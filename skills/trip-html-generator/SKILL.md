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

## Generation Order

**Do NOT write all four files in one shot — that causes timeouts.** Follow the incremental flow in [phase-5-generation-strategy.md](references/phase-5-generation-strategy.md):

0. **Determine output path:** `{cwd}/{destination-slug}-{year}/`. Run `pwd`, confirm with user. NO bracket-corrupted paths, NO invented parent folders.
1. **Build `data/trip.json` in 5 sections (B1–B5):** skeleton → i18n → POIs → schedule → auxiliary. Run `validate-trip.mjs --schema-only` after each.
2. **Generate `app.js` in 8 function groups (C1–C8) via Edit-append:** bootstrap → Today/Overview → Calendar → Spots/Map → Booking → Budget → Checklist/Retro → Export. Do NOT re-Write the whole file each time.
3. **Copy `index-skeleton.md` verbatim** to `index.html`. Replace `__TRIP_JSON__` with the JSON-stringified trip payload (same bytes as `data/trip.json`). Include the three CDN tags from [cdn-and-styling.md](references/cdn-and-styling.md).
4. **Generate `style.css`** — minimal, mostly empty. Tailwind handles 90% of styling. Custom CSS only for the exceptions listed in [cdn-and-styling.md](references/cdn-and-styling.md) and the Phase-4.5 UI-style pack's distinctive treatment.
5. **Run the full validator.** MUST exit 0 before reporting the trip as generated.

```bash
node skills/trip-html-generator/scripts/validate-trip.mjs <trip-folder>                  # full check
node skills/trip-html-generator/scripts/validate-trip.mjs <trip-folder> --schema-only    # mid-build check
```

**Track progress** in `data/trip.json._progress.phase5_step` so an interrupted run can resume. See [phase-5-generation-strategy.md §E](references/phase-5-generation-strategy.md) and [trip-planner/references/checkpoint.md](../trip-planner/references/checkpoint.md).

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
