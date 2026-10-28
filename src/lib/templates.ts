// Project templates: checklists that inform but don't force.
// Every field and step is optional; users rename, remove, add or skip with a reason.
// Step timing is relative to the project's key date (negative = before, positive = after).
// © 2026 RidgeFront. All rights reserved.

export type FieldType = "text" | "url" | "date" | "select" | "textarea";

export interface TemplateField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  hint?: string;
  key?: boolean; // the date the checklist is timed from
}

export interface TemplateStep {
  id: string;
  title: string;
  phase: string;
  offsetDays: number;
  owner: "BCW" | "Client" | "Skill" | "Contractor";
  skill?: string;
  signoff?: boolean; // creates a sign-off item when it produces outbound work
  when?: string; // optional condition, shown as a hint, e.g. "if speaking"
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  dept: string;
  fields: TemplateField[];
  steps: TemplateStep[];
}

export const templates: ProjectTemplate[] = [
  {
    id: "event",
    name: "Event or conference",
    description: "Speaking, presenting, exhibiting or attending, with every deadline that comes with it.",
    icon: "calendar",
    dept: "Earned media",
    fields: [
      { id: "name", label: "Event name", type: "text" },
      { id: "url", label: "Event website", type: "url" },
      { id: "role", label: "Our role", type: "select", options: ["Speaking", "Presenting a poster", "Exhibiting", "Sponsoring", "Attending"] },
      { id: "date", label: "Event start date", type: "date", key: true },
      { id: "location", label: "Location or virtual platform", type: "text" },
      { id: "abstract", label: "Abstract or late-breaking abstract deadline", type: "date", hint: "Late-breaking deadlines are often weeks after the main one" },
      { id: "goal", label: "Goal", type: "text", hint: "For example, 20 qualified conversations" },
    ],
    steps: [
      { id: "e1", title: "Confirm role, budget and goal", phase: "Decide", offsetDays: -120, owner: "BCW" },
      { id: "e2", title: "Draft abstract or session proposal", phase: "Submit", offsetDays: -100, owner: "Skill", skill: "rf-copy", signoff: true, when: "if speaking or presenting" },
      { id: "e3", title: "Regulatory review of abstract claims", phase: "Submit", offsetDays: -95, owner: "Skill", skill: "rf-regulatory", when: "regulated clients" },
      { id: "e4", title: "Reserve booth and confirm sponsorship", phase: "Submit", offsetDays: -90, owner: "Client", when: "if exhibiting" },
      { id: "e5", title: "Register attendees (early-bird)", phase: "Logistics", offsetDays: -60, owner: "Client" },
      { id: "e6", title: "Book hotel block", phase: "Logistics", offsetDays: -45, owner: "Client" },
      { id: "e7", title: "Speaker bio and headshot", phase: "Prepare", offsetDays: -40, owner: "Client", when: "if speaking" },
      { id: "e8", title: "Slides or poster due", phase: "Prepare", offsetDays: -21, owner: "Client", signoff: true, when: "if speaking or presenting" },
      { id: "e9", title: "Ship booth materials", phase: "Logistics", offsetDays: -14, owner: "Client", when: "if exhibiting" },
      { id: "e10", title: "Pre-event promotion plan", phase: "Promote", offsetDays: -21, owner: "Skill", skill: "rf-media", signoff: true },
      { id: "e11", title: "Book meetings with target accounts", phase: "Promote", offsetDays: -14, owner: "BCW" },
      { id: "e12", title: "Live coverage posts", phase: "During", offsetDays: 0, owner: "Skill", skill: "rf-amplify", signoff: true },
      { id: "e13", title: "Follow-up sequence to contacts met", phase: "Follow up", offsetDays: 2, owner: "Skill", skill: "rf-copy", signoff: true },
      { id: "e14", title: "Record outcomes: leads, meetings, coverage", phase: "Follow up", offsetDays: 7, owner: "BCW" },
    ],
  },
  {
    id: "webinar",
    name: "Webinar",
    description: "A live or recorded session, from topic and platform to replay and follow-up.",
    icon: "video",
    dept: "Demand generation",
    fields: [
      { id: "topic", label: "Topic", type: "text" },
      { id: "date", label: "Webinar date", type: "date", key: true },
      { id: "platform", label: "Platform", type: "select", options: ["Zoom", "Teams", "Google Meet", "LinkedIn Live", "Other"] },
      { id: "host", label: "Registration page URL", type: "url" },
      { id: "speakers", label: "Speakers", type: "text" },
      { id: "audience", label: "Target audience", type: "text" },
      { id: "goal", label: "Registration goal", type: "text" },
    ],
    steps: [
      { id: "w1", title: "Confirm topic, speakers and date", phase: "Plan", offsetDays: -35, owner: "BCW" },
      { id: "w2", title: "Set up platform and registration page", phase: "Plan", offsetDays: -28, owner: "Client" },
      { id: "w3", title: "Landing page copy", phase: "Promote", offsetDays: -27, owner: "Skill", skill: "rf-copy", signoff: true },
      { id: "w4", title: "Invitation emails (3 sends)", phase: "Promote", offsetDays: -21, owner: "Skill", skill: "rf-copy", signoff: true },
      { id: "w5", title: "Social promotion plan", phase: "Promote", offsetDays: -21, owner: "Skill", skill: "rf-media", signoff: true },
      { id: "w6", title: "Slides and run of show", phase: "Prepare", offsetDays: -7, owner: "Client", signoff: true },
      { id: "w7", title: "Dry run with speakers", phase: "Prepare", offsetDays: -3, owner: "BCW" },
      { id: "w8", title: "Reminder emails (day before, hour before)", phase: "Promote", offsetDays: -1, owner: "Skill", skill: "rf-copy", signoff: true },
      { id: "w9", title: "Replay and follow-up email", phase: "Follow up", offsetDays: 1, owner: "Skill", skill: "rf-copy", signoff: true },
      { id: "w10", title: "Repurpose into clips and posts", phase: "Follow up", offsetDays: 3, owner: "Skill", skill: "rf-amplify", signoff: true },
      { id: "w11", title: "Record results: registrants, attendees, leads", phase: "Follow up", offsetDays: 7, owner: "Skill", skill: "rf-analyze" },
    ],
  },
  {
    id: "email-campaign",
    name: "Email campaign",
    description: "A one-off or short sequence, from audience and offer to send and results.",
    icon: "mail",
    dept: "Demand generation",
    fields: [
      { id: "name", label: "Campaign name", type: "text" },
      { id: "date", label: "First send date", type: "date", key: true },
      { id: "audience", label: "Audience or list", type: "text" },
      { id: "goal", label: "Goal", type: "text", hint: "For example, reorders, booked calls" },
      { id: "count", label: "Number of emails", type: "select", options: ["1", "2", "3", "4", "5+"] },
      { id: "platform", label: "Send platform", type: "text", hint: "Defaults to the client's email app" },
    ],
    steps: [
      { id: "m1", title: "Confirm audience, offer and goal", phase: "Plan", offsetDays: -14, owner: "BCW" },
      { id: "m2", title: "Draft emails", phase: "Create", offsetDays: -10, owner: "Skill", skill: "rf-copy", signoff: true },
      { id: "m3", title: "Regulatory review", phase: "Create", offsetDays: -8, owner: "Skill", skill: "rf-regulatory", when: "regulated clients" },
      { id: "m4", title: "Design in the client's template", phase: "Create", offsetDays: -7, owner: "Skill", skill: "Moda", signoff: true },
      { id: "m5", title: "Build in send platform, test send", phase: "Launch", offsetDays: -3, owner: "BCW" },
      { id: "m6", title: "Schedule send", phase: "Launch", offsetDays: 0, owner: "BCW" },
      { id: "m7", title: "Results after 7 days", phase: "Measure", offsetDays: 7, owner: "Skill", skill: "rf-analyze" },
    ],
  },
  {
    id: "podcast",
    name: "Podcast appearance",
    description: "From pitching the show to promoting the episode.",
    icon: "mic",
    dept: "Earned media",
    fields: [
      { id: "show", label: "Show name", type: "text" },
      { id: "url", label: "Show URL", type: "url" },
      { id: "host", label: "Host", type: "text" },
      { id: "date", label: "Recording date", type: "date", key: true },
      { id: "guest", label: "Our guest", type: "text" },
      { id: "angle", label: "Pitch angle", type: "textarea" },
    ],
    steps: [
      { id: "p1", title: "Pitch the show", phase: "Pitch", offsetDays: -30, owner: "Skill", skill: "rf-copy", signoff: true },
      { id: "p2", title: "Prep brief for the guest", phase: "Prepare", offsetDays: -5, owner: "Skill", skill: "rf-positioning" },
      { id: "p3", title: "Recording", phase: "Record", offsetDays: 0, owner: "Client" },
      { id: "p4", title: "Promotion when the episode airs", phase: "Promote", offsetDays: 21, owner: "Skill", skill: "rf-amplify", signoff: true },
    ],
  },
  {
    id: "award",
    name: "Award entry",
    description: "Research, draft, approve and submit, with the late deadline tracked.",
    icon: "award",
    dept: "Earned media",
    fields: [
      { id: "program", label: "Award program", type: "text" },
      { id: "url", label: "Program URL", type: "url" },
      { id: "category", label: "Category", type: "text" },
      { id: "date", label: "Entry deadline", type: "date", key: true },
      { id: "late", label: "Late deadline (if any)", type: "date" },
      { id: "fee", label: "Entry fee", type: "text" },
    ],
    steps: [
      { id: "a1", title: "Confirm eligibility and category", phase: "Decide", offsetDays: -30, owner: "BCW" },
      { id: "a2", title: "Gather evidence and approved quotes", phase: "Prepare", offsetDays: -21, owner: "Client" },
      { id: "a3", title: "Draft entry", phase: "Prepare", offsetDays: -14, owner: "Contractor", signoff: true },
      { id: "a4", title: "Regulatory review", phase: "Prepare", offsetDays: -10, owner: "Skill", skill: "rf-regulatory", when: "regulated clients" },
      { id: "a5", title: "Submit", phase: "Submit", offsetDays: -2, owner: "Client" },
      { id: "a6", title: "Announce if shortlisted or won", phase: "Promote", offsetDays: 30, owner: "Skill", skill: "rf-amplify", signoff: true },
    ],
  },
  {
    id: "launch",
    name: "Product or service launch",
    description: "Positioning, assets, channels and follow-through for something new.",
    icon: "rocket",
    dept: "Strategy",
    fields: [
      { id: "name", label: "What's launching", type: "text" },
      { id: "date", label: "Launch date", type: "date", key: true },
      { id: "audience", label: "Primary audience", type: "text" },
      { id: "channels", label: "Channels", type: "text" },
      { id: "goal", label: "Success measure", type: "text" },
    ],
    steps: [
      { id: "l1", title: "Positioning and messaging", phase: "Plan", offsetDays: -45, owner: "Skill", skill: "rf-positioning" },
      { id: "l2", title: "Launch calendar", phase: "Plan", offsetDays: -35, owner: "Skill", skill: "rf-content" },
      { id: "l3", title: "Landing page and web changes", phase: "Create", offsetDays: -21, owner: "Skill", skill: "rf-copy", signoff: true },
      { id: "l4", title: "Press release", phase: "Create", offsetDays: -14, owner: "Skill", skill: "rf-copy", signoff: true },
      { id: "l5", title: "Sales enablement one-pager", phase: "Create", offsetDays: -14, owner: "Skill", skill: "rf-insight", signoff: true },
      { id: "l6", title: "Launch-day distribution", phase: "Launch", offsetDays: 0, owner: "Skill", skill: "rf-media", signoff: true },
      { id: "l7", title: "30-day results", phase: "Measure", offsetDays: 30, owner: "Skill", skill: "rf-analyze" },
    ],
  },
];

export const getTemplate = (id: string) => templates.find((t) => t.id === id);

export function addDays(iso: string, days: number): string {
  const d = new Date(Date.parse(iso) + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}
