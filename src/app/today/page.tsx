"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clients, TODAY } from "@/lib/data";
import { DAY_HOURS, PLANNING_GOAL, leadSeed, todaySeed, type DayItem, type DayKind, type LeadItem } from "@/lib/day";
import { addDays } from "@/lib/templates";
import { daysFromToday, minutesLabel, shortDate } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { ClientTile } from "@/components/ui";
import { SnoozeButton, wakeLabel } from "@/components/Snooze";
import { DRAG_TYPE } from "@/lib/agenda";
import { CoachButton } from "@/components/Coach";
import { DayItemPopover, anchorOf, type Anchor } from "@/components/TaskPopover";

const KIND: Record<DayKind, { label: string; icon: string; cls: string }> = {
  review: { label: "Review", icon: "eye", cls: "b-eyes" },
  task: { label: "Task", icon: "tasks", cls: "b-neutral" },
  planning: { label: "Planning", icon: "calendar", cls: "b-info" },
  meeting: { label: "Meeting", icon: "clock", cls: "b-neutral" },
};
const KEY = "baton-today-v2";

interface Saved { list: DayItem[]; done: string[]; added: string[]; asleep: Record<string, string> }

const startBy = (l: LeadItem) => addDays(l.due, -l.leadDays);

export default function Today() {
  const [list, setList] = useState<DayItem[]>(todaySeed);
  const [done, setDone] = useState<string[]>([]);
  const [added, setAdded] = useState<string[]>([]); // lead items pulled into today
  const [asleep, setAsleep] = useState<Record<string, string>>({}); // snoozed item id → wake date
  const [pop, setPop] = useState<{ id: string; anchor: Anchor } | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draftKind, setDraftKind] = useState<DayKind>("planning");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s: Saved = JSON.parse(raw); setList(s.list); setDone(s.done); setAdded(s.added); setAsleep(s.asleep ?? {}); }
    } catch { /* storage unavailable: start from the sample day */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ list, done, added, asleep } satisfies Saved)); } catch { /* ignore */ }
  }, [list, done, added, asleep]);

  const move = (id: string, to: number) => setList((all) => {
    const from = all.findIndex((i) => i.id === id);
    if (from < 0 || to < 0 || to >= all.length) return all;
    const next = [...all]; const [it] = next.splice(from, 1); next.splice(to, 0, it); return next;
  });
  const dropOn = (targetId: string) => {
    if (drag && drag !== targetId) move(drag, list.findIndex((i) => i.id === targetId));
    setDrag(null); setOver(null);
  };
  const pull = (l: LeadItem) => {
    setList((all) => [...all, { id: l.id, title: l.title, clientId: l.clientId, kind: "planning", minutes: l.minutes, why: `Long lead: due ${shortDate(l.due).full}` }]);
    setAdded((a) => [...a, l.id]);
  };
  const remove = (id: string) => { setList((all) => all.filter((i) => i.id !== id)); setAdded((a) => a.filter((x) => x !== id)); };
  const reset = () => { setList(todaySeed); setDone([]); setAdded([]); setAsleep({}); };
  const awake = (i: DayItem) => !asleep[i.id] || asleep[i.id] <= TODAY;

  const today = list.filter(awake);
  const sleeping = list.filter((i) => !awake(i)).sort((a, b) => asleep[a.id].localeCompare(asleep[b.id]));
  const ordered = [...today.filter((i) => !done.includes(i.id)), ...today.filter((i) => done.includes(i.id))];
  const total = today.reduce((n, i) => n + i.minutes, 0);
  const planning = today.filter((i) => i.kind === "planning").reduce((n, i) => n + i.minutes, 0);
  const share = total ? planning / total : 0;
  const over_ = total > DAY_HOURS * 60;
  const radar = leadSeed.filter((l) => !added.includes(l.id)).sort((a, b) => startBy(a).localeCompare(startBy(b)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 1040 }}>
      <div className="pagehead">
        <div>
          <div className="eyebrow">{new Date(TODAY + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
          <h1 className="title">Today</h1>
        </div>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <CoachButton context="peace" />
          <button className="btn" onClick={reset}>Reset sample day</button>
        </span>
      </div>

      <div className="grid-auto" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <section className="card" style={{ padding: 14 }} aria-label="Time planned">
          <div className="muted xs" style={{ fontWeight: 700, letterSpacing: "0.04em" }}>TIME PLANNED</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: over_ ? "var(--bad-fg)" : undefined }}>{minutesLabel(total)} <span className="muted small" style={{ fontWeight: 500 }}>of {DAY_HOURS}h</span></div>
          <Meter value={total / (DAY_HOURS * 60)} tone={over_ ? "var(--bad-dot)" : "var(--text)"} />
          {over_ && <div className="xs" style={{ color: "var(--bad-fg)", marginTop: 6 }}>Over your day. Snooze something.</div>}
        </section>
        <section className="card" style={{ padding: 14 }} aria-label="Planning share">
          <div className="muted xs" style={{ fontWeight: 700, letterSpacing: "0.04em" }}>LONG-LEAD AND PLANNING</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{Math.round(share * 100)}% <span className="muted small" style={{ fontWeight: 500 }}>goal {PLANNING_GOAL * 100}%+</span></div>
          <Meter value={share} goal={PLANNING_GOAL} tone={share >= PLANNING_GOAL ? "var(--good-dot)" : "var(--warn-dot)"} />
          <div className="xs muted" style={{ marginTop: 6 }}>{share >= PLANNING_GOAL ? "Future work is protected today." : "Urgent work is crowding out next month. Pull one in from the radar."}</div>
        </section>
      </div>

      <section className="card" aria-label="Today's list">
        <div className="card-head"><h2>Your order for today</h2><span className="muted small hide-mobile">Drag to reorder, or use the arrows</span></div>
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {ordered.map((it, n) => {
            const c = it.clientId ? clients.find((x) => x.id === it.clientId) : undefined;
            const isDone = done.includes(it.id);
            const k = KIND[it.kind];
            return (
              <li key={it.id}
                draggable={!isDone}
                onDragStart={(e) => {
                  setDrag(it.id); e.dataTransfer.effectAllowed = "copyMove";
                  // Also droppable into the floating 1:1 agenda.
                  if (it.clientId) e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ kind: "task", title: it.title, href: it.href ?? `/clients/${it.clientId}`, refId: it.id, clientId: it.clientId }));
                }}
                onDragOver={(e) => { e.preventDefault(); setOver(it.id); }}
                onDragLeave={() => setOver((o) => (o === it.id ? null : o))}
                onDrop={(e) => { e.preventDefault(); dropOn(it.id); }}
                onDragEnd={() => { setDrag(null); setOver(null); }}
                className="row"
                style={{ opacity: drag === it.id ? 0.4 : isDone ? 0.55 : 1, boxShadow: over === it.id && drag !== it.id ? "inset 0 2px 0 var(--text)" : undefined, cursor: isDone ? "default" : "grab", flexWrap: "wrap" }}>
                <span aria-hidden="true" className="muted hide-mobile" style={{ letterSpacing: -2, fontWeight: 700, width: 14 }}>⋮⋮</span>
                <span className="muted small" style={{ width: 18, textAlign: "right" }}>{n + 1}</span>
                <input type="checkbox" aria-label={`Done: ${it.title}`} checked={isDone} onChange={() => setDone((d) => (isDone ? d.filter((x) => x !== it.id) : [...d, it.id]))} style={{ width: 18, height: 18 }} />
                {c ? <ClientTile client={c} small /> : <span className="tile tile-sm" style={{ background: "var(--text)" }} aria-hidden="true">B</span>}
                <span style={{ flex: 1, minWidth: 180 }}>
                  <span style={{ fontWeight: 600, textDecoration: isDone ? "line-through" : undefined }}><button className="title-btn" onClick={(e) => setPop({ id: it.id, anchor: anchorOf(e.currentTarget) })} aria-haspopup="dialog">{it.title}</button></span>
                  <span className="muted small" style={{ display: "block" }}>{c?.name ?? "All clients"}{it.why ? ` · ${it.why}` : ""}</span>
                </span>
                <span className={`badge ${k.cls}`}><Icon name={k.icon} size={13} />{k.label}</span>
                <span className="small muted" style={{ width: 52, textAlign: "right" }}>{minutesLabel(it.minutes)}</span>
                <span style={{ display: "flex", gap: 2 }}>
                  <button className="btn" style={{ minHeight: 32, padding: "0 8px" }} aria-label={`Move ${it.title} up`} disabled={isDone || n === 0} onClick={() => move(it.id, list.findIndex((i) => i.id === it.id) - 1)}>↑</button>
                  <button className="btn" style={{ minHeight: 32, padding: "0 8px" }} aria-label={`Move ${it.title} down`} disabled={isDone} onClick={() => move(it.id, list.findIndex((i) => i.id === it.id) + 1)}>↓</button>
                  <SnoozeButton label={it.title} compact onSnooze={(until) => setAsleep((a) => ({ ...a, [it.id]: until }))} />
                </span>
              </li>
            );
          })}
        </ol>
        {sleeping.length > 0 && (
          <details className="row" style={{ display: "block", background: "var(--surface-2)" }}>
            <summary className="small" style={{ cursor: "pointer", fontWeight: 600 }}>Snoozed · {sleeping.length}</summary>
            {sleeping.map((it) => (
              <div key={it.id} className="small" style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0" }}>
                <Icon name="clock" size={15} />
                <span style={{ flex: 1 }}>{it.title} <span className="muted">· back {wakeLabel(asleep[it.id])}</span></span>
                <button className="btn" style={{ minHeight: 30 }} onClick={() => setAsleep((a) => { const n = { ...a }; delete n[it.id]; return n; })}>Back to today</button>
                <button className="btn" style={{ minHeight: 30 }} onClick={() => remove(it.id)}>Remove</button>
              </div>
            ))}
          </details>
        )}
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (!draft.trim()) return; setList((all) => [...all, { id: `n${Date.now()}`, title: draft.trim(), kind: draftKind, minutes: 30 }]); setDraft(""); }} style={{ gap: 8, flexWrap: "wrap" }}>
          <Icon name="plus" size={16} />
          <input className="input" style={{ flex: 1, minWidth: 200 }} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add to today, e.g. Plan January webinar topics" aria-label="New item" />
          <select className="input" style={{ width: "auto" }} value={draftKind} onChange={(e) => setDraftKind(e.target.value as DayKind)} aria-label="Kind">
            {(Object.keys(KIND) as DayKind[]).map((k) => <option key={k} value={k}>{KIND[k].label}</option>)}
          </select>
          <button className="btn btn-primary" type="submit">Add</button>
        </form>
      </section>

      <section className="card" aria-label="Long-lead radar">
        <div className="card-head">
          <h2>Long-lead radar</h2>
          <span className="muted small">Due later, but the work starts now. These are what quietly sink a quarter.</span>
        </div>
        {radar.length === 0 && <div className="row muted small">Everything on the radar is on today&apos;s list.</div>}
        {radar.map((l) => {
          const c = clients.find((x) => x.id === l.clientId)!;
          const sb = startBy(l);
          const until = daysFromToday(sb) ?? 0;
          const tone = until < 0 ? "b-bad" : until <= 7 ? "b-warn" : "b-neutral";
          const label = until < 0 ? `Start was ${shortDate(sb).full}` : until === 0 ? "Start today" : `Start in ${until} day${until === 1 ? "" : "s"}`;
          const elapsed = Math.min(1, Math.max(0, (l.leadDays - (daysFromToday(l.due) ?? 0)) / l.leadDays));
          return (
            <div key={l.id} className="row" style={{ flexWrap: "wrap" }}>
              <ClientTile client={c} small />
              <span style={{ flex: 1, minWidth: 200 }}>
                <span style={{ fontWeight: 600 }}>{l.title}</span>
                <span className="muted small" style={{ display: "block" }}>{c.name} · due {shortDate(l.due).full} · {Math.round(l.leadDays / 7)}-week lead{l.cadence ? ` · ${l.cadence}` : ""}</span>
                <span aria-hidden="true" style={{ display: "block", height: 4, borderRadius: 2, background: "var(--surface-2)", marginTop: 6, maxWidth: 320, position: "relative" }}>
                  <span style={{ position: "absolute", inset: 0, width: `${Math.max(3, elapsed * 100)}%`, borderRadius: 2, background: until <= 7 ? "var(--warn-dot)" : "var(--gray-dot)" }} />
                </span>
              </span>
              <span className={`badge ${tone}`}><Icon name={until <= 7 ? "alert" : "clock"} size={13} />{label}</span>
              <button className="btn btn-outline" style={{ minHeight: 34 }} onClick={() => pull(l)}>Add to today</button>
            </div>
          );
        })}
      </section>
      {pop && (() => {
        const it = list.find((x) => x.id === pop.id);
        return it ? (
          <DayItemPopover item={it} anchor={pop.anchor} onClose={() => setPop(null)}
            onChange={(p) => setList((all) => all.map((x) => (x.id === it.id ? { ...x, ...p } : x)))}
            onSnooze={(until) => setAsleep((a) => ({ ...a, [it.id]: until }))}
            onRemove={() => remove(it.id)} />
        ) : null;
      })()}
    </div>
  );
}

function Meter({ value, goal, tone }: { value: number; goal?: number; tone: string }) {
  return (
    <div style={{ position: "relative", height: 8, borderRadius: 4, background: "var(--surface-2)", marginTop: 8 }} aria-hidden="true">
      <div style={{ width: `${Math.min(100, value * 100)}%`, height: "100%", borderRadius: 4, background: tone }} />
      {goal !== undefined && <div style={{ position: "absolute", left: `${goal * 100}%`, top: -3, bottom: -3, width: 2, background: "var(--text)" }} />}
    </div>
  );
}
