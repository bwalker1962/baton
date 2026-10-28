// Sample data for the Today list and the long-lead radar.
export type DayKind = "review" | "task" | "planning" | "meeting";

export interface DayItem {
  id: string;
  title: string;
  clientId?: string; // none = across all clients
  kind: DayKind;
  minutes: number;
  href?: string;
  why?: string; // why it is on today's list
}

/** Long-lead work: the due date is far away, but the work has to start now. */
export interface LeadItem {
  id: string;
  title: string;
  clientId: string;
  due: string; // ISO date the outcome is due (send, submit, launch)
  leadDays: number; // how long before due the work must start
  minutes: number;
  cadence?: string; // recurring planning rhythm
}

export const DAY_HOURS = 6;
export const PLANNING_GOAL = 0.2; // at least a fifth of the day on long-lead work

export const todaySeed: DayItem[] = [
  { id: "d1", title: "Clear sign-off queue", kind: "review", minutes: 25, href: "/signoff", why: "6 items waiting, 2 send today" },
  { id: "d2", title: "Kick off December newsletter: topics and owner", clientId: "pentara", kind: "planning", minutes: 30, why: "Starts today: sends Dec 8, 6-week lead" },
  { id: "d3", title: "CEO check-in", clientId: "morning-miracle", kind: "meeting", minutes: 30, why: "2:00 pm" },
  { id: "d4", title: "Unblock Klaviyo access for day-45 email", clientId: "morning-miracle", kind: "task", minutes: 15, why: "Blocking a send for 2 days" },
  { id: "d5", title: "Draft December editorial calendar", clientId: "morning-miracle", kind: "planning", minutes: 45, why: "Starts today: Dec posts schedule from Nov 20" },
  { id: "d6", title: "Review GEODesign touch 2 draft", clientId: "pentara", kind: "task", minutes: 20 },
  { id: "d7", title: "Outline Q1 plan for the CEO", clientId: "photopharmics", kind: "planning", minutes: 40, why: "Board meets Dec 10" },
];

export const leadSeed: LeadItem[] = [
  { id: "l1", title: "Late-breaking abstract for [neurology conference]", clientId: "pentara", due: "2026-12-15", leadDays: 42, minutes: 60 },
  { id: "l2", title: "Q1 podcast pitches: booking window opens", clientId: "pentara", due: "2026-12-01", leadDays: 30, minutes: 45 },
  { id: "l3", title: "Valentine's promotion: offer, creative, emails", clientId: "morning-miracle", due: "2027-02-01", leadDays: 75, minutes: 60 },
  { id: "l4", title: "January editorial calendar", clientId: "mountain-peaks", due: "2026-12-20", leadDays: 28, minutes: 45, cadence: "Monthly, 4 weeks ahead" },
  { id: "l5", title: "January newsletter kickoff", clientId: "photopharmics", due: "2027-01-12", leadDays: 42, minutes: 30, cadence: "Monthly, 6 weeks ahead" },
  { id: "l6", title: "[Industry award] entry", clientId: "pentara", due: "2027-01-12", leadDays: 56, minutes: 90 },
];
