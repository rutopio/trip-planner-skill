---
name: trip-mutator
description: >
  Modify an existing trip plan WITHOUT regenerating from scratch. Use when the user has a generated
  trip folder (data/trip.json + index.html + app.js + style.css) and wants to change something:
  swap POIs, change dates, add/remove a day, change accommodation, update budget, mark expenses as
  spent, swap days due to weather, etc. Triggers on phrases like "change my trip to X", "swap day 3
  with day 5", "I want to add Y", "remove Z from my trip", "I spent $50 on lunch", "the weather
  changed, can we move...", "update my trip plan".
  Do NOT use this skill for first-time generation — that's trip-planner. This skill assumes the
  trip files already exist.
---

# Trip Mutator — Surgical Updates to an Existing Trip Plan

Modify a generated trip plan **without** running the full Phase 0–5 flow again. The HTML/CSS/JS template never changes; only `data/trip.json` is edited. Re-rendering is automatic on page reload.

**Core insight:** the template contract guarantees `index.html` / `app.js` / `style.css` contain ZERO trip-specific data. Therefore a trip change = a `trip.json` edit + revalidate. Nothing else.

---

## When To Use This Skill (vs trip-planner)

| User says | Use |
|-----------|-----|
| "Plan a trip to Tokyo" | `trip-planner` (no existing files) |
| "Add Senso-ji to my trip" | `trip-mutator` (existing trip.json) |
| "Change my Tokyo trip to start a week later" | `trip-mutator` |
| "Swap day 2 and day 5 because of rain" | `trip-mutator` |
| "I just spent ¥1500 on lunch" | `trip-mutator` (logs actual expense) |
| "Generate the HTML for my plan" | `trip-html-generator` |

If `data/trip.json` does NOT exist in cwd or any sibling folder, fall back to `trip-planner`.

---

## Workflow

### Step 1 — Locate the trip folder

Run from cwd:
```bash
find . -maxdepth 3 -path '*/data/trip.json' 2>/dev/null | head -5
```

- 0 results → tell user "I don't see an existing trip plan. Did you mean to start a new plan?" and stop.
- 1 result → use it.
- 2+ results → `AskUserQuestion`, list folders, let user pick.

### Step 2 — Classify the mutation

Map the user's request to one of these categories. **The category determines what else needs updating.**

| Category | Example | Side effects |
|----------|---------|--------------|
| **add-poi** | "Add Senso-ji" | + `pois[]` entry, maybe + `schedule[].events[]` |
| **remove-poi** | "Remove Tokyo Tower" | – `pois[]`, – any `schedule[].events[]` referencing it |
| **swap-poi** | "Replace X with Y" | combination of above |
| **swap-days** | "Swap day 2 with day 5" | reorder `schedule[].day` numbers; **re-check weather suitability** |
| **shift-dates** | "Move trip a week later" | `startDate`, `endDate`, every `schedule[].date`, every `weather[].date` (may need re-research) |
| **add-day** | "Add a day after day 3" | new `schedule[]` entry, renumber subsequent days, extend `weather[]` |
| **remove-day** | "Remove day 5" | drop `schedule[]`, renumber, drop weather entry |
| **change-budget-item** | "Hotel is now ¥12,000/night" | edit `budget.items[].amount` |
| **log-actual-expense** | "Spent ¥1500 on lunch today" | append to `budget.actual_expenses[]` with date/cat/city |
| **change-accommodation** | "Booked a different hotel" | edit `booking.purchased[]` (or move from compare→purchased) |
| **toggle-nomad** | "Add work blocks Mon/Wed" | add `schedule[].events[].cat: "work"` blocks; populate `nomadSpots[]` if empty |
| **update-flight** | "I booked the flight" | move from `flightIntel` → `booking.purchased[]` flight entry |

If the user's request matches none cleanly, ask clarifying question rather than guessing.

### Step 3 — Apply weather-aware advice (if relevant)

For `swap-days`, `add-poi` (outdoor), `swap-poi`, `shift-dates`: read `weather[]` first.

```
swap-days:    compare both days' weather, recommend the better arrangement, but obey user's choice
add-poi:      if outdoor + sunny days available, recommend placing on clearest day
shift-dates:  warn if old weather data is now stale ("dates moved >2 weeks; weather needs re-research")
```

Show the recommendation but **don't override the user**. They get final say.

### Step 4 — Edit `trip.json` (atomic)

**Do NOT regenerate the file from scratch.** Use `Edit` tool for surgical changes:

```
Read data/trip.json once (jq or Read tool)
For each affected field: use Edit with old_string / new_string
Preserve all other fields verbatim
```

Common patterns:
- Adding a POI: find `"pois": [` and append before `]`
- Renumbering days: a sequence of small Edits (`"day": 4` → `"day": 3`, etc.) is safer than full rewrite
- For complex multi-field swaps, write to `data/trip.json.tmp` and rename only after validator passes

### Step 5 — Re-validate

```bash
node skills/trip-html-generator/scripts/validate-trip.mjs <trip-folder>
```

Must exit 0. If it fails, the most common causes are:
- Day numbers no longer contiguous (renumber properly)
- Removed POI still referenced in `schedule[].events[]` (remove the events too)
- Removed city still referenced (remove or reassign)
- i18n object missing the user's lang for the new field

### Step 6 — Tell the user what changed

Summarize concisely. Examples:
- "Added 淺草寺 to day 3 (slot 14:00–16:00). Weather that day is sunny ☀️ — good fit."
- "Swapped day 2 and day 5. Day 2 (now ARTE Museum) is rainy 🌧️ — indoor activity fits better."
- "Logged ¥1,500 lunch on 2026-04-03. Day total is now ¥4,200."

Then suggest: "Reload the page in your browser to see the changes."

---

## What This Skill Does NOT Do

- ❌ Regenerate `index.html`, `app.js`, or `style.css`. They never need to change.
- ❌ Re-run Phase 4 deep research unless the user explicitly asks (use `trip-planner` for that).
- ❌ Re-prompt for budget / preferences / dates that are already in `trip.json`.
- ❌ Run `flight-intelligence` again unless flight info is being updated.

If the user asks for something this skill can't do (e.g., "switch UI style"), hand off to the right skill (`ui-style` + `trip-html-generator` step D for restyle).

---

## Edge Cases

**The user changed dates by >2 weeks** → weather data is stale. Tell them: "I can shift the schedule to the new dates, but the weather forecasts are now outdated. Want me to re-research weather for the new dates?" If yes → invoke web search for `{destination} weather forecast {month}`.

**The user added a POI in a city not in `cities[]`** → ask which existing city it belongs to, OR add a new city entry (warning: this changes `--city-color` palette).

**Budget mode actual vs estimated** — `log-actual-expense` always writes to `budget.actual_expenses[]`. Editing the *plan* (estimated cost) writes to `budget.items[]`. Don't mix.

**`_progress` from a half-finished trip-planner run** — if you see `_progress.phase5_step` set, the previous run was interrupted mid-generation. Hand off to `trip-html-generator` to resume, not this skill.

---

## Output

Whatever was modified, verbatim, plus:
- `_progress.updated_at` bumped to now (timestamp only — leave `completed_phase` alone)
- `validator green` confirmation
- One-line user-facing summary
