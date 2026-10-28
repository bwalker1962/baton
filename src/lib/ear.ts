// Ear to the ground: upcoming dates and signals worth knowing, each tied to the clients it
// could matter for and the angle to take. Fixed dates below are real calendar dates for
// 2026; trend signals are samples. The build refreshes signals weekly through rf-compete,
// web research and Press Ranger, and every item links its source.
// © 2026 RidgeFront. All rights reserved.

export type EarKind = "Holiday" | "Awareness" | "Season" | "Industry" | "Trend";

export interface EarItem {
  id: string;
  date: string; // ISO; for a month-long observance, its first day
  until?: string;
  title: string;
  kind: EarKind;
  angles: Record<string, string>; // clientId → why it matters / what to do
  sample?: boolean; // signal, not a fixed date: refreshed in the build
}

export const EAR: EarItem[] = [
  { id: "e1", date: "2026-11-01", until: "2026-11-30", title: "National Alzheimer's Disease Awareness Month (US)", kind: "Awareness",
    angles: { pentara: "Their world. A short piece on what trial designs teach about the disease earns attention without selling.", photopharmics: "Adjacent to their audience; check claims before joining the conversation." } },
  { id: "e2", date: "2026-11-01", until: "2026-11-30", title: "National Family Caregivers Month (US)", kind: "Awareness",
    angles: { photopharmics: "Caregivers are part of the patient's decision; a resource for them helps without making claims.", "mountain-peaks": "Families caring for a parent value an accessible doctor; a practical guide fits." } },
  { id: "e3", date: "2026-11-01", title: "Daylight saving time ends (US)", kind: "Season",
    angles: { "morning-miracle": "Mornings get darker: a routine-reset email lands the week of the change.", photopharmics: "Shorter days put light in the news; stay within approved claims." } },
  { id: "e4", date: "2026-11-01", title: "ACA marketplace open enrollment opens", kind: "Season",
    angles: { "mountain-peaks": "People are comparing coverage now. Explain how membership pairs with insurance." } },
  { id: "e5", date: "2026-11-03", title: "US midterm elections", kind: "Holiday",
    angles: { pentara: "Inboxes are crowded; avoid sending Nov 2 to 4.", "morning-miracle": "Social feeds are noisy; hold promotions until after.", photopharmics: "Hold investor updates until the news cycle settles.", "mountain-peaks": "Local feeds are saturated; post after." } },
  { id: "e6", date: "2026-11-11", title: "Veterans Day (US)", kind: "Holiday",
    angles: { "mountain-peaks": "A plain thank-you post; avoid using the day to sell." } },
  { id: "e7", date: "2026-11-26", title: "Thanksgiving (US)", kind: "Holiday",
    angles: { pentara: "B2B goes quiet Nov 25 to 30; nothing important should send then.", "morning-miracle": "Last calm week before holiday promotions; prep the Black Friday plan by Nov 13.", "mountain-peaks": "Thank members; a simple note builds referrals." } },
  { id: "e8", date: "2026-11-27", title: "Black Friday through Cyber Monday (Nov 27 to 30)", kind: "Holiday",
    angles: { "morning-miracle": "Biggest subscription push of the year for DTC brands; offers, emails and creative need sign-off by Nov 20." } },
  { id: "e9", date: "2026-12-01", title: "Giving Tuesday", kind: "Holiday",
    angles: { photopharmics: "Patient advocacy groups are fundraising; a partner mention can build goodwill.", pentara: "A good day to highlight work with patient foundations, if the client agrees." } },
  { id: "e10", date: "2026-12-21", title: "Winter solstice: shortest day of the year", kind: "Season",
    angles: { photopharmics: "Light is a natural story this week; claims review first.", "morning-miracle": "Darkest mornings of the year: a routine story fits." } },
  { id: "e11", date: "2027-01-01", title: "New Year: resolution season", kind: "Season",
    angles: { "morning-miracle": "Peak intent for new routines. Plan creative in November, send Dec 26 to Jan 10.", "mountain-peaks": "People set health goals; a \"get to know your doctor\" offer fits.", pentara: "Budgets reset; buyers plan Q1 studies." } },
  { id: "t1", date: "2026-10-28", title: "AI answers are taking clicks from search results", kind: "Trend", sample: true,
    angles: { pentara: "Make sure AI assistants can find and cite their expertise (rf-found).", "mountain-peaks": "\"Direct primary care near me\" answers matter more than ads." } },
  { id: "t2", date: "2026-10-28", title: "Employers comparing health plan costs during benefits renewal", kind: "Trend", sample: true,
    angles: { "mountain-peaks": "Small employers are deciding now; a one-page cost comparison helps them." } },
];

export const KIND_CLS: Record<EarKind, string> = { Holiday: "b-neutral", Awareness: "b-info", Season: "b-good", Industry: "b-warn", Trend: "b-eyes" };
