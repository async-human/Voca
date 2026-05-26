---
name: vokal-rich-output
description: Extract transcript-only financial metrics into grouped sections and metric_section UI blocks. Use when the clean transcript contains numbers, currency, percentages, fiscal years (FY24), or words like revenue, profit, margin, million, billion.
---

# Vokal rich output

Product skill for the Vokal API pipeline when generating outputs with spoken numbers (reports, emails with metrics, etc.).

## When to Use

- After `clean_transcript` is available and the recording likely contains metrics.
- Do **not** run full extraction when the transcript has no digits, currency, %, or fiscal-year language (pipeline skips via `skill_applies`).
- **Source of truth** is always the **clean transcript** — never polished `output_text` alone for numbers.

## Core rules

1. **Never invent** a figure, fiscal year, percentage, or date not clearly stated in the transcript.
2. **Never duplicate** the same metric in conflicting values (e.g. FY26 as $2.03M and $5B).
3. **Group metrics by category** — separate `metric_section` blocks per category (revenue vs profit, etc.).
4. **Max 2 decimal places** on all numeric displays and chart values.

## Extraction schema

Return JSON with grouped `sections[]`. Each section has `category`, `title`, and `metrics[]`.

Each metric must include:

| Field | Rule |
|--------|------|
| `fiscal_year` | Four-digit year when spoken (`2024` for "FY24"); `null` only if no year for that number |
| `label` | `FY{yy} {Category}` e.g. `FY24 Revenue` — not a sentence fragment |
| `value_display` | Human-readable, max 2 decimals (`$15M`, `$2.04B`, `73%`) |
| `numeric_value` | Chart scale: millions use `M` base (15 = $15M), billions use `B` base |
| `unit` | `M`, `B`, `%`, or `count` |
| `source_quote` | Verbatim substring from transcript proving this metric |

### Categories (one section per category)

`revenue` · `profit` · `cost` · `rate` · `headcount` · `timeline` · `other` (only if nothing else fits)

Also return `critical_non_numeric`: risks, decisions, deadlines without numbers.

Full JSON examples: `references/schema-examples.md` (loaded only when this skill is invoked).

## UI blocks (`output_meta.blocks`)

Build in order:

1. `heading` + `paragraph` — narrative from polished text; **no new numbers**
2. One `metric_section` per section that has metrics (`title`, `category`, `items`, optional `chart`)
3. `callout` — one per critical non-numeric point
4. Plain `output_text` must not introduce numbers absent from the transcript

Runtime block assembly is implemented in `api/app/services/output_blocks.py` (validates `source_quote` against transcript).

## Validation checklist

- [ ] Every `numeric_value` has a `source_quote` in the transcript
- [ ] Revenue and profit are in separate `metric_section` blocks
- [ ] Chart only includes metrics with a fiscal year (no P1/P2 placeholders)
- [ ] All numbers rounded to 2 decimal places max
