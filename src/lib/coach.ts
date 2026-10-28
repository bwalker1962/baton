// The coach: notices what's slipping with each client and suggests the next move.
// It works from what Baton already knows (promises, sign-off backlog, 1:1 cadence, the
// words in your notes) plus each CEO's working style as you describe it. Anything it
// infers shows its evidence and can be dismissed; working style is private to you and
// never appears in client-facing views, reports or the Claude connector's write tools.
// © 2026 RidgeFront. All rights reserved.
import { clients, TODAY } from "./data";
import { owedToCeos } from "./ceo";
import { addDays } from "./templates";
import type { Agenda } from "./agenda";
import type { Note } from "./notes";
import type { SignoffItem, Task } from "./types";

export type CoachKind = "promise" | "backlog" | "meeting" | "tone" | "style";
export type CoachContext = "owed" | "oneonone" | "peace" | "signoff" | "notes" | "client";

export interface CoachTip {
  id: string; // stable, so a dismissal sticks
  clientId: string;
  kind: CoachKind;
  headline: string;
  advice: string; // the move to make
  evidence: string; // what Baton noticed
  href?: string;
  source: "noticed" | "you said";
  weight: number; // higher shows first
}

/** How a person at a client likes to work, in behaviors rather than labels. */
export interface Style { id: string; clientId: string; person: string; trait: string }

export const styleSeed: Style[] = [
  { id: "y1", clientId: "pentara", person: "CEO", trait: "Wants decisions framed as two options with a recommendation" },
  { id: "y2", clientId: "pentara", person: "CEO", trait: "Pushes back on dates; give a range and what it depends on" },
  { id: "y3", clientId: "morning-miracle", person: "Founder", trait: "Reads on the phone between meetings; keep it to three lines" },
  { id: "y4", clientId: "morning-miracle", person: "Founder", trait: "Gets anxious when news arrives late; tell early, even if incomplete" },
  { id: "y5", clientId: "photopharmics", person: "CEO", trait: "Thinks in investor terms; tie updates to the December investor story" },
];

export const CADENCE_DAYS: Record<string, number> = { pentara: 7, "morning-miracle": 7, photopharmics: 14, "mountain-peaks": 14 };

// Words in your own notes that signal pressure. Crude on purpose: it only nudges, with evidence.
const TENSE = /\b(worried|worry|nervous|frustrat\w*|upset|annoyed|angry|pushback|pushed back|urgent|asap|escalat\w*|unhappy|concern\w*|blocked|late)\b/i;

const name = (id: string) => clients.find((c) => c.id === id)?.name ?? "";
const days = (a: string, b: string) => Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000);

export function coach(ctx: { tasks: Task[]; items: SignoffItem[]; notes: Note[]; agendas: Agenda[]; styles: Style[]; clientId?: string }): CoachTip[] {
  const { tasks, items, notes, agendas, styles, clientId } = ctx;
  const scope = clients.filter((c) => !clientId || c.id === clientId);
  const tips: CoachTip[] = [];
  const styleOf = (cid: string) => styles.filter((s) => s.clientId === cid);

  for (const c of scope) {
    const style = styleOf(c.id);
    const firstStyle = style[0];

    // 1. Late or at-risk promises: tell them before they ask.
    for (const o of owedToCeos(tasks, c.id).filter((o) => o.kind === "promise")) {
      if (o.late) {
        const dateTip = style.find((s) => /date|range/i.test(s.trait));
        tips.push({
          id: `late-${o.id}`, clientId: c.id, kind: "promise", source: "noticed", weight: 100 + days(TODAY, o.due!), href: o.href,
          headline: `${o.title} is ${days(TODAY, o.due!)} days late`,
          advice: `Tell the ${o.to} before they ask: what's blocking it${o.blocked ? ` (${o.blocked})` : ""}, the new date, and what you need from them.${dateTip ? ` Their style: ${dateTip.trait.toLowerCase()}.` : ""}`,
          evidence: `Promised ${o.promisedOn ? `on ${o.promisedOn.slice(5).replace("-", "/")}` : ""}, due ${o.due!.slice(5).replace("-", "/")}`,
        });
      } else if (o.due && days(o.due, TODAY) <= 4) {
        tips.push({
          id: `soon-${o.id}`, clientId: c.id, kind: "promise", source: "noticed", weight: 60, href: o.href,
          headline: `${o.title} is due in ${days(o.due, TODAY)} days`,
          advice: o.blocked ? `It still needs ${o.blocked}. Clear that today or reset expectations now, not on the due date.` : "On track? A one-line heads-up to the CEO now earns trust when it lands.",
          evidence: `Promised to ${o.to}`,
        });
      }
    }

    // 2. Backlog: work waiting on you piles up quietly.
    const waiting = items.filter((i) => i.clientId === c.id && i.state === "needs");
    const old = waiting.filter((i) => i.due < TODAY);
    if (waiting.length >= 3 || old.length) {
      tips.push({
        id: `backlog-${c.id}-${waiting.length}`, clientId: c.id, kind: "backlog", source: "noticed", weight: 70 + old.length * 10, href: `/clients/${c.id}/signoff`,
        headline: `${waiting.length} ${c.name} item${waiting.length > 1 ? "s" : ""} waiting on your eyes`,
        advice: old.length ? `Start with the ${old.length} already past due; the rest can batch in one 20-minute review.` : "Batch them in one 20-minute review today so they don't stack up.",
        evidence: old.length ? `Oldest was due ${old.sort((a, b) => a.due.localeCompare(b.due))[0].due.slice(5).replace("-", "/")}` : "Sign-off queue",
      });
    }

    // 3. Meetings: a 1:1 date that passed with nothing written down, or a long silence.
    const agenda = agendas.find((a) => a.clientId === c.id);
    const last = notes.filter((n) => n.clientId === c.id && /ceo|founder/i.test(n.with)).map((n) => n.date).sort().pop();
    if (agenda && agenda.next < TODAY && (!last || last < agenda.next)) {
      tips.push({
        id: `missed-${c.id}-${agenda.next}`, clientId: c.id, kind: "meeting", source: "noticed", weight: 90, href: `/clients/${c.id}/notes`,
        headline: `The ${agenda.with} 1:1 on ${agenda.next.slice(5).replace("-", "/")} has no notes`,
        advice: "If it happened, jot three lines now while you remember. If it slipped, rebook it this week and send the open topics ahead.",
        evidence: `${agenda.items.filter((i) => !i.covered).length} topics still open on the agenda`,
      });
    } else if (!last || days(TODAY, last) > (CADENCE_DAYS[c.id] ?? 7)) {
      tips.push({
        id: `quiet-${c.id}-${last ?? "never"}`, clientId: c.id, kind: "meeting", source: "noticed", weight: 50, href: `/clients/${c.id}/notes`,
        headline: last ? `${days(TODAY, last)} days since you talked with ${c.name}'s CEO` : `No CEO conversation on record for ${c.name}`,
        advice: `Your rhythm with them is every ${CADENCE_DAYS[c.id] ?? 7} days. A short check-in now keeps small worries from becoming big ones.`,
        evidence: last ? `Last note ${last.slice(5).replace("-", "/")}` : "No notes yet",
      });
    }

    // 4. Tone: pressure words piling up in your own recent notes.
    const recent = notes.filter((n) => n.clientId === c.id && n.date >= addDays(TODAY, -14));
    const tense = recent.flatMap((n) => n.entries.filter((e) => !e.done && TENSE.test(e.text)).map((e) => e.text));
    if (tense.length) {
      tips.push({
        id: `tone-${c.id}-${tense.length}`, clientId: c.id, kind: "tone", source: "noticed", weight: 65, href: `/clients/${c.id}/notes`,
        headline: `Your recent ${c.name} notes carry some pressure`,
        advice: `Lead the next conversation with the worry, not the work: name it, show what you're doing about it, then ask what would make them comfortable.${firstStyle ? ` (${firstStyle.person}: ${firstStyle.trait.toLowerCase()}.)` : ""}`,
        evidence: `"${tense[0].slice(0, 70)}${tense[0].length > 70 ? "…" : ""}"${tense.length > 1 ? ` and ${tense.length - 1} more` : ""}`,
      });
    }

    // 5. Working style: how to land this week's message with this person.
    for (const s of style) {
      tips.push({
        id: `style-${s.id}`, clientId: c.id, kind: "style", source: "you said", weight: 30, href: `/clients/${c.id}/notes`,
        headline: `${s.person}: ${s.trait.split(";")[0]}`,
        advice: s.trait.includes(";") ? s.trait.split(";")[1].trim().replace(/^\w/, (x) => x.toUpperCase()) + "." : "Shape this week's updates that way.",
        evidence: "From your working-style notes",
      });
    }
  }
  return tips.sort((a, b) => b.weight - a.weight);
}

/** Which tips belong on which card. */
export const CONTEXT_KINDS: Record<CoachContext, CoachKind[]> = {
  owed: ["promise", "style"],
  oneonone: ["meeting", "tone", "style"],
  notes: ["tone", "meeting", "style"],
  signoff: ["backlog"],
  peace: ["promise", "meeting", "backlog", "tone"],
  client: ["promise", "meeting", "backlog", "tone", "style"],
};

export const KIND_LABEL: Record<CoachKind, { label: string; icon: string }> = {
  promise: { label: "Promise", icon: "user" },
  backlog: { label: "Backlog", icon: "eye" },
  meeting: { label: "Meeting", icon: "calendar" },
  tone: { label: "Tone", icon: "chat" },
  style: { label: "Working style", icon: "bulb" },
};

export { name as clientName };
