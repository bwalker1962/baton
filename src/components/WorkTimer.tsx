"use client";
// The timer panel in the global header. Time maths, storage and rollups live in
// lib/time.ts; this file is the controls around them.
// © 2026 RidgeFront. All rights reserved.
import { useCallback, useEffect, useRef, useState } from "react";
import { useSpaces } from "@/lib/spaces";
import { useStore } from "@/lib/store";
import {
  clock,
  duration,
  emptyTimeData,
  isIdle,
  isRunaway,
  makeTimer,
  overlapping,
  read,
  sessionDuration,
  startTaskTimer,
  write,
  RUNAWAY_MS,
  TIMER_START_EVENT,
  type TimeData,
  type Timer,
  type TimerStart,
} from "@/lib/time";

// Kept so existing importers of this module keep working.
export { startTaskTimer, TIMER_KEY, TIMER_START_EVENT, type TimerStart } from "@/lib/time";

/** How often to re-check for idle and runaway timers. */
const CHECK_MS = 15000;
/** Don't rewrite lastActive on every keystroke. */
const ACTIVITY_THROTTLE_MS = 30000;

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

export function WorkTimer() {
  const spaces = useSpaces();
  const { projects } = useStore();

  const [data, setData] = useState<TimeData>(emptyTimeData);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(0);
  const [warning, setWarning] = useState("");
  const [review, setReview] = useState<string[]>([]);

  const [task, setTask] = useState("");
  const [spaceId, setSpaceId] = useState("personal");
  const [projectId, setProjectId] = useState("");

  // The idle/runaway check needs the current timers but must not re-register its
  // listeners every time they change, so it reads them through a ref.
  const runningRef = useRef<Timer[]>([]);
  runningRef.current = data.running;

  useEffect(() => {
    setData(read());
    setReady(true);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (!ready) return;
    setWarning(write(data) ? "" : "Could not save your time on this device. Export before closing the tab.");
  }, [data, ready]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onStart = (event: Event) => {
      const d = (event as CustomEvent<TimerStart>).detail;
      if (!d?.task?.trim()) return;
      setData((old) => ({ ...old, running: [...old.running, makeTimer(d)] }));
      setOpen(true);
    };
    window.addEventListener(TIMER_START_EVENT, onStart);
    return () => window.removeEventListener(TIMER_START_EVENT, onStart);
  }, []);

  // One registration for the lifetime of the panel. This effect previously
  // depended on data.running, so four listeners and the interval were torn down
  // and rebuilt on every activity tick, and the interval rarely lived long
  // enough to fire on its own.
  useEffect(() => {
    if (!ready) return;

    const check = () => {
      const n = Date.now();
      const flagged = runningRef.current.filter((t) => isIdle(t, n) || isRunaway(t, n)).map((t) => t.id);
      if (flagged.length) {
        setReview((prev) => (sameIds(prev, flagged) ? prev : flagged));
        setOpen(true);
      } else {
        setReview((prev) => (prev.length ? [] : prev));
      }
    };

    const activity = () => {
      const n = Date.now();
      // A timer already in review stays there until answered; bumping lastActive
      // here would silently dismiss the question.
      if (runningRef.current.some((t) => isIdle(t, n) || isRunaway(t, n))) return check();
      setData((d) => {
        const next = d.running.map((t) =>
          !t.pausedAt && n - t.lastActive >= ACTIVITY_THROTTLE_MS ? { ...t, lastActive: n } : t,
        );
        return next.some((t, i) => t !== d.running[i]) ? { ...d, running: next } : d;
      });
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    const interval = setInterval(check, CHECK_MS);
    window.addEventListener("pointerdown", activity);
    window.addEventListener("keydown", activity);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", onVisible);
    check();
    return () => {
      clearInterval(interval);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ready]);

  const change = useCallback(
    (id: string, fn: (t: Timer) => Timer) =>
      setData((d) => ({ ...d, running: d.running.map((t) => (t.id === id ? fn(t) : t)) })),
    [],
  );

  const pause = (id: string) => change(id, (t) => ({ ...t, pausedAt: t.pausedAt ?? Date.now() }));

  const resume = (id: string) =>
    change(id, (t) => {
      const n = Date.now();
      return { ...t, excludedMs: t.excludedMs + (t.pausedAt ? n - t.pausedAt : 0), pausedAt: undefined, lastActive: n };
    });

  /** Answer the "still working?" question: keep the gap, or drop it. */
  const resolve = (id: string, exclude: boolean) => {
    change(id, (t) => ({
      ...t,
      excludedMs: t.excludedMs + (exclude ? Math.max(0, Date.now() - t.lastActive) : 0),
      lastActive: Date.now(),
    }));
    setReview((v) => v.filter((x) => x !== id));
  };

  /** Keep only the time up to when activity stopped, then log it. */
  const trimAndFinish = (id: string) => {
    setData((d) => {
      const target = d.running.find((x) => x.id === id);
      if (!target) return d;
      return {
        running: d.running.filter((x) => x.id !== id),
        sessions: [{ ...target, pausedAt: undefined, ended: target.lastActive }, ...d.sessions],
      };
    });
    setReview((v) => v.filter((x) => x !== id));
  };

  const finish = (id: string) => {
    const target = runningRef.current.find((t) => t.id === id);
    if (!target) return;
    const endAt = target.pausedAt ?? Date.now();
    // Overlap means this session's clock ran alongside another's — not merely
    // that some other timer happens to exist right now.
    const clash = runningRef.current.filter(
      (t) => t.id !== id && !t.pausedAt && t.started < endAt && (t.pausedAt ?? Date.now()) > target.started,
    );
    if (clash.length) {
      const where =
        projects.find((p) => p.id === target.projectId)?.name ??
        spaces.find((x) => x.id === target.spaceId)?.name ??
        "its Space";
      const ok = window.confirm(
        `This session overlaps ${clash.length} other running timer${clash.length === 1 ? "" : "s"}. ` +
          `Log it to ${where} anyway? Overlapping time is counted in full for each client, so totals across clients can exceed the clock.`,
      );
      if (!ok) return;
    }
    setData((d) => {
      const t = d.running.find((x) => x.id === id);
      if (!t) return d;
      return {
        running: d.running.filter((x) => x.id !== id),
        sessions: [{ ...t, ended: t.pausedAt ?? Date.now() }, ...d.sessions],
      };
    });
  };

  const discard = (id: string) => {
    const t = runningRef.current.find((x) => x.id === id);
    if (!t) return;
    if (!window.confirm(`Discard ${clock(duration(t, Date.now()))} on "${t.task}" without logging it?`)) return;
    setData((d) => ({ ...d, running: d.running.filter((x) => x.id !== id) }));
    setReview((v) => v.filter((x) => x !== id));
  };

  const exportCSV = () => {
    const clash = overlapping(data.sessions);
    const rows = [
      ["Date", "Space", "Project", "Task", "Task ID", "Start", "Finish", "Tracked minutes", "Excluded minutes", "Overlaps another session"],
      ...data.sessions.map((s) => [
        new Date(s.started).toLocaleDateString("en-CA"),
        spaces.find((x) => x.id === s.spaceId)?.name ?? s.spaceId,
        projects.find((p) => p.id === s.projectId)?.name ?? "",
        s.task,
        s.taskId ?? "",
        new Date(s.started).toISOString(),
        new Date(s.ended).toISOString(),
        String(Math.round(sessionDuration(s) / 60000)),
        String(Math.round(s.excludedMs / 60000)),
        clash.has(s.id) ? "Yes" : "No",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `baton-time-log-${new Date().toLocaleDateString("en-CA")}.csv`;
    document.body.appendChild(a); // Firefox will not follow a link that is not in the document
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const active = data.running.filter((t) => !t.pausedAt).length;

  return (
    <div className="baton-timer-wrap">
      <button
        className={`baton-timer-trigger ${active ? "is-running" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Open work timers"
      >
        <span aria-hidden="true">◷</span>
        <span>{data.running.length ? `${active} active · ${data.running.length} timers` : "Timer"}</span>
        {review.length > 0 && <span aria-label="A timer needs review">!</span>}
      </button>

      {open && (
        <div className="baton-timer-panel baton-timer-multi" role="region" aria-label="Work timers">
          <div className="baton-timer-title">
            <strong>Work timers</strong>
            <button onClick={() => setOpen(false)} aria-label="Close timers">×</button>
          </div>

          {warning && <p role="alert" className="baton-timer-alert">{warning}</p>}

          {data.running.map((t) => {
            const runaway = isRunaway(t, now);
            const idleMinutes = Math.floor((now - t.lastActive) / 60000);
            return (
              <section className="baton-timer-session" key={t.id}>
                <div className="baton-timer-session-head">
                  <strong>{t.task}</strong>
                  <strong className="baton-timer-clock-small">{clock(duration(t, now))}</strong>
                </div>
                <p className="muted small">
                  {spaces.find((s) => s.id === t.spaceId)?.name ?? t.spaceId}
                  {t.pausedAt ? " · Paused" : " · Running"}
                </p>

                <label>
                  Report under project
                  <select
                    className="input"
                    value={t.projectId ?? ""}
                    onChange={(e) => change(t.id, (x) => ({ ...x, projectId: e.target.value || undefined }))}
                  >
                    <option value="">No project (Space only)</option>
                    {projects.filter((p) => p.clientId === t.spaceId).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>

                {review.includes(t.id) && !t.pausedAt && (
                  <div className="baton-timer-alert">
                    {runaway ? (
                      <>
                        <strong>Running for {Math.floor(duration(t, now) / 3600000)} hours.</strong>
                        <p>
                          Longer than a working day, so this was probably left on. Keep only the time up to the last
                          activity, {idleMinutes >= 120 ? `about ${Math.floor(idleMinutes / 60)} hours ago` : `${idleMinutes} minutes ago`},
                          or count the whole stretch.
                        </p>
                      </>
                    ) : (
                      <>
                        <strong>Still working?</strong>
                        <p>No activity for {idleMinutes} minutes. Baton asks rather than deciding for you.</p>
                      </>
                    )}
                    <div className="baton-timer-buttons">
                      {runaway && (
                        <button className="btn btn-primary" onClick={() => trimAndFinish(t.id)}>
                          Log up to last activity
                        </button>
                      )}
                      <button className="btn" onClick={() => resolve(t.id, false)}>Count all</button>
                      <button className="btn" onClick={() => resolve(t.id, true)}>Exclude idle</button>
                      <button className="btn" onClick={() => { pause(t.id); setReview((v) => v.filter((x) => x !== t.id)); }}>
                        Pause
                      </button>
                    </div>
                  </div>
                )}

                <div className="baton-timer-buttons">
                  {t.pausedAt
                    ? <button className="btn" onClick={() => resume(t.id)}>Resume</button>
                    : <button className="btn" onClick={() => pause(t.id)}>Pause</button>}
                  <button className="btn btn-primary" onClick={() => finish(t.id)}>Finish &amp; log</button>
                  <button className="btn" onClick={() => discard(t.id)}>Discard</button>
                </div>
              </section>
            );
          })}

          <div className="baton-timer-new">
            <label>
              New timer
              <input className="input" value={task} onChange={(e) => setTask(e.target.value)} placeholder="What are you working on?" />
            </label>
            <label>
              Space
              <select className="input" value={spaceId} onChange={(e) => { setSpaceId(e.target.value); setProjectId(""); }}>
                {spaces.filter((s) => !s.archived).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label>
              Project (optional)
              <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">No project</option>
                {projects.filter((p) => p.clientId === spaceId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <button
              className="btn btn-primary"
              disabled={!task.trim()}
              onClick={() => { startTaskTimer({ task, spaceId, projectId: projectId || undefined }); setTask(""); }}
            >
              Start another timer
            </button>
          </div>

          <div className="baton-timer-log">
            <strong>Recent sessions</strong>
            {data.sessions.slice(0, 5).map((s) => (
              <div key={s.id}>
                <span>{s.task}<small>{spaces.find((x) => x.id === s.spaceId)?.name ?? s.spaceId}</small></span>
                <strong>{clock(sessionDuration(s))}</strong>
              </div>
            ))}
            {data.sessions.length > 0 && <button className="btn" onClick={exportCSV}>Export CSV</button>}
          </div>

          <p className="muted small">
            Timers past {RUNAWAY_MS / 3600000} hours are flagged rather than logged. Overlaps are marked in exports.
            Saved in this browser only.
          </p>
        </div>
      )}
    </div>
  );
}
