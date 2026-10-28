// Conversation notes: what the CEO or staff said, by client.
// Each line is its own entry with a timestamp, so you can see when something was said or
// added; action entries tick off into a Completed list.
// © 2026 RidgeFront. All rights reserved.

export interface Entry {
  id: string;
  text: string;
  at: string; // when it was written (ISO date-time)
  edited?: string; // last change to its words
  action?: boolean;
  done?: boolean;
  doneAt?: string;
}

export interface Note {
  id: string;
  clientId: string;
  with: string; // who the conversation was with: "CEO", "Ops lead", a name
  date: string; // ISO date of the conversation
  entries: Entry[];
  updated: string; // last change to anything in the note (ISO date-time)
}

export const WITH_OPTIONS = ["CEO", "Founder", "Marketing lead", "Sales lead", "Ops lead", "Board member"];

/** Lines that start with "->", "→", "[ ]", "todo" or "next:" are action items. */
export const ACTION = /^\s*(->|→|\[ ?\]|todo:?|next:)\s*/i;

export const eid = () => `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const nowIso = () => new Date().toISOString();

export function entriesFromText(text: string, at: string): Entry[] {
  return text.split("\n").filter((l) => l.trim()).map((line) => ({
    id: eid(), at, text: line.replace(ACTION, "").trim(), action: ACTION.test(line) || undefined,
  }));
}

export const noteText = (n: Note) => n.entries.map((e) => e.text).join("\n");
export const openActions = (n: Note) => n.entries.filter((e) => e.action && !e.done);

/** Notes saved before entries existed: one block of text plus a list of ticked line numbers. */
export function migrate(raw: unknown): Note {
  const n = raw as Note & { text?: string; done?: number[] };
  if (Array.isArray(n.entries)) return n;
  const at = `${n.date}T12:00:00`;
  const lines = (n.text ?? "").split("\n");
  const entries: Entry[] = lines.map((line, i) => ({ line, i })).filter((x) => x.line.trim()).map(({ line, i }) => ({
    id: eid(), at, text: line.replace(ACTION, "").trim(), action: ACTION.test(line) || undefined,
    done: ACTION.test(line) && (n.done ?? []).includes(i) ? true : undefined,
  }));
  return { id: n.id, clientId: n.clientId, with: n.with, date: n.date, entries, updated: at };
}

const seed = (id: string, clientId: string, w: string, date: string, time: string, text: string): Note => {
  const at = `${date}T${time}:00`;
  return { id, clientId, with: w, date, entries: entriesFromText(text, at), updated: at };
};

export const noteSeed: Note[] = [
  seed("n1", "pentara", "CEO", "2026-10-27", "15:30", "Wants the pipeline report before the board prep.\nWorried about the narrative layer: decide by Monday.\n→ Chase CRM access with their ops lead\n→ Draft two narrative options"),
  seed("n2", "pentara", "Sales lead", "2026-10-21", "10:05", "Hearing the same objection: \"we already have a statistician.\"\nWould like a one-page answer to it.\n→ Ask rf-insight for objection handling"),
  seed("n3", "morning-miracle", "Founder", "2026-10-26", "09:20", "Reorder rate is the number they watch.\nOK with routine language, nervous about anything that sounds like a claim.\n→ Get Klaviyo access this week"),
  seed("n4", "photopharmics", "CEO", "2026-10-22", "13:45", "Investor update in December; one-pager should help there too.\nKeep patient stories for after the trial readout."),
  seed("n5", "mountain-peaks", "Founder", "2026-10-20", "11:00", "Most new members come from word of mouth.\nCompetes with DPC family practices nearby.\n→ Send discovery questions for Monday"),
  seed("n6", "pentara", "Ops lead", "2026-10-14", "16:10", "Prefers email over Slack for approvals."),
];
