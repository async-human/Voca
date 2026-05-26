# Schema examples (appendix)

Referenced from the pipeline when building the structured-facts prompt. Not loaded at API startup.

## Extraction JSON

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

## metric_section block

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
