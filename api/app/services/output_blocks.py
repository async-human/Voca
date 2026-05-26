"""Normalize and infer structured report blocks for rich UI rendering."""

from __future__ import annotations

import re
from typing import Any


def _parse_money(raw: str, suffix: str = "") -> float:
    try:
        n = float(raw.replace(",", ""))
    except ValueError:
        return 0.0
    s = (suffix or "").lower()
    if s in ("b", "billion"):
        return n * 1000
    if s in ("m", "million", ""):
        return n
    if s in ("k", "thousand"):
        return n / 1000
    if n >= 1000:
        return n / 1_000_000
    return n


def _has_visuals(blocks: list[dict]) -> bool:
    for b in blocks:
        if b.get("type") == "kpi_grid" and b.get("items"):
            return True
        if b.get("type") == "bar_chart" and len(b.get("items") or []) >= 2:
            return True
    return False


def _count_renderable(blocks: list[dict]) -> int:
    n = 0
    for b in blocks:
        t = b.get("type")
        if t == "kpi_grid" and b.get("items"):
            n += 1
        elif t == "bar_chart" and len(b.get("items") or []) >= 2:
            n += 1
        elif t in ("heading", "paragraph", "callout"):
            n += 1
    return n


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
                if label and value:
                    entry = {"label": label, "value": value}
                    hint = row.get("hint") or row.get("change") or row.get("delta")
                    if hint:
                        entry["hint"] = str(hint)
                    kpis.append(entry)
            if kpis:
                out.append({"type": "kpi_grid", "items": kpis})
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
                    num = float(val)
                else:
                    num = _parse_money(re.sub(r"[$,]", "", str(val)))
                if label and num > 0:
                    bars.append({"label": label, "value": num})
            if len(bars) >= 2:
                block: dict = {"type": "bar_chart", "items": bars}
                if item.get("title"):
                    block["title"] = str(item["title"])
                if item.get("unit"):
                    block["unit"] = str(item["unit"])
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


def infer_blocks_from_text(text: str) -> list[dict]:
    blocks: list[dict] = []
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]

    kpis: list[dict] = []
    series: dict[str, list[dict]] = {}
    current_topic = "Trend"

    kpi_line = re.compile(
        r"^(?:[-*•]\s*)?(.{3,40}?)[\s:–—-]+\s*(\$[\d,.]+[KMB]?|[\d,.]+\s*(?:%|percent|million|billion|M|B|K))",
        re.I,
    )
    fy_money = re.compile(
        r"FY\s*'?(\d{2,4})[^\d$]*(\$?[\d,.]+)\s*(million|billion|M|B|K)?",
        re.I,
    )

    for line in lines:
        header = re.match(
            r"^(executive summary|key points?|recommendations?|risks?|financials?|revenue|profit)",
            line,
            re.I,
        )
        if header:
            current_topic = header.group(1)
            blocks.append({"type": "heading", "text": header.group(1).title()})
            rest = line[len(header.group(0)) :].lstrip(" :–—-")
            if len(rest) > 20:
                blocks.append({"type": "paragraph", "text": rest})
            continue

        km = kpi_line.match(line)
        if km and len(kpis) < 4:
            kpis.append({"label": km.group(1).strip(), "value": km.group(2).strip()})

        for m in fy_money.finditer(line):
            yr = m.group(1)
            yr = yr[-2:] if len(yr) > 2 else yr
            val = _parse_money(m.group(2).replace("$", ""), m.group(3) or "")
            topic = "Profit" if re.search(r"profit|margin|net", line, re.I) else "Revenue"
            series.setdefault(topic, []).append({"label": f"FY{yr}", "value": val})

        dollars = list(re.finditer(r"\$([\d,.]+)\s*([KMB])?", line, re.I))
        if len(dollars) >= 3 and not fy_money.search(line):
            topic = "Profit" if re.search(r"profit|margin", line, re.I) else "Revenue"
            series[topic] = [
                {"label": f"P{i + 1}", "value": _parse_money(d.group(1), d.group(2) or "")}
                for i, d in enumerate(dollars)
            ]

    if kpis:
        blocks.insert(0, {"type": "kpi_grid", "items": kpis[:4]})

    for title, items in series.items():
        if len(items) >= 2:
            blocks.append({"type": "bar_chart", "title": f"{title} trend", "unit": "M", "items": items[-6:]})

    if _count_renderable(blocks) <= 1 and len(text) > 80:
        paras = [p.strip() for p in re.split(r"\n\s*\n", text) if len(p.strip()) > 40]
        if paras and not any(b.get("type") == "paragraph" for b in blocks):
            blocks.insert(0, {"type": "paragraph", "text": paras[0]})
            blocks.insert(0, {"type": "heading", "text": "Executive summary"})

    return blocks


def ensure_report_blocks(output_text: str, output_meta: dict | None, output_format: str) -> dict:
    meta = dict(output_meta or {})
    if output_format != "report":
        return meta

    normalized = normalize_blocks(meta.get("blocks"))
    if _has_visuals(normalized):
        meta["blocks"] = normalized
        return meta

    inferred = infer_blocks_from_text(output_text or "")
    if _has_visuals(inferred):
        meta["blocks"] = inferred
        return meta

    meta["blocks"] = normalized if normalized else inferred
    return meta
