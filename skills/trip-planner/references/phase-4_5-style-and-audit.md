# Phase 4.5 — Final Audit

Final quality gate before HTML generation. Two checks: route efficiency and crowd/party-size validation. **No style discussion** — visual style is fixed (shadcn / Vercel / Next.js aesthetic), there is no picker and no restyle offer.

---

## A. Route Efficiency Audit (MANDATORY)

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

## B. Crowd & Party-Size Final Validation

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
