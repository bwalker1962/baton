"use client";
// Dashboard widgets. Each renders its body only; the dashboard supplies the card, title and controls.
// Order of importance: what you owe CEOs, then peace of mind, then projects and tasks.
import Link from "next/link";
import { useEffect, useState } from "react";
import { clients, getClient, TODAY } from "@/lib/data";
import { owedToCeos, peaceChecks, REPORT_DUE } from "@/lib/ceo";
import { leadSeed, todaySeed, type DayItem } from "@/lib/day";
import { addDays } from "@/lib/templates";
import { CERTAINTY } from "@/lib/intake";
import { healthOrder, minutesLabel, shortDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Icon } from "./Icon";
import { ClientTile, Due, StatusBadge } from "./ui";
import { NotesBoard, PostIt } from "./Notes";
import { EAR, KIND_CLS } from "@/lib/ear";
import { useAddToAgenda } from "./OneOnOne";
import { TaskPopover, anchorOf, type Anchor } from "./TaskPopover";

/** Rows that open a task's pop-over instead of leaving the page. */
function useTaskPop() {
  const [pop, setPop] = useState<{ id: string; anchor: Anchor } | null>(null);
  const open = (id: string) => (e: React.MouseEvent<HTMLElement>) => setPop({ id, anchor: anchorOf(e.currentTarget) });
  const node = pop ? <TaskPopover taskId={pop.id} anchor={pop.anchor} onClose={() => setPop(null)} /> : null;
  return { open, node };
}

export type Size = "s" | "m" | "l";
export type Tier = "ceo" | "peace" | "work";
export interface WidgetDef {
  id: string;
  title: string;
  icon: string;
  tier: Tier;
  scopes: ("home" | "client")[];
  sizes: Size[];
  blurb: string;
  href?: (clientId?: string) => string;
  Body: (p: { clientId?: string; size: Size }) => React.ReactNode;
}
export const TIER_LABEL: Record<Tier, string> = { ceo: "CEO accountability", peace: "Peace of mind", work: "Projects and tasks" };

const Empty = ({ children }: { children: React.ReactNode }) => <div className="row muted small">{children}</div>;
const name = (id: string) => getClient(id)?.name ?? "";

function OwedBody({ clientId, size }: { clientId?: string; size: Size }) {
  const { tasks } = useStore();
  const pop = useTaskPop();
  const [all, setAll] = useState(false);
  const owed = owedToCeos(tasks, clientId);
  const list = all ? owed : owed.slice(0, size === "s" ? 3 : size === "m" ? 5 : 8);
  if (!owed.length) return <Empty>Nothing owed. Every promise is kept.</Empty>;
  return (
    <>
      {list.map((o) => {
        const c = getClient(o.clientId)!;
        const Row = ({ children }: { children: React.ReactNode }) => o.kind === "promise"
          ? <button className="row as-button" style={{ gap: 10 }} onClick={pop.open(o.id)} aria-haspopup="dialog">{children}</button>
          : <Link href={o.href} className="row" style={{ gap: 10 }}>{children}</Link>;
        return (
          <Row key={o.id}>
            {!clientId && <ClientTile client={c} small />}
            <span className="grow">
              <strong className="small">{o.title}</strong><br />
              <span className="muted xs">{o.kind === "report" ? `${REPORT_DUE[o.clientId].cadence}` : `Promised to ${o.to}${o.promisedOn ? ` ${shortDate(o.promisedOn).full}` : ""}`}{!clientId ? ` · ${c.name}` : ""}{o.blocked ? ` · needs ${o.blocked}` : ""}</span>
            </span>
            <Due iso={o.due} />
          </Row>
        );
      })}
      {owed.length > list.length && <button className="row as-button xs" onClick={() => setAll(true)}>Show all {owed.length}</button>}
      {pop.node}
    </>
  );
}

function NextOneOnOneBody({ clientId }: { clientId?: string }) {
  const { agendas, openAgenda } = useStore();
  const scope = clients.filter((c) => !clientId || c.id === clientId);
  return (
    <>
      {scope.map((c) => {
        const a = agendas.find((x) => x.clientId === c.id);
        const open = a?.items.filter((i) => !i.covered).length ?? 0;
        return (
          <div key={c.id} className="row" style={{ gap: 10 }}>
            {!clientId && <ClientTile client={c} small />}
            <span className="grow small">
              <strong>{a ? `${a.with} · ${shortDate(a.next).full}` : "No 1:1 set"}</strong>{!clientId ? <span className="muted"> · {c.name}</span> : null}<br />
              <span className="muted xs">{open ? `${open} topic${open > 1 ? "s" : ""} ready` : "No topics yet"}</span>
            </span>
            <button className="btn" style={{ minHeight: 30 }} onClick={() => openAgenda(c.id)}>Agenda</button>
          </div>
        );
      })}
    </>
  );
}

function PeaceBody({ clientId }: { clientId?: string }) {
  const { items, tasks, notes } = useStore();
  const checks = peaceChecks({ items, tasks, notes, clientId });
  const bad = checks.filter((c) => !c.ok).length;
  return (
    <>
      <div className="row" style={{ gap: 10, background: bad ? "var(--warn-bg)" : "var(--good-bg)", color: bad ? "var(--warn-fg)" : "var(--good-fg)", fontWeight: 700 }}>
        <Icon name={bad ? "alert" : "check"} />{bad ? `${bad} thing${bad > 1 ? "s" : ""} need you` : "All clear. You can stop thinking about work."}
      </div>
      {checks.map((c) => (
        <Link key={c.label} href={c.href} className="row" style={{ gap: 10, alignItems: "flex-start" }}>
          <span style={{ color: c.ok ? "var(--good-fg)" : "var(--warn-fg)", marginTop: 1 }}><Icon name={c.ok ? "check" : "alert"} size={16} /></span>
          <span className="small"><strong>{c.label}</strong><br /><span className="muted xs">{c.detail}</span></span>
        </Link>
      ))}
    </>
  );
}

function SignoffBody({ clientId, size }: { clientId?: string; size: Size }) {
  const { items } = useStore();
  const needs = items.filter((i) => i.state === "needs" && (!clientId || i.clientId === clientId)).sort((a, b) => a.due.localeCompare(b.due));
  if (!needs.length) return <Empty><Icon name="check" size={16} /> Nothing needs your eyes.</Empty>;
  return (
    <>
      {needs.slice(0, size === "l" ? 8 : 4).map((i) => {
        const flags = (i.slips ?? []).filter((x) => x.result !== "pass").length;
        return (
          <Link key={i.id} href={`/signoff/${i.id}${clientId ? `?client=${clientId}` : ""}`} className="row" style={{ gap: 10 }}>
            {!clientId && <ClientTile client={getClient(i.clientId)!} small />}
            <span className="grow small"><strong>{i.title}</strong><br /><span className="muted xs">{i.sendAt}</span></span>
            {flags > 0 && <span className="badge b-warn">{flags} to check</span>}
            <Due iso={i.due} />
          </Link>
        );
      })}
      <div className="row"><Link href={clientId ? `/signoff/${needs[0].id}?client=${clientId}` : `/signoff/${needs[0].id}`} className="btn btn-primary" style={{ minHeight: 34 }}><Icon name="eye" size={15} />Review {needs.length}</Link></div>
    </>
  );
}

function ReportBody({ clientId }: { clientId?: string }) {
  const scope = clients.filter((c) => !clientId || c.id === clientId);
  return (
    <>
      {scope.map((c) => (
        <Link key={c.id} href={`/clients/${c.id}/report`} className="row" style={{ gap: 10, alignItems: "flex-start" }}>
          {!clientId && <ClientTile client={c} small />}
          <span className="grow small">
            <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><strong>Due {shortDate(REPORT_DUE[c.id].due).full}</strong><StatusBadge health={c.health} /></span>
            {clientId ? <span className="muted">{c.summary}</span> : <span className="muted xs">{c.name} · {REPORT_DUE[c.id].cadence}</span>}
          </span>
        </Link>
      ))}
    </>
  );
}

function TodayBody() {
  const [items, setItems] = useState<DayItem[]>(todaySeed);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("baton-today-v2");
      if (raw) { const s = JSON.parse(raw); setItems(s.list.filter((i: DayItem) => !s.done.includes(i.id) && !(s.asleep?.[i.id] > TODAY))); }
    } catch {}
  }, []);
  return (
    <>
      {items.slice(0, 5).map((it, n) => (
        <Link key={it.id} href={it.href ?? "/today"} className="row small" style={{ gap: 10 }}>
          <span className="muted" style={{ width: 14 }}>{n + 1}</span>
          {it.clientId ? <ClientTile client={getClient(it.clientId)!} small /> : <span className="tile tile-sm" style={{ background: "var(--text)" }}>B</span>}
          <span className="grow">{it.title}</span><span className="muted xs">{minutesLabel(it.minutes)}</span>
        </Link>
      ))}
      <div className="row"><Link href="/today" className="small">Open Today</Link></div>
    </>
  );
}

function RadarBody({ clientId }: { clientId?: string }) {
  const list = leadSeed.filter((l) => !clientId || l.clientId === clientId).map((l) => ({ ...l, start: addDays(l.due, -l.leadDays) })).sort((a, b) => a.start.localeCompare(b.start));
  if (!list.length) return <Empty>No long-lead work on the radar.</Empty>;
  return (
    <>
      {list.slice(0, 4).map((l) => (
        <Link key={l.id} href="/today" className="row small" style={{ gap: 10 }}>
          {!clientId && <ClientTile client={getClient(l.clientId)!} small />}
          <span className="grow"><strong>{l.title}</strong><br /><span className="muted xs">Due {shortDate(l.due).full}</span></span>
          <span className="xs" style={{ fontWeight: 700, whiteSpace: "nowrap" }}>Start {shortDate(l.start).full}</span>
        </Link>
      ))}
    </>
  );
}

function TasksBody({ clientId }: { clientId?: string }) {
  const { tasks, snoozed } = useStore();
  const pop = useTaskPop();
  const list = tasks.filter((t) => (!clientId || t.clientId === clientId) && !(snoozed[t.id] > TODAY))
    .sort((a, b) => healthOrder[a.health] - healthOrder[b.health] || (a.due ?? "9").localeCompare(b.due ?? "9"));
  return (
    <>
      {list.slice(0, 5).map((t) => (
        <button key={t.id} className="row as-button small" style={{ gap: 10 }} onClick={pop.open(t.id)} aria-haspopup="dialog">
          {!clientId && <ClientTile client={getClient(t.clientId)!} small />}
          <span className="grow">{t.title}{t.promised && <span className="badge b-info" style={{ marginLeft: 6 }}>Promised</span>}</span>
          <Due iso={t.due} />
        </button>
      ))}
      {pop.node}
    </>
  );
}

function ClientNotesBody({ clientId }: { clientId?: string }) {
  const { notes } = useStore();
  if (!clientId) return <NotesBoard bare />;
  const latest = notes.filter((n) => n.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date))[0];
  return <div style={{ padding: "4px 16px 16px" }}>{latest ? <PostIt note={latest} clamp /> : <span className="muted small">No notes yet.</span>}</div>;
}

function EarBody({ clientId, size }: { clientId?: string; size: Size }) {
  const addToAgenda = useAddToAgenda();
  const [added, setAdded] = useState<string[]>([]);
  const horizon = addDays(TODAY, 75);
  const list = EAR.filter((e) => (e.until ?? e.date) >= TODAY && e.date <= horizon && (!clientId || e.angles[clientId]))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!list.length) return <Empty>Nothing on the horizon for this client.</Empty>;
  return (
    <>
      {list.slice(0, size === "l" ? 10 : size === "m" ? 6 : 4).map((e) => {
        const angles = Object.entries(e.angles).filter(([id]) => !clientId || id === clientId);
        return (
          <div key={e.id} className="row" style={{ alignItems: "flex-start", gap: 10 }}>
            <span style={{ width: 40, flex: "none", textAlign: "center", border: "1px solid var(--border)", borderRadius: 8, padding: "2px 0" }}>
              <span style={{ display: "block", fontSize: 10, fontWeight: 700 }}>{shortDate(e.date).mon}</span>
              <span style={{ display: "block", fontSize: 15, fontWeight: 700 }}>{e.date < TODAY ? "Now" : shortDate(e.date).day}</span>
            </span>
            <span className="grow small" style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <strong>{e.title}</strong><span className={`badge ${KIND_CLS[e.kind]}`}>{e.kind}{e.sample ? " · sample" : ""}</span>
              </span>
              {angles.map(([id, angle]) => (
                <span key={id} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  {!clientId && <ClientTile client={getClient(id)!} small />}
                  <span className="muted">{angle}</span>
                  <button className="btn" style={{ minHeight: 26, padding: "0 7px", fontSize: 12, flex: "none", marginLeft: "auto" }} disabled={added.includes(e.id + id)}
                    title="Add as a talking point for the next 1:1" aria-label={`Add ${e.title} to ${name(id)} 1:1`}
                    onClick={() => { addToAgenda(id, { title: `${e.title}: ${angle}`, kind: "topic" }); setAdded((a) => [...a, e.id + id]); }}>
                    {added.includes(e.id + id) ? "On 1:1" : "1:1"}
                  </button>
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </>
  );
}

function ClientsBody() {
  const { items } = useStore();
  const sorted = [...clients].sort((a, b) => healthOrder[a.health] - healthOrder[b.health]);
  return (
    <div className="scroll-x">
      <table className="tbl" style={{ minWidth: 520 }}>
        <thead><tr><th scope="col">Client</th><th scope="col">Status</th><th scope="col">Phase</th><th scope="col">Your time</th><th scope="col" style={{ textAlign: "right" }}>Your eyes</th></tr></thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.id}>
              <td><Link href={`/clients/${c.id}`} style={{ color: "var(--text)", fontWeight: 600, display: "flex", gap: 10, alignItems: "center" }}><ClientTile client={c} />{c.name}</Link></td>
              <td><StatusBadge health={c.health} /></td>
              <td className="muted">{c.phase}</td>
              <td className="muted">{minutesLabel(c.minutesThisWeek)}</td>
              <td style={{ textAlign: "right", fontWeight: 600 }}>{items.filter((i) => i.state === "needs" && i.clientId === c.id).length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProjectsBody({ clientId }: { clientId?: string }) {
  const { projects } = useStore();
  const list = projects.filter((p) => !clientId || p.clientId === clientId);
  if (!list.length) return <Empty>No projects yet. Use Start a project.</Empty>;
  return (
    <>
      {list.slice(0, 5).map((p) => (
        <Link key={p.id} href={`/clients/${p.clientId}/projects/${p.id}`} className="row small" style={{ gap: 10 }}>
          {!clientId && <ClientTile client={getClient(p.clientId)!} small />}
          <span className="grow"><strong>{p.name}</strong><br /><span className="muted xs">{p.steps.filter((s) => s.status === "open").length} open steps</span></span>
          {p.certainty && <span className={`badge ${CERTAINTY[p.certainty].cls}`}>{CERTAINTY[p.certainty].label}</span>}
        </Link>
      ))}
    </>
  );
}

function StatusMixBody({ clientId }: { clientId?: string }) {
  const { tasks } = useStore();
  const list = tasks.filter((t) => !clientId || t.clientId === clientId);
  const n = (h: string) => list.filter((t) => t.health === h).length;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "4px 16px 16px" }}>
      <StatusBadge health="bad" /><strong>{n("bad")}</strong>
      <StatusBadge health="warn" /><strong>{n("warn")}</strong>
      <StatusBadge health="good" /><strong>{n("good")}</strong>
    </div>
  );
}

export const WIDGETS: WidgetDef[] = [
  { id: "owed", title: "Owed to the CEO", icon: "user", tier: "ceo", scopes: ["home", "client"], sizes: ["s", "m", "l"], blurb: "Every promise and report, late first", Body: OwedBody },
  { id: "oneonone", title: "Next 1:1", icon: "chat", tier: "ceo", scopes: ["home", "client"], sizes: ["s", "m"], blurb: "Dates and topics ready", Body: NextOneOnOneBody },
  { id: "report", title: "CEO report", icon: "report", tier: "ceo", scopes: ["home", "client"], sizes: ["s", "m", "l"], blurb: "When it's due and how things are going", href: (c) => (c ? `/clients/${c}/report` : "/clients"), Body: ReportBody },
  { id: "ear", title: "Ear to the ground", icon: "bulb", tier: "ceo", scopes: ["home", "client"], sizes: ["m", "l"], blurb: "Dates, observances and trends, with each client's angle", Body: EarBody },
  { id: "peace", title: "Peace of mind", icon: "check", tier: "peace", scopes: ["home", "client"], sizes: ["s", "m"], blurb: "The guarantees that let you switch off", Body: PeaceBody },
  { id: "signoff", title: "Needs your eyes", icon: "eye", tier: "peace", scopes: ["home", "client"], sizes: ["s", "m", "l"], blurb: "Sign-off queue with slip flags", href: (c) => (c ? `/clients/${c}/signoff` : "/signoff"), Body: SignoffBody },
  { id: "radar", title: "Long-lead radar", icon: "clock", tier: "peace", scopes: ["home", "client"], sizes: ["s", "m"], blurb: "Work that has to start now", href: () => "/today", Body: RadarBody },
  { id: "notes", title: "Conversation notes", icon: "chat", tier: "ceo", scopes: ["home", "client"], sizes: ["m", "l"], blurb: "Post-it stacks by client", href: (c) => (c ? `/clients/${c}/notes` : "/"), Body: ClientNotesBody },
  { id: "today", title: "Today", icon: "tasks", tier: "work", scopes: ["home"], sizes: ["s", "m"], blurb: "Your order for the day", href: () => "/today", Body: TodayBody },
  { id: "tasks", title: "Tasks", icon: "tasks", tier: "work", scopes: ["home", "client"], sizes: ["s", "m", "l"], blurb: "Worst first", href: (c) => (c ? `/clients/${c}/tasks` : "/today"), Body: TasksBody },
  { id: "projects", title: "Projects", icon: "layers", tier: "work", scopes: ["home", "client"], sizes: ["s", "m"], blurb: "Recent projects and how real they are", href: (c) => (c ? `/clients/${c}/projects` : "/"), Body: ProjectsBody },
  { id: "clients", title: "Clients", icon: "grid", tier: "work", scopes: ["home"], sizes: ["m", "l"], blurb: "Status, phase and your time, worst first", href: () => "/clients", Body: ClientsBody },
  { id: "status", title: "Status mix", icon: "alert", tier: "work", scopes: ["home", "client"], sizes: ["s", "m"], blurb: "Off track, watch, on track", href: (c) => (c ? `/clients/${c}/score` : "/"), Body: StatusMixBody },
];

export interface Slot { w: string; size: Size }
/** Recommended layouts: CEO accountability first, peace of mind second, projects and tasks third. */
export const DEFAULT_HOME: Slot[] = [
  { w: "owed", size: "m" }, { w: "peace", size: "m" },
  { w: "oneonone", size: "s" }, { w: "signoff", size: "m" }, { w: "report", size: "s" },
  { w: "notes", size: "l" },
  { w: "ear", size: "m" }, { w: "radar", size: "m" },
  { w: "today", size: "m" }, { w: "clients", size: "m" },
];
export const DEFAULT_CLIENT: Slot[] = [
  { w: "owed", size: "m" }, { w: "peace", size: "m" },
  { w: "oneonone", size: "s" }, { w: "report", size: "m" }, { w: "notes", size: "s" },
  { w: "signoff", size: "l" },
  { w: "ear", size: "m" }, { w: "radar", size: "m" },
  { w: "tasks", size: "m" },
];
