# Phase 4.5 — UI Style + Final Audit

Two parallel sub-phases before Phase 5 (HTML generation):

1. **Pick UI style**
2. **Run mandatory route efficiency audit**

---

## A. UI Style Selection

Invoke the `ui-style` skill. The 30 design references live in that skill's `references/` directory.

**Present with `AskUserQuestion`** — recommend 4–5 styles fitting a travel guide + "Other" for full catalog:

```
question: "What style do you want for the HTML?"
options:
  - label: "Swiss Minimalist (current default)"
    description: "Clean grid, red accents, zero rounded corners, Notion/Linear aesthetic"
  - label: "Luxury Editorial"
    description: "High-end magazine feel, gold accents, serif fonts, grayscale photos"
  - label: "Botanical / Organic"
    description: "Nature-inspired, sage green + terracotta, rounded shapes, paper texture"
  - label: "Newsprint"
    description: "Newspaper layout, multi-column, drop caps, vintage print feel"
multiSelect: false
```

**After selection:**
1. Read the corresponding reference from `ui-style` skill's `references/`
2. Extract palette, typography, border radius, shadows, signature elements
3. Replace default design tokens in Phase 5 generation
4. Adapt layout to match the style's component patterns and anti-patterns

**Style adaptation rules:**
- **Layout structure** (sidebar + tabs + sections) stays the same regardless of style
- Only **visual treatment** changes: colors, fonts, radius, shadows, spacing, hover effects
- Respect **anti-patterns** (e.g., "no rounded corners" → don't use them)
- Apply **signature elements** — what makes the style distinctive
- The reference file is authoritative — read it fully before generating

**If user says "use default" or doesn't care:**
- Use the existing Swiss Minimalist / Notion-like system in the layout blueprint
- Black/white/gray, system fonts, inverted black stats bar, minimal shadows, 24px radius cards. The DEFAULT.

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
