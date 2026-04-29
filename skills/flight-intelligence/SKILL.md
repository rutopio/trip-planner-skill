---
name: flight-intelligence
description: >
  Flight price research and optimal travel date recommendations. Use when the user hasn't booked
  flights yet and wants to know the best time to fly, current prices vs historical averages,
  buy-now-or-wait analysis, or optimal date recommendations based on price + holidays + remote work
  flexibility. Triggers on phrases like "when should I fly", "are flights cheap right now",
  "best time to book flights to X", "flight prices to X", or when the trip-planner skill
  identifies that flights are not yet booked.
---

# Flight Price Intelligence & Optimal Date Recommendation

Provide flight price research and travel timing recommendations. Two sub-flows depending on
whether the user has fixed dates or flexible dates.

## Sub-flow A: Dates are flexible ("Haven't decided when to go yet")

If the user hasn't picked dates yet, you become a **travel timing advisor**. Research and
recommend the optimal travel window by cross-referencing THREE factors:

**Factor 1: Flight price seasonality**
Use `WebSearch` to research historical flight prices for the route:
- Search: `"{origin} to {destination} flight price trends"`, `"Google Flights {origin} {destination} cheapest month"`
- Search: `"{origin} {destination} flight tickets off-season"`, `"cheap flights {destination} which month"`
- Search: `"Skyscanner {origin} to {destination} cheapest month to fly"`
- Look for: lowest price months, shoulder season windows, typical price range per season
- Record: peak season dates & prices, off-peak dates & prices, shoulder season sweet spots

**Factor 2: User's holiday calendar (based on nationality)**
Determine which country's holiday schedule the user follows. This is NOT always the passport
country -- ask explicitly:
- "Which country's holiday schedule do you follow? Taiwan's national holidays? US holidays? Or other?"
- If remote worker: "Do you set your own schedule or follow your company's holidays? What country is your company in?"
- Key holidays to map (examples):
  - Taiwan: Lunar New Year (late Jan/Feb), Tomb Sweeping Day (Apr), Dragon Boat Festival (Jun), Mid-Autumn Festival (Sep), National Day (Oct), New Year's Day
  - Japan: Golden Week (late Apr-May), Obon (mid Aug), Silver Week (Sep), Year-End/New Year
  - US: Memorial Day (May), July 4th, Labor Day (Sep), Thanksgiving (Nov), Christmas
  - China: Lunar New Year, Tomb Sweeping Day, May Day, Dragon Boat Festival, Mid-Autumn Festival, National Day Golden Week
- Identify upcoming **long weekends** (holiday + 1-2 days PTO = 4-5 day trip) and
  **extended holiday** windows where taking 1-2 PTO days bridges to a longer break

**Factor 3: Can the user work remotely?**
If not already answered in digital nomad mode, ask:
- "Can you work remotely while traveling? Or do you have to take time off?"
- If YES (remote OK): trip length is flexible -- recommend longer trips during cheap-flight
  periods since they can work from the destination. Flag: "The cheap flight period happens to be great for a longer trip -- work remotely on weekdays, explore on weekends"
- If NO (must take PTO): optimize for long weekends and extended holidays to minimize PTO usage.
  Show: "Take X days off to get Y days of travel" calculations
- If PARTIAL (e.g., can WFH some days): hybrid approach -- "Take one day off before and after + remote work in between, you can have 9 days off using only 2 PTO days"

**Present the recommendation as a structured comparison:**

> **Best Departure Period Analysis ({origin} -> {destination}):**
>
> | Period | Flight Price Range | Weather/Season | Holiday Pairing | Recommendation |
> |--------|-------------------|----------------|-----------------|----------------|
> | {month A} | NT$X-Y (off-season) | {weather} | {holiday}: Take X days off for Y days | Best |
> | {month B} | NT$X-Y (shoulder) | {weather} | {holiday}: Take X days off for Y days | Good |
> | {month C} | NT$X-Y (peak) | {weather} | Summer/holiday break, crowded | Avoid |
>
> **My Recommendation:** {specific recommendation with reasoning}
>
> **If you can work remotely:** {alternative recommendation}

Use `AskUserQuestion` to let the user pick a time window, then proceed to lock dates.

## Sub-flow B: Dates are fixed but flights not yet booked

If the user has fixed dates, research current and predicted flight prices:

**Research flight prices NOW:**
- Search: `"Google Flights {origin} to {destination} {date range}"`,
  `"{origin} {destination} {month} {year} flight price"`
- Search: `"Skyscanner {origin} {destination} {month}"`, airline websites
- Search for **historical price data**: `"{route} flight price {month} last year"`,
  `"{route} flight ticket last year price"`
- Check multiple airlines: flag LCCs vs full-service price differences
- Check nearby airports: sometimes flying into a different airport saves significant money

**Build a price intelligence report:**
- Current lowest price (today)
- Price range for the past 12 months for the same route/season
- Whether current price is above/below the historical average
- Predicted trend: "prices typically rise/fall X weeks before departure for this route"
- Buy-now-or-wait recommendation with confidence level

**Present as:**

> **Flight Price Analysis ({origin} -> {destination}, {dates}):**
>
> | Metric | Value |
> |--------|-------|
> | Current lowest price | NT$X ({airline}, {source}) |
> | Same period last year | NT$X - NT$Y |
> | Current vs historical average | Higher/Lower by X% ({above/below average}) |
> | Predicted trend | May rise in next 2-4 weeks / Room for further decrease |
> | **Recommendation** | **Buy now / Wait X more weeks / Set price alert** |
>
> **Historical Price Trend (Past 12 Months):**
> ```
> NT$15k |
> NT$12k |              ---
> NT$9k  |    ---       | |    ---
> NT$6k  |---||  ---|---|  |---| |---|  <- Your travel dates
> NT$3k  |---||----|---|------||----|
>        |--+--+--+--+--+--+--+--+--+--+--+--+
>          Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
> ```

This data feeds into the **Booking Tab** as a "Flight Price Intelligence" section in the HTML generator.

---

## Output Schema (when invoked from `trip-planner` Phase 1.5)

When this skill is invoked as part of the trip-planning flow (not as a stand-alone Q&A), it MUST return a structured object that gets written to `trip.json.flightIntel`. The HTML generator's Booking tab reads this verbatim.

```jsonc
"flightIntel": {
  "route": "TPE→PUS",                         // origin→destination IATA
  "researched_at": "2026-04-29T10:00:00+08:00",
  "fixed_dates": true,                        // false = sub-flow A (date recommendation)

  // Sub-flow A output (only when fixed_dates=false)
  "date_recommendations": [
    {
      "period": "2026-03-15 to 2026-03-22",
      "season": "shoulder",
      "price_range": { "low": 9000, "high": 12000, "currency": "TWD" },
      "weather": "early spring, mild",
      "holiday_pairing": "Take 2 days off → 9-day trip with Tomb Sweeping",
      "verdict": "best",                      // best | good | avoid
      "rationale": "Cheapest flights + long weekend bridge"
    }
  ],

  // Sub-flow B output (only when fixed_dates=true)
  "current_price": {
    "amount": 9800,
    "currency": "TWD",
    "airline": "Tigerair",
    "source_url": "https://...",
    "captured_at": "2026-04-29T10:00:00+08:00"
  },
  "historical": {
    "same_period_last_year": { "low": 8500, "high": 11200, "currency": "TWD" },
    "vs_historical_avg_pct": -8,              // negative = below avg = cheaper
    "data_points": 12                         // months of history examined
  },
  "verdict": {
    "recommendation": "buy-now",              // buy-now | wait | watch
    "confidence": "high",                     // high | medium | low
    "reasoning": "Currently 8% below 12-month avg; LCCs typically increase 4 weeks before departure",
    "wait_until": null                        // ISO date if recommendation = "wait"
  },
  "alternatives": [
    {
      "airline": "China Airlines",
      "price": 11500,
      "tradeoff": "+NT$1,700, full-service with checked bag included"
    }
  ],
  "checkin_window": "48hr–1hr before departure",
  "checkin_url": "https://booking.tigerairtw.com/Web-Checkin"
}
```

**Required fields per sub-flow:**
- Sub-flow A (flexible dates): `route`, `researched_at`, `fixed_dates: false`, `date_recommendations[]` (≥3 entries).
- Sub-flow B (fixed dates): `route`, `researched_at`, `fixed_dates: true`, `current_price`, `historical`, `verdict`.

**Caller integration (trip-planner Phase 1.5):**
```
1. Run flight-intelligence with logistics from Phase 1.
2. Receive the flightIntel object above.
3. Write it to trip.json: trip.flightIntel = result
4. Update _progress.completed_phase = 1.5
5. Continue to Phase 2.
```

**The HTML generator (Booking tab Flight Card)** reads `trip.flightIntel.verdict` and renders the green/yellow/red verdict badge inline. It reads `current_price`, `historical`, `alternatives` for the comparison section.

**Skip Phase 1.5 entirely if `logistics.flights.status === "booked"`** — flights already purchased; intelligence is moot. Surface the booked flight in `booking.purchased[]` instead.
