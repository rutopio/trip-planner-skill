---
name: checkpoint
description: Incremental save/resume mechanism for the 20-min trip planning flow
---

# Checkpoint Mechanism — Resume After Interruption

The full Phase 0 → 5 flow takes ~20 minutes. To survive context reload, timeout, or accidental interruption, write progress to `data/trip.json` (or `trip-checkpoint.json` if HTML not yet generated) at the end of each costly phase.

## What to save

`trip.json` carries a top-level `_progress` field:

```json
{
  "_progress": {
    "completed_phase": 3,
    "updated_at": "2026-04-29T14:30:00+08:00",
    "next_action": "Phase 4 deep research"
  },
  "logistics": { ... },
  "budget": { ... },
  "preferences": { ... },
  "flights": { ... },
  "selected_pois": [ ... ],
  "daily_routes": [ ... ],
  "research": { ... }
}
```

## When to write (only at high-cost boundaries)

| Phase end | Write? | Fields added |
|-----------|--------|--------------|
| 0 / 0.5   | ❌ | `travel-research.json` already exists |
| 1         | ✅ | `logistics`, `budget`, `preferences` |
| 1.5       | ✅ | `flights` (flight intelligence results) |
| 2         | ✅ | `selected_pois` |
| 3         | ✅ | `daily_routes` |
| 4         | ✅ | `research` (deep research per POI) |
| 4.5       | ❌ | Audit only, no new data |
| 5         | — | Final HTML generated, checkpoint becomes the real `trip.json` |

After each write, update `_progress.completed_phase` and `_progress.updated_at`.

## Resume detection (run at the very start of Phase 0)

1. Check if `data/trip.json` or `trip-checkpoint.json` exists with a `_progress` field.
2. If found, show:
   > 偵測到上次進行到 **Phase {N}**（更新於 {updated_at}）。
   > 要從這裡繼續，還是重新開始？
   > （回覆「**繼續**」或「**重新開始**」）
3. On "繼續": load all saved fields, jump directly to Phase {N+1}, skip earlier phase questions.
4. On "重新開始": archive the old file as `trip-checkpoint.{timestamp}.json` (do NOT delete) and start fresh from Phase 0.

## Important rules

- **Single file, not per-phase files** — keeps the `trip-html-generator` template contract simple.
- **Never ask the user the same question twice on resume** — if `logistics.dates` is already saved, skip that question in Phase 1.
- **Strip `_progress` before final HTML generation** — Phase 5 should output a clean `trip.json` without checkpoint metadata, OR the field is harmless if kept (template ignores unknown fields).
- **Atomic write** — write to `trip.json.tmp` then rename, to avoid corrupting the file mid-write if interrupted.
