---
name: trip-html-generator
description: >
  Generates a complete interactive HTML travel guide from researched trip data.
  Produces a multi-file folder (index.html + style.css + app.js + data/trip.json)
  with optional i18n, interactive maps, calendar views, expense tracking, and
  booking comparison.
  Trigger phrases: "generate the trip HTML", "create the travel guide",
  "build the interactive trip plan page", "generate the HTML for my trip",
  "create the trip planner app", "build the travel plan website"
---

# Trip HTML Generator

Generate a trip planner app as a **multi-file folder structure** (`index.html` + `style.css` + `app.js` + `data/trip.json`).

`data/trip.json` is the single source of truth. `index.html`, `style.css`, and `app.js` are a generic shell — the same shell across every trip — and contain ZERO trip-specific strings, prices, city names, or hardcoded data. Updating a trip = editing `trip.json` only.

---

## Read These References Before Generating

| Reference | What it covers |
|-----------|----------------|
| **[references/phase-5-generation-strategy.md](references/phase-5-generation-strategy.md)** | Output path rule, incremental section-by-section build, checkpoint/resume. **Read FIRST.** |
| **[references/cdn-and-styling.md](references/cdn-and-styling.md)** | CDN dependencies (Tailwind / Leaflet / Google Fonts), styling decision tree, when (not) to write custom CSS |
| **[references/components.md](references/components.md)** | Per-component rules: Cover, Today, Weather, POI Modal, Live Clocks, Now Line, Flight Card, Nomad Spots, GeoJSON, Booking links, Meal tracking, Currency, layering/z-index |
| **[references/template-contract.md](references/template-contract.md)** | What may/may not appear in HTML/CSS/JS + the validation checklist |
| **[references/index-skeleton.md](references/index-skeleton.md)** | Canonical `index.html` shell (copy verbatim, fill `__TRIP_JSON__`) |
| **[references/app-skeleton.md](references/app-skeleton.md)** | Canonical `app.js` shape (`bootstrap`, `t()`, `L()`, `cityById`, render dispatch) |
| **[references/trip-json-schema.md](references/trip-json-schema.md)** | Full `trip.json` schema (`lang`, `supportedLangs`, `cities`, `i18n`, `weather`, `booking`, `entryForms`, `retro`, …) |
| **[references/layout-blueprint.md](references/layout-blueprint.md)** | Layout structure, design system, responsive breakpoints |
| **[references/html-content-sections.md](references/html-content-sections.md)** | Tab-specific markup and content requirements |

---

## Generation Order — READ BEFORE TOUCHING ANY FILE

**Phase 5 is incremental. Generating in one shot causes 15+ minute timeouts and silent failures. This is the rule, not a suggestion.**

### Hard limits (single Write/Edit per call must obey these)

**Universal ceiling: any single `Write` or `Edit` call MUST stay under 500 lines of new content.** Above 500 lines a single tool call takes 1–4 minutes to complete, and the user sees a spinner with no progress. Many small calls feel faster than one big call, even when total time is identical.

| File | One-shot Write OK? | Per-call ceiling | Strategy |
|------|---------------------|-------------------|----------|
| `data/trip.json` | ❌ Never | **500 lines per section** | 5 sections (B1–B5). For B3 with > 10 POIs, split into B3a/B3b/... — 5 POIs per Edit max. For B4 with > 7 days, split per-3-days. |
| `app.js` | ❌ Never | **500 lines per group** | 8 function groups (C1–C8). C1 is `Write`; C2–C8 use **shell append** (see below). If a render group exceeds 500 lines, split into C5a/C5b/etc. |
| `index.html` | ✅ Once | ~400 lines | Copy `index-skeleton.md` verbatim. **Do NOT inline the trip.json into the HTML during Write** — substitute via `sed` after writing (see Step 4). |
| `style.css` | ✅ Once | ~200 lines | Mostly empty — Tailwind handles 90% |

### Append vs Edit — use shell append for app.js

For C2–C8, do NOT use the `Edit` tool to grow `app.js`. Edit recomputes string positions on a growing file and gets slow. Use `Bash` with heredoc append:

```bash
cat >> "<folder>/app.js" << 'EOF'
function renderCalendar() {
  /* ... C3 body ... */
}
EOF
```

This is O(1) regardless of file size. Same applies to growing `trip.json` mid-build via `jq` patches if needed; but for `trip.json` the cleaner path is `Edit` with surgical insertions because the append point is inside arrays (`pois`, `schedule`).

### Required sequence (do not deviate)

**Step 0 — Confirm output path.** Run `pwd`, propose `{pwd}/{destination-slug}-{year}/`, ask user. Then `mkdir -p <path>/data <path>/.claude`.

**Step 1 — Announce the plan to the user.** In one short message, list the steps you will take and the order:
> "I'll generate the trip in 14 steps: B1–B5 (trip.json sections) → C1–C8 (app.js groups) → D (index.html + style.css). Each step writes a file or appends to one, then I run schema-only validator. Starting B1 now."

This announcement is **mandatory**. It commits you publicly to the incremental flow and lets the user interrupt if you start drifting.

**Step 2 — Execute B1 → B5** (build `data/trip.json`). Each sub-step:
- B1: skeleton (`lang`, `supportedLangs`, `destination`, `startDate`, `endDate`, `currency`, `cities[]`, empty `i18n{}`, empty `pois:[]`, empty `schedule:[]`)
- B2: `i18n.{lang}.{key}` for every required UI key (see `app-skeleton.md`)
- B3: `pois[]` with full nested-i18n `name`/`desc`, `lat`, `lng`, `cat`, `city`
- B4: `schedule[]` day-by-day events
- B5: `weather[]`, `budget`, `booking`, `entryForms`, `flightIntel`, `retro`

After EACH B-step:
1. Update `_progress.phase5_step = "B<N>"` and `_progress.updated_at`
2. Run `node skills/trip-html-generator/scripts/validate-trip.mjs <folder> --schema-only`
3. **If validator fails, fix and re-run before moving on.** Do not proceed with cascading errors.
4. **Output a one-line progress message to the user.** Mandatory. Format: `✅ B<N> done — {what was added} ({line count}). Validator green. → Starting B<N+1>: {next thing}...`. This 1–2 sentence ping every 1–3 minutes prevents the user thinking the run is frozen during long generations.

**Step 3 — Execute C1 → C8** (build `app.js`).
- C1: `Write` the entire bootstrap (`bootstrap`, `t()`, `L()`, `cityById()`, `bindLanguageSwitcher`, `bindTabs`, `showTab`, `applyLang`, `fmtMoney`, `injectCityVars`) — this is the only `Write` for app.js.
- C2–C8: each appends one render group via **shell `cat >> ... << 'EOF'`**, NOT via `Edit`. See "Append vs Edit" above for syntax.
- **Never re-`Write` app.js after C1.** Append only.
- **No single C-step append may exceed 500 lines of new code.** If a render group is bigger, split into C5a/C5b/etc.
- Update `_progress.phase5_step = "C<N>"` after each.
- Output progress: `✅ C<N> done — {functions added} ({line count}). → Starting C<N+1>...`

**Step 4 — D (index.html + style.css).**
- Copy `index-skeleton.md` verbatim → `index.html`. **Leave `__TRIP_JSON__` as the literal placeholder.** Do NOT inline the trip.json contents in this Write — that bloats the call by thousands of lines.
- Substitute the JSON via shell after the Write (Python over sed for binary-safety with multibyte JSON):
  ```bash
  cd "<folder>" && python3 -c "
  import json, pathlib
  d = pathlib.Path('data/trip.json').read_text()
  h = pathlib.Path('index.html').read_text()
  pathlib.Path('index.html').write_text(h.replace('__TRIP_JSON__', d))
  "
  ```
- Generate minimal `style.css` (50–200 lines). Custom CSS only for the exceptions in `cdn-and-styling.md`.
- Update `_progress.phase5_step = "D"`.
- Output progress: `✅ D done — index.html ({n} lines) + style.css ({m} lines) + trip.json injected. → Running final validator...`

**Step 5 — Final validator.** Full check, no `--schema-only`:
```bash
node skills/trip-html-generator/scripts/validate-trip.mjs <folder>
```
Must exit 0. Fix any failures.

### Self-check before each Write/Edit/Bash

Before calling any file-writing tool, ask yourself:
- Is this Write/Edit/append > **500 lines** of new content? → STOP. Split it.
- Am I about to re-`Write` `app.js` after C1? → STOP. Use `cat >> ... << 'EOF'` to append.
- Am I about to inline the trip.json into the index.html Write call? → STOP. Use `__TRIP_JSON__` placeholder + Python substitution after.
- Did I update `_progress.phase5_step` after the last step? → If not, do it before this one.
- Has the schema-only validator run since the last B-step? → If not, run it now.
- Have I told the user what just finished and what's starting next? → If not, output the one-line progress ping first.

### When to consult the longer doc

Most LLMs don't need to open `phase-5-generation-strategy.md` — the rules above are sufficient. Open it ONLY if:
- A B/C step's content is unclear (which fields go in B3 vs B5? what's in C5?)
- You need the resume-from-checkpoint logic
- You're debugging a mid-Phase-5 failure

Track progress in `data/trip.json._progress.phase5_step` for resume. Schema defined in [trip-planner/references/checkpoint.md](../trip-planner/references/checkpoint.md).

---

## Tab Anatomy (MANDATORY — do not invent your own)

The 7 tabs each have a fixed responsibility. **Do not merge them, do not put map/POI list on the Overview tab, do not create new tabs.**

| Tab id | Sidebar icon | Purpose | Required mount points |
|--------|--------------|---------|------------------------|
| `tab-attractions` | `travel_explore` | Trip summary: header, stats, countdown, today card, weather strip | `#trip-destination` `#trip-meta` `#trip-tagline` `#stats-bar` `#info-box` `#time-countdown` `#today-card` `#weather-strip` |
| `tab-calendar` | `calendar_month` | Day-by-day grid + mobile fallback | `#calendar-desktop` `#calendar-mobile` |
| `tab-booking` | `sell` | Flights, hotels, tickets, passes, recommended buys | `#flight-intel` `#booking-purchased` `#booking-compare` `#booking-recommended` `#holiday-calendar` |
| `tab-budget` | `wallet` | Estimated/actual toggle, charts, line items | `#budget-mode-toggle` `#budget-total` `#budget-by-city` `#budget-by-cat` `#budget-detail` |
| `tab-time` | `map` | **Spots / Map** — filters + Leaflet map + POI list | `#poi-filters` `#map` `#poi-list` |
| `tab-checklist` | `checklist` | Entry forms + pre-trip checklist + nomad spots | `#entry-forms` `#checklist-groups` `#nomad-workspaces` |
| `tab-retro` | `auto_stories` | Post-trip retrospective (hidden until `endDate` passes) | `#retro-map` `#retro-budget-review` `#retro-missed` `#retro-changelog` `#retro-lessons` |

### Hard rules

1. **`#map` exists in exactly ONE place: inside `#tab-time`.** Leaflet's `L.map('map')` binds to the first occurrence — duplicating breaks both tabs.
2. **POI list lives in `#tab-time`.** Overview shows a stat count, not the full list.
3. **Calendar grid lives in `#tab-calendar`.** Overview shows the today card only.
4. Each tab section is `<section class="tab-panel" id="tab-{id}">`. Use `class="active"` for the initial tab. Switching is `app.js → showTab(id)`.
5. **Retro tab is hidden until `new Date() >= new Date(TRIP.endDate)`.**
6. **Cover and Today overlays** are top-level `<div>` siblings of `<main>`, not inside any tab. See [components.md §Layering Order](references/components.md).

If `#map` ends up outside `tab-time`, or any required mount point is missing, the validator fails the build.

---

## Data Language Rule (single format)

**Every user-visible text field is a nested i18n object. NEVER a bare string. NEVER `field` + `field_en` siblings.**

```json
✅ GOOD (single-lang, default):  { "name": { "zh": "淺草寺" } }
✅ GOOD (multi-lang, opt-in):    { "name": { "zh": "淺草寺", "en": "Senso-ji" } }
❌ BAD:  { "name": "淺草寺", "name_en": "Senso-ji" }                        // flat-sibling
❌ BAD:  { "name": "淺草寺" }                                                // bare string
```

The runtime resolver `L(obj)` reads `obj[currentLang]` first, falls back to default lang. Flat-sibling shapes leak `[object Object]` into the UI. Bare strings can't switch languages.

See [trip-json-schema.md §MANDATORY i18n Format](references/trip-json-schema.md) for the exhaustive list of i18n-required fields.

### Required Languages (single-language by default)

- `lang` = user's conversation language (e.g., `"zh"` for a Traditional-Chinese-speaking user).
- `supportedLangs` = `[lang]` (single-element array). The language switcher hides itself when `supportedLangs.length <= 1`.
- **Multi-lang is opt-in only.** Only emit multiple langs if the user explicitly asks ("我要中英文都有").

When opt-in: include user's lang + English + destination language(s), e.g. `["zh", "en", "ja"]`.

### UI Chrome Translations

Every UI string the user reads (tab labels, buttons, headings, empty states, status badges, week labels) lives in `trip.i18n.{lang}.{key}`. The renderer accesses them via `t(key)`.

- Required key list lives in [app-skeleton.md §Required `i18n` keys](references/app-skeleton.md). Phase 5 generator MUST emit a value for each key under every `supportedLangs` entry.
- **NEVER hardcode UI text in `app.js` or `index.html`.** No `currentLang === 'zh' ? '中文' : 'English'`. No `<button>概覽</button>`. Use `t('tab.today')` and `<button data-i18n="tab.today"></button>`.
- The validator catches both: warns on lang ladders in JS and errors on trip-display tokens in HTML/CSS/JS.

---

## Styling: Tailwind First

The shell uses CDN-hosted **Tailwind CSS v3 JIT runtime**. Default to Tailwind utility classes; write custom CSS only for the narrow exceptions in [cdn-and-styling.md](references/cdn-and-styling.md).

If your `style.css` exceeds 400 lines, you're not using Tailwind enough — audit and convert.

Material Symbols Outlined is the icon font. No emoji except country flags in passport contexts.

---

## Validator Enforces

The validator (`scripts/validate-trip.mjs`) blocks all of these:

- Missing required files or missing mount points.
- `trip.json` schema violations (missing fields, dangling city refs).
- `i18n` coverage gaps (every key × every `supportedLangs`).
- Flat-sibling i18n keys (`name_en`, `desc_ko`, …).
- Trip-specific tokens leaking into `index.html`/`app.js`/`style.css`.
- Per-city CSS selectors (`.wd-city-busan`).
- Module-scope literal arrays in app.js (`WEATHER_DATA`, `POIS`, `SCHEDULE`, `NOMAD_SPOTS`, `SCHEDULE_CITY_I18N`).
- Conditional language ladders in JS (`lang === 'zh' ? ... : ...`).
- `#map` outside `#tab-time` or duplicated.

If the validator reports failures: regenerate the offending file. Do not ship a violating trip.

---

## Output

```
{destination-slug}-{year}/
├── index.html        # HTML shell + 3 CDN tags + inline JSON fallback
├── style.css         # Minimal — Tailwind handles 90%
├── app.js            # All render logic
├── data/
│   └── trip.json     # Source of truth
├── serve.py          # Local dev server
└── .claude/
    └── launch.json   # Preview config
```

External deps (CDN): Tailwind, Leaflet + CartoDB Voyager basemap, Google Fonts (Noto Sans + Material Symbols). All listed in [cdn-and-styling.md](references/cdn-and-styling.md).

Tell the user the absolute folder path and run instructions: `python3 serve.py` → `http://localhost:8765`.

---

## After Phase 5 Completes — Offer a Restyle

Default style is **Swiss Minimalist** (clean grid, red accent, zero rounded corners). After the trip is generated AND validator is green, offer the user the option to switch styles now that they can see the result:

> "Trip is live at `http://localhost:8765` with the **Swiss Minimalist** style (the default). Want to keep it, or try a different style? Travel-friendly options: Luxury Editorial, Botanical, Newsprint, Professional Serif, Academia, Organic, Monochrome."

If the user wants a different style: hand off to the `ui-style` skill, read the chosen style's reference, then **rerun ONLY Phase 5 step D** (regenerate `style.css` from the new design tokens). `trip.json`, `app.js`, and `index.html` stay untouched. This is fast — usually under a minute.

If the user is happy with Swiss: do nothing more. The trip is done.
