# Phase 4.5 — Final Audit (UI style is deferred to post-generation)

Phase 4.5 used to ask the user to pick a UI style here. **It no longer does.** Asking for a style before the user can see what the trip looks like is decision fatigue — the user has just spent ~15 minutes on logistics, attractions, routes, and deep research; another design question right before generation slows everything down without helping them choose well.

**New flow: ship Swiss Minimalist by default, offer restyle after they see it.**

---

## A. UI Style — Use the Default, Skip the Question

**Do NOT invoke the `ui-style` skill at this phase. Do NOT ask the user about styles.** Phase 5 generates with the Swiss Minimalist design tokens already baked into [trip-html-generator/references/layout-blueprint.md §Design Tokens](../../trip-html-generator/references/layout-blueprint.md).

Swiss Minimalist (the default):
- Clean grid, generous whitespace
- Red accent (`#DC2626`)
- **Zero rounded corners** (`--r: 0px`)
- Notion/Linear aesthetic
- Pairs well with calendar/itinerary information density

After Phase 5 completes successfully and the user has reviewed the live HTML (running `python3 serve.py`), THEN offer a restyle:

> "The trip is generated and live at `http://localhost:8765`. The current style is **Swiss Minimalist** (the default — clean grid, red accents, no rounded corners). Want to keep this style, or try a different one? I can apply Luxury Editorial, Botanical, Newsprint, Professional Serif, Academia, Organic, or Monochrome — all designed to work with travel itineraries."

If the user picks a different style, it's a Phase-5-step-D rerun (style.css only) — not a full regeneration. Hand off to `ui-style` skill at that point. Trip data stays intact.

**Override rule:** if the user volunteers a preference earlier in the conversation ("I want it to look like a magazine", "make it dark", "Newsprint please"), respect it — apply that style at Phase 5 generation instead of the Swiss default. But do NOT proactively ask.

---

## B. Route Efficiency Audit (MANDATORY)

Comprehensive audit using POI coordinates. **Mandatory quality gate** — generated itinerary must be geographically optimized.

**Process:**
1. For each day, list events with lat/lng
2. Calculate straight-line distances between consecutive events
3. Identify zigzag patterns (east→west→east) wasting travel time
4. Score each day: efficient / has issues / has suggestions

**Present:**
```
Route Efficiency Analysis:

Day 1 — Smooth (one-directional)
Day 2 — Haeundae→Seomyeon→Cheongsapo V-shaped backtrack (+18km)
Suggestion: Move Seomyeon Crashop to Day 4 (already has Seomyeon cold noodles); Day 2 becomes straight coastal route

Pre-opt avg daily: X km
Post-opt avg daily: Y km (save Z%)
```

**Rules:**
- Fixed items (tours, flights, check-in/out) cannot move
- Work days: only evening events movable
- Sunset/night events stay evening
- Present as **suggestions** — user decides
- After confirm, apply optimizations to final itinerary

**This audit runs every time a trip is generated or modified.** Not optional.

---

## C. Crowd & Party-Size Final Validation

After geographic audit, also validate:

**Crowd check:**
- For each day, count events within their `crowd.peak_hours`
- Flag days with 2+ peak events: "Day 3 has 3 attractions all at peak — time-shift or swap with off-peak days"
- Verify weekend/holiday assignments — popular attractions should be weekdays when possible

**Restaurant party-size check:**
- Scan food events, verify `dining.party_size` matches user's `companions`
- Flag mismatches: "Day 5 dinner at {restaurant} only seats 8 at counter — group of 5 will wait 30+ min. Consider {alternative} (tables for groups)."
- Solo travelers shouldn't be scheduled at sharing-required restaurants without alternatives

---

## Final Confirmation Gate (Before Phase 5)

Present a final confirmation summary:

> **Itinerary Confirmation Overview:**
> - Destination: {destination}, {days} days ({date range})
> - Budget: ~{range} (excluding flights & hotels)
> - Selected: {count} attractions across {areas} areas
> - Daily plan: [brief per-day summary]
> - Confirmed items: {fixed — flights, hotels, pre-booked tickets}
>
> **If everything looks good, reply "OK" or "Generate" and I'll start creating the interactive HTML travel guide.**

**Do NOT use `AskUserQuestion` for this final confirmation** — let user type freely. Wait for next message. User can type "OK", "Generate", ask questions, or request changes without being blocked by a button UI. This is the one confirmation that MUST be free-text.

**Red flags that you're skipping ahead:**
- Haven't used `AskUserQuestion` for attractions → back to Phase 2
- Haven't shown day-by-day route → back to Phase 3
- User hasn't confirmed budget → back to Phase 1
- Generating HTML "to show what it looks like" → NO, finish dialogue first
