# Baton — UI evaluation and recommendations

Evaluated 17 November 2026 against commit `fb366c0` (branch `time-to-report`).
Method: the app was run and screenshotted at 1440×900 and 390×844, in light and
dark, across 17 routes, plus the repo's own `audit:contrast` script and a DOM
and network inspection. Findings below are things the app actually rendered,
not things inferred from reading the source.

---

## What is already good

Worth stating plainly, because the defects list is longer than the praise list
and that would give a false impression of the whole.

- **The sign-off detail screen is the best thing in the app.** Slip check,
  customer-first read, settings treated as part of what gets approved, a
  regulatory pass, and an approve button that stays locked until every box is
  ticked. It makes "nothing ships without your eyes" a mechanism rather than a
  slogan.
- **Contrast is deliberate.** There is already a `audit:contrast` script
  covering light, half and dark across every page. It reports exactly one
  failure (below). Most projects this size have dozens.
- **Dark mode is properly built**, not an inverted afterthought.
- **Client colour coding** on task rows — the left edge bar — lets you scan by
  client without reading.
- **The expanded dashboard is genuinely strong**: owed to CEOs, peace of mind,
  next 1:1, needs your eyes, CEO report, conversation notes, long-lead radar.

---

## Not a defect

The orange **"1 Insight"** pill in the lower left of every screenshot is the
**Next.js dev tools indicator**, rendered inside a `nextjs-portal` shadow root.
It is not Baton's and it does not ship to production. Mentioned because it is
visually prominent, it overlaps the footer and the mobile tab bar in dev, and
it would be easy to spend an afternoon trying to fix something that is not
yours.

---

## P1 — Fix now

### 1. The home page hides the entire product behind one collapsed row

`src/app/page.tsx` renders the portfolio dashboard inside a bare `<details>`
with no `open` attribute. The landing page therefore shows a date, a heading,
one line of summary, three buttons, and a collapsed strip reading "Portfolio
dashboard · expand when needed". Roughly 80% of a 1440×900 viewport is empty.

Expanding it reveals ten widgets of real, well-built content. The product's
entire answer to "what needs me today" is one click away and invisible until
you find the click.

**Recommendation.** Open by default, and remember the choice. A cockpit that
starts closed is not a cockpit. The affordance to collapse should stay for
people who want a quiet landing page, but the default should show the work.

### 2. Every client tile fetches a favicon from that client's live website

`src/components/ClientTile.tsx` renders
`<img src="https://{client-domain}/favicon.ico">` for each tile, using a
hardcoded host map (`pentara.com`, `drinkmorningmiracle.com`,
`photopharmics.com`, `mountainpeaksfamilypractice.com`).

Three separate problems:

- **It phones each client's server on every render.** Open Today with five task
  rows and Pentara's web server logs five hits from your IP. For a tool whose
  pitch is discretion and judgment on behalf of a client, having the app beacon
  the client's own infrastructure every time you glance at your task list is a
  poor default — and it is invisible, so nobody would know to look.
- **When it fails, the broken-image glyph is permanent.** The `onError` handler
  that should fall back to the monogram is attached by React during hydration,
  but the browser starts loading the image from the server-rendered HTML before
  that. If the request fails first — offline, slow DNS, a client who removed
  their favicon — the error event fires with no listener attached and the
  fallback never runs. This is visible in every screenshot taken here: the
  client avatar renders as a generic broken-picture icon on Today, on the
  client header, and on the CEO report.
- **No offline story.** The app is otherwise entirely local.

**Recommendation.** Drop the favicon fetch. Render the monogram, which is
already implemented, already colour-coded per client, and already what the
sidebar uses. Keep the image path only for a logo the user explicitly chose in
Brand settings, where the source is known and intended.

### 3. The 1:1 pill sits on top of content

`.oneonone-pill` is `position: fixed; right: 20px; bottom: 20px` with no
corresponding gutter on the page container. It overlaps real content at every
width tested:

| Screen | What it covers |
|---|---|
| Home (expanded) | The CEO report card's first row |
| Sign-off detail | The Settings card's Recipients line |
| Client report, phone | The report's own `<h2>` heading |

**Recommendation.** Reserve the space rather than floating over it: add bottom
padding to the scroll container equal to the pill's height, and on narrow
widths dock the pill rather than overlaying. A persistent affordance that
covers the thing you are reading costs more than it saves.

---

## P2 — Worth doing

### 4. "SPACES" nav heading fails WCAG AA

`.baton-spaces-heading` uses `--nav-muted` (`#6b7480`) on the sidebar
background: **4.34:1**, against the 4.5:1 required for normal text. The repo's
own audit script reports it on all 17 routes. It is the only contrast failure
in the app.

**Recommendation.** Darken `--nav-muted` in light mode to meet 4.5:1, or treat
the heading as large text by raising its size and weight. Darkening the token
is the smaller change and fixes it everywhere at once.

### 5. The sign-off detail screen has a 700px canyon

The primary review screen is a two-column layout where the left column (email
preview, ~500px tall) is much shorter than the right rail (slip check,
customer-first, settings, regulatory, changed-since — ~1050px tall). The
approval panel then starts below both. The result is roughly 700px of empty
space in the middle of the most important screen in the app, which pushes the
approve controls below the fold on a laptop.

**Recommendation.** Let the approval panel rise into the space under the
preview on wide screens, or cap the right rail's height and let it scroll
independently. The goal is that preview and decision are visible together,
since the whole screen exists to support one decision.

### 6. Client pages on mobile are mostly chrome

On a 390px viewport, a client page renders in order: global header, client name
and phase pills (2 rows), key-file chips (4 rows), section tabs (3 rows). Real
content starts around 480px down — more than half a phone screen of navigation
before anything you came to read.

This matters more than usual here because the stated mobile use case is review
and approval, which means arriving at a specific thing and acting on it.

**Recommendation.** On narrow widths, collapse the key-file chips behind a
single "Files" control and make the tab strip a horizontally scrolling single
row. Both are mechanical changes; neither needs a redesign.

---

## P3 — Smaller, still real

### 7. Google Fonts is a render-blocking third-party request

Inter is loaded from `fonts.googleapis.com`. That is a blocking stylesheet
request to a third party on every cold load, and the app renders in a fallback
face until it resolves. Next's `next/font` self-hosts the font at build time
and removes both the request and the swap.

### 8. Placeholder copy ships in the CEO report

`[Detail for this CEO: what happened this week, next milestone and date]`
renders inside each spotlight project on the report page — the artifact
intended to be shared with a client CEO. Fine in a prototype; a liability the
first time the share button is real.

### 9. The report's date is hardcoded

The report header reads "Weekly update · week of Oct 26" while the app header
reads the live date. Should derive from the same week the time rollup uses.

---

## Suggested order

1. ClientTile favicon (P1-2) — smallest change, removes a privacy default and a
   visible rendering bug at once.
2. Home dashboard open by default (P1-1) — one attribute, largest perceived
   change.
3. 1:1 pill overlap (P1-3).
4. Nav heading contrast (P2-4).
5. Sign-off canyon (P2-5).
6. Report placeholder and date (P3-8, P3-9).
7. `next/font` (P3-7).
8. Mobile chrome (P2-6) — largest, do last.

---

## A note on method

Two findings here could only have come from running the app, and both would
have been missed by reading the code. The broken avatar looks correct in
source — there is an `onError` fallback right there. It fails only because of
when the browser loads images relative to when React attaches handlers. And
the favicon requests were invisible until the network panel showed four
outbound calls to client domains.

The reverse also held: the most visually obtrusive element in every screenshot
turned out to belong to Next.js, not to Baton. Reading the code would have
found no such component and the screenshot alone would have produced a
confident, wrong bug report. Both checks were needed.

© 2026 RidgeFront.
