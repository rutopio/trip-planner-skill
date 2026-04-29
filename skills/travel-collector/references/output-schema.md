---
name: output-schema
description: Markdown summary contract between travel-collector (producer) and trip-planner (consumer). The summary lives in conversation context — no file is written.
---

# Travel Collector Output Schema

The collector emits a **markdown summary in the conversation**, not a JSON file. This is the
contract between collector (producer) and trip-planner (consumer). Both skills read it from
conversation context.

---

## Summary Skeleton

```markdown
## Captured Items

**Source:** {url | "screenshot" | "user note"}
**Destination(s):** {city / region — multiple if applicable}
**Items captured:** {n}

### Attractions
- **{name} / {name_local}** — {area}. {one-line why}.
  Price: {price or "—"} · Hours: {hours or "—"} · Priority: {must-visit | recommended | optional}
  Google Maps: {url}
  Source: {url}

### Food
- **{name} / {name_local}** — {cuisine}, {area}. {why}.
  Price: {range} · Meal slot: {lunch | dinner | breakfast | snack} · Party size: {1–2 | 2–4 | 4+ | any}
  Reservation: {needed: yes/no — flag inline if yes}
  Signature: {dish₁ ¥X · dish₂ ¥Y}
  Google Maps: {url}

### Cafes / Shopping / Activities / Nightlife
(same shape as Attractions)

### Accommodations
- **{name}** — {area}. {hotel | hostel | airbnb}. {price/night}. Check-in/out: {times}. Status: {booked | option}.

### Transport
- **{route}** — {carrier}. {departure → arrival}. {price}. Status: {confirmed | researching | option}.

### Tips
- {tip} — applies to {city | "general"}. Source: {url}.

### Passes & Deals
- **{name}** — covers {list}. Validity: {duration}. Price: {amount}. Worth-it: {analysis}.
```

---

## Field Conventions

| Field | Convention |
|-------|-----------|
| Place name | Bilingual when source allows: "太宰府天滿宮 / 太宰府天満宮" |
| Price | Plain text with currency: "¥1,500" or "₩12,000–15,000" or "—" if unknown |
| Hours | "10:00–18:00 (週一休)" — concise, in user's language |
| Priority | `must-visit` / `recommended` / `optional` (lowercase, fixed values) |
| Meal slot | `lunch` / `dinner` / `breakfast` / `snack` (lowercase, fixed values) |
| Party size | `1–2` / `2–4` / `4+` / `any` |
| Google Maps URL | Always `https://www.google.com/maps/search/?api=1&query={URL-encoded name}+{city}` |
| Source URL | Original URL the item was extracted from, when applicable |

---

## What Producers (collector) MUST Provide

For every captured item:
- Type bucket (Attractions / Food / Cafe / etc.)
- Name (bilingual when possible)
- Area / city
- One-line "why this is interesting"
- Source attribution

**Food items** must additionally have: meal slot, party size, solo-friendliness note, Google Maps URL, reservation flag.

---

## What Consumers (trip-planner) Should Do

- Read the captured summary from conversation context — no file load step
- Treat `must-visit` items as locked into the itinerary without re-asking
- Use captured prices/hours/booking URLs verbatim — skip re-research for those fields
- Treat `Reservation: needed: yes` items as Phase 4.5 action items
- Use meal-slot tags to fill day-by-day gaps in Phase 3

---

## What Is Explicitly NOT in the Schema

- ❌ JSON output / file writes / on-disk artefacts
- ❌ Stable IDs (`r1`, `t1`, `a1`) — not needed since nothing references items by ID
- ❌ Coordinates (lat/lng) — only included when the source already exposes them
- ❌ UI style preferences — collector does not touch styling
- ❌ HTML generation — that's trip-planner Phase 5

If a producer is tempted to add JSON, lat/lng lookups, or persistent IDs, the design has drifted
from the new architecture (summary lives in conversation context, single-file HTML at the end).
Stop and re-read this document.
