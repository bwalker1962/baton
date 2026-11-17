"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clients, TODAY } from "@/lib/data";
import { DAY_HOURS, PLANNING_GOAL, leadSeed, todaySeed, type DayItem, type DayKind, type LeadItem } from "@/lib/day";
import { addDays } from "@/lib/templates";
import { daysFromToday, minutesLabel, shortDate } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { ClientTile, CardHead } from "@/components/ui";
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
  const [critical, setCritical] = useState<string[]>([]);
  const [pulsePaused, setPulsePaused] = useState(false);
  const [draftKind, setDraftKind] = useState<DayKind>("task");
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showCaptureOptions, setShowCaptureOptions] = useState(false);
  const [currentDay, setCurrentDay] = useState(TODAY);

  useEffect(() => {
    setCurrentDay(new Date().toLocaleDateString("en-CA"));
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s: Saved = JSON.parse(raw); setList(s.list); setDone(s.done); setAdded(s.added); setAsleep(s.asleep ?? {}); setCritical((s as Saved & { critical?: string[] }).critical ?? []); setPulsePaused((s as Saved & { pulsePaused?: boolean }).pulsePaused ?? false); }
    } catch { /* storage unavailable: start from the sample day */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify({ list, done, added, asleep, critical, pulsePaused })); } catch { /* ignore */ }
  }, [list, done, added, asleep, critical, pulsePaused, loaded]);

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
  const reset = () => { setList(todaySeed); setDone([]); setAdded([]); setAsleep({}); setCritical([]); setPulsePaused(false); };
  const awake = (i: DayItem) => !asleep[i.id] || asleep[i.id] <= currentDay;

  const today = list.filter(awake);
  const sleeping = list.filter((i) => !awake(i)).sort((a, b) => asleep[a.id].localeCompare(asleep[b.id]));
  const ordered = [...today.filter((i) => !done.includes(i.id)), ...today.filter((i) => done.includes(i.id))];
  const visible = expanded ? ordered : ordered.filter(i => !done.includes(i.id));
  const urgent = today.filter(i => critical.includes(i.id) && !done.includes(i.id));
  const pending = today.filter(i => !done.includes(i.id));
  const blocked = pending.filter(i => /\b(blocked|blocking|unblock)\b/i.test(i.title + " " + (i.why ?? "")));
  const total = today.reduce((n, i) => n + i.minutes, 0);
  const planning = today.filter((i) => i.kind === "planning").reduce((n, i) => n + i.minutes, 0);
  const share = total ? planning / total : 0;
  const over_ = total > DAY_HOURS * 60;
  const radar = leadSeed.filter((l) => !added.includes(l.id)).sort((a, b) => startBy(a).localeCompare(startBy(b)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 1600 }}>
      <div className="pagehead">
        <div>
          <h1 className="title">Today</h1>
        </div>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <CoachButton context="peace" />
          <Link className="btn" href="/plan">Plan day</Link>
          <details className="baton-more"><summary>More</summary><button className="btn" onClick={reset}>Reset sample day</button></details>
        </span>
      </div>

      <section className="card" aria-label="Today's list">
        <div className="baton-cockpit-bar"><div className="baton-cockpit-metrics">      
        <span className={`baton-status-item ${urgent.length ? "is-critical" : "is-clear"}`} style={{backgroundColor: urgent.length ? "var(--bad-bg)" : "var(--good-bg)"}} title="Manually flagged critical tasks">
          <span className="baton-status-dot" aria-hidden="true" />Critical <strong>{urgent.length}</strong>
        </span>
        <span className={`baton-status-item ${blocked.length ? "is-blocked" : "is-clear"}`} style={{backgroundColor: blocked.length ? "var(--warn-bg)" : "var(--good-bg)"}} title="Possible blockers based on task wording">
          <span className="baton-status-dot" aria-hidden="true" />Blocked <strong>{blocked.length}</strong>
        </span>
        <span className={`baton-status-item ${pending.length ? "is-active" : "is-clear"}`} style={{backgroundColor: pending.length ? "var(--info-bg)" : "var(--good-bg)"}} title="Unfinished, unsnoozed items">Remaining <strong>{pending.length}</strong></span>
        {urgent.length > 0 && <button className="baton-status-pause" onClick={() => setPulsePaused(p => !p)}>{pulsePaused ? "Resume alerts" : "Pause alerts"}</button>}
      
</div><button className="btn baton-cockpit-toggle" onClick={() => setExpanded(v => !v)}>{expanded ? "Hide completed" : `Completed ${done.filter(id => today.some(t => t.id === id)).length}`}</button></div>
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {visible.map((it, n) => {
            const c = it.clientId ? clients.find((x) => x.id === it.clientId) : undefined;
            const isDone = done.includes(it.id);
            const k = KIND[it.kind];
            const isCritical = critical.includes(it.id) && !isDone;
            const isBlocked = !isDone && /\b(blocked|blocking|unblock)\b/i.test(it.title + " " + (it.why ?? ""));
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
                className={`row baton-task-row ${isCritical ? "baton-task-critical" : isBlocked ? "baton-task-blocked" : ""} ${isCritical && !pulsePaused ? "baton-task-pulse" : ""}`}
                style={{ borderLeft: `5px solid ${isCritical ? "var(--bad-dot)" : isBlocked ? "var(--warn-dot)" : c?.color ?? "var(--gray-dot)"}`, opacity: drag === it.id ? 0.4 : isDone ? 0.55 : 1, boxShadow: over === it.id && drag !== it.id ? "inset 0 2px 0 var(--text)" : undefined, cursor: isDone ? "default" : "grab", flexWrap: "wrap" }}>


                <input type="checkbox" aria-label={`Done: ${it.title}`} checked={isDone} onChange={() => setDone((d) => (isDone ? d.filter((x) => x !== it.id) : [...d, it.id]))} style={{ width: 17, height: 17 }} />
                <span title={c?.name ?? "Personal"}>{c ? <ClientTile client={c} small /> : <span className="tile tile-sm" style={{ background: "var(--text)" }} aria-hidden="true">P</span>}</span>
                <span className="baton-cockpit-task" style={{ flex: 1, minWidth: 180 }}>
                  <span style={{ fontWeight: 600, textDecoration: isDone ? "line-through" : undefined }}><button className="title-btn" onClick={(e) => setPop({ id: it.id, anchor: anchorOf(e.currentTarget) })} aria-haspopup="dialog">{it.title}</button></span>
                  <span className="baton-cockpit-space">{c?.name ?? "Personal"}</span>
                </span>
                {isCritical && <span className="badge b-bad"><Icon name="alert" size={13} />Critical</span>}
                {!isCritical && isBlocked && <span className="badge b-warn"><Icon name="alert" size={13} />Blocked?</span>}


                <details className="baton-more"><summary aria-label={`Actions for ${it.title}`}>···</summary><span className="baton-more-actions">
                  <button className="btn" style={{ minHeight: 32, padding: "0 8px" }} aria-pressed={critical.includes(it.id)} aria-label={`${critical.includes(it.id) ? "Unflag" : "Flag"} ${it.title} as critical`} title={critical.includes(it.id) ? "Remove critical flag" : "Mark critical"} onClick={() => setCritical(ids => ids.includes(it.id) ? ids.filter(x => x !== it.id) : [...ids, it.id])}>{critical.includes(it.id) ? "★" : "☆"}</button>
                  <button className="btn" style={{ minHeight: 32, padding: "0 8px" }} aria-label={`Move ${it.title} up`} disabled={isDone || n === 0} onClick={() => move(it.id, list.findIndex((i) => i.id === it.id) - 1)}>↑</button>
                  <button className="btn" style={{ minHeight: 32, padding: "0 8px" }} aria-label={`Move ${it.title} down`} disabled={isDone} onClick={() => move(it.id, list.findIndex((i) => i.id === it.id) + 1)}>↓</button>
                  <SnoozeButton label={it.title} compact onSnooze={(until) => setAsleep((a) => ({ ...a, [it.id]: until }))} />
                </span></details>
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
          <input className="input" style={{ flex: 1, minWidth: 200 }} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Capture a task…" aria-label="New item" />
          {showCaptureOptions && <select className="input" style={{ width: "auto" }} value={draftKind} onChange={(e) => setDraftKind(e.target.value as DayKind)} aria-label="Kind">
            {(Object.keys(KIND) as DayKind[]).map((k) => <option key={k} value={k}>{KIND[k].label}</option>)}
          </select>}
          <button className="btn baton-capture-options" type="button" aria-expanded={showCaptureOptions} onClick={() => setShowCaptureOptions(v => !v)}>Type</button>
          <button className="btn btn-primary" type="submit">Add</button>
        </form>
      </section>

      <details className="card baton-radar-disclosure" aria-label="Long-lead radar"><summary>Upcoming work <span className="muted">· {radar.length}</span></summary><div>
        <CardHead icon="clock" title="Long-lead radar" count={radar.length} sub="Due later, but the work starts now" />
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
      </div></details>
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
