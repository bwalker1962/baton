// Tests for the time maths. These numbers reach a client CEO and decide
// whether a week looks inside its budget, so they are worth pinning down.
// Run with: npm test
// © 2026 RidgeFront. All rights reserved.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  duration,
  isIdle,
  isRunaway,
  minutesThisWeek,
  overlapping,
  pace,
  sessionDuration,
  weekStart,
  weekTotals,
  IDLE_MS,
  RUNAWAY_MS,
  type Session,
} from "./time.ts";

const MIN = 60_000;
const HOUR = 60 * MIN;

function session(over: Partial<Session> & { started: number; ended: number }): Session {
  return {
    id: Math.random().toString(36).slice(2),
    task: "work",
    spaceId: "pentara",
    excludedMs: 0,
    lastActive: over.ended,
    ...over,
  };
}

test("weekStart lands on Monday midnight, local", () => {
  // Wednesday 2026-11-18
  const wed = new Date(2026, 10, 18, 15, 30);
  const start = weekStart(wed);
  assert.equal(start.getDay(), 1, "Monday");
  assert.equal(start.getDate(), 16);
  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
});

test("weekStart treats Sunday as the end of the week, not the start", () => {
  const sun = new Date(2026, 10, 22, 9, 0); // Sunday
  const start = weekStart(sun);
  assert.equal(start.getDay(), 1);
  assert.equal(start.getDate(), 16, "the Monday six days earlier");
});

test("duration subtracts excluded time", () => {
  const t = { id: "a", task: "x", spaceId: "s", started: 0, excludedMs: 10 * MIN, lastActive: 0 };
  assert.equal(duration(t, HOUR), 50 * MIN);
});

test("duration freezes while paused", () => {
  const t = { id: "a", task: "x", spaceId: "s", started: 0, pausedAt: 20 * MIN, excludedMs: 0, lastActive: 0 };
  assert.equal(duration(t, HOUR), 20 * MIN, "later wall clock does not add time");
  assert.equal(duration(t, 10 * HOUR), 20 * MIN);
});

test("duration never goes negative", () => {
  const t = { id: "a", task: "x", spaceId: "s", started: 0, excludedMs: 10 * HOUR, lastActive: 0 };
  assert.equal(duration(t, HOUR), 0);
});

test("weekTotals counts only sessions inside the week", () => {
  const monday = weekStart(new Date(2026, 10, 18)).getTime();
  const sessions = [
    session({ started: monday + HOUR, ended: monday + 2 * HOUR }), // in
    session({ started: monday - 2 * HOUR, ended: monday - HOUR }), // last week
    session({ started: monday + 8 * 24 * HOUR, ended: monday + 8 * 24 * HOUR + HOUR }), // next week
  ];
  const totals = weekTotals(sessions, new Date(2026, 10, 18));
  assert.equal(totals.pentara.sessions, 1);
  assert.equal(totals.pentara.ms, HOUR);
});

test("weekTotals separates spaces and groups by project", () => {
  const monday = weekStart(new Date(2026, 10, 18)).getTime();
  const sessions = [
    session({ started: monday + HOUR, ended: monday + 2 * HOUR, spaceId: "pentara", projectId: "p1" }),
    session({ started: monday + 3 * HOUR, ended: monday + 4 * HOUR, spaceId: "pentara", projectId: "p1" }),
    session({ started: monday + 5 * HOUR, ended: monday + 6 * HOUR, spaceId: "pentara" }), // no project
    session({ started: monday + 7 * HOUR, ended: monday + 8 * HOUR, spaceId: "morning-miracle" }),
  ];
  const totals = weekTotals(sessions, new Date(2026, 10, 18));
  assert.equal(totals.pentara.ms, 3 * HOUR);
  assert.equal(totals.pentara.byProject.p1, 2 * HOUR);
  assert.equal(totals.pentara.byProject[""], HOUR, "unassigned time keyed separately");
  assert.equal(totals["morning-miracle"].ms, HOUR);
});

test("weekTotals honours excluded time", () => {
  const monday = weekStart(new Date(2026, 10, 18)).getTime();
  const s = session({ started: monday + HOUR, ended: monday + 3 * HOUR, excludedMs: 30 * MIN });
  assert.equal(sessionDuration(s), 90 * MIN);
  assert.equal(minutesThisWeek([s], "pentara", new Date(2026, 10, 18)), 90);
});

test("minutesThisWeek is zero for a client with nothing logged", () => {
  assert.equal(minutesThisWeek([], "pentara"), 0);
});

test("pace brackets the conductor-hours budget", () => {
  assert.equal(pace(0), "none");
  assert.equal(pace(2 * 60 + 59), "under");
  assert.equal(pace(3 * 60), "on", "the floor counts as on budget");
  assert.equal(pace(4 * 60), "on");
  assert.equal(pace(5 * 60), "on", "the ceiling counts as on budget");
  assert.equal(pace(5 * 60 + 1), "over");
});

test("overlapping finds concurrent sessions and leaves the rest alone", () => {
  const a = session({ id: "a", started: 0, ended: 2 * HOUR });
  const b = session({ id: "b", started: HOUR, ended: 3 * HOUR }); // overlaps a
  const c = session({ id: "c", started: 4 * HOUR, ended: 5 * HOUR }); // clear
  const hit = overlapping([a, b, c]);
  assert.ok(hit.has("a"));
  assert.ok(hit.has("b"));
  assert.ok(!hit.has("c"));
});

test("sessions that merely touch end to end do not count as overlapping", () => {
  const a = session({ id: "a", started: 0, ended: HOUR });
  const b = session({ id: "b", started: HOUR, ended: 2 * HOUR });
  assert.equal(overlapping([a, b]).size, 0);
});

test("overlapping is order independent", () => {
  const a = session({ id: "a", started: 2 * HOUR, ended: 4 * HOUR });
  const b = session({ id: "b", started: 0, ended: 3 * HOUR });
  assert.equal(overlapping([a, b]).size, 2);
  assert.equal(overlapping([b, a]).size, 2);
});

test("isIdle fires only past the threshold, and never while paused", () => {
  const base = { id: "a", task: "x", spaceId: "s", started: 0, excludedMs: 0 };
  assert.ok(!isIdle({ ...base, lastActive: 0 }, IDLE_MS - 1));
  assert.ok(isIdle({ ...base, lastActive: 0 }, IDLE_MS));
  assert.ok(!isIdle({ ...base, lastActive: 0, pausedAt: 1 }, IDLE_MS * 10), "paused timers are not idle");
});

test("isRunaway catches a timer left on overnight", () => {
  const base = { id: "a", task: "x", spaceId: "s", started: 0, excludedMs: 0, lastActive: 0 };
  assert.ok(!isRunaway(base, RUNAWAY_MS - 1));
  assert.ok(isRunaway(base, RUNAWAY_MS));
  assert.ok(isRunaway(base, 15 * HOUR), "closed the laptop at 6pm, opened it at 9am");
  assert.ok(!isRunaway({ ...base, pausedAt: HOUR }, 15 * HOUR), "paused is deliberate, not forgotten");
});
