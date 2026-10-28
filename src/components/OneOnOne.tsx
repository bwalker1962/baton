"use client";
// Floating 1:1 agenda. Stays put while you move around Baton, so you can jump to a task or
// project mid-conversation and come back to exactly where you were.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clients, TODAY } from "@/lib/data";
import { entriesFromText, nowIso } from "@/lib/notes";
import { DRAG_TYPE, KIND_ICON, OUTCOMES, type Agenda, type AgendaItem, type Draggable, type Outcome } from "@/lib/agenda";
import { useClientLook, useStore } from "@/lib/store";
import { shortDate } from "@/lib/format";
import { addDays } from "@/lib/templates";
import { Icon } from "./Icon";
import { ClientTile } from "./ui";

const REORDER = "application/x-baton-agenda";
const uid = () => `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const hasType = (e: React.DragEvent, t: string) => Array.from(e.dataTransfer.types).includes(t);

/** Add something to a client's next 1:1 from anywhere (keyboard and touch friendly). */
export function useAddToAgenda() {
  const { agendas, saveAgenda } = useStore();
  return (clientId: string, item: Omit<AgendaItem, "id">) => {
    const target = agendas.find((a) => a.clientId === clientId) ?? { clientId, next: addDays(TODAY, 7), with: "CEO", items: [] };
    if (item.refId && target.items.some((i) => i.refId === item.refId)) return false;
    saveAgenda({ ...target, items: [...target.items, { ...item, id: uid() }] });
    return true;
  };
}

export function OneOnOne({ here }: { here?: string }) {
  const router = useRouter();
  const { agendas, saveAgenda, saveNote, addTask, projects, updateProject, agendaOpenFor, openAgenda } = useStore();
  const [open, setOpen] = useState(false);
  const [cid, setCid] = useState(here ?? agendas[0]?.clientId ?? clients[0].id);
  const [meeting, setMeeting] = useState(false);
  const [draft, setDraft] = useState("");
  const [hot, setHot] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [flash, setFlash] = useState("");
  const [stepTarget, setStepTarget] = useState<Record<string, string>>({});

  // Any screen can ask for a client's agenda to open.
  useEffect(() => { if (agendaOpenFor) { setCid(agendaOpenFor); setOpen(true); openAgenda(null); } }, [agendaOpenFor, openAgenda]);
  // Follow the client you're looking at, except during a meeting: then the agenda holds still.
  useEffect(() => { if (here && !meeting) setCid(here); }, [here, meeting]);
  // On wide screens the page makes room for the open panel instead of hiding under it.
  useEffect(() => {
    document.documentElement.dataset.oneonone = open ? "open" : "closed";
    return () => { delete document.documentElement.dataset.oneonone; };
  }, [open]);
  useEffect(() => { if (!flash) return; const t = setTimeout(() => setFlash(""), 4000); return () => clearTimeout(t); }, [flash]);

  const client = clients.find((c) => c.id === cid)!;
  const look = useClientLook(client);
  const agenda: Agenda = agendas.find((a) => a.clientId === cid) ?? { clientId: cid, next: addDays(TODAY, 7), with: "CEO", items: [] };
  const put = (patch: Partial<Agenda>, target = agenda) => saveAgenda({ ...target, ...patch });
  const setItem = (id: string, patch: Partial<AgendaItem>) => put({ items: agenda.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const open_ = agenda.items.filter((i) => !i.covered).length;

  const add = (item: Omit<AgendaItem, "id">, forClient = cid) => {
    const target = agendas.find((a) => a.clientId === forClient) ?? { clientId: forClient, next: addDays(TODAY, 7), with: "CEO", items: [] };
    if (item.refId && target.items.some((i) => i.refId === item.refId)) { setFlash("Already on the agenda"); return; }
    saveAgenda({ ...target, items: [...target.items, { ...item, id: uid() }] });
    if (forClient !== cid) setFlash(`That's a ${clients.find((c) => c.id === forClient)?.name} item, so it went on their 1:1 agenda.`);
  };

  const onDrop = (e: React.DragEvent, beforeId?: string) => {
    e.preventDefault(); e.stopPropagation(); setHot(false);
    if (hasType(e, REORDER)) {
      const id = e.dataTransfer.getData(REORDER);
      const moving = agenda.items.find((i) => i.id === id);
      if (!moving || id === beforeId) return;
      const rest = agenda.items.filter((i) => i.id !== id);
      const at = beforeId ? rest.findIndex((i) => i.id === beforeId) : rest.length;
      rest.splice(at < 0 ? rest.length : at, 0, moving);
      put({ items: rest });
      return;
    }
    if (hasType(e, DRAG_TYPE)) {
      const d: Draggable = JSON.parse(e.dataTransfer.getData(DRAG_TYPE));
      add({ title: d.title, kind: d.kind, href: d.href, refId: d.refId }, d.clientId);
      setOpen(true);
    }
  };
  const onOver = (e: React.DragEvent) => { if (hasType(e, DRAG_TYPE) || hasType(e, REORDER)) { e.preventDefault(); setHot(true); } };

  const focus = (i: AgendaItem) => { put({ current: i.id }); if (i.href) router.push(i.href); };
  const nextTopic = () => {
    const items = agenda.items.map((i) => (i.id === agenda.current ? { ...i, covered: true } : i));
    const nxt = items.find((i) => !i.covered);
    put({ items, current: nxt?.id });
    if (nxt?.href) router.push(nxt.href);
  };

  const sendBack = () => {
    const covered = agenda.items.filter((i) => i.covered || i.answer);
    const clientProjects = projects.filter((p) => p.clientId === cid);
    let tasks = 0, steps = 0;
    for (const i of covered) {
      const text = (i.answer?.split("\n")[0] || i.title).slice(0, 120);
      if (i.outcome === "step" && stepTarget[i.id]) {
        const p = clientProjects.find((x) => x.id === stepTarget[i.id]);
        if (p) { updateProject(p.id, { steps: [...p.steps, { id: uid(), title: text, phase: "From 1:1", due: null, owner: "BCW", status: "open" }] }); steps++; continue; }
      }
      if (i.outcome === "task" || i.outcome === "step") {
        addTask({ id: uid(), clientId: cid, title: text, dept: `From 1:1 on ${shortDate(TODAY).full}`, owner: "BCW", ownerKind: "person", due: agenda.next, health: "none", pct: 0, promised: { to: agenda.with, on: TODAY } });
        tasks++;
      }
    }
    const lines = covered.map((i) => {
      const tag = i.outcome === "decision" ? " [decision]" : "";
      const follow = i.outcome === "task" || i.outcome === "step" ? `\n→ ${(i.answer?.split("\n")[0] || i.title)}` : "";
      return follow ? `${i.title}${follow}` : `${i.title}${tag}${i.answer ? `: ${i.answer}` : ""}`;
    });
    if (lines.length) { const at = nowIso(); saveNote({ id: `n${Date.now().toString(36)}`, clientId: cid, with: agenda.with, date: TODAY, entries: entriesFromText(`1:1\n${lines.join("\n")}`, at), updated: at }); }
    // Uncovered topics carry over to the next 1:1.
    put({ items: agenda.items.filter((i) => !(i.covered || i.answer)), current: undefined, next: addDays(agenda.next, 7) });
    setWrap(false); setMeeting(false);
    setFlash(`Saved to Notes${tasks ? ` · ${tasks} task${tasks > 1 ? "s" : ""}` : ""}${steps ? ` · ${steps} project step${steps > 1 ? "s" : ""}` : ""}. Open topics carried over.`);
  };

  if (!open) {
    return (
      <button className={`oneonone-pill ${hot ? "hot" : ""}`} onClick={() => setOpen(true)} onDragOver={onOver} onDragLeave={() => setHot(false)} onDrop={(e) => onDrop(e)}
        style={{ ["--note" as string]: look.color }} aria-label={`Open 1:1 agenda for ${client.name}, ${open_} topics`}>
        <ClientTile client={client} small />{hot ? "Drop to add to the 1:1" : `1:1 · ${open_} topic${open_ === 1 ? "" : "s"}`}
        {flash && <span className="xs" style={{ fontWeight: 500, opacity: 0.8 }}>· {flash}</span>}
      </button>
    );
  }

  const clientProjects = projects.filter((p) => p.clientId === cid);
  return (
    <>
    <aside className={`oneonone fade ${hot ? "hot" : ""}`} style={{ ["--note" as string]: look.color }} aria-label="1:1 agenda" onDragOver={onOver} onDragLeave={() => setHot(false)} onDrop={(e) => onDrop(e)}>
      <header style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <ClientTile client={client} small />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ fontSize: 14 }}>1:1 with {agenda.with}</strong>
          <div className="xs muted">{client.name} · {meeting ? "in progress" : `next ${shortDate(agenda.next).full}`}</div>
        </div>
        {!meeting && (
          <select className="input" aria-label="Which client's 1:1" value={cid} onChange={(e) => setCid(e.target.value)} style={{ width: "auto", padding: "4px 6px", fontSize: 12 }}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <button className="btn" aria-label="Minimize" title="Minimize" onClick={() => setOpen(false)} style={{ minHeight: 30, padding: "0 8px" }}>–</button>
      </header>

      <div className="seg" role="group" aria-label="Mode" style={{ alignSelf: "flex-start" }}>
        <button aria-pressed={!meeting} onClick={() => setMeeting(false)}>Prep</button>
        <button aria-pressed={meeting} onClick={() => { setMeeting(true); if (!agenda.current) put({ current: agenda.items.find((i) => !i.covered)?.id }); }}>In the meeting</button>
      </div>

      <ol className="oneonone-list" onDragOver={onOver}>
        {agenda.items.length === 0 && <li className="small muted" style={{ padding: 10 }}>Drag tasks, sign-off items or projects here, or type a topic below.</li>}
        {agenda.items.map((i, n) => {
          const isCurrent = meeting && agenda.current === i.id;
          return (
            <li key={i.id} className={`oneonone-item ${isCurrent ? "current" : ""} ${i.covered ? "covered" : ""}`}
              draggable={!meeting} onDragStart={(e) => { e.dataTransfer.setData(REORDER, i.id); e.dataTransfer.effectAllowed = "move"; }}
              onDrop={(e) => onDrop(e, i.id)}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <input type="checkbox" aria-label={`Covered: ${i.title}`} checked={!!i.covered} onChange={() => setItem(i.id, { covered: !i.covered })} style={{ marginTop: 3, width: 16, height: 16 }} />
                <span className="muted" style={{ marginTop: 1 }}><Icon name={KIND_ICON[i.kind]} size={14} /></span>
                <button className="oneonone-title" onClick={() => (meeting ? focus(i) : i.href ? router.push(i.href) : put({ current: i.id }))} title={i.href ? "Jump to it; the agenda stays open" : undefined}>
                  <span style={{ textDecoration: i.covered ? "line-through" : undefined }}>{n + 1}. {i.title}</span>
                  {i.href && <Icon name="link" size={12} />}
                </button>
                {!meeting && <button className="btn" aria-label={`Remove ${i.title}`} onClick={() => put({ items: agenda.items.filter((x) => x.id !== i.id) })} style={{ minHeight: 24, padding: "0 6px", border: 0, background: "none" }}>×</button>}
              </div>
              {(isCurrent || (meeting && i.answer)) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6, paddingLeft: 24 }}>
                  {isCurrent ? (
                    <>
                      <textarea className="input" rows={3} autoFocus value={i.answer ?? ""} onChange={(e) => setItem(i.id, { answer: e.target.value })} placeholder={`What ${agenda.with === "CEO" ? "the CEO" : agenda.with} said, direction, decisions…`} aria-label={`Notes on ${i.title}`} />
                      <select className="input" value={i.outcome ?? "note"} onChange={(e) => setItem(i.id, { outcome: e.target.value as Outcome })} aria-label="What comes of it" style={{ padding: "4px 6px", fontSize: 13 }}>
                        {(Object.keys(OUTCOMES) as Outcome[]).map((o) => <option key={o} value={o}>{OUTCOMES[o]}</option>)}
                      </select>
                    </>
                  ) : <span className="xs muted">{i.answer}</span>}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!meeting ? (
        <>
          <form onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { add({ title: draft.trim(), kind: "topic" }); setDraft(""); } }} style={{ display: "flex", gap: 6 }}>
            <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a topic" aria-label="Add a topic" style={{ padding: "6px 8px" }} />
            <button className="btn" type="submit" style={{ minHeight: 34 }}>Add</button>
          </form>
          <button className="btn" style={{ minHeight: 32, alignSelf: "flex-start" }} onClick={() => add({ title: document.title.replace(" · Baton", ""), kind: "page", href: window.location.pathname + window.location.search })}>
            <Icon name="plus" size={14} />Add the page I&apos;m on
          </button>
        </>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn" style={{ flex: 1 }} onClick={nextTopic} disabled={!agenda.current}>Next topic</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setWrap(true)}>Wrap up</button>
        </div>
      )}
      {flash && <div className="xs" role="status" style={{ fontWeight: 600 }}>{flash}</div>}

    </aside>
      {wrap && (
        <div className="backdrop" role="presentation" onClick={() => setWrap(false)}>
          <div className="sheet fade" role="dialog" aria-modal="true" aria-label="Wrap up 1:1" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Send the 1:1 back into your work</h2>
            <p className="small muted" style={{ margin: 0 }}>Everything discussed is saved as a note with {agenda.with}. Follow-ups become promises to {agenda.with}, due by the next 1:1 ({shortDate(agenda.next).full}), as tasks or project steps. Topics you didn&apos;t reach carry over to the next 1:1.</p>
            {agenda.items.filter((i) => i.covered || i.answer).map((i) => (
              <div key={i.id} className="card" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                <strong className="small">{i.title}</strong>
                {i.answer && <span className="small">{i.answer}</span>}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <select className="input" value={i.outcome ?? "note"} onChange={(e) => setItem(i.id, { outcome: e.target.value as Outcome })} aria-label="What comes of it" style={{ width: "auto", padding: "4px 6px", fontSize: 13 }}>
                    {(Object.keys(OUTCOMES) as Outcome[]).map((o) => <option key={o} value={o}>{OUTCOMES[o]}</option>)}
                  </select>
                  {i.outcome === "step" && (clientProjects.length ? (
                    <select className="input" value={stepTarget[i.id] ?? ""} onChange={(e) => setStepTarget((s) => ({ ...s, [i.id]: e.target.value }))} aria-label="Which project" style={{ width: "auto", padding: "4px 6px", fontSize: 13 }}>
                      <option value="">Pick a project…</option>
                      {clientProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  ) : <span className="xs muted">No projects yet; it will be a task.</span>)}
                </div>
              </div>
            ))}
            {agenda.items.every((i) => !(i.covered || i.answer)) && <p className="small">Nothing covered yet. Tick topics or add notes first.</p>}
            <button className="btn btn-primary btn-lg" onClick={sendBack} disabled={agenda.items.every((i) => !(i.covered || i.answer))}>Save and send back</button>
            <Link href={`/clients/${cid}/notes`} className="btn" onClick={() => setWrap(false)}>Open {client.name} notes</Link>
            <button className="btn" onClick={() => setWrap(false)}>Keep going</button>
          </div>
        </div>
      )}
    </>
  );
}
