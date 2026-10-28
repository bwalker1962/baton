# Baton: progressive spec

Baton is RidgeFront's operating app for running marketing across many client companies: one view across every client, a sign-off gate nothing gets past, and AI skills that learn from your judgment.

**Promise:** human judgment at scale, without the anxiety and without a full staff.

This spec grows with the build. Every feature carries a status, and each build adds a changelog entry. The narrative spec with full rationale lives in the [Baton product spec](https://claude.ai/artifact/27uECpZbob18PojSbdTx9E); this file tracks what exists.

| Status | Meaning |
| --- | --- |
| **Built** | Works with real data and services |
| **Prototyped** | Working UI on sample data in this repo |
| **Specified** | Designed in the spec, not yet built |
| **Future** | Agreed direction, not yet designed |

## Pillars

| Pillar | Proof in the product |
| --- | --- |
| A. Break the four-client ceiling | Your time per client on Home; one skill library across clients |
| B. Nothing ships without your eyes | Version-tied sign-off, four outcomes, holds, undo |
| C. AI that learns your standards | Notes routed to skill or client Direction; first-pass approval per skill |

## Features

### Portfolio and navigation

| Feature | Status | Notes |
| --- | --- | --- |
| Home: four status counts, clients worst first, coming up | Prototyped | `/` |
| All-clear state when nothing needs you | Prototyped | Shows when the sign-off queue is empty |
| Your time per client this week | Prototyped | Sample minutes; real tracking Specified |
| Light, Half-dark, Dark modes | Prototyped | Remembered per browser |
| Command palette (⌘K) | Specified | Button present, palette not built |
| Mobile layout with bottom tab bar | Prototyped | Under 860 px wide |
| Multi-firm ready (firmId on every record) | Prototyped | One firm today: RidgeFront |

### Client workspace

| Feature | Status | Notes |
| --- | --- | --- |
| Notes edited in place: Who, every line, add a line; no edit mode | Prototyped | Enter starts a new line; backspace on an empty line removes it |
| Each line carries its time, revealed by a small clock on the note's right edge | Prototyped | Added, edited and done times |
| Ticked items move to a grayed "Completed items" list at the bottom | Prototyped | Untick to restore |
| Last updated time on every note; newest first | Prototyped | |
| Promises to the CEO tracked on tasks: who, when promised, due | Prototyped | 1:1 follow-ups become promises due by the next 1:1 |
| Floating 1:1 agenda per client, on every screen, minimizes to a pill | Prototyped | Follows the client you're viewing, except during a meeting |
| Drag tasks, sign-off items, projects and Today items onto it; or "1:1" buttons and "Add the page I'm on" | Prototyped | Another client's item goes to that client's agenda, and says so |
| Reorder topics by dragging; jump to any linked item while the agenda stays open | Prototyped | Page makes room for the panel on wide screens |
| In-the-meeting mode: current topic highlighted, notes field for the CEO's answers, Next topic | Prototyped | Your place survives navigation |
| Each topic's outcome: note, decision, follow-up task, or step on a project | Prototyped | |
| Wrap up: saves the 1:1 as a note, creates tasks and project steps, carries uncovered topics to next time | Prototyped | Next 1:1 date moves a week |
| Next 1:1 date from the calendar; agenda sent to the CEO ahead if you choose | Specified | |
| Dictate answers during the meeting | Specified | |
| Notes tab: notepad for conversations with the CEO or staff, by client | Prototyped | Who, date, free text; edit, delete, search, filter by person |
| Lines starting with → or [ ] become action items you can tick | Prototyped | Open actions counted per client |
| Home: cascading post-it stacks, one per client, in the client's color | Prototyped | Most recent conversation on top; opens the client's notes |
| Notes saved on this device | Prototyped | Stored per client, private to you, in the build |
| Dictate a note by voice | Specified | Same speech input as Start a project |
| Action item to task or Today in one tap | Specified | |
| Before a meeting, show the last notes with that person | Specified | From the calendar |
| Notes never appear in client-facing views or reports | Specified | Phase 2 roles respect this |
| First tab is Sign-off filtered to this client, with a count on the tab | Prototyped | Score moved to its own tab |
| Review mode started from a client stays inside that client | Prototyped | Returns to the client when done |
| Drag documents from your computer onto any screen to file them | Prototyped | Overlay names where it will land |
| Obvious documents file themselves, with Change in the confirmation | Prototyped | Client named clearly, and no conflict with where you dropped it |
| Unclear documents ask which client: no name, several names, or a different client than where you dropped it | Prototyped | Mixed mentions preselect nothing |
| File kind guessed from the name (brand guide, logo, brief, report, contract, notes) | Prototyped | Changeable before filing |
| Files that look like passwords or keys are refused | Prototyped | Logins belong in the vault |
| Reading PDFs, Word and slide files; Claude judges the client from content | Specified | Prototype reads names and plain text |
| Dropped files stored in the client's Drive folder, linked in Baton | Specified | |
| Client identity: logo tile, color, phase steps | Prototyped | Logo upload Specified |
| Brand pulled from the client's website: logo, icon, colors, fonts | Prototyped | Sample results; real fetch Specified |
| Adjust brand: pick logo or monogram, pick or set color | Prototyped | `/clients/[id]/brand`; applies everywhere |
| Readability guard: light brand colors darkened for Baton's own accents | Built | 4.5:1 contrast; client's real brand untouched |
| Re-check brand monthly; flag when the site's logo or colors change | Specified | You confirm before anything changes |
| Push brand to connected tools (Moda brand kit, Brevo brand, Klaviyo) | Specified | Only after you approve |
| Key files strip, logins as vault references | Prototyped | No passwords stored, by design |
| Score by department, crew chips, empty chairs | Prototyped | Full Score for Pentara |
| Score by status with display switches | Prototyped | Icons, progress, due dates, roadblocks |
| Tasks: owner (add new owner inline), due, progress, roadblock | Prototyped | `/clients/[id]/tasks` |
| Chats as meeting topics, sort by recent or category | Prototyped | |
| Apps by role, permission level | Prototyped | Connecting real apps Specified |
| CEO report with spotlight projects and reviewed-work log | Prototyped | Requires your review before sharing |

### Projects and checklists

| Feature | Status | Notes |
| --- | --- | --- |
| Start a project by typing or talking, on Home and each client's Projects tab | Prototyped | Voice uses the browser's speech recognition |
| Baton asks only for what's missing: client, type, how real, date, role, check-back, name | Prototyped | One question at a time, with tap-to-answer options |
| Guessed status is always confirmed before creating | Prototyped | "Not official yet" reads as Heard about it |
| How real is it: Heard about it, Rough idea, Proposed, Confirmed | Prototyped | Change any time on the project |
| Heard and Rough: no tasks, nothing on Today, a check-back reminder | Prototyped | Reminder Specified |
| Proposed: checklist drafted with dates; Confirmed: checklist goes live | Prototyped | Moving up a stage builds the checklist |
| Month-only dates kept as month-only | Prototyped | Never shown as a made-up day |
| Understanding by Claude instead of rules | Specified | Same questions and slots; rules miss phrasing Claude would catch |
| Start from a forwarded email, meeting notes or a link | Specified | Fills the same slots |
| Templates: event, webinar, email campaign, podcast, award entry, launch | Prototyped | `src/lib/templates.ts` |
| Info gathering with all fields optional | Prototyped | Key date times the checklist |
| Steps: include, rename, add, remove before creating | Prototyped | Conditional hints such as "if exhibiting" |
| Project checklist: tick, skip with reason, restore, add | Prototyped | In memory; resets on reload |
| Steps that produce outbound work create sign-off items | Specified | Marked with a sign-off badge today |
| Save a customized checklist as your own template | Future | |

### Dashboards

| Feature | Status | Notes |
| --- | --- | --- |
| Home and each client open on a dashboard of widgets you arrange | Prototyped | Client tabs: Dashboard, then Sign-off |
| Drag a widget by its grip to move it; arrow keys on the grip move it too | Prototyped | Drags inside a widget (rows into the 1:1) never move the widget |
| Customize: widget library grouped by priority; drag in or tap Add; S, M, Wide sizes; remove; reset to recommended | Prototyped | Saved per dashboard |
| Widgets: Owed to the CEO, Next 1:1, CEO report, Conversation notes, Ear to the ground, Peace of mind, Needs your eyes, Long-lead radar, Today, Tasks, Projects, Clients, Status mix | Prototyped | |
| Start a project is a pill that opens when needed | Prototyped | Home, client dashboard, Projects tab |
| Layouts sync across devices | Specified | Saved on this device in the prototype |

### Coach

| Feature | Status | Notes |
| --- | --- | --- |
| Coach icon on cards (Owed to the CEO, Next 1:1, Peace of mind, Needs your eyes, Notes), client headers and Today | Prototyped | Hover to peek, click to pin; count shows how many suggestions; amber when urgent |
| Late and near-due promises: what to tell the CEO before they ask, shaped by their working style | Prototyped | |
| Backlog: sign-off items piling up or past due, with how to clear them | Prototyped | |
| Meetings: a 1:1 date that passed with no notes; too long since the last CEO conversation for that client's rhythm | Prototyped | Rhythm per client (weekly, every other week) |
| Tone: pressure words building in your own recent notes ("worried," "pushback," "blocked") | Prototyped | Shows the line it noticed; nudges only |
| Working style per person, in your words, as behaviors not labels | Prototyped | Notes tab; private to you |
| Every tip shows its evidence ("Noticed" or "You said"), can be raised at the 1:1, or dismissed with Got it | Prototyped | Dismissed tips return when the facts change |
| Claude reads notes, emails and meeting transcripts to suggest working-style observations for you to confirm | Specified | Nothing inferred is saved without your yes |
| Patterns over time: promises usually late with one client, meetings that keep slipping, a CEO whose replies are getting shorter | Specified | |
| Working style never appears in client-facing views, reports, exports, or the Claude connector's write tools | Specified | |

### Ear to the ground

| Feature | Status | Notes |
| --- | --- | --- |
| Upcoming holidays, observances, seasons and awareness months, each with the clients it matters to and the angle | Prototyped | Real 2026 dates; angles are suggestions |
| Trend signals marked as samples | Prototyped | Refreshed weekly in the build through rf-compete, web research and Press Ranger, with sources |
| Add any angle to that client's next 1:1 as a talking point | Prototyped | |
| Industry events and deadlines per client (conferences, abstracts, award cycles) | Specified | Feeds the long-lead radar |
| Weekly "what's coming" digest | Specified | |

### Today and long-lead planning

| Feature | Status | Notes |
| --- | --- | --- |
| Click any task or Today item to adjust it in a pop-over | Prototyped | Title, status, owner, due, progress, roadblock, promised to the CEO, snooze, add to 1:1 |
| Edits apply everywhere the task appears | Prototyped | Tasks tab, dashboards, Owed to the CEO |
| Snooze any task or Today item: tomorrow, 3 days, 1 week, 2 weeks, 1 month, or any number of days, weeks or months | Prototyped | Shows the wake date before you choose |
| Snoozed list with wake dates; wake early with one tap | Prototyped | On Tasks and Today |
| Snoozing past a due date asks whether to move the due date | Specified | |
| Option to skip weekends when a snooze would wake on one | Specified | |
| Today list across all clients: reviews, tasks, meetings and planning in one order | Prototyped | `/today` |
| Drag to reorder; arrow buttons for keyboard and phone; move to tomorrow | Prototyped | Order saved on this device in the prototype |
| Time planned against a 6-hour day, warns when over | Prototyped | Day length adjustable Specified |
| Planning share meter with a 20% floor | Prototyped | Keeps urgent work from crowding out next month |
| Long-lead radar: start-by date = due date minus lead time | Prototyped | Sorted by when work must start, not when it is due |
| Recurring planning cadences per client (newsletter kickoff, editorial calendar, quarterly plan) | Specified | Each generates radar items automatically |
| Lead times learned from history ("newsletters took 5 weeks, not 4") | Specified | |
| Built from your calendar, sign-off queue and task due dates each morning | Specified | You reorder; Baton never reorders on its own |
| Block planning time on your calendar | Specified | Asks first |
| Unfinished items carry over with a count of days carried | Specified | Three days carried prompts: do, delegate or drop |

### Sign-off

| Feature | Status | Notes |
| --- | --- | --- |
| Slip check: automated look for common mistakes on every item | Prototyped | Sample results; real checks Specified |
| Each flagged slip is its own tick; a blocking slip disables Approve | Prototyped | |
| Flagged settings highlighted where they appear | Prototyped | |
| Read-back of From, Recipients, Subject and Send right above Approve | Prototyped | Large type; flagged fields in amber |
| Expected values per client (sender, reply-to, lists, accounts, time zone) | Specified | A setting that differs from the client's usual is flagged |
| Test send to your own inbox, opened from the review screen | Specified | |
| Slip log: caught before send vs got through | Specified | Every slip that got through becomes a new check |
| Queue: needs your eyes, held, decided; filter by tier | Prototyped | `/signoff` |
| Embedded asset preview: email, social post, document | Prototyped | Placeholders for real content |
| Settings shown with the asset (subject, preview text, from, reply-to, recipients, schedule, platform) | Prototyped | Part of what you approve |
| Email preview at phone and desktop width | Prototyped | |
| Screen grabs rendered from the client's connected apps | Specified | Baton fetches; no sign-in to other tools |
| Changing a setting after approval reopens sign-off | Specified | Settings are versioned with the asset |
| Approval hands the item to the connected app to schedule or publish | Specified | |
| Post-send screen grab compared with what was approved | Specified | |
| Client approvers review through a secure single-use link | Future | Phase 2; no account or install |
| Checklist must be ticked before Approve unlocks | Prototyped | |
| Four outcomes: approve, approve with changes, resubmit, decline | Prototyped | |
| Approve with changes: fix now, owner applies, call, meet, chat | Prototyped | Talk-it-through paths hold the send |
| Undo window after any decision | Prototyped | 10 seconds in the prototype; 10 minutes specified |
| rf-regulatory redlines beside regulated drafts | Prototyped | |
| Lesson routing: skill, client Direction, or this item | Prototyped | Saved as training signal: Specified |
| Gate reopens on any edit after review | Specified | |
| Face ID for Tier 1 on mobile | Specified | Native app |
| Shipped-matches-approved check | Specified | |
| Daily digest for in-guardrail machine adjustments | Specified | |

### Advisor

| Feature | Status | Notes |
| --- | --- | --- |
| Advisor page: pick a client, name any area, get ranked best practices | Prototyped | `/advisor`; sample guidance for 8 areas |
| Ranked by impact, then least effort | Prototyped | Highest, High, Medium; Low, Medium, High effort |
| Every item says what the customer gets, and what companies like this client do | Prototyped | Peer notes differ for B2B services, DTC subscription, medtech and DPC practices |
| Peer set per client (who it's compared with, who its customers are) | Prototyped | From Direction; missing peer set prompts you to name competitors |
| "Applies to everything" fundamentals and a five-question customer-first test | Prototyped | |
| Top three moves on every project, by project type | Prototyped | Links to the full advice |
| Customer-first check in sign-off: "you" vs "we", what the piece opens with | Prototyped | Sample counts; real reading Specified |
| Live research of peer practice through rf-compete, with links and dates | Specified | Areas without a playbook researched on demand |
| Advice refined by sign-off notes and results (rf-analyze) | Specified | What worked for this client outranks general practice |
| Add a recommended move as a project step or a Today item | Specified | |

### Skills

| Feature | Status | Notes |
| --- | --- | --- |
| Library of 12 client-neutral skills by department | Prototyped | Sample first-pass rates |
| Skills run on the Claude API with client Direction loaded | Specified | |
| Proposed skill improvements as diffs | Specified | |

### Platform

| Feature | Status | Notes |
| --- | --- | --- |
| Claude connector: Baton as a remote MCP server | Specified | Read status, add notes, topics, tasks; never approve or send |
| OAuth sign-in so Claude acts as you, scoped to your firm | Specified | Same permissions as the app |
| Data and auth (Supabase, row-level security per client) | Specified | |
| Sign up: name, email, firm, password or Google | Prototyped | `/signup`; creates the firm (multi-firm ready) |
| Sign in: password, emailed one-time link, Google | Prototyped | `/login`; real auth via Supabase Auth Specified |
| Face ID, Touch ID, Windows Hello through passkeys | Prototyped | WebAuthn; offered right after sign-up |
| Remember me: 30-day session on trusted devices | Prototyped | Off means session ends when the browser closes |
| Forgot password: single-use reset link | Prototyped | `/forgot`; 30-minute expiry |
| Two-step verification and new-device alerts | Specified | Required before client data is shown on a new device |
| Session list with sign out of other devices | Specified | |
| App connections through MCP connectors | Specified | Moda, Buffer, Metricool, Brevo, Klaviyo, Press Ranger, Drive |
| Scheduling and retries (durable job queue) | Specified | |
| Failure alerts when a skill or connection breaks | Specified | |
| Phase 2: roles for collaborators and client teams | Future | Owner, Collaborator, Client admin, Client viewer |
| Away mode | Future | |

## Principle: the order of priorities

Every screen is ordered the same way: accountability to each CEO first, your own peace of mind second, project and task views third.

What the review changed:

- **CEO first.** Promises to a CEO are now tracked (who, when promised, due), late ones first. 1:1 follow-ups become promises due by the next 1:1. The CEO report is a standing promise with a cadence. Home's greeting leads with whether any promise is late. Both dashboards open with Owed to the CEO, Next 1:1 and the CEO report. Ear to the ground turns into talking points for the 1:1.
- **Peace of mind second.** A Peace of mind widget checks five guarantees: no late promise, nothing sending today without your eyes, no slip flags waiting, long-lead work started on time, and a recent conversation with every CEO. All clear means you can stop thinking about work.
- **Projects and tasks third.** Still one click away, below the fold by default.

Still open (Specified): an action line in a note can be marked as a promise; a pre-1:1 brief assembled automatically from what's owed, decisions needed and Ear to the ground; the CEO report shows promises kept and at risk; an end-of-day "you can stop" check.

## Principle: everything for review lives in Baton

Every item arrives complete: the asset, screen grabs of how it will look where it lands, and every setting that decides how it goes out. Review never requires another login, an app install or a download. Baton fetches previews and settings through each client's connected apps, and approval sends the item on exactly as reviewed. Workflows that flow.

## Slip checks: making human review hold

Most damaging mistakes are not bad writing; they are small, normal-looking errors a tired reviewer skims past. Baton checks for them before you see the item, so a slip has to get past both the machine and you.

- **Sender and identity:** From and reply-to differ from the client's usual; another client's logo, footer or account.
- **Subject and preview:** placeholder or leftover text, repeats a recent send, too long for phones, preview text duplicates the subject.
- **Audience:** wrong list or segment, a test list on a live send, recipient count far from normal.
- **Timing:** time zone of the recipients, weekday matching the date, sends on a holiday or overlapping another send to the same people.
- **Content:** merge tags without fallbacks, broken or untagged links, "TK", "lorem" or bracketed notes, names misspelled or styled wrongly, word or character limits.
- **Compliance:** unsubscribe and address footer, required disclaimers, rf-regulatory redlines.

Each result is OK, Check (you tick it to approve) or Blocks send. The four fields people most often get wrong are read back in large type just above Approve. When a slip gets through anyway, you log it in one tap and it becomes a new check for every client.

## How brand detection works

Baton reads the client's public website: the header logo, favicon and app icon (`link rel="icon"`, `apple-touch-icon`), the social share image (`og:image`), the theme color (`meta name="theme-color"`, web manifest) and the most-used colors and fonts in its styles. Where a connected tool already does this well (Brevo's brand fetch, a Moda brand kit), Baton uses it. Every result is a suggestion: you pick, adjust and save. Colors too light for white text get a deeper shade for Baton's own accents so the screen stays readable.

## Changelog

### 2026-10-28: coach
- Coach icon on key cards and client headers: hover for reminders and coaching about late promises, backlog, missed or overdue 1:1s, the tone of your notes, and each CEO's working style.
- Working-style notes per client person on the Notes tab.

### 2026-10-28: dashboards, CEO-first workflow, task pop-over, notes in place
- Home and client dashboards of widgets you drag in, move, resize and remove; Start a project is a pill.
- Promises to the CEO tracked; Owed to the CEO, Peace of mind and Ear to the ground widgets.
- Click any task to adjust it in a pop-over; edits show everywhere.
- Notes edited in place with Who and last updated; each line timestamped behind a small clock; ticked items fold into Completed items.
- Fixed: dragging a row inside a widget no longer moves the widget.

### 2026-10-28: contrast fixes
- Post-it notes follow the page in Half-dark (light page, dark frame); their buttons take the note's text color.
- Fixed low contrast: avatar, completed phase badges, client-colored labels in dark mode, brand swatch labels.
- Added `npm run audit:contrast`: checks every label on every page in all three modes against WCAG AA.

### 2026-10-28: floating 1:1 agenda
- 1:1 agenda per client floats over every screen; drag work onto it, jump to items without losing your place.
- In-meeting notes and outcomes; Wrap up sends decisions to Notes and follow-ups to tasks and project checklists.

### 2026-10-28: conversation notes
- Notes tab per client for conversations with the CEO and staff; arrow lines become action items.
- Home shows a cascading post-it stack per client, color-coded with the client's brand.

### 2026-10-28: client sign-off tab, drop to file, snooze
- Each client opens on its own sign-off queue; review mode stays within that client.
- Drag documents onto Baton to file them; unclear ones ask which client; password files are refused.
- Snooze tasks and Today items for any number of days, weeks or months.

### 2026-10-28: advisor
- Advisor page ranks best practices for an area by impact, written from the customer's side, with notes on what companies like the client do.
- Projects show their top three moves; sign-off shows a customer-first check.
- Mountain Peaks peer set: direct primary care (DPC) family practices.

### 2026-10-28: start a project by chat
- "Start a project" box on Home and each client's Projects tab; type or talk, Baton asks clarifying questions.
- Projects carry how real they are (Heard about it, Rough idea, Proposed, Confirmed); only Proposed and Confirmed create a checklist.
- Phone menu fixed to fit five items.

### 2026-10-28: Today and slip checks
- Today list: drag to reorder reviews, tasks, meetings and planning across clients; time and planning-share meters.
- Long-lead radar shows work by its start-by date, with Add to today.
- Sign-off review adds slip checks, a tick for each flagged slip, highlighted settings and a read-back above Approve.

### 2026-10-28: client brand and sign-in
- Brand tab pulls logo, icon, colors and fonts from the client's website (sample results), lets you adjust them and applies them to the client's tile, top bar and accents.
- Light brand colors are automatically deepened for readability.
- Sign-up, sign-in (Face ID or passkey, password, emailed link, Google), remember me and password reset screens. Avatar now signs out.

### 2026-10-28: review completeness
- Sign-off review shows each item's settings beside the asset (subject, preview text, from, reply-to, recipients, schedule, platform).
- Email previews switch between phone and desktop width.
- Spec adds screen grabs from connected apps, settings-versioned sign-off, hand-off on approval, post-send check and no-login client approvals.

### 2026-10-28: first prototype
- App shell with Light, Half-dark and Dark modes, desktop and mobile layouts.
- Home, client workspace (Score, Tasks, Projects, Chats, Apps and files, CEO report), sign-off queue and review, skill library.
- Project templates with optional, editable checklists.
- Sample data for four clients; no real services connected.

---

© 2026 RidgeFront. All rights reserved.
