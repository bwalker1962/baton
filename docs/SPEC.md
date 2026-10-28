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

### Sign-off

| Feature | Status | Notes |
| --- | --- | --- |
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
| App connections through MCP connectors | Specified | Moda, Buffer, Metricool, Brevo, Klaviyo, Press Ranger, Drive |
| Scheduling and retries (durable job queue) | Specified | |
| Failure alerts when a skill or connection breaks | Specified | |
| Phase 2: roles for collaborators and client teams | Future | Owner, Collaborator, Client admin, Client viewer |
| Away mode | Future | |

## Principle: everything for review lives in Baton

Every item arrives complete: the asset, screen grabs of how it will look where it lands, and every setting that decides how it goes out. Review never requires another login, an app install or a download. Baton fetches previews and settings through each client's connected apps, and approval sends the item on exactly as reviewed. Workflows that flow.

## Changelog

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
