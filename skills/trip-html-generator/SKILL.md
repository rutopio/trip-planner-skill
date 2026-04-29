---
name: trip-html-generator
description: >
  Generates a complete interactive HTML travel guide from researched trip data.
  Produces a multi-file folder (index.html + app.js + data/*.json shards). NO style.css — Tailwind CDN handles 90% of styling, the small amount of custom CSS lives in a <style> block inside index.html.
  with optional i18n, interactive maps, calendar views, expense tracking, and
  booking comparison.
  Trigger phrases: "generate the trip HTML", "create the travel guide",
  "build the interactive trip plan page", "generate the HTML for my trip",
  "create the trip planner app", "build the travel plan website"
---

# Trip HTML Generator

Generate a trip planner app as a **multi-file folder structure** (`index.html` + `app.js` + `data/*.json` shards). **NO `style.css`** — Tailwind CDN handles 90% of styling; the small amount of custom CSS lives in a `<style>` block inside `index.html`.

The `data/*.json` shards are the single source of truth. `index.html` and `app.js` are a generic shell — the same shell across every trip — and contain ZERO trip-specific strings, prices, city names, or hardcoded data. Updating a trip = editing one or more shards only.

---

## Read These References Before Generating

| Reference | What it covers |
|-----------|----------------|
| **[references/phase-5-generation-strategy.md](references/phase-5-generation-strategy.md)** | Output path rule, incremental section-by-section build, checkpoint/resume. **Read FIRST.** |
| **[references/cdn-and-styling.md](references/cdn-and-styling.md)** | CDN dependencies (Tailwind / Leaflet / Google Fonts), styling decision tree, when (not) to write custom CSS |
| **[references/components.md](references/components.md)** | Per-component rules: Cover, Today, Weather, POI Modal, Live Clocks, Now Line, Flight Card, Nomad Spots, GeoJSON, Booking links, Meal tracking, Currency, layering/z-index |
| **[references/template-contract.md](references/template-contract.md)** | What may/may not appear in HTML/CSS/JS + the validation checklist |
| **[references/index-skeleton.md](references/index-skeleton.md)** | Canonical `index.html` shell (copy verbatim — includes inline `<style>` block) |
| **[references/app-skeleton.md](references/app-skeleton.md)** | Canonical `app.js` shape (`bootstrap`, `loadTrip` (sharded fetch), `t()`, `L()`, `cityById`, render dispatch) |
| **[references/trip-json-schema.md](references/trip-json-schema.md)** | Schema for `data/*.json` shards (`trip.meta.json` carries `lang`, `supportedLangs`, `cities`, `i18n`; per-shard fields documented) |
| **[references/layout-blueprint.md](references/layout-blueprint.md)** | Layout structure, design system, responsive breakpoints |
| **[references/html-content-sections.md](references/html-content-sections.md)** | Tab-specific markup and content requirements |

---

## Generation Order — READ BEFORE TOUCHING ANY FILE

**Phase 5 is incremental. Generating in one shot causes 15+ minute timeouts and silent failures. This is the rule, not a suggestion.**

### Hard limits (single Write/Edit per call must obey these)

**Universal ceiling: any single `Write` or `Edit` call MUST stay under 500 lines of new content.** Above 500 lines a single tool call takes 1–4 minutes to complete, and the user sees a spinner with no progress. Many small calls feel faster than one big call.

| File | Strategy | Per-call ceiling |
|------|----------|-------------------|
| `data/trip.meta.json` | One `Write` (B1) | ~150 lines |
| `data/pois.json` | One `Write` (B2). If > 500 lines, split into `pois.json` + `pois.2.json`. | 500 lines |
| `data/schedule.json` | One `Write` (B3). If > 500 lines, split per-half-of-trip. | 500 lines |
| `data/weather.json`, `budget.json`, `booking.json`, `checklist.json`, `flightIntel.json`, etc. | One `Write` each | ~200 lines each |
| `app.js` | C1 = `Write` of bootstrap. C2–C8 = **shell append** (`cat >> ... << 'EOF'`). **Never re-Write app.js after C1; never `Edit` it.** | 500 lines per append |
| `index.html` | One `Write` from `index-skeleton.md` verbatim. **No inline trip data** — `app.js` fetches shards at runtime. | ~180 lines |
| `style.css` | **DOES NOT EXIST** — all CSS inlined in `<style>` block inside `index.html` | — |

### Why multi-file shards (the most important rule)

A single `data/trip.json` was retired because every `Edit` on a growing JSON file streamed the **whole file** through the LLM — costs scaled O(n²) with trip size. A 20-POI trip burned ~60k tokens just patching the JSON. Sharding makes each shard a single `Write` with token cost ∝ shard size only.

### Append vs Edit — use shell append for app.js

For C2–C8, do NOT use `Edit` to grow `app.js`. Edit recomputes string positions on a growing file. Use `Bash` heredoc:

```bash
cat >> "<folder>/app.js" << 'EOF'
function renderCalendar() {
  /* ... C3 body ... */
}
EOF
```

This is O(1) regardless of file size.

### Required sequence (do not deviate)

**Step 0 — Confirm output path.** Run `pwd`, propose `{pwd}/{destination-slug}-{year}/`, ask user. Then `mkdir -p <path>/data <path>/.claude`.

**Step 1 — Announce the plan to the user.** In one short message, list the steps:
> "I'll generate the trip in ~15 steps: B1 (trip.meta) → B2 (pois) → B3 (schedule) → B4 (weather) → B5 (budget) → B6 (booking) → B7 (checklist) → B8/B9 (optional shards) → C1–C8 (app.js groups) → D (index.html with inline `<style>`). Each step is one Write (or one shell append for C2–C8), then I validate. Starting B1 now."

This announcement is **mandatory**. It commits you publicly to the incremental flow and lets the user interrupt if you start drifting.

**Step 2 — Build `data/` shards (B1 → B7+).** Each shard is **one `Write` call** that creates the whole file from scratch. **Never `Edit` a shard after Writing it** — if you need to fix something, `Write` the whole shard again (still cheap; each shard is small).
- B1: `data/trip.meta.json` — `lang`, `supportedLangs`, `destination`, `tagline`, `startDate`, `endDate`, `currency`, `cities[]`, `i18n.{lang}.{key}` (all UI chrome keys)
- B2: `data/pois.json` — full nested-i18n POI array
- B3: `data/schedule.json` — day-by-day events
- B4: `data/weather.json`
- B5: `data/budget.json`
- B6: `data/booking.json`
- B7: `data/checklist.json`
- B8: `data/flightIntel.json` (if flights researched)
- B9: `data/entryRequirements.json`, `data/entryForms.json`, `data/holidays.json`, `data/retro.json` (whichever apply)

After EACH B-step:
1. Update `_progress.phase5_step = "B<N>"` in `trip.meta.json` (this is the only shard that may be re-Written; do it sparingly — once at end of each B-step is fine).
2. Run `node skills/trip-html-generator/scripts/validate-trip.mjs <folder> --schema-only`. The validator merges all shards in memory.
3. **If validator fails, fix and re-Write that shard before moving on.**
4. **Output a one-line progress message.** Mandatory. Format: `✅ B<N> done — {filename} ({entry count}, {line count}). Validator green. → Starting B<N+1>: {next thing}...`

**Step 3 — Build `app.js` (C1 → C8).**
- C1: `Write` the entire bootstrap (`bootstrap`, `loadTrip`, `t()`, `L()`, `cityById()`, `bindLanguageSwitcher`, `bindTabs`, `showTab`, `applyLang`, `fmtMoney`, `injectCityVars`) — the **only** `Write` for app.js.
- C2–C8: each appends one render group via **shell `cat >> ... << 'EOF'`**, NOT via `Edit`.
- **Never re-`Write` app.js after C1.** Append only.
- **No single C-step append may exceed 500 lines.** If a render group is bigger, split into C5a/C5b/etc.
- Update `_progress.phase5_step = "C<N>"` (one re-Write of `trip.meta.json` is OK per group).
- Output progress: `✅ C<N> done — {functions added} ({line count}). → Starting C<N+1>...`

**Step 4 — D (index.html + serve.py).**
- `Write` `index.html` from `index-skeleton.md` verbatim. **No JSON inlining, no separate style.css.** All custom CSS is already in the skeleton's inline `<style>` block. Trip data is loaded at runtime from `data/*.json` shards by `app.js → loadTrip()`. Single small Write (~250 lines including the `<style>` block).
- **Do NOT write a `style.css` file.** Tailwind CDN + the inline `<style>` block cover 100% of styling. If a UI-style pack needs different design tokens, edit the `:root { ... }` rule INSIDE the existing `<style>` block — never extract it to a separate file.
- `Write` `serve.py` (10 lines, mandatory — `file://` no longer works because sharded `fetch` requires HTTP).
- Update `_progress.phase5_step = "D"`.
- Output progress: `✅ D done — index.html (with inline <style>) + serve.py written. → Running final validator...`

**Step 5 — Final validator.** Full check, no `--schema-only`:
```bash
node skills/trip-html-generator/scripts/validate-trip.mjs <folder>
```
Must exit 0. Fix any failures.

### Self-check before each Write/Edit/Bash

Before calling any file-writing tool, ask yourself:
- Is this Write/Edit/append > **500 lines** of new content? → STOP. Split it.
- Am I about to `Edit` a JSON shard? → STOP. `Edit` on a JSON file streams the whole file through the LLM (token cost is O(file size), not O(diff size)). Either `Write` the whole shard fresh, or split the data into a numbered overflow shard (`pois.2.json`).
- Am I about to re-`Write` `app.js` after C1? → STOP. Use `cat >> ... << 'EOF'` to append.
- Am I about to inline trip data into `index.html`? → STOP. There is no inline trip data anymore. `app.js → loadTrip()` fetches the shards.
- Did I update `_progress.phase5_step` after the last step? → If not, do it before this one (re-Write `trip.meta.json` is fine, it's small).
- Has the schema-only validator run since the last B-step? → If not, run it now.
- Have I told the user what just finished and what's starting next? → If not, output the one-line progress ping first.

### When to consult the longer doc

Most LLMs don't need to open `phase-5-generation-strategy.md` — the rules above are sufficient. Open it ONLY if:
- A shard's content is unclear (which fields go in `trip.meta.json` vs `pois.json`?)
- You need the resume-from-checkpoint logic
- You're debugging a mid-Phase-5 failure

Track progress in `data/trip.meta.json._progress.phase5_step` for resume. Schema defined in [trip-planner/references/checkpoint.md](../trip-planner/references/checkpoint.md).

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

If a `style.css` file exists at all, that's a bug — delete it and inline content into the `<style>` block in `index.html`. The inline `<style>` block should stay under 200 lines; if it grows past that, you're hand-writing CSS that should be Tailwind utilities in the markup.

Material Symbols Outlined is the icon font. No emoji except country flags in passport contexts.

---

## Validator Enforces

The validator (`scripts/validate-trip.mjs`) blocks all of these:

- Missing required files or missing mount points.
- Trip data schema violations (missing fields, dangling city refs across shards).
- `i18n` coverage gaps (every key × every `supportedLangs`).
- Flat-sibling i18n keys (`name_en`, `desc_ko`, …).
- Trip-specific tokens leaking into `index.html` or `app.js` (style.css doesn't exist).
- Per-city CSS selectors (`.wd-city-busan`).
- Module-scope literal arrays in app.js (`WEATHER_DATA`, `POIS`, `SCHEDULE`, `NOMAD_SPOTS`, `SCHEDULE_CITY_I18N`).
- Conditional language ladders in JS (`lang === 'zh' ? ... : ...`).
- `#map` outside `#tab-time` or duplicated.

If the validator reports failures: regenerate the offending file. Do not ship a violating trip.

---

## Output

```
{destination-slug}-{year}/
├── index.html              # HTML shell + 3 CDN tags + mount points
                            # NO style.css — all CSS inline in index.html <style> block
├── app.js                  # All render logic
├── data/
│   ├── trip.meta.json      # lang, supportedLangs, cities, i18n, dates, currency
│   ├── pois.json           # POI array
│   ├── schedule.json       # day-by-day events
│   ├── weather.json        # forecast per day
│   ├── budget.json         # items + actual_expenses
│   ├── booking.json        # purchased + compare + recommended
│   ├── checklist.json      # pre-trip checklist groups
│   ├── flightIntel.json    # (optional) flight price intelligence
│   ├── entryRequirements.json   # (optional) per-country requirements
│   ├── entryForms.json     # (optional) pre-fill data for arrival forms
│   ├── holidays.json       # (optional) host-country holidays
│   └── retro.json          # (optional) post-trip retrospective
├── serve.py                # Local dev server (mandatory — file:// not supported)
└── .claude/
    └── launch.json         # Preview config
```

External deps (CDN): Tailwind, Leaflet + CartoDB Voyager basemap, Google Fonts (Noto Sans + Material Symbols). All listed in [cdn-and-styling.md](references/cdn-and-styling.md).

Tell the user the absolute folder path and run instructions: `python3 serve.py` → `http://localhost:8765`.

---

## After Phase 5 Completes — Offer a Restyle

Default style is **Swiss Minimalist** (clean grid, red accent, zero rounded corners). After the trip is generated AND validator is green, offer the user the option to switch styles now that they can see the result:

> "Trip is live at `http://localhost:8765` with the **Swiss Minimalist** style (the default). Want to keep it, or try a different style? Travel-friendly options: Luxury Editorial, Botanical, Newsprint, Professional Serif, Academia, Organic, Monochrome."

If the user wants a different style: hand off to the `ui-style` skill, read the chosen style's reference, then **edit the `<style>` block inside `index.html`** — replace the `:root { ... }` CSS variables with the new pack's tokens, and update the `tailwind.config = { theme.extend }` script if needed. All `data/*.json` shards, `app.js`, and the rest of `index.html` stay untouched. This is fast — usually under a minute.

If the user is happy with Swiss: do nothing more. The trip is done.
