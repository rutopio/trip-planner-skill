---
name: phase-5-generation-strategy
description: How to actually generate the trip files without timing out, truncating, or producing broken paths
---

# Phase 5 Generation Strategy

The Phase 5 deliverables (`trip.json` + `index.html` + `app.js` + `style.css`) total several thousand lines. Writing them in one shot causes timeouts, truncation, and unrecoverable mid-write failures. This document defines the **incremental, validated, resumable** generation flow that the generator MUST follow.

---

## A. Output Path Rule (MANDATORY — NO improvisation)

The output folder is determined by a single deterministic rule:

```
{cwd}/{destination-slug}-{year}/
```

- `{cwd}` = the current working directory at the time the skill is invoked. Use the absolute path of `pwd` — do NOT use `~`, do NOT use `$HOME`, do NOT invent parent directories like `trip-plan/`.
- `{destination-slug}` = lowercase ASCII destination, hyphenated. E.g. `kyoto`, `busan-fukuoka`, `tokyo`.
- `{year}` = 4-digit start year of the trip from `trip.json.startDate`.

**Examples (correct):**
- cwd `/Users/alex/projects/` + Kyoto 2026 → `/Users/alex/projects/kyoto-2026/`
- cwd `/Users/alex/Documents/GitHub/trip-planner-skill/` + Busan+Fukuoka 2026 → `/Users/alex/Documents/GitHub/trip-planner-skill/busan-fukuoka-2026/`

**Forbidden patterns:**
- `[anything]GitHub` — paste/glob corruption, abort and re-derive `pwd`
- Nested `trip-plan/`, `trips/`, `output/` parents that aren't in cwd
- Spaces, brackets, or non-ASCII in the folder name
- Absolute paths to other users' homes

**Before any `mkdir`:**
1. Run `pwd` once and capture the literal string.
2. Concatenate `{pwd}/{slug}-{year}` with no `cd`, no shell variables, no globs.
3. Confirm the path with the user once before creating files: "I'll generate the trip into `/abs/path/{slug}-{year}/`. OK?"

---

## B. Build `trip.json` in 5 Sections (write → validate → continue)

`trip.json` is the largest single artifact and the source of truth. Build it section-by-section, writing the file after each section and re-running schema validation. This catches missing i18n keys early instead of after the whole pipeline.

### Section order

| # | Section | Fields added | Validate after |
|---|---------|--------------|----------------|
| B1 | **Skeleton** | `lang`, `supportedLangs`, `destination`, `startDate`, `endDate`, `currency`, `cities[]`, empty `i18n{}`, `pois:[]`, `schedule:[]` | schema-only |
| B2 | **i18n chrome** | `i18n.{lang}.{key}` for every required key — in **single-lang mode (default), only one lang block** | schema-only |
| B3 | **POIs** | `pois[]` with full nested-i18n `name`/`desc`, `lat`, `lng`, `cat`, `city`, `addr` | schema-only |
| B4 | **Schedule** | `schedule[]` with day-by-day events, restaurants, booking_urls | schema-only |
| B5 | **Auxiliary** | `weather[]`, `budget`, `booking`, `entryForms`, `flightIntel`, `retro` | schema-only |

After each section: run

```bash
node skills/trip-html-generator/scripts/validate-trip.mjs <trip-folder> --schema-only
```

`--schema-only` skips all HTML/CSS/JS checks (those files don't exist yet). Fix any errors before moving to the next section. **Never proceed past a failing section** — partial trip.json + downstream HTML compounds the cost of recovery.

### Why this order

- B1 first: gives validator the `cities[]` list so B3/B4 can reference cities by id without dangling references.
- B2 before any rendering content: every visible POI/schedule/budget label has to map through `t(key)` in `app.js`; if `i18n` is incomplete the renderer will crash silently.
- B3 before B4: `schedule[].events[]` references POI ids; building POIs first means schedule writes don't introduce orphan ids.

### Sub-batching for big trips

If any single B-section would exceed **500 lines** of new content, split it:

- **B3 with > 10 POIs** → B3a, B3b, B3c, … each adds 5 POIs. Use `Edit` with `old_string` = `"pois": [` (or the closing `]`) for surgical insertion.
- **B4 with > 7 days** → B4a, B4b, … each adds 3 days of schedule.
- **B5** → can stay as one section if `weather[] + budget + booking + entryForms + retro` fits under 500 lines combined; otherwise split per-field.

Update `_progress.phase5_step` to the sub-letter (`"B3a"`, `"B3b"`, …) and run schema-only validator after each sub-batch.

---

## C. Build `app.js` in Function Groups (shell-append, not Write-once)

`app.js` is the second-largest file. Write the skeleton once (C1), then **append render functions in groups** using `Bash` with heredoc:

```bash
cat >> "<folder>/app.js" << 'EOF'
function renderCalendar() { /* ... */ }
function renderCalendarMobile() { /* ... */ }
EOF
```

Shell append is O(1) — file size doesn't slow it down. Do NOT use `Edit` to grow `app.js` (Edit recomputes string positions on a growing file and gets slow). Do NOT re-`Write` the whole file (defeats the entire incremental flow).

**Hard ceiling: 500 lines per single append call.** If a render group is bigger, split it (C5a/C5b/etc.).

### Group order

| # | Group | Functions |
|---|-------|-----------|
| C1 | **Bootstrap** (from app-skeleton.md verbatim) | `bootstrap()`, `t()`, `L()`, `cityById()`, `bindLanguageSwitcher()`, `bindTabs()`, `showTab()`, `applyLang()`, `fmtMoney()`, `injectCityVars()` |
| C2 | **Today + Overview** | `renderToday()`, `renderTodayCard()`, `renderWeatherStrip()`, `renderOverviewExtras()`, `getEvIcon()` |
| C3 | **Calendar** | `renderCalendarDesktop()`, `renderCalendarMobile()`, `initClocks()`, `renderNowLine()`, drag-drop handlers |
| C4 | **Spots/Map** | `renderPOIList()`, `initMap()`, `focusPOI()`, `openPOIModal()`, filter chips |
| C5 | **Booking** | `renderFlightCard()`, `renderBookingCompare()`, `renderBookingPurchased()`, `renderHolidayCalendar()` |
| C6 | **Budget** | `renderBudgetEstimated()`, `renderBudgetActual()`, mode toggle, currency switcher |
| C7 | **Checklist + Retro** | `renderEntryForms()`, `renderChecklist()`, `renderNomadSpots()`, `renderRetro()` |
| C8 | **Export + misc** | `initExport()` (GeoJSON), Google Maps export, print mode |

After each group: do NOT run validator (it requires `index.html` to exist). Just visually scan the appended block for syntax errors before continuing.

---

## D. Build `index.html` and `style.css` Last

1. **`index.html`** — copy from `index-skeleton.md` verbatim. The skeleton already includes the three CDN tags (Tailwind + Leaflet + Google Fonts) and Tailwind theme config. **Leave `__TRIP_JSON__` as the literal placeholder during the Write call** — do NOT inline the JSON into the Write payload (that bloats it by thousands of lines and slows the call to a crawl).
2. **Substitute the JSON afterwards** via Python (binary-safe with multibyte CJK):
   ```bash
   cd "<folder>" && python3 -c "
   import pathlib
   d = pathlib.Path('data/trip.json').read_text()
   h = pathlib.Path('index.html').read_text()
   pathlib.Path('index.html').write_text(h.replace('__TRIP_JSON__', d))
   "
   ```
3. **`style.css`** — minimal. Tailwind handles 90% of styling via CDN. Custom CSS only for the exceptions documented in [cdn-and-styling.md](cdn-and-styling.md) (CSS variables, Leaflet overrides, animations, calendar grid math, UI-style pack specifics). **Target: 50–200 lines.** If you exceed 400, audit and convert to Tailwind classes.
4. **Run full validator** (no `--schema-only`):
   ```bash
   node skills/trip-html-generator/scripts/validate-trip.mjs <trip-folder>
   ```
5. Fix any failures. Do not ship a violating trip.

---

## E. Checkpoint & Resume (mid-Phase-5)

Phase 5 is long enough to time out mid-section. Track progress in `data/trip.json._progress` using the **single canonical schema defined in [trip-planner/references/checkpoint.md](../../trip-planner/references/checkpoint.md)**.

After each section/group completes, update `_progress.phase5_step` to the **just-finished** step (`B1`/`B2`/`B3`/`B4`/`B5`/`C1`...`C8`/`D`). Also update `_progress.updated_at`. On resume:

1. Read `_progress.phase5_step`.
2. Resume at the next step (e.g., `B3` finished → continue at `B4`).
3. Do NOT re-write earlier sections — they're already in the file.

When the full validator passes in step D, you may delete `_progress` or leave it (template ignores unknown fields).

---

## Summary Checklist (run through this every Phase 5)

- [ ] `pwd` captured, `{slug}-{year}` folder name confirmed with user
- [ ] `mkdir -p {abs-path}/data {abs-path}/.claude` succeeds with no bracket-corruption in path
- [ ] B1–B5 written incrementally, `--schema-only` validator green after each
- [ ] `_progress.phase5_step` updated after each section/group
- [ ] C1–C8 appended via Edit, not full Write rewrites
- [ ] `index.html` + `style.css` generated last
- [ ] Full validator exits 0
- [ ] `_progress` removed (or accepted as harmless residue)
- [ ] Tell user the absolute folder path + `python3 serve.py` command
