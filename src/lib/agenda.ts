// The 1:1 agenda: topics for the next CEO conversation, per client. It floats over every
// screen, takes dragged tasks, sign-off items and projects, holds the CEO's answers, and
// sends follow-ups back into tasks and project checklists afterwards.
// © 2026 RidgeFront. All rights reserved.

export type AgendaKind = "topic" | "task" | "signoff" | "project" | "page";
export type Outcome = "note" | "task" | "step" | "decision";

export interface AgendaItem {
  id: string;
  title: string;
  kind: AgendaKind;
  href?: string;
  refId?: string; // the task, sign-off item or project it points to
  covered?: boolean;
  answer?: string; // what the CEO said
  outcome?: Outcome;
}

export interface Agenda {
  clientId: string;
  next: string; // date of the next 1:1
  with: string;
  items: AgendaItem[];
  current?: string; // topic in focus during the meeting: your place
}

export const OUTCOMES: Record<Outcome, string> = {
  note: "Just a note",
  decision: "Decision made",
  task: "Follow-up task",
  step: "Step on a project",
};

export const KIND_ICON: Record<AgendaKind, string> = { topic: "chat", task: "tasks", signoff: "eye", project: "layers", page: "link" };

export const DRAG_TYPE = "application/x-baton-item";

export interface Draggable { kind: AgendaKind; title: string; href: string; refId?: string; clientId: string }

/** Spread onto any row to let it be dragged into the 1:1 agenda. */
export const dragInto1on1 = (d: Draggable) => ({
  draggable: true,
  onDragStart: (e: React.DragEvent) => {
    e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(d));
    e.dataTransfer.setData("text/plain", d.title);
    e.dataTransfer.effectAllowed = "copy";
  },
});

export const agendaSeed: Agenda[] = [
  {
    clientId: "pentara", next: "2026-11-02", with: "CEO",
    items: [
      { id: "a1", title: "Pipeline reporting: CRM access still blocked", kind: "task", refId: "t1", href: "/clients/pentara/tasks" },
      { id: "a2", title: "Narrative layer: two options to choose from", kind: "topic" },
      { id: "a3", title: "Award entry: OK to name the trial sponsor?", kind: "signoff", refId: "s6", href: "/signoff/s6?client=pentara" },
    ],
  },
  {
    clientId: "morning-miracle", next: "2026-11-04", with: "Founder",
    items: [
      { id: "a4", title: "Klaviyo access: day-45 email is blocked", kind: "task", refId: "t7", href: "/clients/morning-miracle/tasks" },
      { id: "a5", title: "Black Friday offer: what are we willing to discount?", kind: "topic" },
    ],
  },
  {
    clientId: "photopharmics", next: "2026-10-26", with: "CEO",
    items: [
      { id: "a6", title: "One-pager: does it work for the December investor update?", kind: "signoff", refId: "s4", href: "/signoff/s4?client=photopharmics" },
    ],
  },
];
