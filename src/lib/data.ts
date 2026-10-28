// Sample data for the Baton prototype. All numbers are illustrative.
// © 2026 RidgeFront. All rights reserved.
import type { Client, Department, Firm, SignoffItem, Skill, Task, Topic } from "./types";

export const TODAY = "2026-10-28";

export const firm: Firm = { id: "ridgefront", name: "RidgeFront" };

export const clients: Client[] = [
  {
    id: "morning-miracle",
    firmId: "ridgefront",
    website: "https://[morningmiracle site]",
    detected: { logos: [{ id: "header", source: "Site header logo", kind: "logo" }, { id: "favicon", source: "Favicon", kind: "icon" }, { id: "social", source: "Social share image", kind: "social" }], palette: [{ hex: "#c96a1c", source: "Button color" }, { hex: "#f2b66d", source: "Theme color" }, { hex: "#2b2622", source: "Text color" }, { hex: "#f7efe6", source: "Page background" }], fonts: ["Cabinet Grotesk", "Fraunces"] },
    name: "Morning Miracle",
    initial: "M",
    color: "#c96a1c",
    tint: "#f7efe6",
    phase: "Optimize",
    health: "bad",
    retainer: "Owned brand",
    regulated: true,
    minutesThisWeek: 95,
    apps: [
      { role: "Brand kit", app: "Moda", state: "connected" },
      { role: "Social", app: "Buffer", state: "connected" },
      { role: "Email", app: "Klaviyo", state: "requested" },
      { role: "Commerce", app: "Shopify", state: "connected" },
      { role: "Files", app: "Drive · /Morning Miracle", state: "connected" },
    ],
    keyFiles: [
      { label: "Brand guide", source: "Drive", updated: "2026-09-02" },
      { label: "Logo pack", source: "Moda", updated: "2026-08-20" },
      { label: "Email standards", source: "Drive", updated: "2026-07-01" },
      { label: "Logins", source: "Password manager", updated: "2026-10-01", isLogin: true },
    ],
    spotlight: ["Day-45 reorder nudge", "Instagram activation"],
    summary:
      "Social is running on schedule and the nurture sequence is two emails from complete. The lifecycle email send is blocked until Klaviyo replaces Shopify Messaging. Next week focuses on the day-45 reorder email.",
  },
  {
    id: "pentara",
    firmId: "ridgefront",
    website: "https://[pentara site]",
    detected: { logos: [{ id: "header", source: "Site header logo", kind: "logo" }, { id: "icon", source: "App icon", kind: "icon" }], palette: [{ hex: "#1f5c6b", source: "Header background" }, { hex: "#5fb3c4", source: "Link color" }, { hex: "#203038", source: "Text color" }], fonts: ["Source Sans"] },
    name: "Pentara",
    initial: "P",
    color: "#1f5c6b",
    tint: "#eef2f3",
    phase: "Grow",
    health: "warn",
    retainer: "Retainer through Dec 2026",
    regulated: true,
    minutesThisWeek: 140,
    apps: [
      { role: "Brand kit", app: "Moda", state: "connected" },
      { role: "Social", app: "Metricool", state: "connected" },
      { role: "Email", app: "Brevo", state: "drafts" },
      { role: "CRM", app: "Client CRM", state: "requested" },
      { role: "PR", app: "Press Ranger", state: "connected" },
      { role: "Files", app: "Drive · /Pentara", state: "connected" },
    ],
    keyFiles: [
      { label: "Brand guide", source: "Drive", updated: "2026-06-11" },
      { label: "Logo pack", source: "Moda", updated: "2026-06-11" },
      { label: "Strategic brief", source: "Drive", updated: "2026-09-15" },
      { label: "Messaging house", source: "Drive", updated: "2026-10-02" },
      { label: "Logins", source: "Password manager", updated: "2026-10-12", isLogin: true },
    ],
    spotlight: ["ABM war room", "Cost alignment"],
    summary:
      "The ABM program is on track, with the GEODesign sequence ready for sign-off today. Pipeline reporting is paused until CRM access is granted. The brand narrative update is waiting on one decision.",
  },
  {
    id: "photopharmics",
    firmId: "ridgefront",
    website: "https://[photopharmics site]",
    detected: { logos: [{ id: "header", source: "Site header logo", kind: "logo" }, { id: "favicon", source: "Favicon", kind: "icon" }], palette: [{ hex: "#3e5c8a", source: "Button color" }, { hex: "#9fc1e8", source: "Theme color" }], fonts: ["Inter"] },
    name: "PhotoPharmics",
    initial: "P",
    color: "#3e5c8a",
    tint: "#eef1f6",
    phase: "Shape",
    health: "good",
    retainer: "Retainer",
    regulated: true,
    minutesThisWeek: 55,
    apps: [
      { role: "Brand kit", app: "Moda", state: "connected" },
      { role: "Social", app: "Buffer", state: "connected" },
      { role: "Files", app: "Drive · /PhotoPharmics", state: "connected" },
    ],
    keyFiles: [
      { label: "Brand guide", source: "Drive", updated: "2026-05-30" },
      { label: "Claims guidance", source: "Drive", updated: "2026-09-20" },
    ],
    spotlight: ["Narrative one-pager"],
    summary:
      "Narrative work is on schedule and the one-pager is close. Claims language is being checked against the investigational device rules. No decisions needed this week.",
  },
  {
    id: "mountain-peaks",
    firmId: "ridgefront",
    website: "https://[mountainpeaks site]",
    detected: { logos: [{ id: "favicon", source: "Favicon", kind: "icon" }], palette: [{ hex: "#4e7d4f", source: "Header background" }, { hex: "#c7e0a8", source: "Accent" }], fonts: [] },
    name: "Mountain Peaks",
    initial: "M",
    color: "#4e7d4f",
    tint: "#eff3ee",
    phase: "Align",
    health: "good",
    retainer: "Align sprint",
    regulated: false,
    minutesThisWeek: 30,
    apps: [{ role: "Files", app: "Drive · /Mountain Peaks", state: "connected" }],
    keyFiles: [{ label: "Discovery notes", source: "Drive", updated: "2026-10-20" }],
    spotlight: ["Strategic brief"],
    summary:
      "Discovery is under way and the strategic brief is drafting. Monday input is still outstanding. Nothing is blocked.",
  },
];

const D = (
  clientId: string,
  id: string,
  name: string,
  scope: string,
  health: Department["health"],
  crew: Department["crew"],
  metricLabel: string,
  metric: string,
  next: string,
): Department => ({ id: `${clientId}-${id}`, clientId, name, scope, health, crew, metricLabel, metric, next });

export const departments: Department[] = [
  D("pentara", "brand", "Brand", "Positioning, narrative, identity, competitive watch", "warn",
    [{ kind: "skill", label: "rf-positioning" }, { kind: "skill", label: "rf-compete" }, { kind: "app", label: "Moda" }],
    "Share of voice", "[trend]", "Narrative layer decision"),
  D("pentara", "insight", "Customer insight", "Research, objections, voice of customer, win/loss", "none",
    [{ kind: "skill", label: "rf-insight" }, { kind: "gap", label: "No call notes yet" }],
    "Conversations analyzed", "0", "Share 5 call notes"),
  D("pentara", "strategy", "Strategy", "Go-to-market, editorial plan, budget", "good",
    [{ kind: "person", label: "BCW" }, { kind: "skill", label: "rf-content" }],
    "Plan milestones", "On time", "Q1 plan draft"),
  D("pentara", "demand", "Demand generation", "Content, social, email, lead magnets", "good",
    [{ kind: "skill", label: "rf-copy" }, { kind: "skill", label: "rf-media" }, { kind: "skill", label: "rf-leads" }, { kind: "app", label: "Metricool" }, { kind: "app", label: "Brevo" }],
    "Qualified leads", "[value]", "GEODesign sequence sign-off"),
  D("pentara", "earned", "Earned media", "PR, awards, podcasts, events", "good",
    [{ kind: "app", label: "Press Ranger" }, { kind: "skill", label: "rf-amplify" }, { kind: "person", label: "PR contractor" }],
    "Open pursuits", "2 awards · 3 podcasts", "Award entry due Nov 3"),
  D("pentara", "revenue", "Revenue growth", "Funnel, win rate, cycle time, attribution", "bad",
    [{ kind: "skill", label: "rf-revenue" }, { kind: "gap", label: "CRM not connected" }],
    "Pipeline", "No data", "Client grants CRM access"),
  D("pentara", "ops", "Marketing ops", "Apps, analytics, search, budget", "good",
    [{ kind: "skill", label: "rf-found" }, { kind: "skill", label: "rf-analyze" }, { kind: "app", label: "GA4" }],
    "Spend vs plan", "[value]", "Monthly data refresh"),
  D("pentara", "compliance", "Compliance", "Claims review before sign-off", "good",
    [{ kind: "skill", label: "rf-regulatory" }],
    "Items reviewed", "6 this week", "Runs before every sign-off"),
];

export const tasks: Task[] = [
  { id: "t1", clientId: "pentara", title: "Pipeline reporting", dept: "Revenue growth", owner: "Client", ownerKind: "person", due: "2026-10-21", health: "bad", pct: 0, blocker: { kind: "access", label: "CRM access" } },
  { id: "t2", clientId: "pentara", title: "Narrative layer decision", dept: "Brand", owner: "BCW", ownerKind: "person", due: "2026-11-01", health: "warn", pct: 50, blocker: { kind: "client", label: "client input" } },
  { id: "t3", clientId: "pentara", title: "Cost alignment review prep", dept: "Strategy", owner: "BCW", ownerKind: "person", due: "2026-11-04", health: "warn", pct: 10, blocker: { kind: "task", label: "prep task" } },
  { id: "t4", clientId: "pentara", title: "Research 30 Forensic Engineering", dept: "Brand", owner: "rf-positioning", ownerKind: "skill", due: "2026-10-30", health: "good", pct: 60 },
  { id: "t5", clientId: "pentara", title: "Q1 plan draft", dept: "Strategy", owner: "BCW", ownerKind: "person", due: "2026-12-01", health: "good", pct: 35 },
  { id: "t6", clientId: "pentara", title: "Customer research plan", dept: "Customer insight", owner: "Unassigned", ownerKind: "gap", due: null, health: "none", pct: 0 },
  { id: "t7", clientId: "morning-miracle", title: "Connect Klaviyo", dept: "Marketing ops", owner: "BCW", ownerKind: "person", due: "2026-10-26", health: "bad", pct: 20, blocker: { kind: "access", label: "Klaviyo account" } },
  { id: "t8", clientId: "morning-miracle", title: "Day-45 reorder email", dept: "Demand generation", owner: "rf-copy", ownerKind: "skill", due: "2026-10-28", health: "warn", pct: 90 },
  { id: "t9", clientId: "photopharmics", title: "Narrative one-pager", dept: "Brand", owner: "rf-positioning", ownerKind: "skill", due: "2026-11-03", health: "good", pct: 80 },
  { id: "t10", clientId: "mountain-peaks", title: "Monday input", dept: "Strategy", owner: "Client", ownerKind: "person", due: "2026-10-26", health: "warn", pct: 0, blocker: { kind: "client", label: "client input" } },
];

export const signoffItems: SignoffItem[] = [
  {
    id: "s1", clientId: "pentara", title: "GEODesign outreach, touch 1 of 5", kind: "email", channel: "Email", tier: 1,
    skill: "rf-copy", version: "v1.4", owner: "rf-copy", due: "2026-10-28", sendAt: "Today, 10:00 am", dept: "Demand generation", state: "needs",
    changedSinceLast: "Opening rewritten after your note: lead with their world, not ours.",
    regulatory: ["No efficacy or outcome claims about client trials", "Avoid naming other clients"],
    subject: "[Subject line from draft]",
    body: [
      "[Opening tied to GEODesign's most recent public signal]",
      "[Scaling-wall observation and one comparable proof point]",
      "[Ask: 20 minutes, one discovery question]",
      "[Signature block and unsubscribe footer]",
    ],
    settings: [
      { label: "From", value: "[Pentara sender] <[address]>" },
      { label: "Reply-to", value: "[address]" },
      { label: "Subject", value: "[Subject line from draft]" },
      { label: "Preview text", value: "[Preview text]" },
      { label: "Recipients", value: "GEODesign · 3 contacts (founder, ops lead, BD)" },
      { label: "Send", value: "Today, 10:00 am MT" },
      { label: "Platform", value: "Brevo" },
    ],
  },
  {
    id: "s2", clientId: "morning-miracle", title: "Week 45 social stack, post 3 of 6", kind: "social", channel: "Instagram", tier: 2,
    skill: "rf-content + Moda", version: "v1.2", owner: "rf-copy", due: "2026-10-28", sendAt: "Thu, 7:30 am via Buffer", dept: "Demand generation", state: "needs",
    regulatory: ["Use routine language, not treatment claims", "FDA disclaimer in first comment"],
    body: ["[Caption: routine-focused, modify-anytime wording]", "First comment: [link and disclaimer]"],
    settings: [
      { label: "Account", value: "[Morning Miracle Instagram]" },
      { label: "First comment", value: "[Link and FDA disclaimer]" },
      { label: "Alt text", value: "[Image description]" },
      { label: "Schedule", value: "Thu, 7:30 am MT" },
      { label: "Posting tool", value: "Buffer" },
    ],
  },
  {
    id: "s3", clientId: "morning-miracle", title: "Email 5: day-45 reorder nudge", kind: "email", channel: "Email", tier: 1,
    skill: "rf-copy", version: "v1.4", owner: "rf-copy", due: "2026-10-26", sendAt: "Blocked: no send tool", dept: "Demand generation", state: "needs",
    subject: "[You're 45 days in]",
    body: ["[Day-45 check-in: what's working]", "[Reorder prompt with modify-anytime option]", "[Compliance footer]"],
    settings: [
      { label: "From", value: "[Morning Miracle sender] <[address]>" },
      { label: "Subject", value: "[You're 45 days in]" },
      { label: "Preview text", value: "[Preview text]" },
      { label: "Recipients", value: "Subscribers at day 45 · [count]" },
      { label: "Send", value: "Triggered at day 45" },
      { label: "Platform", value: "Not connected (Klaviyo pending)" },
    ],
  },
  {
    id: "s4", clientId: "photopharmics", title: "Narrative one-pager", kind: "doc", channel: "Document", tier: 1,
    skill: "rf-positioning", version: "v1.1", owner: "rf-positioning", due: "2026-11-03", sendAt: "Share with CEO after sign-off", dept: "Brand", state: "needs",
    regulatory: ["Investigational device: no safety or effectiveness claims"],
    body: ["[Who we are and the problem we address]", "[What makes the approach different]", "[Where we are in the regulatory path]"],
    settings: [
      { label: "Destination", value: "Shared with CEO as a doc" },
      { label: "Recipients", value: "[CEO name]" },
    ],
  },
  {
    id: "s5", clientId: "pentara", title: "LinkedIn carousel: ABM war room", kind: "social", channel: "LinkedIn", tier: 2,
    skill: "rf-amplify", version: "v1.0", owner: "rf-amplify", due: "2026-10-29", sendAt: "Wed, 8:15 am via Metricool", dept: "Demand generation", state: "needs",
    body: ["[Cover slide: the hook]", "[Slides 2-7: one idea each]", "[Last slide: call to action]"],
    settings: [
      { label: "Account", value: "[Pentara company page]" },
      { label: "Slides", value: "8" },
      { label: "Schedule", value: "Wed, 8:15 am MT" },
      { label: "Posting tool", value: "Metricool" },
    ],
  },
  {
    id: "s6", clientId: "pentara", title: "Award entry draft", kind: "doc", channel: "Submission", tier: 1,
    skill: "PR contractor", version: "draft 2", owner: "PR contractor", due: "2026-11-03", sendAt: "Submit by Nov 3", dept: "Earned media", state: "needs",
    body: ["[Entry summary]", "[Results and evidence]", "[Supporting quotes, approved]"],
    settings: [
      { label: "Program", value: "[Award program, category]" },
      { label: "Submit to", value: "[Submission site]" },
      { label: "Deadline", value: "Nov 3 (late deadline: [date])" },
    ],
  },
];

export const topics: Topic[] = [
  { id: "c1", clientId: "pentara", title: "Act-like-an-owner coaching notes", category: "Coaching", date: "2026-10-27", program: "CEO coaching", summary: "Why ownership stalls when roles are scoped too junior.", decision: "Pilot one role redesign before Q1 hiring.", followups: "2 tasks · 1 open" },
  { id: "c2", clientId: "pentara", title: "GEODesign signal audit", category: "ABM and pipeline", date: "2026-10-24", program: "ABM war room", summary: "Eight-category signal scan; scored maturity Level 1.", decision: "Lead with the founder thread, ops second.", followups: "3 tasks · in review" },
  { id: "c3", clientId: "pentara", title: "Cost alignment kickoff", category: "Strategy", date: "2026-10-22", program: "Cost alignment", summary: "Framed spend by revenue impact rather than department.", decision: "Review starts the week of Nov 4.", followups: "1 task · open" },
  { id: "c4", clientId: "pentara", title: "Nurture list: Rincon, PEGUS", category: "ABM and pipeline", date: "2026-10-20", program: "ABM war room", summary: "Same oncology niche as Pentara; conflict of interest.", decision: "Nurture only until written permission.", followups: "None" },
  { id: "c5", clientId: "pentara", title: "Q4 LinkedIn themes", category: "Content", date: "2026-10-16", program: "Marketing formalization", summary: "Three pillars mapped to the editorial calendar.", decision: "CEO posts biweekly, company page weekly.", followups: "4 tasks · 2 open" },
];

export const skills: Skill[] = [
  { id: "rf-positioning", job: "Positioning dossier: pains, competitor audit, gaps, options, battlegrounds", dept: "Brand", version: "v1.0", firstPass: 88, status: "active" },
  { id: "rf-compete", job: "Weekly competitor moves classed Threat, Opportunity, Watch or Noise", dept: "Brand", version: "v1.1", firstPass: 91, status: "active" },
  { id: "rf-insight", job: "Positioning check, objection map, sales script redlines", dept: "Customer insight", version: "v1.0", firstPass: null, status: "draft" },
  { id: "rf-content", job: "30-day editorial calendar of 15–20 briefs", dept: "Strategy", version: "v1.1", firstPass: 82, status: "active" },
  { id: "rf-copy", job: "LinkedIn, X, blog intros, newsletters, video scripts", dept: "Demand generation", version: "v1.4", firstPass: 74, status: "active" },
  { id: "rf-amplify", job: "One long-form piece into 8–10 platform-native assets", dept: "Demand generation", version: "v1.1", firstPass: 79, status: "active" },
  { id: "rf-media", job: "7-day, time-zone-aware distribution plan", dept: "Demand generation", version: "v1.1", firstPass: 86, status: "active" },
  { id: "rf-leads", job: "Lead magnet, landing page and 3-email follow-up", dept: "Demand generation", version: "v1.1", firstPass: 70, status: "active" },
  { id: "rf-revenue", job: "Lead-to-close funnel diagnosis matched to buying motion", dept: "Revenue growth", version: "v1.0", firstPass: null, status: "draft" },
  { id: "rf-found", job: "Search and AI-answer optimization of drafts", dept: "Marketing ops", version: "v1.1", firstPass: 90, status: "active" },
  { id: "rf-analyze", job: "Performance against benchmarks, tied to pipeline", dept: "Marketing ops", version: "v1.1", firstPass: 84, status: "active" },
  { id: "rf-regulatory", job: "Life science claims review with redlines", dept: "Compliance", version: "v1.0", firstPass: 93, status: "active" },
];

export const getClient = (id: string) => clients.find((c) => c.id === id);
