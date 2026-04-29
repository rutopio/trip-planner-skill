---
name: trip-debugger
description: >
  Diagnose and fix failures in a generated trip plan. Use when the validator reports errors, when
  the user says the trip "looks broken / blank / wrong / not loading / shows [object Object] /
  map missing / fonts wrong / styles missing", or when Phase 5 generation aborted partway. Triggers
  on phrases like "the trip is broken", "validator says X", "it's blank", "fix the trip", "why is
  the map missing", "the prices look wrong", "language switcher not working".
---

# Trip Debugger — Diagnose and Fix Generation Failures

Trip plans break in predictable ways. Always start with the validator — it catches 80% of issues before you have to look at anything else.

```bash
node skills/trip-html-generator/scripts/validate-trip.mjs <trip-folder>
```

---

## Triage (run in order — STOP at first failure)

### 1. Locate the trip folder

```bash
find . -maxdepth 3 -path '*/data/trip.json' 2>/dev/null | head -5
```

- 0 results → no trip exists. Tell user, hand off to `trip-planner` if they want a new one.
- 2+ results → ask which one to debug.

### 2. Does `data/trip.json` parse?

```bash
node -e "JSON.parse(require('fs').readFileSync('<folder>/data/trip.json'))" && echo OK
```

- "Unexpected token" → JSON corrupted mid-write. Restore from git, or re-run Phase 5 from `_progress.phase5_step` checkpoint (see `references/runtime-symptoms.md §Phase 5 Mid-Generation Failures`).

### 3. Does the validator pass?

- ❌ Red → fix validator errors first. Look up each error code in [references/validator-errors.md](references/validator-errors.md).
- ✅ Green → it's runtime/visual. Continue to step 4.

### 4. Does the page actually load?

Open `http://localhost:8765` (after `python3 serve.py`). Open DevTools console.

- Console errors or visual symptoms → look up in [references/runtime-symptoms.md](references/runtime-symptoms.md).
- Page fully blank with no errors → CDN failure. Same doc, "CDN Failures" section.

---

## Reference Documents

| Doc | Use when |
|-----|----------|
| [references/validator-errors.md](references/validator-errors.md) | Validator reported a specific error code (e.g. `flat-i18n`, `cdn-tailwind`, `osm-direct`) |
| [references/runtime-symptoms.md](references/runtime-symptoms.md) | Validator green, but page looks wrong (blank map, `[object Object]`, wrong fonts, broken switcher, mid-Phase-5 failures) |

Each error / symptom in those docs maps 1-to-1 to a fix. Don't memorize them; look up only the one matching the current failure.

---

## When To Escalate

- **Trip data is fundamentally wrong** ("this trip is supposed to be Korea but data is for Japan"): not a debug — hand off to `trip-mutator`.
- **Visual aesthetic is off but data is correct**: hand off to `ui-style` to re-pick a style and rerun Phase 5 step D only.
- **10+ tool calls without progress**: stop chasing accumulated drift. Re-run Phase 5 from B1. Clean rebuild is faster.
