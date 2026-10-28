// What you owe each CEO, and whether you can stop worrying.
// Priority order for every screen: accountability to the CEO first, your peace of mind
// second, project and task views third.
// © 2026 RidgeFront. All rights reserved.
import { clients, TODAY } from "./data";
import { leadSeed } from "./day";
import { addDays } from "./templates";
import type { Note } from "./notes";
import type { SignoffItem, Task } from "./types";

/** The CEO report is a standing promise: each client's next one and its cadence. */
export const REPORT_DUE: Record<string, { due: string; cadence: string }> = {
  pentara: { due: "2026-10-30", cadence: "Weekly, Fridays" },
  "morning-miracle": { due: "2026-10-30", cadence: "Weekly, Fridays" },
  photopharmics: { due: "2026-11-06", cadence: "Every other Friday" },
  "mountain-peaks": { due: "2026-11-13", cadence: "Monthly" },
};

export interface Owed {
  id: string;
  clientId: string;
  title: string;
  to: string;
  due: string | null;
  promisedOn?: string;
  kind: "promise" | "report";
  href: string;
  late: boolean;
  blocked?: string;
}

export function owedToCeos(tasks: Task[], clientId?: string): Owed[] {
  const all = tasks.filter((t) => t.promised && (!clientId || t.clientId === clientId));
  const promises: Owed[] = all.map((t) => ({
    id: t.id, clientId: t.clientId, title: t.title, to: t.promised!.to, due: t.due, promisedOn: t.promised!.on, kind: "promise",
    href: `/clients/${t.clientId}/tasks`, late: !!t.due && t.due < TODAY, blocked: t.blocker?.label,
  }));
  const reports: Owed[] = clients.filter((c) => !clientId || c.id === clientId).map((c) => ({
    id: `report-${c.id}`, clientId: c.id, title: "CEO report", to: "CEO", due: REPORT_DUE[c.id].due, kind: "report",
    href: `/clients/${c.id}/report`, late: REPORT_DUE[c.id].due < TODAY,
  }));
  // Late first, then soonest due; undated promises last.
  return [...promises, ...reports].sort((a, b) => Number(b.late) - Number(a.late) || (a.due ?? "9999").localeCompare(b.due ?? "9999"));
}

export interface Check { label: string; ok: boolean; detail: string; href: string }

/** The few guarantees that let you stop thinking about work. */
export function peaceChecks(ctx: { items: SignoffItem[]; tasks: Task[]; notes: Note[]; clientId?: string }): Check[] {
  const { items, tasks, notes, clientId } = ctx;
  const mine = items.filter((i) => i.state === "needs" && (!clientId || i.clientId === clientId));
  const sendingToday = mine.filter((i) => i.sendAt.startsWith("Today"));
  const flags = mine.reduce((n, i) => n + (i.slips ?? []).filter((x) => x.result !== "pass").length, 0);
  const late = owedToCeos(tasks, clientId).filter((o) => o.late);
  const leads = leadSeed.filter((l) => (!clientId || l.clientId === clientId) && addDays(l.due, -l.leadDays) < TODAY);
  const scope = clients.filter((c) => !clientId || c.id === clientId);
  const quiet = scope.filter((c) => {
    const last = notes.filter((n) => n.clientId === c.id).map((n) => n.date).sort().pop();
    return !last || last < addDays(TODAY, -7);
  });
  const name = (id: string) => clients.find((c) => c.id === id)?.name;
  return [
    { label: "No promise to a CEO is late", ok: late.length === 0, detail: late.length ? late.map((o) => `${o.title} (${name(o.clientId)})`).join(", ") : "Every commitment is on time", href: clientId ? `/clients/${clientId}/tasks` : "/today" },
    { label: "Nothing goes out today without your eyes", ok: sendingToday.length === 0, detail: sendingToday.length ? `${sendingToday.length} send${sendingToday.length > 1 ? "s" : ""} today still need sign-off` : "Today's sends are all reviewed", href: clientId ? `/clients/${clientId}/signoff` : "/signoff" },
    { label: "No slip flags waiting", ok: flags === 0, detail: flags ? `${flags} flag${flags > 1 ? "s" : ""} to check before approving` : "Slip checks are clear", href: clientId ? `/clients/${clientId}/signoff` : "/signoff" },
    { label: "Long-lead work started on time", ok: leads.length === 0, detail: leads.length ? leads.map((l) => l.title).join(", ") : "Nothing past its start date", href: "/today" },
    { label: clientId ? "You've talked with the CEO this week" : "Every CEO heard from this week", ok: quiet.length === 0, detail: quiet.length ? `No notes in 7 days: ${quiet.map((c) => c.name).join(", ")}` : "Recent conversation with each", href: clientId ? `/clients/${clientId}/notes` : "/" },
  ];
}
