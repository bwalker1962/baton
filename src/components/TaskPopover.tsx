"use client";
// Click a task anywhere to adjust it in place. Changes apply as you make them and show
// everywhere the task appears (Tasks, dashboards, Owed to the CEO).
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { clients, TODAY } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { BlockerKind, DayKindLike, Health } from "./taskTypes";
import { SnoozeButton, wakeLabel } from "./Snooze";
import { useAddToAgenda } from "./OneOnOne";
import { Icon } from "./Icon";

export type Anchor = { top: number; left: number; bottom: number; right: number };
export const anchorOf = (el: Element): Anchor => { const r = el.getBoundingClientRect(); return { top: r.top, left: r.left, bottom: r.bottom, right: r.right }; };

const W = 360;
/** Positions next to what you clicked; a bottom sheet on phones. Escape or a click outside closes it. */
function Frame({ anchor, onClose, label, children }: { anchor: Anchor; onClose: () => void; label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const isPhone = window.innerWidth < 700;
    setPhone(isPhone);
    const h = ref.current?.offsetHeight ?? 420;
    const below = anchor.bottom + 8;
    const top = below + h > window.innerHeight - 12 ? Math.max(12, anchor.top - h - 8) : below;
    setPos({ top, left: Math.max(12, Math.min(anchor.left, window.innerWidth - W - 12)) });
    ref.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
  }, [anchor]);
  useEffect(() => {
    const out = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node) && !(e.target as Element).closest?.("[role=menu]")) onClose(); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", out); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", out); document.removeEventListener("keydown", esc); };
  }, [onClose]);
  return (
    <div ref={ref} role="dialog" aria-label={label} className="card fade task-pop"
      style={phone ? { position: "fixed", left: 8, right: 8, bottom: 8, zIndex: 70 } : { position: "fixed", top: pos?.top ?? -9999, left: pos?.left ?? 0, width: W, zIndex: 70 }}>
      {children}
    </div>
  );
}

const Field = ({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: wide ? "1 / -1" : undefined }} className="small">
    <span className="muted xs" style={{ fontWeight: 700, letterSpacing: "0.03em" }}>{label}</span>{children}
  </label>
);

const HEALTH: [Health, string][] = [["good", "On track"], ["warn", "Watch"], ["bad", "Off track"], ["none", "Not started"]];
const BLOCKERS: [BlockerKind | "", string][] = [["", "None"], ["client", "Waiting on client"], ["you", "Waiting on you"], ["task", "Depends on a task"], ["access", "Needs access"]];

export function TaskPopover({ taskId, anchor, onClose }: { taskId: string; anchor: Anchor; onClose: () => void }) {
  const { tasks, editTask, snoozed, snooze } = useStore();
  const addToAgenda = useAddToAgenda();
  const [onAgenda, setOnAgenda] = useState(false);
  const t = tasks.find((x) => x.id === taskId);
  if (!t) return null;
  const set = (patch: Parameters<typeof editTask>[1]) => editTask(t.id, patch);
  const client = clients.find((c) => c.id === t.clientId);
  return (
    <Frame anchor={anchor} onClose={onClose} label={`Settings for ${t.title}`}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <span className="xs muted">{client?.name} · {t.dept}</span>
        <button className="btn" onClick={onClose} style={{ minHeight: 28, padding: "0 8px" }} aria-label="Close">Done</button>
      </div>
      <input className="input" value={t.title} onChange={(e) => set({ title: e.target.value })} aria-label="Task title" style={{ fontWeight: 700, fontSize: 15 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="STATUS">
          <select className="input" value={t.health} onChange={(e) => set({ health: e.target.value as Health })}>{HEALTH.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </Field>
        <Field label="OWNER">
          <input className="input" list="task-owners" value={t.owner} onChange={(e) => set({ owner: e.target.value, ownerKind: e.target.value.startsWith("rf-") ? "skill" : "person" })} />
          <datalist id="task-owners">{["BCW", "Client", "PR contractor", "rf-copy", "rf-positioning", "rf-content"].map((o) => <option key={o} value={o} />)}</datalist>
        </Field>
        <Field label="DUE">
          <span style={{ display: "flex", gap: 4 }}>
            <input className="input" type="date" value={t.due ?? ""} onChange={(e) => set({ due: e.target.value || null })} />
          </span>
        </Field>
        <Field label={`PROGRESS · ${t.pct}%`}>
          <input type="range" min={0} max={100} step={5} value={t.pct} onChange={(e) => set({ pct: Number(e.target.value) })} style={{ accentColor: "var(--text)" }} />
        </Field>
        <Field label="ROADBLOCK">
          <select className="input" value={t.blocker?.kind ?? ""} onChange={(e) => set({ blocker: e.target.value ? { kind: e.target.value as BlockerKind, label: t.blocker?.label ?? "" } : undefined })}>
            {BLOCKERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        {t.blocker && (
          <Field label="WHAT IT NEEDS">
            <input className="input" value={t.blocker.label} onChange={(e) => set({ blocker: { kind: t.blocker!.kind, label: e.target.value } })} placeholder="e.g. CRM access" />
          </Field>
        )}
      </div>
      <div className="task-promise" style={{ background: t.promised ? "var(--info-bg)" : "var(--surface-2)" }}>
        <label className="small" style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
          <input type="checkbox" checked={!!t.promised} onChange={(e) => set({ promised: e.target.checked ? { to: "CEO", on: TODAY } : undefined })} style={{ width: 16, height: 16 }} />
          Promised to the CEO
        </label>
        {t.promised && (
          <span className="small" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            to <input className="input" list="promise-to" value={t.promised.to} onChange={(e) => set({ promised: { ...t.promised!, to: e.target.value } })} style={{ width: 110, padding: "4px 6px" }} aria-label="Promised to" />
            <datalist id="promise-to">{["CEO", "Founder", "COO", "Board"].map((o) => <option key={o} value={o} />)}</datalist>
            on <input className="input" type="date" value={t.promised.on} onChange={(e) => set({ promised: { ...t.promised!, on: e.target.value } })} style={{ width: "auto", padding: "4px 6px" }} aria-label="Promised on" />
          </span>
        )}
        {t.promised && !t.due && <span className="xs" style={{ color: "var(--warn-fg)", fontWeight: 600 }}>A promise needs a due date to be tracked.</span>}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <SnoozeButton label={t.title} onSnooze={(until) => snooze(t.id, until)} />
        {snoozed[t.id] > TODAY && <button className="btn" style={{ minHeight: 32 }} onClick={() => snooze(t.id, null)}>Wake (back {wakeLabel(snoozed[t.id])})</button>}
        <button className="btn" style={{ minHeight: 32 }} disabled={onAgenda} onClick={() => { addToAgenda(t.clientId, { title: t.title, kind: "task", refId: t.id, href: `/clients/${t.clientId}/tasks` }); setOnAgenda(true); }}>
          <Icon name="chat" size={14} />{onAgenda ? "On the 1:1" : "Add to 1:1"}
        </button>
        <Link href={`/clients/${t.clientId}/tasks`} className="small" style={{ marginLeft: "auto" }} onClick={onClose}>All {client?.name} tasks</Link>
      </div>
    </Frame>
  );
}

export interface DayLike { id: string; title: string; clientId?: string; kind: DayKindLike; minutes: number; href?: string; why?: string }

/** Today items are lighter than tasks: what, for whom, what kind, how long. */
export function DayItemPopover({ item, anchor, onClose, onChange, onSnooze, onRemove }:
  { item: DayLike; anchor: Anchor; onClose: () => void; onChange: (p: Partial<DayLike>) => void; onSnooze: (until: string) => void; onRemove: () => void }) {
  const addToAgenda = useAddToAgenda();
  const [onAgenda, setOnAgenda] = useState(false);
  return (
    <Frame anchor={anchor} onClose={onClose} label={`Settings for ${item.title}`}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <span className="xs muted">Today</span>
        <button className="btn" onClick={onClose} style={{ minHeight: 28, padding: "0 8px" }}>Done</button>
      </div>
      <input className="input" value={item.title} onChange={(e) => onChange({ title: e.target.value })} aria-label="Title" style={{ fontWeight: 700, fontSize: 15 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="CLIENT">
          <select className="input" value={item.clientId ?? ""} onChange={(e) => onChange({ clientId: e.target.value || undefined })}>
            <option value="">All clients</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="TIME">
          <select className="input" value={item.minutes} onChange={(e) => onChange({ minutes: Number(e.target.value) })}>
            {[10, 15, 20, 25, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} h`}</option>)}
          </select>
        </Field>
        <Field label="KIND" wide>
          <span className="seg" role="group" aria-label="Kind">
            {(["review", "task", "planning", "meeting"] as DayKindLike[]).map((k) => <button type="button" key={k} aria-pressed={item.kind === k} onClick={() => onChange({ kind: k })}>{k[0].toUpperCase() + k.slice(1)}</button>)}
          </span>
        </Field>
        <Field label="NOTE" wide>
          <input className="input" value={item.why ?? ""} onChange={(e) => onChange({ why: e.target.value })} placeholder="Why it's on today" />
        </Field>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <SnoozeButton label={item.title} onSnooze={(u) => { onSnooze(u); onClose(); }} />
        {item.clientId && (
          <button className="btn" style={{ minHeight: 32 }} disabled={onAgenda} onClick={() => { addToAgenda(item.clientId!, { title: item.title, kind: "task", href: item.href }); setOnAgenda(true); }}>
            <Icon name="chat" size={14} />{onAgenda ? "On the 1:1" : "Add to 1:1"}
          </button>
        )}
        <button className="btn" style={{ minHeight: 32 }} onClick={() => { onRemove(); onClose(); }}>Remove</button>
        {item.href && <Link href={item.href} className="small" style={{ marginLeft: "auto" }}>Open</Link>}
      </div>
    </Frame>
  );
}
