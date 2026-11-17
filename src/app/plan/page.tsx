"use client";
import { useEffect, useState } from "react";

type Lane = "inbox" | "today" | "doing" | "done";
type Task = { id: string; title: string; space: string; lane: Lane; plannedFor?: string; snoozeUntil?: string; due?: string; created: string };
const KEY = "baton-planning-v1";
const day = () => new Date().toLocaleDateString("en-CA");
const id = () => crypto.randomUUID();
const lanes: { key: Lane; label: string }[] = [
  { key: "today", label: "To do" }, { key: "doing", label: "In progress" }, { key: "done", label: "Done" }
];
const button: React.CSSProperties = { border: "1px solid var(--border, #aaa)", borderRadius: 8, padding: "7px 10px", cursor: "pointer", background: "transparent", color: "inherit" };

export default function PlanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<"pick" | "board">("pick");
  const [title, setTitle] = useState("");
  const [space, setSpace] = useState("Personal");
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(day());
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) setTasks(parsed); }
    } catch { /* local storage unavailable */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch { /* storage unavailable */ }
  }, [tasks, ready]);
  const update = (taskId: string, patch: Partial<Task>) => setTasks(old => old.map(t => t.id === taskId ? { ...t, ...patch } : t));
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setTasks(old => [{ id: id(), title: title.trim(), space: space.trim() || "Personal", lane: "inbox", created: new Date().toISOString() }, ...old]);
    setTitle("");
  };
  const carry = tasks.filter(t => (t.lane === "today" || t.lane === "doing") && t.plannedFor && t.plannedFor < today && (!t.snoozeUntil || t.snoozeUntil <= today));
  const candidates = tasks.filter(t => t.lane === "inbox" && (!t.snoozeUntil || t.snoozeUntil <= today));
  const active = tasks.filter(t => (t.lane === "today" || t.lane === "doing") && t.plannedFor === today);
  const done = tasks.filter(t => t.lane === "done" && t.plannedFor === today);
  const keep = (t: Task) => update(t.id, { lane: "today", plannedFor: today, snoozeUntil: undefined });
  const snooze = (t: Task, days: number) => { const d = new Date(); d.setDate(d.getDate() + days); update(t.id, { lane: "inbox", plannedFor: undefined, snoozeUntil: d.toLocaleDateString("en-CA") }); };
  const card = (t: Task, mode: "carry" | "pick" | "board") => (
    <div key={t.id} style={{ padding: 12, border: "1px solid var(--border, #bbb)", borderRadius: 10, marginBottom: 8 }}>
      <div style={{ fontWeight: 600 }}>{t.title}</div>
      <div style={{ opacity: .65, fontSize: 12, margin: "4px 0 10px" }}>{t.space}{t.due ? " · Due " + t.due : ""}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {mode !== "board" && <button style={button} onClick={() => keep(t)}>Keep today</button>}
        {mode === "board" && t.lane !== "doing" && t.lane !== "done" && <button style={button} onClick={() => update(t.id, { lane: "doing" })}>Start</button>}
        {mode === "board" && t.lane !== "done" && <button style={button} onClick={() => update(t.id, { lane: "done" })}>Done</button>}
        {mode === "board" && t.lane === "done" && <button style={button} onClick={() => update(t.id, { lane: "today" })}>Undo</button>}
        {mode !== "pick" && t.lane !== "done" && <button style={button} onClick={() => snooze(t, 1)}>Tomorrow</button>}
        {mode === "carry" && <button style={button} onClick={() => snooze(t, 7)}>Snooze 1 week</button>}
        {mode === "carry" && <button style={button} onClick={() => update(t.id, { lane: "inbox", plannedFor: undefined })}>Backlog</button>}
        {mode === "pick" && <button style={button} onClick={() => snooze(t, 7)}>Snooze 1 week</button>}
      </div>
    </div>
  );
  if (!ready) return <div>Loading your planning board…</div>;
  return (
    <section style={{ maxWidth: 1100, display: "grid", gap: 22 }}>
      <header><div className="eyebrow">PERSONAL WORKSPACE</div><h1>Plan my day</h1><p style={{ opacity: .7 }}>Choose deliberately. Unfinished work waits for your decision tomorrow.</p></header>
      <form onSubmit={add} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input aria-label="New task" placeholder="Capture a task or idea…" value={title} onChange={e => setTitle(e.target.value)} style={{ flex: "2 1 230px", padding: 10, borderRadius: 8 }} />
        <input aria-label="Space" placeholder="Space" value={space} onChange={e => setSpace(e.target.value)} style={{ flex: "1 1 120px", padding: 10, borderRadius: 8 }} />
        <button style={button} type="submit">Add to inbox</button>
      </form>
      {carry.length > 0 && <section><h2>From yesterday · {carry.length}</h2><p>Keep it today, snooze it, or return it to your backlog.</p>{carry.map(t => card(t, "carry"))}</section>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Today · {active.length} active</h2>
        <div style={{ display: "flex", gap: 6 }}><button style={button} aria-pressed={view === "pick"} onClick={() => setView("pick")}>Picking list</button><button style={button} aria-pressed={view === "board"} onClick={() => setView("board")}>Kanban</button></div>
      </div>
      {view === "pick" ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 18 }}>
        <section><h3>Today's picks</h3>{active.length ? active.map(t => card(t, "board")) : <p>No tasks selected yet.</p>}</section>
        <section><h3>Pick from inbox · {candidates.length}</h3>{candidates.map(t => card(t, "pick"))}{!candidates.length && <p>Your inbox is clear.</p>}</section>
      </div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        {lanes.map(l => <section key={l.key} style={{ padding: 12, background: "var(--surface-2, rgba(128,128,128,.07))", borderRadius: 12 }}><h3>{l.label}</h3>{(l.key === "done" ? done : active.filter(t => t.lane === l.key)).map(t => card(t, "board"))}</section>)}
      </div>}
      <section><h3>Backlog & snoozed</h3><p style={{ opacity: .7 }}>Everything stays here until you select it. Snoozed tasks reappear when due.</p>{tasks.filter(t => t.lane === "inbox" && t.snoozeUntil && t.snoozeUntil > today).map(t => <div key={t.id} style={{ padding: 8 }}>{t.title} · returns {t.snoozeUntil} <button style={button} onClick={() => keep(t)}>Bring to today</button></div>)}</section>
      <p style={{ fontSize: 12, opacity: .65 }}>Pilot: data is saved only in this browser. Cross-device sync and notifications are not yet enabled.</p>
    </section>
  );
}
