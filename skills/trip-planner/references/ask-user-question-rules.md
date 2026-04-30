# AskUserQuestion Hard Rules (SCHEMA LIMITS)

`AskUserQuestion` validates strictly. Any violation fails immediately with `Invalid tool parameters`. Self-check before every call.

## Schema Limits

| Rule | Limit |
|------|-------|
| Questions per call | 1–4 |
| Options per question | **2–4 (fewer than 2 or more than 4 fails)** |
| `header` length | ≤ 12 chars (CJK chars count as 1 each, still keep it short) |
| `label` length | **≤ 6 CJK chars OR ≤ 12 ASCII chars** — the terminal clips anything longer and produces garbled characters. Put all extra detail in `description`, never in `label`. |
| Required fields | `question` / `header` / `options` / `multiSelect` — none may be omitted |
| Each option requires | `label` + `description` |
| "Other" option | **Do not add it manually** — the system appends it automatically |
| `preview` field | Single-select only; not allowed when `multiSelect: true` |

## Label vs Description — Critical

The `label` is rendered in a narrow fixed-width column in the terminal. CJK characters each occupy **2 terminal columns**; overflowing labels produce garbled/truncated output.

**Rule: label = shortest possible name. description = everything else.**

```
# CORRECT
label: "嚴島神社"
description: "海上鳥居，漲潮時浮在水面。¥300 / 人，建議傍晚造訪。"

# WRONG — label too long, will garble
label: "嚴島神社 潮水鳥居 + 展望台"
description: "..."
```

For place names longer than 6 CJK characters: use the short common name in `label`, put the full name + detail in `description`.

## When You Have More Than 4 Choices

1. **Paginate across multiple calls** — e.g. 12 interests → 3 rounds of 4. Before each round, tell the user "pick from this set, more on the next page", then issue the next call. There is no upper bound on pages — keep paginating until all choices are covered.
2. **Never add a "see more" / "next page" entry as a 5th option** — it still exceeds the limit and fails.
3. **Never fall back to free text just because there are many choices** — paginate instead.

## The One Legitimate Free-Text Case

- **Phase confirmation gates** — after each phase, the user may want to confirm, ask follow-up questions, or request changes in their own words. These gates must be free text. This is the ONLY exception.

## Wrong Tool For The Job

- Budget breakdown → ask per-category with 3 options (Budget / Comfort / Premium) each via `AskUserQuestion`
- Long attraction lists (must-go selection) → paginate in rounds of ≤ 4, no free-text fallback
- Route tweak questions → offer structured options (e.g. "pace OK / too packed / too loose") via `AskUserQuestion`
- Transit pass adoption → `AskUserQuestion` with 2–3 options
- Any question where the answer is one of a finite set → `AskUserQuestion`, always
