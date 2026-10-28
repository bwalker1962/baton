// Conversation notes: what the CEO or staff said, by client.
// © 2026 RidgeFront. All rights reserved.

export interface Note {
  id: string;
  clientId: string;
  with: string; // who the conversation was with: "CEO", "Ops lead", a name
  date: string; // ISO
  text: string;
  done?: number[]; // indexes of action lines ticked off
}

export const WITH_OPTIONS = ["CEO", "Founder", "Marketing lead", "Sales lead", "Ops lead", "Board member"];

/** Lines that start with "->", "→", "[ ]", "todo" or "next:" are action items. */
export const ACTION = /^\s*(->|→|\[ ?\]|todo:?|next:)\s*/i;
export const actions = (text: string) =>
  text.split("\n").map((line, i) => ({ i, line })).filter((x) => ACTION.test(x.line)).map((x) => ({ i: x.i, text: x.line.replace(ACTION, "") }));

export const noteSeed: Note[] = [
  { id: "n1", clientId: "pentara", with: "CEO", date: "2026-10-27", text: "Wants the pipeline report before the board prep.\nWorried about the narrative layer: decide by Monday.\n→ Chase CRM access with their ops lead\n→ Draft two narrative options" },
  { id: "n2", clientId: "pentara", with: "Sales lead", date: "2026-10-21", text: "Hearing the same objection: \"we already have a statistician.\"\nWould like a one-page answer to it.\n→ Ask rf-insight for objection handling" },
  { id: "n3", clientId: "morning-miracle", with: "Founder", date: "2026-10-26", text: "Reorder rate is the number they watch.\nOK with routine language, nervous about anything that sounds like a claim.\n→ Get Klaviyo access this week" },
  { id: "n4", clientId: "photopharmics", with: "CEO", date: "2026-10-22", text: "Investor update in December; one-pager should help there too.\nKeep patient stories for after the trial readout." },
  { id: "n5", clientId: "mountain-peaks", with: "Founder", date: "2026-10-20", text: "Most new members come from word of mouth.\nCompetes with DPC family practices nearby.\n→ Send discovery questions for Monday" },
  { id: "n6", clientId: "pentara", with: "Ops lead", date: "2026-10-14", text: "Prefers email over Slack for approvals." },
];
