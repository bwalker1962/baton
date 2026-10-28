// Baton domain types. © 2026 RidgeFront. All rights reserved.
// Every client-scoped record carries firmId so more firms can be added later.

export type Health = "good" | "warn" | "bad" | "none";
export type Phase = "Align" | "Shape" | "Grow" | "Optimize";
export type CrewKind = "skill" | "app" | "person" | "gap";

export interface Firm {
  id: string;
  name: string;
}

export interface AppConnection {
  role: string; // Brand kit, Social, Email, CRM, PR, Files
  app: string;
  state: "connected" | "drafts" | "requested" | "error";
}

export interface KeyFile {
  label: string;
  source: string;
  updated: string; // ISO date
  isLogin?: boolean;
}

export interface Client {
  id: string;
  firmId: string;
  name: string;
  initial: string;
  color: string;
  tint: string;
  phase: Phase;
  health: Health;
  retainer: string;
  regulated: boolean;
  minutesThisWeek: number;
  apps: AppConnection[];
  keyFiles: KeyFile[];
  spotlight: string[]; // project names the CEO cares about
  summary: string; // three-sentence "how things are going"
}

export interface Crew {
  kind: CrewKind;
  label: string;
}

export interface Department {
  id: string;
  clientId: string;
  name: string;
  scope: string;
  health: Health;
  crew: Crew[];
  metricLabel: string;
  metric: string;
  next: string;
}

export type BlockerKind = "client" | "you" | "task" | "access";

export interface Task {
  id: string;
  clientId: string;
  title: string;
  dept: string;
  owner: string;
  ownerKind: CrewKind;
  due: string | null; // ISO date
  health: Health;
  pct: number;
  blocker?: { kind: BlockerKind; label: string };
}

export type SignoffState =
  | "needs"
  | "approved"
  | "approved-changes"
  | "resubmit"
  | "declined"
  | "held";

export type AssetKind = "email" | "social" | "doc";

export interface SignoffItem {
  id: string;
  clientId: string;
  title: string;
  kind: AssetKind;
  channel: string;
  tier: 1 | 2;
  skill: string;
  version: string;
  owner: string;
  due: string; // ISO date
  sendAt: string; // human readable scheduled send
  dept: string;
  state: SignoffState;
  changedSinceLast?: string;
  regulatory?: string[]; // rf-regulatory redlines
  body: string[]; // rendered asset paragraphs
  subject?: string;
  outcome?: string;
}

export interface Topic {
  id: string;
  clientId: string;
  title: string;
  category: string;
  date: string; // ISO
  program: string;
  summary: string;
  decision: string;
  followups: string;
}

export interface Skill {
  id: string;
  job: string;
  dept: string;
  version: string;
  firstPass: number | null; // first-pass approval rate, percent
  status: "active" | "draft";
}
