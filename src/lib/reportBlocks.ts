import type { BarChartData, OutputBlock, StructuredFacts, StructuredFactsSection } from './types';

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
  /(?:~|≈|about\s+)?\$\s*([\d]{1,4}(?:,\d{3})*(?:\.\d{1,3})?)\s*(million|billion|thousand|M|B|K|%)?|([\d]{1,4}(?:,\d{3})*(?:\.\d{1,3})?)\s+(million|billion|thousand)\b/gi;
const YEAR_RE =
  /(?:FY\s*['']?|fiscal\s+year\s*)(\d{2,4})\b|(?:in\s+|for\s+|during\s+)(20\d{2})\b|\b(20\d{2})\s*(?:\(|[~$]|:|,|\s+(?:was|is|at)\b)/gi;

function stripMarkdownForExtraction(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\r/g, '');
}

/** Remove inline markdown (bold, heading prefixes) for display text. */
export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .trim();
}

/** Turn LLM markdown output_text into heading / paragraph / bullet_list blocks. */
export function parseMarkdownOutput(text: string): OutputBlock[] {
  const blocks: OutputBlock[] = [];
  const lines = (text || '').replace(/\r/g, '').split('\n');
  let paraBuf: string[] = [];
  let listBuf: string[] = [];

  const flushPara = () => {
    const t = stripInlineMarkdown(paraBuf.join(' '));
    if (t.length > 0) blocks.push({ type: 'paragraph', text: t });
    paraBuf = [];
  };

  const flushList = () => {
    if (listBuf.length) {
      blocks.push({
        type: 'bullet_list',
        items: listBuf.map((item) => stripInlineMarkdown(item)),
      });
    }
    listBuf = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushPara();
      flushList();
      blocks.push({ type: 'heading', text: stripInlineMarkdown(heading[2]) });
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      flushPara();
      listBuf.push(bullet[1]);
      continue;
    }

    flushList();
    paraBuf.push(line);
  }

  flushPara();
  flushList();
  return blocks;
}

/** Narrative blocks from output; omit Key Points when metrics/charts already cover numbers. */
export function narrativeBlocksFromOutput(
  outputText: string,
  skipKeyPoints: boolean,
): OutputBlock[] {
  const all = parseMarkdownOutput(outputText);
  if (!skipKeyPoints) return all;

  const out: OutputBlock[] = [];
  let omit = false;
  for (const b of all) {
    if (b.type === 'heading' && /key\s*points/i.test(b.text)) {
      omit = true;
      continue;
    }
    if (b.type === 'heading') omit = false;
    if (!omit) out.push(b);
  }
  return out;
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
      const y = m[1] || m[2] || m[3];
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

function factVerifiableInTranscript(
  fact: { value: string; numeric_value: number },
  transcript: string,
): boolean {
  const digitsOnly = transcript.replace(/[^0-9.]/g, '');
  const core = String(fact.numeric_value).replace(/\.?0+$/, '');
  if (core && digitsOnly.includes(core)) return true;
  const fromValue = fact.value.replace(/[^0-9.]/g, '');
  return fromValue.length >= 1 && digitsOnly.includes(fromValue);
}

/** Pull metrics from transcript; if sparse, add output_text facts verified against transcript. */
export function extractLegacyMetrics(
  transcript: string | undefined,
  outputText: string,
): ReturnType<typeof extractFactsFromTranscript> {
  const t = transcript?.trim() || '';
  const o = outputText?.trim() || '';

  if (!t && !o) return { facts: [], highlights: [] };

  let base = extractFactsFromTranscript(t || o);
  if (!base.facts.length && o) {
    base = extractFactsFromTranscript(o);
  } else if (t && o) {
    const fromOutput = extractFactsFromTranscript(o);
    const verified = fromOutput.facts.filter((f) => factVerifiableInTranscript(f, t));
    if (verified.length) {
      base = mergeExtracted(base, { facts: verified, highlights: fromOutput.highlights });
    }
  }
  return base;
}

export function normalizeStructuredFacts(data: unknown): StructuredFacts | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.sections) && o.sections.length) {
    return o as StructuredFacts;
  }
  const facts = o.facts;
  if (!Array.isArray(facts) || !facts.length) return undefined;

  const byCat = new Map<string, StructuredFactsSection>();
  for (const raw of facts) {
    if (!raw || typeof raw !== 'object') continue;
    const f = raw as Record<string, unknown>;
    const cat = String(f.category || 'other').toLowerCase();
    let section = byCat.get(cat);
    if (!section) {
      section = { category: cat, title: cat.charAt(0).toUpperCase() + cat.slice(1), metrics: [] };
      byCat.set(cat, section);
    }
    section.metrics.push({
      fiscal_year: f.fiscal_year != null ? String(f.fiscal_year) : null,
      label: f.label != null ? String(f.label) : undefined,
      value_display: String(f.value_display || f.value || ''),
      numeric_value: typeof f.numeric_value === 'number' ? f.numeric_value : undefined,
      unit: f.unit != null ? String(f.unit) : undefined,
      source_quote: f.source_quote != null ? String(f.source_quote) : undefined,
    });
  }
  return {
    sections: [...byCat.values()],
    critical_non_numeric: Array.isArray(o.critical_non_numeric)
      ? (o.critical_non_numeric as string[])
      : [],
  };
}

function factsToStructuredFacts(
  extracted: ReturnType<typeof extractFactsFromTranscript>,
): StructuredFacts {
  const byCat = new Map<string, StructuredFactsSection>();
  for (const f of extracted.facts) {
    const cat = f.category || 'other';
    let section = byCat.get(cat);
    if (!section) {
      section = {
        category: cat,
        title: cat.charAt(0).toUpperCase() + cat.slice(1),
        metrics: [],
      };
      byCat.set(cat, section);
    }
    section.metrics.push({
      fiscal_year: f.fiscal_year,
      label: f.label,
      value_display: f.value,
      numeric_value: f.numeric_value,
      unit: f.unit,
    });
  }
  return {
    sections: [...byCat.values()],
    critical_non_numeric: extracted.highlights,
  };
}

function mergeWithStructuredRebuild(
  narrative: OutputBlock[],
  rebuilt: OutputBlock[],
  outputText: string,
): OutputBlock[] {
  const hasMetrics = rebuilt.some((b) => b.type === 'metric_section');
  const parsed = narrativeBlocksFromOutput(outputText, hasMetrics);
  if (parsed.length) {
    const sections = rebuilt.filter((b) => b.type === 'metric_section');
    const callouts = rebuilt.filter((b) => b.type === 'callout');
    return [...parsed, ...sections, ...callouts];
  }
  const narrativeOnly = narrative.filter(
    (b) =>
      b.type === 'heading' ||
      b.type === 'paragraph' ||
      b.type === 'bullet_list' ||
      b.type === 'callout',
  );
  if (!narrativeOnly.length) return rebuilt;
  const sections = rebuilt.filter((b) => b.type === 'metric_section');
  const callouts = rebuilt.filter((b) => b.type === 'callout');
  return [...narrativeOnly, ...sections, ...callouts];
}

export function normalizeBlocks(raw: unknown): OutputBlock[] {
  if (!Array.isArray(raw)) return [];

  const out: OutputBlock[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const b = item as LooseBlock;
    const type = String(b.type || b.kind || '').toLowerCase().replace(/-/g, '_');

    if (type === 'heading' || type === 'title' || type === 'section_title') {
      const text = stripInlineMarkdown(String(b.text || b.title || b.heading || ''));
      if (text) out.push({ type: 'heading', text });
    } else if (type === 'paragraph' || type === 'text' || type === 'body') {
      const text = stripInlineMarkdown(String(b.text || b.content || b.body || ''));
      if (text) out.push({ type: 'paragraph', text });
    } else if (type === 'bullet_list' || type === 'list') {
      const itemsRaw = b.items as unknown;
      if (Array.isArray(itemsRaw)) {
        const items = itemsRaw
          .map((item) =>
            typeof item === 'string'
              ? stripInlineMarkdown(item)
              : stripInlineMarkdown(String((item as LooseBlock).text || (item as LooseBlock).body || '')),
          )
          .filter(Boolean);
        if (items.length) out.push({ type: 'bullet_list', items });
      }
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

  const hasMetrics = blocks.some((b) => b.type === 'kpi_grid' || b.type === 'bar_chart');
  if (outputText) {
    const paras = narrativeBlocksFromOutput(outputText, hasMetrics);
    if (paras.length && format === 'report' && !paras.some((b) => b.type === 'heading')) {
      blocks.unshift({ type: 'heading', text: 'Executive summary' });
    }
    return [...paras, ...blocks];
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
      b.type === 'heading' ||
      b.type === 'bullet_list',
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

  const hasMetrics = blocks.some((b) => b.type === 'metric_section');
  if (outputText) {
    const narrative = narrativeBlocksFromOutput(outputText, hasMetrics);
    if (narrative.length) {
      return [...narrative, ...blocks];
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
  const normalizedFacts = normalizeStructuredFacts(structuredFacts) ?? structuredFacts;

  if (llmBlocks.some((b) => b.type === 'metric_section')) {
    const visuals = llmBlocks.filter(
      (b) =>
        b.type === 'metric_section' ||
        b.type === 'kpi_grid' ||
        b.type === 'bar_chart' ||
        b.type === 'callout',
    );
    const narrative = narrativeBlocksFromOutput(outputText, true);
    return narrative.length ? [...narrative, ...visuals] : llmBlocks;
  }

  if (normalizedFacts?.sections?.length) {
    const rebuilt = buildBlocksFromStructuredFacts(normalizedFacts, outputText, format);
    if (reportHasVisuals(rebuilt)) return rebuilt;
  }

  if (llmBlocks.length && reportHasVisuals(llmBlocks)) {
    return llmBlocks;
  }

  const legacy = extractLegacyMetrics(sourceTranscript, outputText);
  if (legacy.facts.length) {
    const rebuilt = buildBlocksFromStructuredFacts(
      factsToStructuredFacts(legacy),
      outputText,
      format,
    );
    if (reportHasVisuals(rebuilt)) {
      return llmBlocks.length
        ? mergeWithStructuredRebuild(llmBlocks, rebuilt, outputText)
        : rebuilt;
    }
    const factual = buildBlocksFromFacts(legacy, outputText, format);
    if (reportHasVisuals(factual)) {
      return llmBlocks.length ? mergeBlocks(llmBlocks, factual) : factual;
    }
  }

  if (outputText.trim()) {
    return parseMarkdownOutput(outputText);
  }

  return llmBlocks;
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
