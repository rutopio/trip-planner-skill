---
name: output-schema
description: Canonical schema for travel-research.json — the contract between travel-collector (producer) and trip-planner (consumer)
---

# `travel-research.json` — Output Schema (canonical)

**This file is the single source of truth.** Both `travel-collector` (producer) and `trip-planner/references/phase-0-research-load.md` (consumer) reference this document. Do not duplicate the schema elsewhere.

```json
{
  "meta": {
    "trip_name": "string — destination or trip label",
    "last_updated": "ISO 8601 timestamp",
    "total_items": 0
  },
  "items": [ /* see Item schema below */ ],
  "transport": [ /* see Transport schema below */ ],
  "accommodations": [ /* see Accommodation schema below */ ],
  "passes_and_deals": [ /* see Pass schema below */ ],
  "general_tips": [ /* see Tip schema below */ ]
}
```

The full field list lives in [travel-collector/SKILL.md §Schema](../SKILL.md). This document focuses on **the producer/consumer contract**: which fields are required, which are optional, and how `trip-planner` consumes each.

---

## Field-Level Contract

### `items[]` — POIs / activities

| Field | Producer (collector) | Consumer (planner) |
|-------|----------------------|---------------------|
| `id` | MUST emit unique short id (`r1`, `r2`, …) | Used as POI id seed in `trip.json.pois[].id` |
| `type` | MUST: one of `attraction \| food \| cafe \| accommodation \| transport \| shopping \| tip \| activity \| nightlife` | Maps to `pois[].cat` in trip.json |
| `name` | MUST: original name (any language) | Becomes `pois[].name.{lang}` (i18n object) |
| `name_local` | SHOULD: local-script name | Becomes `pois[].nameLocal.{lang}` (same value across all langs) |
| `location.city` | MUST | Maps to `pois[].city` (must match a `cities[].id`) |
| `location.area` | SHOULD | Used in route clustering (Phase 3) |
| `location.address` | OPTIONAL | Becomes `pois[].addr.{lang}` |
| `location.lat`/`lng` | OPTIONAL | Becomes `pois[].lat`/`lng`. If absent, planner runs a geocoding search in Phase 4. |
| `details.description` | MUST | Becomes `pois[].desc.{lang}` |
| `details.price` | SHOULD (text form) | Pass-through. Phase 4 deep-research may refine. |
| `details.price_value` + `price_currency` | OPTIONAL | If present, planner adds to `budget.items[]`. |
| `details.hours` | OPTIONAL | Pass-through. |
| `details.tags` | OPTIONAL | Used to filter Phase 2 selection ("cherry-blossom", "must-visit"). |
| `details.dining.*` | OPTIONAL (food/cafe types) | Becomes `pois[].dining` block — drives party-size suitability logic. |
| `details.tips` | OPTIONAL | Aggregated into `pois[].crowd.tips[]` if relevant. |
| `details.booking_required` / `booking_url` | OPTIONAL | If true → `schedule[].events[].reservation = "needed"` + `booking_url`. |
| `details.reservation.*` | OPTIONAL | If `confirmed: true` → reservation moves into `schedule[].events[]`. |
| `details.meal_slot` | OPTIONAL | Drives Phase 3 placement (lunch slot ~12:00, dinner slot ~19:00). |
| `details.google_maps_url` | SHOULD | Pass-through to `pois[].mapUrl`. |
| `source.*` | MUST | Preserved for attribution. Surface as "from {source.title}" in UI when POI is presented. |
| `priority` | MUST: `must-visit \| recommended \| optional` | `must-visit` → auto-include in Phase 3. `recommended` → present to user in Phase 2. `optional` → only show if user asks. |
| `notes` | OPTIONAL | Free-text user notes. Surface in POI detail modal. |

### `transport[]` — Flights, trains, ferries, etc.

| Field | Required by | Consumer behavior |
|-------|------------|-------------------|
| `id` | producer | — |
| `type` | producer | Routes to flight-intelligence skill (if flight) or schedule transit block (if ground) |
| `route` | producer | "Taoyuan → Gimhae" — text form |
| `details.carrier`, `departure`, `arrival`, `price`, `price_currency` | producer (when known) | Populates `flightIntel` or `booking.purchased[]` |
| `details.status` | producer: `confirmed \| researching \| option` | `confirmed` → `booking.purchased[]`. Else → `flightIntel.options[]`. |

### `accommodations[]`

| Field | Required by | Consumer behavior |
|-------|------------|-------------------|
| `id`, `name`, `location`, `dates` (check_in/check_out) | producer | Populates `booking.purchased[]` if booked |
| `price_per_night`, `total_price`, `currency` | producer | Adds to `budget.items[]` under `hotel` cat |

### `passes_and_deals[]`

| Field | Required by | Consumer behavior |
|-------|------------|-------------------|
| `id`, `name`, `coverage[]`, `price`, `validity` | producer | Used in Phase 4 ticket-vs-pass calculation; presented in `booking.passes[]` |

### `general_tips[]`

Free-form tips (visa info, adapter, eSIM recommendations). Each tip has `id`, `category`, `text`, `source`. Consumer aggregates into `entryRequirements[]` and `checklist[]`.

---

## Producer Rules (travel-collector)

1. **Always write to `travel-research.json` in the cwd**, not a custom path.
2. **Never skip `id`, `name`, `location.city`, `priority`, `source`** — these are MUST fields.
3. **`source.collected_at` is a real ISO timestamp**, not "today". The planner uses this to detect stale data.
4. **For food items, always populate `details.dining.*`** at least with `recommended_for` and `solo_friendly`.
5. **Don't invent `lat`/`lng`** — leave null if unsure. The planner geocodes in Phase 4.

## Consumer Rules (trip-planner Phase 0)

1. **Read `travel-research.json` silently** — no user prompts.
2. **Pre-fill, don't overwrite.** If the user later corrects something in Phase 1, the user's value wins.
3. **Items with full data (price + hours + lat/lng + booking_url) skip Phase 4 deep research.** Don't re-search what's already known.
4. **`priority: "must-visit"` items go directly into Phase 3 routing.** The user does not need to "select" them in Phase 2.
5. **`source` is preserved** all the way to the rendered HTML — surface as small "from {source.title}" caption in the POI modal.

---

## Schema Evolution

When new fields are added to `travel-research.json`:

1. Update the schema in [travel-collector/SKILL.md §Schema](../SKILL.md).
2. Update this contract document with the producer/consumer behavior.
3. Update `trip-planner/references/phase-0-research-load.md` only if consumer behavior changes.
4. **Never break existing fields** — old `travel-research.json` files in the wild must still load.
