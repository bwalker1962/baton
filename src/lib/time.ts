"use client";
// Tracked time: storage, duration maths, and the weekly rollups the dashboard
// and the CEO report read.
//
// This lives outside the timer component on purpose. The timer is one way to
// put time in; the rollups are the reason the time is collected at all. Keeping
// them together meant "minutes this week" in the dashboard stayed a hardcoded
// number while real sessions piled up where nothing could read them.
//
// Still this-browser-only in the prototype. A real build moves `read`/`write`
// to the database and everything above them stays as it is.
// © 2026 RidgeFront. All rights reserved.
import { useCallback, useEffect, useState } from "react";

export const TIMER_KEY = "baton-time-v2";
export const TIMER_START_EVENT = "baton:start-timer";
export const TIMER_CHANGED_EVENT = "baton:timers-changed";

/** How long one timer may run before Baton treats it as forgotten rather than worked. */
export const RUNAWAY_MS = 10 * 60 * 60 * 1000; // 10 hours
/** Silence from the keyboard and pointer for this long raises the "still working?" ask. */
export const IDLE_MS = 10 * 60 * 1000;
/** Sessions kept on the device. Oldest fall off so the store cannot grow without limit. */
export const MAX_SESSIONS = 500;
/** Conductor-hours budget per client per week; the number the model is built on. */
export const WEEKLY_TARGET_HOURS = { min: 3, max: 5 } as const;

export interface TimerStart {
  taskId?: string;
  task: string;
  spaceId: string;
  projectId?: string;
}

export interface Timer {
  id: string;
  taskId?: string;
  task: string;
  spaceId: string;
  projectId?: string;
  started: number;
  pausedAt?: number;
  excludedMs: number;
  lastActive: number;
}

export type Session = Timer & { ended: number };

export interface TimeData {
  running: Timer[];
  sessions: Session[];
}

export const emptyTimeData: TimeData = { running: [], sessions: [] };

/** Tracked milliseconds for a timer: wall clock since start, less anything excluded. */
export function duration(t: Timer, now: number): number {
  return Math.max(0, (t.pausedAt ?? now) - t.started - t.excludedMs);
}

/** A finished session's tracked milliseconds. */
export function sessionDuration(s: Session): number {
  return duration(s, s.ended);
}

export function clock(ms: number): string {
  const total = Math.floor(ms / 1000);
  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map((x) => String(x).padStart(2, "0"))
    .join(":");
}

/** True when a timer has been running long enough that it was probably left on. */
export function isRunaway(t: Timer, now: number): boolean {
  return !t.pausedAt && now - t.started >= RUNAWAY_MS;
}

/** True when a timer has seen no keyboard or pointer activity for a while. */
export function isIdle(t: Timer, now: number): boolean {
  return !t.pausedAt && now - t.lastActive >= IDLE_MS;
}

function newId(): string {
  // crypto.randomUUID needs a secure context; fall back so the timer still works
  // over plain http on a LAN address.
  try {
    return crypto.randomUUID();
  } catch {
    return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function makeTimer(detail: TimerStart, now = Date.now()): Timer {
  return {
    id: newId(),
    taskId: detail.taskId,
    task: detail.task.trim(),
    spaceId: detail.spaceId || "personal",
    projectId: detail.projectId,
    started: now,
    lastActive: now,
    excludedMs: 0,
  };
}

/** Read what is on this device, tolerating the v1 shape and corrupt JSON. */
export function read(): TimeData {
  if (typeof localStorage === "undefined") return emptyTimeData;
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<TimeData>;
      return {
        running: Array.isArray(d.running) ? d.running : [],
        sessions: Array.isArray(d.sessions) ? d.sessions : [],
      };
    }
    const old = localStorage.getItem("baton-time-v1");
    if (old) {
      const d = JSON.parse(old) as { running?: Partial<Timer>; sessions?: Session[] };
      const r = d.running;
      return {
        running: r
          ? [
              {
                ...(r as Timer),
                id: r.id ?? newId(),
                excludedMs: r.excludedMs ?? 0,
                lastActive: r.lastActive ?? r.started ?? Date.now(),
              },
            ]
          : [],
        sessions: Array.isArray(d.sessions) ? d.sessions : [],
      };
    }
  } catch {
    // Unreadable data is left in place rather than overwritten, so a bad parse
    // does not destroy what might still be recoverable by hand.
  }
  return emptyTimeData;
}

/** Persist, trimming the session history. Returns false when the browser refused. */
export function write(data: TimeData): boolean {
  if (typeof localStorage === "undefined") return false;
  const trimmed: TimeData = {
    running: data.running,
    sessions: data.sessions.slice(0, MAX_SESSIONS),
  };
  try {
    localStorage.setItem(TIMER_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new Event(TIMER_CHANGED_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function startTaskTimer(detail: TimerStart): void {
  window.dispatchEvent(new CustomEvent<TimerStart>(TIMER_START_EVENT, { detail }));
}

// ---------------------------------------------------------------------------
// Rollups
// ---------------------------------------------------------------------------

/** Midnight on the Monday of the week containing `ref`, in local time. */
export function weekStart(ref: Date = new Date()): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const shift = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - shift);
  return d;
}

export interface SpaceTotal {
  spaceId: string;
  ms: number;
  sessions: number;
  byProject: Record<string, number>;
}

/** Tracked time per Space for one week, from finished sessions. */
export function weekTotals(sessions: Session[], ref: Date = new Date()): Record<string, SpaceTotal> {
  const from = weekStart(ref).getTime();
  const to = from + 7 * 24 * 60 * 60 * 1000;
  const out: Record<string, SpaceTotal> = {};
  for (const s of sessions) {
    if (s.started < from || s.started >= to) continue;
    const row = (out[s.spaceId] ??= { spaceId: s.spaceId, ms: 0, sessions: 0, byProject: {} });
    const ms = sessionDuration(s);
    row.ms += ms;
    row.sessions += 1;
    const key = s.projectId ?? "";
    row.byProject[key] = (row.byProject[key] ?? 0) + ms;
  }
  return out;
}

/** Whole minutes tracked against one Space this week. */
export function minutesThisWeek(sessions: Session[], spaceId: string, ref: Date = new Date()): number {
  return Math.round((weekTotals(sessions, ref)[spaceId]?.ms ?? 0) / 60000);
}

export type PaceVerdict = "under" | "on" | "over" | "none";

/** Where a week's tracked hours sit against the conductor-hours budget. */
export function pace(minutes: number): PaceVerdict {
  if (minutes <= 0) return "none";
  const hours = minutes / 60;
  if (hours < WEEKLY_TARGET_HOURS.min) return "under";
  if (hours > WEEKLY_TARGET_HOURS.max) return "over";
  return "on";
}

/** Sessions whose clock overlaps another session's. Concurrent timers can double-count. */
export function overlapping(sessions: Session[]): Set<string> {
  const ordered = [...sessions].sort((a, b) => a.started - b.started);
  const hit = new Set<string>();
  for (let i = 0; i < ordered.length; i++) {
    for (let j = i + 1; j < ordered.length; j++) {
      if (ordered[j].started >= ordered[i].ended) break; // sorted, so nothing later can overlap
      hit.add(ordered[i].id);
      hit.add(ordered[j].id);
    }
  }
  return hit;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Read-only view of tracked time that keeps up with the timer panel, including
 * when the panel lives in another part of the tree or another tab.
 */
export function useTimeData(): TimeData {
  const [data, setData] = useState<TimeData>(emptyTimeData);
  const refresh = useCallback(() => setData(read()), []);
  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === TIMER_KEY) refresh();
    };
    window.addEventListener(TIMER_CHANGED_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(TIMER_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);
  return data;
}
