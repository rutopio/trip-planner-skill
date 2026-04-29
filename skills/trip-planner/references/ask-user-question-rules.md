# AskUserQuestion Hard Rules (SCHEMA LIMITS)

`AskUserQuestion` validates strictly. Any violation fails immediately with `Invalid tool parameters`. Self-check before every call.

## Schema Limits

| Rule | Limit |
|------|-------|
| Questions per call | 1–4 |
| Options per question | **2–4 (fewer than 2 or more than 4 fails)** |
| `header` length | ≤ 12 chars (CJK chars count as 1 each, still keep it short) |
| Required fields | `question` / `header` / `options` / `multiSelect` — none may be omitted |
| Each option requires | `label` + `description` |
| "Other" option | **Do not add it manually** — the system appends it automatically |
| `preview` field | Single-select only; not allowed when `multiSelect: true` |

## When You Have More Than 4 Choices

1. **Paginate across multiple calls** — e.g. 12 interests → 3 rounds of 4. Before each round, tell the user "pick from this set, more on the next page", then issue the next call. Preferred approach.
2. **Switch to a markdown list + free-text reply** — when the choices don't divide cleanly (e.g. a 7-row budget table, an N-folder list where N is unknown), render a markdown list and ask the user to reply in free text. Do NOT use `AskUserQuestion`.
3. **Never add a "see more" / "next page" entry as a 5th option** — it still exceeds the limit and fails.

## Wrong Tool For The Job

- Multi-field / multi-row table input (budget breakdown, itinerary details) → markdown table + free text
- Unknown-cardinality lists (folder scans, search results) → if count > 4, fall back to markdown + free text
- Final approval gates where the user may want to type freely → free text (e.g. Phase 4.5 final confirmation)
