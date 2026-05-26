"""Extract factual data from transcripts and build rich mixed-media output blocks."""

from __future__ import annotations

import re
from typing import Any


def _round2(n: float) -> float:
    return round(n + 1e-9, 2)


def _is_year(n: float) -> bool:
    return n == int(n) and 1900 <= int(n) <= 2100


def _format_display_value(n: float, unit: str = "") -> str:
    n = _round2(n)
    u = (unit or "").lower()
    if u in ("%", "percent"):
        return f"{n:.2f}".rstrip("0").rstrip(".") + "%"
    if u in ("m", "million", "usd_m", ""):
        if n >= 1000:
            return f"${_round2(n / 1000):.2f}".rstrip("0").rstrip(".") + "B"
        s = f"{n:.2f}".rstrip("0").rstrip(".")
        return f"${s}M"
    if u in ("b", "billion"):
        return f"${n:.2f}".rstrip("0").rstrip(".") + "B"
    if u in ("k", "thousand"):
        return f"${_round2(n * 1000):.2f}".rstrip("0").rstrip(".") + "K"
    s = f"{n:.2f}".rstrip("0").rstrip(".")
    return f"${s}" if "$" not in unit else s


def _parse_amount(raw: str, suffix: str = "") -> tuple[float, str]:
    try:
        n = float(raw.replace(",", ""))
    except ValueError:
        return 0.0, ""
    if _is_year(n):
        return 0.0, ""

    s = (suffix or "").lower().rstrip(".")
    if s in ("b", "billion"):
        return _round2(n * 1000), "million"
    if s in ("m", "million"):
        return _round2(n), "million"
    if s in ("k", "thousand"):
        return _round2(n / 1000), "million"
    if s in ("%", "percent"):
        return _round2(n), "percent"
    # Bare number: only treat as millions if reasonably sized
    if n > 0 and n < 500:
        return _round2(n), "million"
    return 0.0, ""


_AMOUNT_RE = re.compile(
    r"\$\s*([\d]{1,4}(?:,\d{3})*(?:\.\d{1,2})?)\s*(million|billion|thousand|M|B|K|%)?"
    r"|([\d]{1,4}(?:,\d{3})*(?:\.\d{1,2})?)\s+(million|billion|thousand)\b",
    re.I,
)
_YEAR_RE = re.compile(
    r"(?:FY\s*['']?|fiscal\s+year\s*)(\d{2,4})\b|(?:in\s+|for\s+|during\s+)(\d{4})\b",
    re.I,
)


def extract_facts_from_transcript(text: str) -> dict[str, Any]:
    """Pair fiscal years with amounts; capture every metric mentioned."""
    facts: list[dict] = []
    seen: set[str] = set()
    highlights: list[str] = []

    sentences = re.split(r"(?<=[.!?])\s+|\n+", text or "")
    for sent in sentences:
        s = sent.strip()
        if len(s) < 8:
            continue

        years: list[str] = []
        for m in _YEAR_RE.finditer(s):
            y = m.group(1) or m.group(2)
            if y and len(y) >= 2:
                label = y if len(y) == 4 else f"20{y}"
                if 1900 <= int(label) <= 2100:
                    years.append(label[-2:] if len(label) == 4 else label)

        amounts: list[tuple[float, str, str]] = []
        for m in _AMOUNT_RE.finditer(s):
            raw = m.group(1) or m.group(3)
            suf = m.group(2) or m.group(4) or ""
            val, unit = _parse_amount(raw, suf)
            if val > 0:
                amounts.append((val, unit, _format_display_value(val, unit)))

        category = "metric"
        if re.search(r"revenue|sales|turnover", s, re.I):
            category = "revenue"
        elif re.search(r"profit|margin|net income|earnings", s, re.I):
            category = "profit"
        elif re.search(r"cost|expense|spend", s, re.I):
            category = "cost"
        elif re.search(r"%|percent|growth|rate", s, re.I) and amounts:
            category = "rate"

        if amounts:
            if years and len(years) == len(amounts):
                pairs = zip(years, amounts)
            elif years:
                pairs = [(years[min(i, len(years) - 1)], amounts[i]) for i in range(len(amounts))]
            else:
                pairs = [(f"P{i + 1}", amounts[i]) for i in range(len(amounts))]

            for yr, (val, unit, display) in pairs:
                fy = yr if yr.startswith("P") else f"FY{yr}"
                cat_label = category.replace("_", " ").title()
                label = f"{fy} {cat_label}" if not yr.startswith("P") else f"{cat_label} ({yr})"
                key = f"{label}|{display}"
                if key in seen:
                    continue
                seen.add(key)
                facts.append({
                    "category": category,
                    "fiscal_year": None if yr.startswith("P") else f"20{yr}" if len(yr) == 2 else yr,
                    "label": label,
                    "value": display,
                    "numeric_value": val,
                    "unit": unit,
                })
        elif re.search(
            r"risk|recommend|decision|launch|deadline|blocker|concern|plan|strategy",
            s,
            re.I,
        ):
            if len(s) > 24 and len(highlights) < 8:
                highlights.append(s[:280])

    return {"facts": facts, "highlights": highlights}


def _has_visuals(blocks: list[dict]) -> bool:
    for b in blocks:
        if b.get("type") == "kpi_grid" and b.get("items"):
            return True
        if b.get("type") == "bar_chart" and len(b.get("items") or []) >= 2:
            return True
    return False


def normalize_blocks(raw: Any) -> list[dict]:
    if not isinstance(raw, list):
        return []

    out: list[dict] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        kind = str(item.get("type") or item.get("kind") or "").lower().replace("-", "_")

        if kind in ("heading", "title", "section_title"):
            text = str(item.get("text") or item.get("title") or item.get("heading") or "").strip()
            if text:
                out.append({"type": "heading", "text": text})
        elif kind in ("paragraph", "text", "body"):
            text = str(item.get("text") or item.get("content") or item.get("body") or "").strip()
            if text:
                out.append({"type": "paragraph", "text": text})
        elif kind in ("kpi_grid", "kpi", "kpis", "kpi_row", "metrics"):
            rows = item.get("items") or item.get("kpis") or item.get("metrics") or item.get("cards")
            if not isinstance(rows, list):
                continue
            kpis = []
            for row in rows:
                if not isinstance(row, dict):
                    continue
                label = str(row.get("label") or row.get("name") or row.get("title") or "").strip()
                value = str(row.get("value") or row.get("amount") or row.get("metric") or "").strip()
                if len(label) > 48:
                    label = label[:45] + "…"
                if label and value:
                    entry = {"label": label, "value": value}
                    hint = row.get("hint") or row.get("year") or row.get("fiscal_year")
                    if hint:
                        entry["hint"] = str(hint)
                    kpis.append(entry)
            if kpis:
                out.append({"type": "kpi_grid", "items": kpis[:8]})
        elif kind in ("bar_chart", "chart", "bar", "graph"):
            rows = item.get("items") or item.get("data") or item.get("series") or item.get("bars")
            if not isinstance(rows, list):
                continue
            bars = []
            for row in rows:
                if not isinstance(row, dict):
                    continue
                label = str(row.get("label") or row.get("name") or row.get("year") or "").strip()
                val = row.get("value", row.get("amount", row.get("y")))
                if isinstance(val, (int, float)):
                    num = _round2(float(val))
                else:
                    num, _ = _parse_amount(re.sub(r"[$,%]", "", str(val)), "")
                if _is_year(num) or num <= 0 or num > 10_000:
                    continue
                if label and num > 0:
                    bars.append({"label": label, "value": num})
            if len(bars) >= 2:
                block: dict = {"type": "bar_chart", "items": bars}
                if item.get("title"):
                    block["title"] = str(item["title"])
                if item.get("unit"):
                    block["unit"] = str(item["unit"])
                else:
                    block["unit"] = "M"
                out.append(block)
        elif kind in ("callout", "note", "insight", "risk"):
            body = str(item.get("body") or item.get("text") or item.get("content") or "").strip()
            if body:
                out.append(
                    {
                        "type": "callout",
                        "title": str(item.get("title") or item.get("label") or "Note"),
                        "body": body,
                        "variant": "risk" if kind == "risk" else "insight" if kind == "insight" else "default",
                    }
                )
    return out


def build_blocks_from_facts(
    extracted: dict[str, Any],
    output_text: str,
    output_format: str,
) -> list[dict]:
    blocks: list[dict] = []
    facts: list[dict] = extracted.get("facts") or []

    if facts:
        blocks.append({
            "type": "kpi_grid",
            "items": [
                {
                    "label": f["label"],
                    "value": f["value"],
                    **({"hint": f["fiscal_year"]} if f.get("fiscal_year") else {}),
                }
                for f in facts[:8]
            ],
        })

        by_cat: dict[str, list[dict]] = {}
        for f in facts:
            cat = f.get("category") or "metric"
            fy = f.get("fiscal_year")
            if not fy:
                continue
            fy_str = str(fy)
            label = f"FY{fy_str[-2:]}" if len(fy_str) >= 2 else fy_str
            by_cat.setdefault(cat, []).append({
                "label": label,
                "value": _round2(float(f.get("numeric_value") or 0)),
            })

        for cat, items in by_cat.items():
            if len(items) >= 2:
                dedup: dict[str, dict] = {}
                for it in items:
                    dedup[it["label"]] = it
                sorted_items = sorted(dedup.values(), key=lambda x: x["label"])
                blocks.append({
                    "type": "bar_chart",
                    "title": f"{cat.title()} trend",
                    "unit": "M",
                    "items": sorted_items,
                })

    for point in (extracted.get("highlights") or [])[:3]:
        blocks.append({
            "type": "callout",
            "title": "Key point",
            "body": point,
            "variant": "insight",
        })

    if output_text:
        paras = [p.strip() for p in re.split(r"\n\s*\n", output_text) if len(p.strip()) > 40]
        if paras and output_format == "report":
            if not any(b.get("type") == "heading" for b in blocks):
                blocks.insert(0, {"type": "heading", "text": "Executive summary"})
            if not any(b.get("type") == "paragraph" for b in blocks):
                blocks.insert(1, {"type": "paragraph", "text": paras[0][:1200]})
        elif paras and output_format != "report" and not any(b.get("type") == "paragraph" for b in blocks):
            blocks.append({"type": "paragraph", "text": paras[0][:800]})

    return blocks


def merge_blocks(primary: list[dict], factual: list[dict]) -> list[dict]:
    """Prefer factual KPI/charts; keep LLM prose/callouts."""
    merged: list[dict] = []
    for b in factual:
        if b.get("type") in ("kpi_grid", "bar_chart"):
            merged.append(b)

    for b in primary:
        if b.get("type") in ("heading", "paragraph", "callout"):
            merged.append(b)

    if not any(b.get("type") == "kpi_grid" for b in merged):
        for b in primary:
            if b.get("type") == "kpi_grid":
                merged.insert(0, b)
                break

    if not any(b.get("type") == "bar_chart" for b in merged):
        for b in primary:
            if b.get("type") == "bar_chart":
                merged.append(b)

    return merged


def _merge_llm_facts(extracted: dict[str, Any], llm: dict[str, Any] | None) -> dict[str, Any]:
    if not llm:
        return extracted
    facts = list(extracted.get("facts") or [])
    seen = {f"{f.get('label')}|{f.get('value')}" for f in facts}
    for row in llm.get("facts") or []:
        if not isinstance(row, dict):
            continue
        label = str(row.get("label") or "").strip()
        value = str(row.get("value") or "").strip()
        key = f"{label}|{value}"
        if key in seen or not label or not value:
            continue
        seen.add(key)
        facts.append({
            "category": row.get("category") or "metric",
            "fiscal_year": row.get("fiscal_year"),
            "label": label[:48],
            "value": value,
            "numeric_value": _round2(float(row.get("numeric_value") or 0)),
            "unit": row.get("unit") or "million",
        })
    highlights = list(extracted.get("highlights") or [])
    for point in llm.get("critical_non_numeric") or []:
        if point and point not in highlights and len(highlights) < 8:
            highlights.append(str(point)[:280])
    return {"facts": facts, "highlights": highlights}


def ensure_output_blocks(
    output_text: str,
    output_meta: dict | None,
    output_format: str,
    *,
    source_transcript: str = "",
    numerical_facts: dict | None = None,
) -> dict:
    meta = dict(output_meta or {})
    transcript = (source_transcript or output_text or "").strip()

    extracted = _merge_llm_facts(extract_facts_from_transcript(transcript), numerical_facts)
    fact_blocks = build_blocks_from_facts(extracted, output_text or "", output_format)
    llm_blocks = normalize_blocks(meta.get("blocks"))

    if extracted.get("facts") or fact_blocks:
        meta["blocks"] = merge_blocks(llm_blocks, fact_blocks)
    elif llm_blocks:
        meta["blocks"] = llm_blocks
    else:
        meta["blocks"] = fact_blocks

    meta["facts_captured"] = len(extracted.get("facts") or [])
    return meta


# Backwards-compatible alias
def ensure_report_blocks(
    output_text: str,
    output_meta: dict | None,
    output_format: str,
) -> dict:
    return ensure_output_blocks(output_text, output_meta, output_format)
