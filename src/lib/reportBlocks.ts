import type { OutputBlock } from './types';

type LooseBlock = Record<string, unknown>;

function parseMoneyValue(raw: string, suffix?: string): number {
  const n = parseFloat(raw.replace(/,/g, ''));
  if (Number.isNaN(n)) return 0;
  const s = (suffix || '').toLowerCase();
  if (s === 'b' || s === 'billion') return n * 1000;
  if (s === 'm' || s === 'million') return n;
  if (s === 'k' || s === 'thousand') return n / 1000;
  if (n >= 1000) return n / 1_000_000;
  return n;
}

function formatMoney(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1).replace(/\.0$/, '')}B`;
  if (n >= 1) return `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}M`;
  if (n >= 0.001) return `$${Math.round(n * 1000)}K`;
  return `$${n}`;
}

/** Map common LLM block variants to our schema */
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
      continue;
    }

    if (type === 'paragraph' || type === 'text' || type === 'body') {
      const text = String(b.text || b.content || b.body || '').trim();
      if (text) out.push({ type: 'paragraph', text });
      continue;
    }

    if (type === 'kpi_grid' || type === 'kpi' || type === 'kpis' || type === 'kpi_row' || type === 'metrics') {
      const items = (b.items || b.kpis || b.metrics || b.cards) as LooseBlock[] | undefined;
      if (!Array.isArray(items)) continue;
      const kpis = items
        .map((k) => ({
          label: String(k.label || k.name || k.title || '').trim(),
          value: String(k.value || k.amount || k.metric || '').trim(),
          hint: k.hint || k.change || k.delta ? String(k.hint || k.change || k.delta) : undefined,
        }))
        .filter((k) => k.label && k.value);
      if (kpis.length) out.push({ type: 'kpi_grid', items: kpis });
      continue;
    }

    if (type === 'bar_chart' || type === 'chart' || type === 'bar' || type === 'graph') {
      const items = (b.items || b.data || b.series || b.bars) as LooseBlock[] | undefined;
      if (!Array.isArray(items)) continue;
      const bars = items
        .map((row) => {
          const label = String(row.label || row.name || row.year || '').trim();
          const val = row.value ?? row.amount ?? row.y;
          const num = typeof val === 'number' ? val : parseMoneyValue(String(val).replace(/[$,]/g, ''), '');
          return { label, value: num };
        })
        .filter((row) => row.label && row.value > 0);
      if (bars.length >= 2) {
        out.push({
          type: 'bar_chart',
          title: b.title ? String(b.title) : undefined,
          unit: b.unit ? String(b.unit) : undefined,
          items: bars,
        });
      }
      continue;
    }

    if (type === 'callout' || type === 'note' || type === 'insight' || type === 'risk') {
      const title = String(b.title || b.label || 'Note').trim();
      const body = String(b.body || b.text || b.content || '').trim();
      if (body) {
        out.push({
          type: 'callout',
          title,
          body,
          variant: type === 'risk' ? 'risk' : type === 'insight' ? 'insight' : 'default',
        });
      }
    }
  }

  return out;
}

export function countRenderableBlocks(blocks: OutputBlock[]): number {
  return blocks.filter((b) => {
    if (b.type === 'kpi_grid') return b.items.length > 0;
    if (b.type === 'bar_chart') return b.items.length >= 2;
    if (b.type === 'heading' || b.type === 'paragraph' || b.type === 'callout') return true;
    return false;
  }).length;
}

export function reportHasVisuals(blocks: OutputBlock[]): boolean {
  return blocks.some(
    (b) =>
      (b.type === 'kpi_grid' && b.items.length > 0) ||
      (b.type === 'bar_chart' && b.items.length >= 2),
  );
}

/** Build KPI + chart blocks from plain report text when the model omits structured blocks */
export function inferBlocksFromReportText(text: string): OutputBlock[] {
  const blocks: OutputBlock[] = [];
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  const kpis: { label: string; value: string; hint?: string }[] = [];
  const seriesByTopic = new Map<string, { label: string; value: number }[]>();

  const kpiLineRe =
    /^(?:[-*•]\s*)?(.{3,40}?)[\s:–—-]+\s*(\$[\d,.]+[KMB]?|[\d,.]+\s*(?:%|percent|million|billion|M|B|K)(?:\s|$))/i;
  const fyMoneyRe =
    /FY\s*'?(\d{2,4})[^\d$]*(\$[\d,.]+[KMB]?|[\d,.]+)\s*(million|billion|M|B|K)?/gi;
  const percentRe = /([\d.]+%)/g;

  let currentTopic = 'Trend';

  for (const line of lines) {
    const header = line.match(/^(executive summary|key points?|recommendations?|risks?|financials?|revenue|profit)/i);
    if (header) {
      currentTopic = header[1].replace(/\s+/g, ' ');
      const rest = line.slice(header[0].length).replace(/^[\s:–—-]+/, '').trim();
      if (rest.length > 20) {
        blocks.push({ type: 'heading', text: header[1] });
        blocks.push({ type: 'paragraph', text: rest });
      } else {
        blocks.push({ type: 'heading', text: header[1] });
      }
      continue;
    }

    const kpiMatch = line.match(kpiLineRe);
    if (kpiMatch && kpis.length < 4) {
      kpis.push({ label: kpiMatch[1].trim(), value: kpiMatch[2].trim() });
    }

    let fyMatch: RegExpExecArray | null;
    const re = new RegExp(fyMoneyRe.source, fyMoneyRe.flags);
    while ((fyMatch = re.exec(line)) !== null) {
      const yr = fyMatch[1].length === 2 ? fyMatch[1] : fyMatch[1].slice(-2);
      const amount = fyMatch[2].replace('$', '');
      const suffix = fyMatch[3];
      const val = parseMoneyValue(amount, suffix);
      const topic = /profit|margin|net/i.test(line)
        ? 'Profit'
        : /revenue|sales/i.test(line)
          ? 'Revenue'
          : currentTopic;
      const key = topic;
      if (!seriesByTopic.has(key)) seriesByTopic.set(key, []);
      seriesByTopic.get(key)!.push({ label: `FY${yr}`, value: val });
    }

    const percents = [...line.matchAll(percentRe)].map((m) => m[1]);
    if (percents.length === 1 && kpis.length < 4 && line.length < 120) {
      const label = line.replace(percentRe, '').replace(/[:–—-]\s*$/, '').trim().slice(0, 36);
      if (label.length > 3) kpis.push({ label, value: percents[0] });
    }

    const dollars = [...line.matchAll(/\$([\d,.]+)\s*([KMB])?/gi)];
    if (dollars.length >= 3 && !fyMoneyRe.test(line)) {
      const topic = /profit|margin/i.test(line) ? 'Profit' : /revenue|sales/i.test(line) ? 'Revenue' : currentTopic;
      const bars = dollars.map((m, idx) => ({
        label: `P${idx + 1}`,
        value: parseMoneyValue(m[1], m[2]),
      }));
      seriesByTopic.set(topic, bars);
    }
  }

  if (kpis.length === 0) {
    const moneyHits = [...text.matchAll(/\$([\d,.]+)\s*(M|B|K|million|billion)?/gi)].slice(0, 4);
    moneyHits.forEach((m, i) => {
      kpis.push({
        label: ['Latest figure', 'Prior period', 'Target', 'Metric'][i] || `Metric ${i + 1}`,
        value: `$${m[1]}${m[2] ? m[2].toUpperCase().charAt(0) : ''}`,
      });
    });
  }

  if (kpis.length > 0) {
    blocks.unshift({ type: 'kpi_grid', items: kpis.slice(0, 4) });
  }

  for (const [title, items] of seriesByTopic) {
    if (items.length >= 2) {
      const deduped = items.slice(-6);
      blocks.push({
        type: 'bar_chart',
        title: `${title} trend`,
        unit: 'M',
        items: deduped,
      });
    }
  }

  if (!reportHasVisuals(blocks) && text.length > 80) {
    const paras = text.split(/\n\n+/).filter((p) => p.trim().length > 40);
    if (paras[0] && !blocks.some((b) => b.type === 'paragraph')) {
      blocks.push({ type: 'heading', text: 'Executive summary' });
      blocks.push({ type: 'paragraph', text: paras[0].trim() });
    }
  }

  return blocks;
}

export function resolveReportBlocks(
  rawBlocks: unknown,
  outputText: string,
  format: string,
): OutputBlock[] {
  if (format !== 'report') return normalizeBlocks(rawBlocks);

  const normalized = normalizeBlocks(rawBlocks);
  if (reportHasVisuals(normalized)) return normalized;

  const inferred = inferBlocksFromReportText(outputText);
  if (reportHasVisuals(inferred)) return inferred;

  return countRenderableBlocks(normalized) > 0 ? normalized : inferred;
}
