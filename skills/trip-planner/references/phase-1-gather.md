# Phase 1 — Gather Trip Details

## Pre-Phase: Language & Nationality

### Language Matching
**Respond in whatever language the user opens with.** Maintain it through every phase, every question, every summary, and the final HTML output (tab labels, headings, all UI text).

- Traditional Chinese → respond entirely in Traditional Chinese
- Simplified Chinese → respond in Simplified Chinese
- Japanese → Japanese; Korean → Korean
- Mixed → mirror the dominant language

### Nationality Inference (then confirm via passport question)
| Language | Inferred nationality | Default currency | Holiday calendar |
|----------|---------------------|------------------|-----------------|
| Traditional Chinese | Taiwanese | TWD | TW: Lunar New Year, Qingming, Dragon Boat, Mid-Autumn, 10/10 |
| Simplified Chinese | Mainland Chinese | CNY | CN: Spring Festival, May Day, National Day Golden Week |
| Japanese | Japanese | JPY | JP: Golden Week, Obon, Silver Week, Year-End |
| Korean | South Korean | KRW | KR: Seollal, Chuseok, Children's Day |
| Thai | Thai | THB | Songkran, royal holidays |
| English | Ambiguous | Confirm | Confirm |

Use inferred nationality to pre-set currency display, skip obvious questions, tailor visa advice, and pre-populate the holiday calendar in the Booking tab. Always confirm via the passport question.

### Vacation Habits — Ask in Round 1
Vacation habits unlock long-weekend optimization and trip-depth logic.

| Field | Ask | Why |
|-------|-----|-----|
| Annual leave | "How many days of annual leave do you have? How many for this trip?" | Whether to extend or minimize PTO |
| Trip frequency | "Do you save up for one big trip, or take frequent shorter trips?" | Big-trip → pack more in; frequent → leave things for next time |
| Date flexibility | "Are dates fixed, or can you shift to land on a long weekend?" | Long-weekend bridging |
| Typical length | "Weekend (2–3d), short trip (4–5d), or longer (1–2w)?" | Pacing & itinerary depth |

---

## Round 1: Basics + What's Already Locked In

Use `AskUserQuestion` and group logically.

| Field | Ask | Why |
|-------|-----|-----|
| Destination | Usually given | Determines everything |
| Trip length | Usually given | Capacity planning |
| Date range | "What are the exact dates?" | Seasonal events, weather, pricing |
| Flights booked? | If YES: airline, flight#, dep/arr times, airport, **round-trip cost**. If NO: "Roughly what arrival time? Morning or evening preferred?" | Day 1 / last day hours + budget |
| Hotel booked? | If YES: name, area, check-in/out, breakfast, nights, **cost**. If NO: "Preferred area to stay?" | Home base + budget |
| Nationality/passport | "What passport?" | Visa + home currency |
| SIM card | "Bought a SIM/eSIM? Cost?" — recommend options if not | Budget + checklist |
| Airport transfer | "Need pickup/drop-off?" — note direction; if no, research transit | Day 1 / last day logistics |
| Already-decided plans | "Any tickets purchased, friends to meet, restaurant reservations, tours, theme park tickets?" — list specific examples | Immovable blocks come first |
| Been here before | If YES: "What did you visit? Want new places or revisits?" | Avoid re-recommending |
| Travel history | "What's your travel style? Recent trips? Favorite past attractions?" — infer preferences from specifics | Tailor recs to proven taste |
| Already own items | "Transit cards (T-money/ICOCA/Suica), Wi-Fi hotspot, adapters?" | Avoid recommending owned items |

**Flights/hotel NOT booked — follow up:**
- Flights: "Any particular flight times in mind?"
- Hotel: ask accommodation preferences first

**Accommodation preferences (before recommending):**
- Type: hotel / Airbnb / hostel? If hostel-OK, explain pros (1/3 price, social, central, modern hostels often have private rooms) vs cons (shared bath, noise, less privacy, luggage security, curfews)
- "Need laundry during the trip?" — affects packing advice
- Per-night budget + 2–3 area suggestions with pros/cons
- **If accommodation not booked yet, plan itinerary FIRST**, then recommend areas/hotels that fit the route

---

## Round 1.5: Flight Price Intelligence

Triggers when flights are NOT booked.

Invoke the `flight-intelligence` skill. Pass origin, destination, fixed/flexible dates. It handles all price research, holiday calendar analysis, PTO optimization, and structured recommendations. Output feeds the Booking Tab "Flight Price Intelligence" section.

---

## Round 2: Budget Deep-Dive

**Do NOT accept vague answers like "moderate" or "mid-range" without drilling down.**

Use `AskUserQuestion` with **concrete numbers specific to the destination**. Research real prices via `WebSearch` first if needed.

> **Budget Confirmation ({destination}, {days} days, {N} people):**
>
> | Item | Budget | Comfort | Premium |
> |------|--------|---------|---------|
> | Flights (round-trip/person) | NT$X-Y | NT$X-Y | NT$X-Y |
> | Accommodation (/night) | NT$X-Y | NT$X-Y | NT$X-Y |
> | Meals (/day/person) | NT$X-Y | NT$X-Y | NT$X-Y |
> | Transportation (/day) | NT$X-Y | NT$X-Y | NT$X-Y |
> | Tickets (/day) | NT$X-Y | NT$X-Y | NT$X-Y |
> | Shopping (whole trip) | NT$X-Y | NT$X-Y | NT$X-Y |
> | **Total per person** | **NT$X-Y** | **NT$X-Y** | **NT$X-Y** |

Let user mix-and-match ("save on accommodation but eat well"). Record choices.

**If flights/hotel already booked**, remove those rows and recompute "remaining budget" for activities + food + shopping + transport only.

**Key questions:**
- "Anything you want to splurge on?"
- "Roughly how much for shopping? Anything specific?"
- "Buying souvenirs? For how many people?"

---

## Round 3: Style & Preferences

| Field | Ask |
|-------|-----|
| Interests | `multiSelect`: Cultural / Nature / Food / Shopping / Nightlife / Art / Family / Outdoor / Photography / Local experiences / Cafe hopping / Markets |
| Pace | Packed (4–5/day) / Balanced (3–4/day) / Slow (2–3/day) |
| Companions | solo / couple / family (kid ages?) / group (count?) |
| Mobility | "20,000 steps/day OK? Or need more rides?" |
| Home currency | Auto-derive from passport. Confirm only if ambiguous. |
| Digital nomad mode? | If YES: (1) hours/day, (2) preferred schedule, (3) **work timezone** ("Taiwan time? US time?"), (4) flexible/fixed |

---

## Smart Defaults
- Home currency derives from **nationality/passport**, not language
- Visa: based on passport
- Trip > 5 days → suggest splitting into regions
- Nomad mode → ask work timezone explicitly. Convert to local. Default 09:00–13:00 in **work TZ** (e.g., work TZ UTC+8 in Tokyo UTC+9 → 10:00–14:00 local)
- Hotel booked → use hotel area as base, skip accommodation research
- Flights booked → use arrival/departure to constrain Day 1 and last day

---

## Phase 1 Confirmation Gate

> **Phase 1 Confirmed:**
> - {destination}, {days} days ({date range})
> - Flights: {details or "TBD"}
> - Accommodation: {details or "TBD, area: {area}"}
> - Budget: {tier + breakdown}
> - Confirmed plans: {fixed items or "None"}
> - Interests: {interests}
> - Pace: {pace}
>
> **Looks right? Reply to confirm, then I'll start recommending attractions.**

Wait for confirmation before Phase 2.
