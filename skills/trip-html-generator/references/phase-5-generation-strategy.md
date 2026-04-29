---
name: phase-5-generation-strategy
description: How to actually generate the trip files without timing out, truncating, or producing broken paths
---

# Phase 5 Generation Strategy

The Phase 5 deliverables (`data/*.json` shards + `index.html` (with inline `<style>`) + `app.js`) total several thousand lines. Writing them in one shot causes timeouts, truncation, and unrecoverable mid-write failures. This document defines the **incremental, validated, resumable** generation flow that the generator MUST follow.

**No separate `style.css`.** All custom CSS lives in a `<style>` block inside `index.html` — Tailwind CDN does the rest. See [cdn-and-styling.md](cdn-and-styling.md).

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

## B. Build Trip Data as Multi-File Shards (one `Write` per shard)

**Single-file `trip.json` was retired in 2026-04** because every `Edit` on a growing JSON file streamed the whole file through the LLM — costs scaled O(n²) with trip size. A single 800-line trip.json could burn 60k+ tokens just for B-step edits.

The new layout shards trip data across `data/*.json`. Each shard is small, self-contained, and **written exactly once via `Write`** — no Edits, no patches, no token-cost compounding.

### Shard files (under `data/`)

| # | File | Content | Required? |
|---|------|---------|-----------|
| B1 | `trip.meta.json` | `lang`, `supportedLangs`, `destination`, `tagline`, `startDate`, `endDate`, `currency`, `cities[]`, `i18n` | ✅ |
| B2 | `pois.json` | `[ { id, name, nameLocal, desc, addr, city, cat, lat, lng, ... } ]` | ✅ |
| B3 | `schedule.json` | `[ { date, city, events: [...] } ]` | ✅ |
| B4 | `weather.json` | `[ { date, city, icon, high, low, ... } ]` | ✅ |
| B5 | `budget.json` | `{ items: [...], actual_expenses: [] }` | ✅ |
| B6 | `booking.json` | `{ purchased: [...], compare: [...], passes: [...], recommended: [...] }` | ✅ |
| B7 | `checklist.json` | `[ { title, items: [...] } ]` | ✅ |
| B8 | `flightIntel.json` | flight price intelligence (see flight-intelligence skill) | optional |
| B9 | `entryRequirements.json` + `entryForms.json` + `holidays.json` + `retro.json` | misc | optional |

### Build order

1. **B1 — `trip.meta.json`** first. Contains `cities[]` so B2/B3 can reference city ids without dangling.
2. **B2 — `pois.json`**. Contains POI ids that B3 events will reference.
3. **B3 — `schedule.json`**.
4. **B4–B7** in any order (no inter-shard refs).
5. **B8–B9** for whatever applies to this trip; skip the rest.

### How to write each shard

Each shard is **one `Write` call** — never `Edit` a shard once written. If you discover a missing field after B5 is written, **rewrite the entire shard** with `Write` (still cheap because each shard is small).

Example B2 (POIs):

```bash
# Write the whole pois.json once. Token cost ∝ POI count, not trip size.
```

```jsonc
// data/pois.json — this entire file is the Write payload
[
  { "id": "p1", "name": { "zh": "雪梨歌劇院" }, "nameLocal": { "zh": "Sydney Opera House" },
    "desc": { "zh": "..." }, "addr": { "zh": "Bennelong Point" },
    "city": "sydney", "cat": "attraction", "lat": -33.8568, "lng": 151.2153,
    "icon": "theater_comedy", "price_local": 49, "currency": "AUD" },
  { "id": "p2", ... },
  ...
]
```

After each shard write: run schema-only validator to catch shape errors immediately:

```bash
node skills/trip-html-generator/scripts/validate-trip.mjs <trip-folder> --schema-only
```

The validator merges all shards in memory and checks the combined object against the schema. If a B-step fails, **fix and re-Write that shard** (still one call, no compounding cost).

### Single-Write hard ceiling: 500 lines

If any single shard would exceed 500 lines, **split the array across two files** with a numeric suffix:

- `pois.json` + `pois.2.json` (loader concatenates `[...arr1, ...arr2]`)
- Loader logic lives in `app-skeleton.md → loadTrip()`. If you add a `.2.json` shard, also patch the loader to fetch it.

But in practice: **20 POIs ≈ 250 lines, 14-day schedule ≈ 300 lines.** Most trips fit in one shard each. Splitting is rare.

### Progress reporting after each shard

Output a one-line ping after each shard write + validator pass:

> `✅ B2 done — pois.json (15 entries, 230 lines). Validator green. → Starting B3: schedule...`

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

## D. Build `index.html` Last (no style.css, no JSON inlining)

1. **`index.html`** — copy from `index-skeleton.md` verbatim. The skeleton already includes:
   - 3 CDN tags (Tailwind + Leaflet + Google Fonts)
   - Tailwind theme config in `<script>tailwind.config = ...</script>`
   - **Inline `<style>` block** with CSS variables, calendar absolute-positioning math, Leaflet overrides, animations, print rules. **This replaces what used to be a separate style.css file.**
   - All mount points (sidebar, bottom-bar, 7 tab sections, modal/cover/today overlays)

   No trip data inlined. `app.js → loadTrip()` fetches shards at runtime. Single `Write` call (~250 lines including `<style>`).

2. **Do NOT write a separate `style.css` file.** The skeleton's inline `<style>` block is the only place for custom CSS. If a UI-style pack needs different design tokens, edit the `:root { ... }` rule INSIDE the existing `<style>` block.

3. **`serve.py` is mandatory.** `file://` is no longer supported (sharded `fetch` requires HTTP). Tell the user: `python3 serve.py` → `http://localhost:8765`.

4. **Run full validator** (no `--schema-only`):
   ```bash
   node skills/trip-html-generator/scripts/validate-trip.mjs <trip-folder>
   ```
5. Fix any failures. Do not ship a violating trip.

---

## E. Checkpoint & Resume (mid-Phase-5)

Phase 5 is long enough to time out mid-section. Track progress in `data/trip.meta.json._progress` (the meta shard is the most stable shard — schema in [trip-planner/references/checkpoint.md](../../trip-planner/references/checkpoint.md)).

After each shard/group completes, update `_progress.phase5_step` to the **just-finished** step (`B1`–`B9`/`C1`–`C8`/`D`). Also update `_progress.updated_at`. On resume:

1. Read `data/trip.meta.json._progress.phase5_step`.
2. Resume at the next step (e.g., `B3` finished → continue at `B4`).
3. Do NOT re-Write earlier shards — they're already on disk.

When the full validator passes in step D, you may delete `_progress` from `trip.meta.json` or leave it (the loader and template both ignore unknown top-level fields).

---

## Summary Checklist (run through this every Phase 5)

- [ ] `pwd` captured, `{slug}-{year}` folder name confirmed with user
- [ ] `mkdir -p {abs-path}/data {abs-path}/.claude` succeeds with no bracket-corruption in path
- [ ] B1–B5 written incrementally, `--schema-only` validator green after each
- [ ] `_progress.phase5_step` updated after each section/group
- [ ] C1–C8 appended via Edit, not full Write rewrites
- [ ] `index.html` (with inline `<style>` block, no separate style.css) generated last
- [ ] Full validator exits 0
- [ ] `_progress` removed (or accepted as harmless residue)
- [ ] Tell user the absolute folder path + `python3 serve.py` command
