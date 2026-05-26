import type { BarChartData, OutputBlock, StructuredFacts } from './types';

type LooseBlock = Record<string, unknown>;

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function isYear(n: number): boolean {
  return Number.isInteger(n) && n >= 1900 && n <= 2100;
}

function parseAmount(raw: string, suffix = ''): { value: number; unit: string; chartValue: number; chartUnit: string } {
  const n = parseFloat(raw.replace(/,/g, ''));
  if (Number.isNaN(n) || isYear(n)) return { value: 0, unit: '', chartValue: 0, chartUnit: 'M' };

  const s = suffix.toLowerCase().replace(/\.$/, '');
  if (s === 'b' || s === 'billion') {
    return { value: n, unit: 'billion', chartValue: round2(n), chartUnit: 'B' };
  }
  if (s === 'm' || s === 'million') {
    return { value: n, unit: 'million', chartValue: round2(n), chartUnit: 'M' };
  }
  if (s === 'k' || s === 'thousand') {
    return { value: n, unit: 'thousand', chartValue: round2(n / 1000), chartUnit: 'M' };
  }
  if (s === '%' || s === 'percent') {
    return { value: n, unit: 'percent', chartValue: round2(n), chartUnit: '%' };
  }
  if (n > 0 && n < 500) {
    return { value: n, unit: 'million', chartValue: round2(n), chartUnit: 'M' };
  }
  return { value: 0, unit: '', chartValue: 0, chartUnit: 'M' };
}

export function formatDisplayValue(n: number, unit = ''): string {
  const r = round2(n);
  const u = unit.toLowerCase();
  if (u === 'percent' || u === '%') {
    const s = r.toFixed(2).replace(/\.?0+$/, '');
    return `${s}%`;
  }
  if (u === 'billion' || u === 'b') {
    const s = r.toFixed(2).replace(/\.?0+$/, '');
    return `$${s}B`;
  }
  if (u === 'thousand' || u === 'k') {
    const s = round2(r * 1000).toFixed(2).replace(/\.?0+$/, '');
    return `$${s}K`;
  }
  const s = r.toFixed(2).replace(/\.?0+$/, '');
  return `$${s}M`;
}

export function formatChartValue(n: number, unit?: string): string {
  const r = round2(n);
  const s = r.toFixed(2).replace(/\.?0+$/, '');
  if (unit === '%') return `${s}%`;
  if (unit === 'B') return `$${s}B`;
  return `${s}M`;
}

const AMOUNT_RE =
  /\$\s*([\d]{1,4}(?:,\d{3})*(?:\.\d{1,2})?)\s*(million|billion|thousand|M|B|K|%)?|([\d]{1,4}(?:,\d{3})*(?:\.\d{1,2})?)\s+(million|billion|thousand)\b/gi;
const YEAR_RE = /(?:FY\s*['']?|fiscal\s+year\s*)(\d{2,4})\b|(?:in\s+|for\s+|during\s+)(\d{4})\b/gi;

function stripMarkdownForExtraction(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\r/g, '');
}

function mergeExtracted(
  a: ReturnType<typeof extractFactsFromTranscript>,
  b: ReturnType<typeof extractFactsFromTranscript>,
): ReturnType<typeof extractFactsFromTranscript> {
  const seen = new Set<string>();
  const facts = [...a.facts, ...b.facts].filter((f) => {
    const key = `${f.label}|${f.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const highlights = [...a.highlights, ...b.highlights].filter((h, i, arr) => arr.indexOf(h) === i).slice(0, 8);
  return { facts, highlights };
}

export function extractFactsFromTranscript(text: string) {
  const facts: {
    category: string;
    fiscal_year: string | null;
    label: string;
    value: string;
    numeric_value: number;
    unit: string;
  }[] = [];
  const highlights: string[] = [];
  const seen = new Set<string>();

  const sentences = stripMarkdownForExtraction(text || '').split(/(?<=[.!?])\s+|\n+/);
  for (const sent of sentences) {
    const s = sent.trim();
    if (s.length < 8) continue;

    const years: string[] = [];
    for (const m of s.matchAll(YEAR_RE)) {
      const y = m[1] || m[2];
      if (!y) continue;
      const full = y.length === 4 ? y : `20${y}`;
      const n = parseInt(full, 10);
      if (n >= 1900 && n <= 2100) years.push(full.slice(-2));
    }

    const amounts: {
      value: number;
      unit: string;
      display: string;
      chartValue: number;
      chartUnit: string;
    }[] = [];
    for (const m of s.matchAll(AMOUNT_RE)) {
      const raw = m[1] || m[3];
      const suf = m[2] || m[4] || '';
      const parsed = parseAmount(raw, suf);
      if (parsed.value > 0) {
        amounts.push({
          value: parsed.value,
          unit: parsed.unit,
          display: formatDisplayValue(parsed.value, parsed.unit),
          chartValue: parsed.chartValue,
          chartUnit: parsed.chartUnit,
        });
      }
    }

    let category = 'metric';
    if (/revenue|sales|turnover/i.test(s)) category = 'revenue';
    else if (/profit|margin|net income|earnings/i.test(s)) category = 'profit';
    else if (/cost|expense|spend/i.test(s)) category = 'cost';
    else if (/%|percent|growth|rate/i.test(s) && amounts.length) category = 'rate';

    if (amounts.length) {
      const pairs: [string, typeof amounts[0]][] =
        years.length === amounts.length
          ? years.map((yr, i) => [yr, amounts[i]])
          : years.length
            ? amounts.map((a, i) => [years[Math.min(i, years.length - 1)], a])
            : amounts.map((a, i) => [`P${i + 1}`, a]);

      for (const [yr, amt] of pairs) {
        const fy = yr.startsWith('P') ? yr : `FY${yr}`;
        const catLabel = category.charAt(0).toUpperCase() + category.slice(1);
        const label = yr.startsWith('P') ? `${catLabel} (${yr})` : `${fy} ${catLabel}`;
        const key = `${label}|${amt.display}`;
        if (seen.has(key)) continue;
        seen.add(key);
        facts.push({
          category,
          fiscal_year: yr.startsWith('P') ? null : yr.length === 2 ? `20${yr}` : yr,
          label,
          value: amt.display,
          numeric_value: amt.chartValue,
          unit: amt.chartUnit,
        });
      }
    } else if (
      /risk|recommend|decision|launch|deadline|blocker|concern|plan|strategy/i.test(s) &&
      highlights.length < 8
    ) {
      highlights.push(s.slice(0, 280));
    }
  }

  return { facts, highlights };
}

export function normalizeBlocks(raw: unknown): OutputBlock[] {
  if (!Array.isArray(raw)) return [];

  const out: OutputBlock[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const b = item as LooseBlock;
    const type = String(b.type || b.kind || '').toLowerCase().replace(/-/g, '_');

    if (type === 'heading' || type === 'title' || type === 'section_title') {
      const text = String(b.text || b.title || b.heading || '').trim();
      if (text) out.push({ type: 'heading', text });
    } else if (type === 'paragraph' || type === 'text' || type === 'body') {
      const text = String(b.text || b.content || b.body || '').trim();
      if (text) out.push({ type: 'paragraph', text });
    } else if (type === 'metric_section') {
      const itemsRaw = b.items as LooseBlock[] | undefined;
      const items = Array.isArray(itemsRaw)
        ? itemsRaw
            .map((row) => ({
              label: String(row.label || '').trim(),
              value: String(row.value || '').trim(),
              hint: row.hint ? String(row.hint) : undefined,
            }))
            .filter((row) => row.label && row.value)
        : [];
      const chartRaw = b.chart as LooseBlock | undefined;
      let chart: BarChartData | undefined;
      if (chartRaw && Array.isArray(chartRaw.items) && chartRaw.items.length >= 2) {
        const bars = (chartRaw.items as LooseBlock[])
          .map((row) => {
            const label = String(row.label || '').trim();
            const val = row.value ?? row.amount;
            const num = typeof val === 'number' ? round2(val) : parseAmount(String(val), '').chartValue;
            if (num <= 0 || num > 500) return null;
            return { label, value: num };
          })
          .filter((row): row is { label: string; value: number } => !!row);
        if (bars.length >= 2) {
          chart = {
            title: chartRaw.title ? String(chartRaw.title) : undefined,
            unit: chartRaw.unit ? String(chartRaw.unit) : 'M',
            items: bars,
          };
        }
      }
      if (items.length) {
        out.push({
          type: 'metric_section',
          title: String(b.title || 'Metrics'),
          category: b.category ? String(b.category) : undefined,
          items,
          ...(chart ? { chart } : {}),
        });
      }
    } else if (type === 'kpi_grid' || type === 'kpi' || type === 'kpis' || type === 'kpi_row' || type === 'metrics') {
      const items = (b.items || b.kpis || b.metrics || b.cards) as LooseBlock[] | undefined;
      if (!Array.isArray(items)) continue;
      const kpis = items
        .map((k) => {
          let label = String(k.label || k.name || k.title || '').trim();
          if (label.length > 48) label = `${label.slice(0, 45)}…`;
          const value = String(k.value || k.amount || k.metric || '').trim();
          const hint = k.hint || k.year || k.fiscal_year;
          return {
            label,
            value,
            hint: hint ? String(hint) : undefined,
          };
        })
        .filter((k) => k.label && k.value);
      if (kpis.length) out.push({ type: 'kpi_grid', items: kpis.slice(0, 8) });
    } else if (type === 'bar_chart' || type === 'chart' || type === 'bar' || type === 'graph') {
      const items = (b.items || b.data || b.series || b.bars) as LooseBlock[] | undefined;
      if (!Array.isArray(items)) continue;
      const bars = items
        .map((row) => {
          const label = String(row.label || row.name || row.year || '').trim();
          const val = row.value ?? row.amount ?? row.y;
          let num =
            typeof val === 'number' ? round2(val) : parseAmount(String(val).replace(/[$,%]/g, ''), '').value;
          if (isYear(num) || num <= 0 || num > 500) return null;
          return { label, value: num };
        })
        .filter((row): row is { label: string; value: number } => !!row && !!row.label);
      if (bars.length >= 2) {
        out.push({
          type: 'bar_chart',
          title: b.title ? String(b.title) : undefined,
          unit: b.unit ? String(b.unit) : 'M',
          items: bars,
        });
      }
    } else if (type === 'callout' || type === 'note' || type === 'insight' || type === 'risk') {
      const body = String(b.body || b.text || b.content || '').trim();
      if (body) {
        out.push({
          type: 'callout',
          title: String(b.title || b.label || 'Note'),
          body,
          variant: type === 'risk' ? 'risk' : type === 'insight' ? 'insight' : 'default',
        });
      }
    }
  }

  return out;
}

function buildBlocksFromFacts(
  extracted: ReturnType<typeof extractFactsFromTranscript>,
  outputText: string,
  format: string,
): OutputBlock[] {
  const blocks: OutputBlock[] = [];
  const { facts, highlights } = extracted;

  if (facts.length) {
    blocks.push({
      type: 'kpi_grid',
      items: facts.slice(0, 8).map((f) => ({
        label: f.label,
        value: f.value,
        ...(f.fiscal_year ? { hint: f.fiscal_year } : {}),
      })),
    });

    const byCat = new Map<string, { label: string; value: number }[]>();
    for (const f of facts) {
      if (!f.fiscal_year) continue;
      const cat = f.category;
      const label = `FY${f.fiscal_year.slice(-2)}`;
      const list = byCat.get(cat) || [];
      list.push({ label, value: f.numeric_value });
      byCat.set(cat, list);
    }
    for (const [cat, items] of byCat) {
      if (items.length >= 2) {
        const dedup = new Map(items.map((i) => [i.label, i]));
        blocks.push({
          type: 'bar_chart',
          title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} trend`,
          unit: 'M',
          items: [...dedup.values()].sort((a, b) => a.label.localeCompare(b.label)),
        });
      }
    }
  }

  for (const point of highlights.slice(0, 3)) {
    blocks.push({ type: 'callout', title: 'Key point', body: point, variant: 'insight' });
  }

  if (outputText) {
    const paras = outputText.split(/\n\s*\n/).filter((p) => p.trim().length > 40);
    if (paras.length && format === 'report') {
      if (!blocks.some((b) => b.type === 'heading')) {
        blocks.unshift({ type: 'heading', text: 'Executive summary' });
      }
      if (!blocks.some((b) => b.type === 'paragraph')) {
        blocks.splice(1, 0, { type: 'paragraph', text: paras[0].trim().slice(0, 1200) });
      }
    } else if (paras.length && !blocks.some((b) => b.type === 'paragraph')) {
      blocks.push({ type: 'paragraph', text: paras[0].trim().slice(0, 800) });
    }
  }

  return blocks;
}

function mergeBlocks(primary: OutputBlock[], factual: OutputBlock[]): OutputBlock[] {
  const merged: OutputBlock[] = [];
  for (const b of factual) {
    if (b.type === 'kpi_grid' || b.type === 'bar_chart') merged.push(b);
  }
  for (const b of primary) {
    if (b.type === 'heading' || b.type === 'paragraph' || b.type === 'callout') merged.push(b);
  }
  if (!merged.some((b) => b.type === 'kpi_grid')) {
    const k = primary.find((b) => b.type === 'kpi_grid');
    if (k) merged.unshift(k);
  }
  if (!merged.some((b) => b.type === 'bar_chart')) {
    const c = primary.find((b) => b.type === 'bar_chart');
    if (c) merged.push(c);
  }
  return merged;
}

export function reportHasVisuals(blocks: OutputBlock[]): boolean {
  return blocks.some(
    (b) =>
      (b.type === 'metric_section' && b.items.length > 0) ||
      (b.type === 'kpi_grid' && b.items.length > 0) ||
      (b.type === 'bar_chart' && b.items.length >= 2),
  );
}

export function hasMixedContent(blocks: OutputBlock[]): boolean {
  if (reportHasVisuals(blocks)) return true;
  return blocks.some(
    (b) =>
      b.type === 'metric_section' ||
      b.type === 'kpi_grid' ||
      b.type === 'bar_chart' ||
      b.type === 'callout' ||
      b.type === 'heading',
  );
}

const SECTION_ORDER = ['revenue', 'profit', 'cost', 'rate', 'headcount', 'timeline', 'other'];

/** Client-side rebuild from saved structured_facts (same layout as API). */
export function buildBlocksFromStructuredFacts(
  structured: StructuredFacts,
  outputText: string,
  format: string,
): OutputBlock[] {
  const blocks: OutputBlock[] = [];
  const sections = [...(structured.sections || [])].sort(
    (a, b) =>
      SECTION_ORDER.indexOf(a.category) - SECTION_ORDER.indexOf(b.category),
  );

  for (const section of sections) {
    const metrics = section.metrics || [];
    const items = metrics
      .map((m) => ({
        label: String(m.label || '').trim(),
        value: String(m.value_display || m.value || '').trim(),
        hint: m.fiscal_year ? String(m.fiscal_year) : undefined,
      }))
      .filter((m) => m.label && m.value);

    const chartItems = metrics
      .filter((m) => m.fiscal_year && m.numeric_value != null && m.numeric_value > 0)
      .map((m) => {
        const fy = String(m.fiscal_year);
        return {
          label: `FY${fy.slice(-2)}`,
          value: round2(Number(m.numeric_value)),
          unit: (m.unit || 'M').toUpperCase(),
        };
      })
      .filter((c) => c.value <= 500);

    if (!items.length) continue;

    const block: OutputBlock = {
      type: 'metric_section',
      title: section.title || section.category,
      category: section.category,
      items,
    };

    if (chartItems.length >= 2) {
      const dedup = new Map(chartItems.map((c) => [c.label, c]));
      const sorted = [...dedup.values()].sort((a, b) => a.label.localeCompare(b.label));
      block.chart = {
        title: `${block.title} trend`,
        unit: sorted[0].unit || 'M',
        items: sorted.map(({ label, value }) => ({ label, value })),
      };
    }
    blocks.push(block);
  }

  for (const point of (structured.critical_non_numeric || []).slice(0, 4)) {
    blocks.push({ type: 'callout', title: 'Key point', body: point, variant: 'insight' });
  }

  if (outputText) {
    const paras = outputText.split(/\n\s*\n/).filter((p) => p.trim().length > 40);
    if (paras.length && !blocks.some((b) => b.type === 'paragraph')) {
      if (format === 'report') blocks.unshift({ type: 'heading', text: 'Executive summary' });
      blocks.splice(format === 'report' ? 1 : 0, 0, {
        type: 'paragraph',
        text: paras[0].trim().slice(0, 1200),
      });
    }
  }

  return blocks;
}

export function resolveOutputBlocks(
  rawBlocks: unknown,
  outputText: string,
  format: string,
  sourceTranscript?: string,
  structuredFacts?: StructuredFacts,
): OutputBlock[] {
  const llmBlocks = normalizeBlocks(rawBlocks);

  if (llmBlocks.some((b) => b.type === 'metric_section')) {
    return llmBlocks;
  }

  if (structuredFacts?.sections?.length) {
    return buildBlocksFromStructuredFacts(structuredFacts, outputText, format);
  }

  // Legacy sessions: show saved blocks only — do not infer numbers from polished text (causes hallucinations).
  if (llmBlocks.length) return llmBlocks;

  // Last resort: transcript-only regex (no output_text).
  if (sourceTranscript?.trim()) {
    const extracted = extractFactsFromTranscript(sourceTranscript);
    return buildBlocksFromFacts(extracted, outputText, format);
  }

  return [];
}

/** @deprecated use resolveOutputBlocks */
export function resolveReportBlocks(
  rawBlocks: unknown,
  outputText: string,
  format: string,
  sourceTranscript?: string,
): OutputBlock[] {
  return resolveOutputBlocks(rawBlocks, outputText, format, sourceTranscript);
}
