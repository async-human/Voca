# Vokal rich output — structured facts & blocks

Product skill used by the Vokal API pipeline when generating outputs with numbers (reports, emails with metrics, etc.).

## Core rules

1. **Source of truth** is the **clean transcript** from the voice recording — never the polished `output_text` alone for extracting numbers.
2. **Never invent** a figure, fiscal year, percentage, or date not clearly stated in the transcript.
3. **Never duplicate** the same metric in conflicting values (e.g. FY26 as $2.03M and $5B).
4. **Group metrics by category** — do not dump all KPI cards into one grid.

## Extraction output schema

Return JSON with grouped sections:

```json
{
  "sections": [
    {
      "category": "revenue",
      "title": "Revenue",
      "metrics": [
        {
          "fiscal_year": "2024",
          "label": "FY24 Revenue",
          "value_display": "$15M",
          "numeric_value": 15,
          "unit": "M",
          "source_quote": "exact short phrase from transcript"
        }
      ]
    },
    {
      "category": "profit",
      "title": "Profit",
      "metrics": []
    }
  ],
  "critical_non_numeric": ["risks, decisions, deadlines without numbers"]
}
```

### Categories (use exactly one per section)

- `revenue` — sales, turnover, top-line
- `profit` — margin, net income, earnings, bottom-line
- `cost` — expenses, spend, burn
- `rate` — growth %, conversion, ratios
- `headcount` — team size, hires
- `timeline` — dates, deadlines (non-dollar)
- `other` — only if it does not fit above

### Metric rules

- **fiscal_year**: four-digit year (`2024`) when spoken ("FY24", "fiscal year 2024", "in 2025"). Use `null` only if no year was said for that specific number.
- **label**: `FY{yy} {Category}` e.g. `FY24 Revenue` — never a sentence fragment.
- **value_display**: human-readable, max 2 decimals (`$15M`, `$2.04B`, `73%`).
- **numeric_value**: chart-scale number; millions use `M` base (15 = $15M), billions use `B` base (2.04 = $2.04B).
- **unit**: `M`, `B`, `%`, or `count`.
- **source_quote**: verbatim substring from transcript proving this metric.

## UI block schema (output_meta.blocks)

Build blocks in this order:

1. `heading` + `paragraph` — executive summary / narrative (from polished text, no new numbers).
2. For **each section** with metrics, emit a `metric_section` block:

```json
{
  "type": "metric_section",
  "title": "Revenue",
  "category": "revenue",
  "items": [{ "label": "FY24 Revenue", "value": "$15M", "hint": "2024" }],
  "chart": {
    "title": "Revenue trend",
    "unit": "M",
    "items": [{ "label": "FY24", "value": 15 }, { "label": "FY25", "value": 25 }]
  }
}
```

3. `callout` — one per critical non-numeric point (risks, recommendations).
4. `output_text` — full plain-text copy; must not introduce numbers absent from transcript.

## Validation checklist

Before returning blocks:

- [ ] Every `numeric_value` has a `source_quote` in the transcript
- [ ] No metric appears in two sections unless transcript explicitly ties it to both
- [ ] Profit and revenue are in separate `metric_section` blocks
- [ ] Chart only includes metrics with a fiscal year (no P1/P2/P3 placeholders)
- [ ] All numbers rounded to 2 decimal places max
