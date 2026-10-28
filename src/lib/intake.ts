// Project intake: turn a typed or spoken prompt into a project, asking only for what's missing.
// The prototype uses simple rules; the real build hands the prompt to Claude with the same slots.
// © 2026 RidgeFront. All rights reserved.
import { clients, TODAY } from "./data";
import { templates } from "./templates";

export type Certainty = "heard" | "rough" | "proposed" | "confirmed";

export const CERTAINTY: Record<Certainty, { label: string; sub: string; cls: string; next: string }> = {
  heard: { label: "Heard about it", sub: "Not official; may never happen", cls: "b-neutral", next: "Saved to Watching. No tasks and nothing on Today. Baton reminds you to check whether it's official." },
  rough: { label: "Rough idea", sub: "Worth shaping; nobody has agreed yet", cls: "b-info", next: "Saved as an idea. The suggested checklist waits in the background until you firm it up." },
  proposed: { label: "Proposed", sub: "Pitched or in discussion with the client", cls: "b-warn", next: "Checklist drafted with dates. Steps stay drafts until the client says yes; long-lead steps show on the radar." },
  confirmed: { label: "Confirmed", sub: "Official and happening", cls: "b-good", next: "Checklist goes live: owners and due dates set, long-lead steps on the radar, outbound work routed to sign-off." },
};

export interface Slots {
  clientId?: string;
  templateId?: string; // a template id, or "blank"
  certainty?: Certainty;
  date?: string | null; // null = asked, not known yet
  monthOnly?: boolean; // the person gave a month, not a day
  role?: string;
  checkBack?: string;
  name?: string;
  url?: string;
}

export type SlotKey = "clientId" | "templateId" | "certainty" | "date" | "role" | "checkBack" | "name";

const TYPE_WORDS: [string, RegExp][] = [
  ["webinar", /webinar|live session|linkedin live/i],
  ["podcast", /podcast|episode|show guest/i],
  ["award", /award|nominat|entry/i],
  ["launch", /launch|release|go[- ]live|rollout/i],
  ["email-campaign", /newsletter|email|campaign|drip|sequence/i],
  ["event", /conference|summit|expo|trade ?show|booth|exhibit|sponsor|poster|abstract|congress|meeting|event|speak|keynote|panel/i],
];
const CERTAINTY_WORDS: [Certainty, RegExp][] = [
  ["heard", /heard|rumou?r|might|may be|maybe|not sure|don'?t know|could be|possibly|word is|floated/i],
  ["rough", /idea|thinking|rough|consider|toying|brainstorm|what if/i],
  ["proposed", /propos|pitch|suggest|recommend|in discussion|waiting on (their|a) yes|pending approval/i],
  ["confirmed", /confirm|official|signed|approved|booked|green[- ]?lit|locked|accepted|we'?re in|it'?s happening/i],
];
const ROLE_WORDS: [string, RegExp][] = [
  ["Speaking", /speak|talk|keynote|panel/i],
  ["Presenting a poster", /poster|abstract/i],
  ["Exhibiting", /exhibit|booth/i],
  ["Sponsoring", /sponsor/i],
  ["Attending", /attend|going to|walk the floor/i],
];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export function parseDate(text: string): string | null | undefined {
  if (/don'?t know|not sure|tbd|unknown|no date|not set/i.test(text)) return null;
  const iso = text.match(/\b(20\d\d)-(\d\d)-(\d\d)\b/);
  if (iso) return iso[0];
  const m = text.toLowerCase().replace(/\bmay\s+be\b/g, "").match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{1,2})?(?:st|nd|rd|th)?(?:,?\s*(20\d\d))?/);
  if (m) {
    const mon = MONTHS.indexOf(m[1]);
    const [ty, tm] = [Number(TODAY.slice(0, 4)), Number(TODAY.slice(5, 7)) - 1];
    const year = m[3] ? Number(m[3]) : mon < tm ? ty + 1 : ty;
    return `${year}-${String(mon + 1).padStart(2, "0")}-${String(m[2] ? Number(m[2]) : 1).padStart(2, "0")}`;
  }
  if (/next month/i.test(text)) {
    const d = new Date(TODAY + "T12:00"); d.setMonth(d.getMonth() + 1, 1); return d.toISOString().slice(0, 10);
  }
  return undefined;
}

/** Pull every slot the text mentions. */
export function parse(text: string): Slots {
  const s: Slots = {};
  const c = clients.find((x) => new RegExp(`\\b${x.name.split(" ")[0]}`, "i").test(text));
  if (c) s.clientId = c.id;
  const t = TYPE_WORDS.find(([, re]) => re.test(text));
  if (t) s.templateId = t[0];
  else if (/other|something else|blank|custom/i.test(text)) s.templateId = "blank";
  // "Not official yet" is a hedge, not a confirmation; and any hedge outranks a firm word.
  const negated = /\b(not|isn'?t|aren'?t|wasn'?t|un|no|never)\s*(yet\s*|really\s*)?(official|confirmed|signed|approved|booked|decided|final)/i.test(text);
  const cert = negated ? (["heard"] as const) : CERTAINTY_WORDS.find(([, re]) => re.test(text));
  if (cert) s.certainty = cert[0];
  const d = parseDate(text);
  if (d !== undefined) { s.date = d; s.monthOnly = !!d && !/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{1,2}\b|20\d\d-\d\d-\d\d/i.test(text); }
  const r = ROLE_WORDS.find(([, re]) => re.test(text));
  if (r) s.role = r[0];
  const u = text.match(/https?:\/\/\S+/);
  if (u) s.url = u[0];
  return s;
}

export const typeName = (id?: string) => (id === "blank" ? "Project" : templates.find((t) => t.id === id)?.name ?? "Project");

export function suggestName(s: Slots): string {
  const when = s.date ? `, ${new Date(s.date + "T12:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : "";
  return `${typeName(s.templateId)}${when}`;
}

export interface Question { slot: SlotKey; text: string; chips: string[] }

/** The next thing to ask, or null when the project is described well enough. */
export function nextQuestion(s: Slots, guessed: Partial<Record<SlotKey, boolean>>): Question | null {
  if (!s.clientId) return { slot: "clientId", text: "Which client is this for?", chips: clients.map((c) => c.name) };
  if (!s.templateId) return { slot: "templateId", text: "What kind of project is it?", chips: [...templates.map((t) => t.name), "Something else"] };
  if (!s.certainty || guessed.certainty)
    return {
      slot: "certainty",
      text: s.certainty
        ? `It sounds like this is "${CERTAINTY[s.certainty].label}". Is that right, or where does it really stand?`
        : "How solid is this? It decides whether Baton starts real work or just keeps an eye on it.",
      chips: (Object.keys(CERTAINTY) as Certainty[]).map((k) => CERTAINTY[k].label),
    };
  if (s.date === undefined) {
    const label = s.templateId === "award" ? "entry deadline" : s.templateId === "email-campaign" ? "first send date" : s.templateId === "launch" ? "launch date" : "date";
    return { slot: "date", text: `Do you know the ${label}? A rough month is fine.`, chips: ["Not known yet"] };
  }
  if (s.templateId === "event" && !s.role) return { slot: "role", text: "What's the client's role there?", chips: ROLE_WORDS.map(([r]) => r).concat("Not decided") };
  if ((s.certainty === "heard" || s.certainty === "rough") && !s.checkBack)
    return { slot: "checkBack", text: "When should I ask you whether it's become real?", chips: ["In 1 week", "In 2 weeks", "In 1 month"] };
  if (!s.name) return { slot: "name", text: "Last thing: what should we call it?", chips: [suggestName(s)] };
  return null;
}

/** Apply an answer to the slot that was asked, falling back to the raw text where it fits. */
export function answer(slot: SlotKey, text: string, s: Slots): Slots {
  const p = parse(text);
  const next: Slots = { ...s };
  // Fill anything newly mentioned that was still empty.
  (Object.keys(p) as (keyof Slots)[]).forEach((k) => { if (next[k] === undefined) (next as Record<string, unknown>)[k] = p[k]; });
  if (slot === "certainty") {
    const byLabel = (Object.keys(CERTAINTY) as Certainty[]).find((k) => CERTAINTY[k].label.toLowerCase() === text.trim().toLowerCase());
    next.certainty = byLabel ?? p.certainty ?? (/^(yes|yep|right|correct|that'?s right)/i.test(text) ? s.certainty : s.certainty);
  }
  if (slot === "templateId") next.templateId = templates.find((t) => t.name === text)?.id ?? p.templateId ?? (text === "Something else" ? "blank" : s.templateId);
  if (slot === "date" && next.date === undefined) next.date = parseDate(text) ?? null;
  if (slot === "role") next.role = p.role ?? (text.trim() || "Not decided");
  if (slot === "checkBack") {
    const days = /month/i.test(text) ? 30 : /2|two/i.test(text) ? 14 : /week/i.test(text) ? 7 : undefined;
    next.checkBack = days ? new Date(Date.parse(TODAY) + days * 86_400_000).toISOString().slice(0, 10) : parseDate(text) ?? undefined;
  }
  if (slot === "name") next.name = text.trim();
  return next;
}

/** "Jul 2027" when only a month was given, "Jul 14, 2027" otherwise. */
export function dateLabel(iso: string, monthOnly?: boolean): string {
  const d = new Date(iso + "T12:00");
  return monthOnly
    ? `${d.toLocaleDateString("en-US", { month: "long", year: "numeric" })} (day not set)`
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
