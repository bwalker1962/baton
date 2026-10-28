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
| Templates: event, webinar, email campaign, podcast, award entry, launch | Prototyped | `src/lib/templates.ts` |
| Info gathering with all fields optional | Prototyped | Key date times the checklist |
| Steps: include, rename, add, remove before creating | Prototyped | Conditional hints such as "if exhibiting" |
| Project checklist: tick, skip with reason, restore, add | Prototyped | In memory; resets on reload |
| Steps that produce outbound work create sign-off items | Specified | Marked with a sign-off badge today |
| Save a customized checklist as your own template | Future | |

### Today and long-lead planning

| Feature | Status | Notes |
| --- | --- | --- |
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

### Skills

| Feature | Status | Notes |
| --- | --- | --- |
| Library of 12 client-neutral skills by department | Prototyped | Sample first-pass rates |
| Skills run on the Claude API with client Direction loaded | Specified | |
| Proposed skill improvements as diffs | Specified | |

### Platform

| Feature | Status | Notes |
| --- | --- | --- |
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
