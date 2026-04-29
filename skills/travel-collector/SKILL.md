---
name: travel-collector
description: >
  Parses unstructured travel material the user drops in — URLs, screenshots, blog posts, social
  media links, friend recommendations, hotel/flight confirmations, Google Maps links — and turns
  it into a clean structured summary that the trip-planner skill can consume directly in the
  same conversation. Use this skill whenever the user shares a link, image, or note that's
  travel-related and seems to want it captured for planning. Trigger phrases: "save this",
  "I found this place", "check this out", "add this to my trip", or just dropping a URL/screenshot
  while a trip is being planned. Especially useful before Phase 1 of trip-planner so the upfront
  attraction list doesn't have to be built from scratch.
---

# Travel Collector

Parse whatever the user drops — links, screenshots, text — and extract the travel-relevant bits.
Then **return the structured summary inline in the conversation**. No file is written. The
trip-planner skill picks up the summary from conversation context in its later phases.

> **This skill writes nothing to disk.** It produces a markdown summary that lives in the
> conversation. The output schema is described in [references/output-schema.md](references/output-schema.md).

---

## When To Use

- User pastes a URL (Klook, KKday, Tabelog, Naver, blog post, Google Maps link, IG/TikTok)
- User drops a screenshot of a place, menu, map, or social post
- User says "my friend recommended these" + a list
- User pastes a hotel or flight booking confirmation
- Any travel content arriving outside of an active Phase 1 dialogue

If the user is already mid-Phase-1 and just types text answers, that's the trip-planner's job.
This skill is for *unstructured material that needs parsing first*.

---

## How It Works

1. **Receive** — user provides URL / screenshot / text
2. **Fetch & extract** — `WebFetch` for URLs, vision for screenshots, parse text directly
3. **Classify** — bucket each item: attraction / food / accommodation / transport / tip / pass
4. **Summarise** — emit a markdown summary in the user's language (see "Output Format" below)
5. **Hand off** — tell the user the items are captured for planning; if a Phase 1 conversation
   is starting, trip-planner will read this summary from context

---

## Input Handling

### URLs
Use `WebFetch` for the page. Extract every place/item mentioned (a "Top 10 cafes" post → 10 items).
Capture: name (bilingual when possible), location, price, hours, why-recommended, source URL.

For specific source types:
- **Google Maps link** — extract place name, address, coordinates if visible, rating
- **Klook / KKday product page** — product name, price, included items, booking URL
- **Tabelog / Naver Map** — restaurant name, cuisine, price range, signature dishes
- **Blog post / listicle** — pull every place mentioned, not just the first
- **IG / TikTok / YouTube** — place names, locations, tips from caption + visible text
- **Hotel listing** — name, area, price/night, check-in/out, amenities
- **Flight / hotel confirmation** — carrier/property, dates, price, booking ref

### Screenshots
Read the image. Extract: text, place names, prices, addresses, hours, menu items, map markers.
Treat map screenshots as a list of all visible labels in the area.

### Text Notes
Parse for place names, recommendations, prices, recommender attribution
("小明推薦的", "must-go from my friend"). Handle bilingual input (zh/ja/ko/en mixed).

---

## Output Format (markdown summary, user's language)

Emit a markdown block the user can read at a glance and trip-planner can consume from context.
**Do not write to a file.** Bilingual place names when source allows.

Section heading is in the user's conversation language. Example skeleton (replace headings with the user's language):

```
## Captured Items

**Source:** {url or "screenshot" or "user note"}
**Destination(s):** {city / region}
**Items captured:** {n}

### Attractions
- **{name} / {name_local}** — {area}. {one-line why}.
  Price: {price or "—"} · Hours: {hours or "—"} · Priority: {must-visit | recommended | optional}
  {google maps url}
  {source url if applicable}

### Food
- **{name} / {name_local}** — {cuisine}, {area}. {why}.
  Price: {range} · Meal slot: {lunch | dinner | breakfast | snack} · Party size: {1–2 | 2–4 | 4+ | any}
  Reservation needed: {yes/no — if yes, flag it}
  Signature dishes: {list with prices if available}
  {google maps url}

### Cafes / Shopping / Activities / Nightlife
{same shape}

### Accommodations
- **{name}** — {area}. {type}. {price/night}. Check-in/out: {times}. Booked: {yes/no}.

### Transport
- **{route}** — {carrier}, {departure → arrival}, {price}. Status: {confirmed | researching | option}.

### Tips
- {tip text} — applies to {city or "general"}. Source: {url}.

### Passes & Deals
- **{name}** — covers {list}. Validity: {duration}. Price: {amount}. Worth-it note: {analysis}.
```

After the summary, end with one short sentence in the user's language. English template:

> "All captured. trip-planner will pick up from here when you're ready to plan."

---

## Classification Rules

### Type buckets
`attraction` · `food` · `cafe` · `accommodation` · `transport` · `shopping` · `tip` · `activity` · `nightlife` · `pass`

### Priority
- **must-visit** — user said "必去" / "must" / "don't miss", or source rates it top-tier
- **recommended** — featured prominently, high ratings, mentioned multiple times
- **optional** — listed as alternative, "if you have time", lower ratings

### Mandatory enrichment for food/cafe items
- **Meal slot** — lunch / dinner / breakfast / snack
- **Google Maps URL** — `https://www.google.com/maps/search/?api=1&query={name}+{city}`
- **Party size fit** — 1–2 / 2–4 / 4+ / any
- **Solo-friendliness** — true if counter seats / fast-casual / cafe / ramen; false if group-only / sharing-only
- **Signature dishes** — pull from source if listed; bilingual name + price if shown
- **Reservation flag** — set true if source contains a reservation-required phrase in any language ("要預約" / "予約推奨" / "예약 필수" / "reservation recommended" / "booking required") or if it's high-end with limited seats. **When flagged, ask the user inline in their language**, e.g. English: "{name} needs a reservation. Already booked? What time and party size?"

---

## Language Handling

- Reply in the user's conversation language
- Bilingual place names whenever the source provides them (e.g., "太宰府天滿宮 / 太宰府天満宮")
- Don't translate signature dish names — keep originals + the user's language

---

## Edge Cases

- **Duplicate detection** — if the user has already shared the same place earlier in the
  conversation, mention it briefly in their language (e.g. "{name} was already captured earlier — merging the new info") and merge rather than re-listing identically.
- **Multiple destinations** — group by city/region in the summary headings.
- **Ambiguous source** — if you can't tell which trip the input belongs to, ask once before
  parsing.
- **Non-travel content** — say so politely and don't force a parse.
- **Partial info** — capture what's available, leave fields as "—" if unknown. A place with
  just "my friend said it's good" is still worth keeping.

---

## Hand-off to trip-planner

When the user starts trip-planner Phase 1 after a collector run, the planner reads the
summary from conversation context and uses it as the seed list. It should:

1. Treat `must-visit` items as locked-in — include them without re-asking
2. Use captured prices/hours instead of re-searching
3. Use captured booking URLs verbatim — they're already verified
4. Treat `reservation needed: yes` items as Phase 4.5 action items
5. Use meal-slot tags to fill schedule gaps in Phase 3

The collector summary is in conversation context, so no file read is required.

---

## What This Skill Does NOT Do

- ❌ **Write JSON files** (no `*-research.json`, no disk artefacts)
- ❌ **Geocode addresses** (lat/lng only when the source already exposes them)
- ❌ **Pick UI styles** (visual style is fixed by trip-planner Phase 5)
- ❌ **Generate HTML** (that's Phase 5's job)
- ❌ **Check or validate against a schema** (the markdown summary IS the contract)
