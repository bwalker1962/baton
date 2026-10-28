// Best-practice advisor: what companies like this client do in an area, ranked by impact,
// always judged from the customer's side. Sample guidance for the prototype; the build
// researches each area live through the RF skills and cites its sources.
// © 2026 RidgeFront. All rights reserved.

export type Segment = "b2b" | "dtc" | "medtech" | "dpc";
export type Impact = "Highest" | "High" | "Medium";
export type Effort = "Low" | "Medium" | "High";

export interface Peer { segment?: Segment; peers: string; buyers: string }

/** Who the client is compared with. Set from Direction; unknown until someone says. */
export const PEERS: Record<string, Peer> = {
  pentara: { segment: "b2b", peers: "Specialist scientific services firms selling to biotech and pharma clinical teams", buyers: "Clinical, regulatory and executive leads making a long, considered decision together" },
  "morning-miracle": { segment: "dtc", peers: "Direct-to-consumer wellness brands sold by subscription", buyers: "Individuals deciding quickly, then deciding again at every reorder" },
  photopharmics: { segment: "medtech", peers: "Medical device companies with an investigational therapy", buyers: "Clinicians, patients and families, and investors, each needing different proof" },
  "mountain-peaks": { segment: "dpc", peers: "Direct primary care (DPC) family practices", buyers: "Families, individuals and small employers choosing a doctor and a monthly membership, mostly close to home" },
};

export interface Consideration {
  id: string;
  title: string;
  impact: Impact;
  effort: Effort;
  customer: string; // what the customer gets: the reason it matters
  peer?: Partial<Record<Segment, string>>; // how companies like this usually do it
  skills: string[];
}

export interface Topic {
  id: string;
  name: string;
  match: RegExp;
  templateIds: string[]; // project templates this topic advises
  items: Consideration[];
}

/** Applies to everything: the lens every recommendation is checked against. */
export const FUNDAMENTALS: Consideration[] = [
  { id: "f1", title: "Open with their problem, in their words", impact: "Highest", effort: "Low", customer: "They decide in seconds whether this is for them. Their words, not yours, are what they recognize.", skills: ["rf-insight", "rf-copy"] },
  { id: "f2", title: "One audience and one next step per piece", impact: "Highest", effort: "Low", customer: "A single, small, obvious next step gets taken. Three options get skipped.", skills: ["rf-copy", "rf-leads"] },
  { id: "f3", title: "Proof from people like them", impact: "High", effort: "Medium", customer: "A peer's result lowers their risk far more than your claims about yourself.", skills: ["rf-insight", "rf-positioning"] },
  { id: "f4", title: "Cut what is about you unless it lowers their risk", impact: "High", effort: "Low", customer: "History, awards and team photos earn space only when they answer \"can I trust you with this?\"", skills: ["rf-copy", "rf-positioning"] },
  { id: "f5", title: "Show up where they already look", impact: "High", effort: "Medium", customer: "Their channels and search habits, including AI answers, not the ones convenient for you.", skills: ["rf-found", "rf-media"] },
];

export const CUSTOMER_TEST = [
  "Does the first line mention their problem or their goal?",
  "Count \"you\" and \"we\". Is the reader the subject?",
  "Could a competitor sign this unchanged? If so, it isn't about what they need from you.",
  "Would the reader forward it to a colleague?",
  "What is the one thing they do next, and how small is it?",
];

export const TOPICS: Topic[] = [
  {
    id: "website", name: "Website", match: /web ?site|home ?page|landing|site\b|seo|aeo/i, templateIds: ["launch"],
    items: [
      { id: "w1", title: "Home page answers \"is this for me?\" above the fold", impact: "Highest", effort: "Medium", customer: "Visitors arrive with a problem. Name it, name who you help, and show the next step before they scroll.",
        peer: { b2b: "Lead with the outcome for the buyer's program, not a list of services.", dtc: "Lead with the result in the customer's routine and the offer, with reviews close by.", medtech: "Separate paths for clinicians, patients and investors from the first screen.", dpc: "Lead with what membership includes, the monthly price and how quickly members see their doctor. Plain pricing is central to DPC." }, skills: ["rf-positioning", "rf-copy"] },
      { id: "w2", title: "Pages organized by the customer's problem, not your org chart", impact: "High", effort: "High", customer: "People look for their situation, not your departments.",
        peer: { b2b: "Pages by situation (\"rescuing a delayed trial\") alongside service pages.", medtech: "Condition and patient-journey pages, written within approved claims.", dpc: "Pages for families, individuals and small employers, plus a plain \"how DPC works with insurance\" page." }, skills: ["rf-positioning", "rf-insight"] },
      { id: "w3", title: "Proof on every page: results, named peers, specifics", impact: "High", effort: "Medium", customer: "Evidence from someone like them, where the doubt arises.",
        peer: { b2b: "Short case notes with the client's situation, approach and result.", dtc: "Reviews and before-and-after routines near the buy button.", medtech: "Published data and trial status, with careful claims language.", dpc: "Member stories, shared only with written consent, and doctor bios about access and time with patients." }, skills: ["rf-insight", "rf-regulatory"] },
      { id: "w4", title: "Found in search and AI answers for the questions they ask", impact: "High", effort: "Medium", customer: "They ask Google and AI assistants first. Plain answers to their real questions get you cited.",
        peer: { dpc: "Local search matters most: a complete Google Business Profile, steady reviews, and answers to \"direct primary care near me\"." }, skills: ["rf-found"] },
      { id: "w5", title: "One clear next step that matches their readiness", impact: "Medium", effort: "Low", customer: "Early visitors want something useful; ready buyers want a short call. Offer both, plainly.",
        peer: { b2b: "A useful tool or guide for early researchers, and a 20-minute call for ready buyers.", dtc: "Trial or starter offer, with easy cancel stated up front.", dpc: "Book a meet-the-doctor visit, or enroll online in a few minutes." }, skills: ["rf-leads"] },
    ],
  },
  {
    id: "booth", name: "Trade show booth", match: /booth|trade ?show|exhibit|conference|expo|event/i, templateIds: ["event"],
    items: [
      { id: "b1", title: "Book meetings before the show", impact: "Highest", effort: "Medium", customer: "Busy attendees plan their days in advance. A booked 15 minutes respects their time.",
        peer: { b2b: "Targeted outreach to named accounts weeks ahead, with a reason specific to them.", medtech: "Pre-arranged meetings with investigators and key opinion leaders.", dpc: "Local employer benefits fairs and chamber events; book time with HR and benefits leads ahead." }, skills: ["rf-leads", "rf-copy"] },
      { id: "b2", title: "Booth headline states their problem, readable from the aisle", impact: "High", effort: "Low", customer: "People decide to stop in a few steps. Your logo doesn't tell them why they should.", skills: ["rf-copy", "rf-positioning"] },
      { id: "b3", title: "Something useful to take or do, not a brochure", impact: "High", effort: "Medium", customer: "A quick assessment, a checklist or a short demo answers their question on the spot.",
        peer: { b2b: "A one-page readiness checklist or a short consult slot.", medtech: "Device demonstrations and data posters, within approved claims.", dpc: "A cost worksheet visitors fill in for their own family or company, comparing membership with what they pay now." }, skills: ["rf-leads", "rf-regulatory"] },
      { id: "b4", title: "Follow up within two business days, about what they said", impact: "Highest", effort: "Low", customer: "A note that recalls their situation shows you listened. A generic \"great to meet you\" doesn't.", skills: ["rf-copy"] },
      { id: "b5", title: "Measure conversations and next meetings, not badge scans", impact: "Medium", effort: "Low", customer: "Counting real conversations keeps staff talking with people instead of scanning them.", skills: ["rf-analyze"] },
    ],
  },
  {
    id: "newsletter", name: "Newsletter", match: /newsletter|email|campaign|drip|nurture/i, templateIds: ["email-campaign"],
    items: [
      { id: "n1", title: "A frequency you can keep, set by what readers find useful", impact: "Highest", effort: "Low", customer: "Readers trust a steady rhythm. Silence followed by a burst reads as being sold to.",
        peer: { b2b: "Usually monthly, sometimes twice a month; consistency matters more than volume.", dtc: "Often weekly, plus timed emails around each customer's reorder point.", medtech: "Typically monthly or quarterly, by audience: clinicians, patients, investors.", dpc: "Usually monthly, with seasonal reminders (flu shots, school physicals) members can act on." }, skills: ["rf-content", "rf-analyze"] },
      { id: "n2", title: "Mostly their world; a small share about you", impact: "Highest", effort: "Low", customer: "They open for useful insight on their problems. Your news belongs only where it helps them.",
        peer: { b2b: "One sharp insight on the reader's problem, one practical takeaway, then a light mention of you.", dtc: "Routines, tips and customer stories first; the offer second.", dpc: "Practical health tips and practice news members can use; general guidance, never advice to an individual." }, skills: ["rf-content", "rf-copy"] },
      { id: "n3", title: "Subject line promises one specific benefit to the reader", impact: "High", effort: "Low", customer: "The subject is the whole decision to open. Specific and about them beats clever.", skills: ["rf-copy"] },
      { id: "n4", title: "Segment by where readers are, not one list for all", impact: "High", effort: "Medium", customer: "A new subscriber and a three-year customer need different things.",
        peer: { b2b: "Separate tracks for prospects, current clients and alumni contacts.", dtc: "New, active, lapsed and at-risk subscribers each get their own flow.", dpc: "Members, prospects and employer contacts each get their own track." }, skills: ["rf-analyze", "rf-revenue"] },
      { id: "n5", title: "Judge by replies, clicks and pipeline, not opens", impact: "Medium", effort: "Low", customer: "What readers do afterwards shows what was worth their time.", skills: ["rf-analyze"] },
    ],
  },
  {
    id: "webinar", name: "Webinar", match: /webinar|live session|virtual event/i, templateIds: ["webinar"],
    items: [
      { id: "wb1", title: "Title promises a skill or answer they leave with", impact: "Highest", effort: "Low", customer: "People register for what they'll be able to do afterwards, not for your topic.", skills: ["rf-copy", "rf-insight"] },
      { id: "wb2", title: "A guest from the audience's world", impact: "High", effort: "Medium", customer: "A peer or customer on the panel makes it about their reality.", skills: ["rf-positioning"] },
      { id: "wb3", title: "Most of the time on their questions", impact: "High", effort: "Low", customer: "Live Q&A is the part only a live session can give them.", skills: ["rf-insight"] },
      { id: "wb4", title: "Recording plus short clips to everyone who registered", impact: "Medium", effort: "Low", customer: "Many registrants can't attend live; a two-minute clip respects their time.", skills: ["rf-amplify", "rf-media"] },
    ],
  },
  {
    id: "social", name: "Social media", match: /social|linkedin|instagram|post|carousel/i, templateIds: [],
    items: [
      { id: "s1", title: "Teach or show something in the post itself", impact: "Highest", effort: "Low", customer: "Value inside the feed, without a click, earns attention and trust.", skills: ["rf-amplify", "rf-copy"] },
      { id: "s2", title: "People over logos", impact: "High", effort: "Medium", customer: "Audiences follow people. Founders' and experts' posts usually travel further than brand pages.",
        peer: { b2b: "Leaders and practitioners post; the company page amplifies.", dtc: "Customers and creators show the product in real routines.", dpc: "The doctors themselves explaining DPC in plain words, answering common questions." }, skills: ["rf-amplify"] },
      { id: "s3", title: "Reply to every real comment", impact: "Medium", effort: "Low", customer: "A conversation shows there are people behind the account.", skills: ["rf-media"] },
    ],
  },
  {
    id: "podcast", name: "Podcast guesting", match: /podcast/i, templateIds: ["podcast"],
    items: [
      { id: "p1", title: "Pitch the host's audience problem, not your bio", impact: "Highest", effort: "Low", customer: "Hosts say yes to what their listeners need to hear.", skills: ["rf-copy", "rf-media"] },
      { id: "p2", title: "Choose shows the buyers actually listen to", impact: "High", effort: "Medium", customer: "A small show their peers trust beats a big general one.", skills: ["rf-compete", "rf-media"] },
      { id: "p3", title: "Turn each episode into clips and a written summary", impact: "Medium", effort: "Low", customer: "Most of the audience will meet it in a feed or a search, not the full episode.", skills: ["rf-amplify", "rf-found"] },
    ],
  },
  {
    id: "award", name: "Award entries", match: /award|nominat/i, templateIds: ["award"],
    items: [
      { id: "a1", title: "Enter only awards the buyers recognize", impact: "Highest", effort: "Low", customer: "An award matters only if it lowers the buyer's risk in choosing you.", skills: ["rf-compete"] },
      { id: "a2", title: "Tell the customer's result, with their permission", impact: "High", effort: "Medium", customer: "Judges and buyers both respond to a client's measurable outcome.", skills: ["rf-copy", "rf-insight"] },
      { id: "a3", title: "Plan how to use a win before entering", impact: "Medium", effort: "Low", customer: "Mention it where it answers a buyer's doubt, not as a banner about you.", skills: ["rf-amplify"] },
    ],
  },
  {
    id: "launch", name: "Product or service launch", match: /launch|release|new product|new service/i, templateIds: ["launch"],
    items: [
      { id: "l1", title: "Test the message with five real customers first", impact: "Highest", effort: "Medium", customer: "Their words for the problem will be better than the ones written in a meeting.", skills: ["rf-insight", "rf-positioning"] },
      { id: "l2", title: "Lead with what changes for them", impact: "Highest", effort: "Low", customer: "\"Now you can…\" beats \"We're excited to announce…\".", skills: ["rf-copy"] },
      { id: "l3", title: "Existing customers hear it first", impact: "High", effort: "Low", customer: "They're your most likely buyers and your best proof.", skills: ["rf-media", "rf-revenue"] },
    ],
  },
];

export const topicFor = (q: string) => TOPICS.find((t) => t.match.test(q));
export const topicForTemplate = (templateId: string) => TOPICS.find((t) => t.templateIds.includes(templateId));

const IMPACT_ORDER: Impact[] = ["Highest", "High", "Medium"];
const EFFORT_ORDER: Effort[] = ["Low", "Medium", "High"];
/** Highest impact first; among equals, least effort first. */
export const ranked = (items: Consideration[]) =>
  [...items].sort((a, b) => IMPACT_ORDER.indexOf(a.impact) - IMPACT_ORDER.indexOf(b.impact) || EFFORT_ORDER.indexOf(a.effort) - EFFORT_ORDER.indexOf(b.effort));
