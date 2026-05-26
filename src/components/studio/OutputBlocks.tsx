'use client';

import { cn } from '@/lib/cn';
import { formatChartValue, round2 } from '@/lib/reportBlocks';
import type { OutputBlock } from '@/lib/types';

interface OutputBlocksProps {
  blocks: OutputBlock[];
  className?: string;
}

function maxBarValue(items: { value: number }[]) {
  return Math.max(...items.map((i) => i.value), 1);
}

function BarChartBlock({
  title,
  unit,
  items,
}: {
  title?: string;
  unit?: string;
  items: { label: string; value: number }[];
}) {
  const max = maxBarValue(items);
  return (
    <div className="rounded-[16px] border border-faint-2 bg-white/70 px-4 py-4">
      {title && (
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
          {title}
          {unit ? ` · ${unit}` : ''}
        </p>
      )}
      <div className="flex items-end justify-between gap-2 sm:gap-3">
        {items.map((item, j) => (
          <div key={j} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="font-mono text-[10px] tabular-nums text-ink-3">
              {formatChartValue(round2(item.value), unit)}
            </span>
            <div className="flex h-24 w-full items-end justify-center">
              <div
                className="w-full max-w-[48px] rounded-t-md bg-gradient-to-t from-accent/70 to-accent-2 transition-all duration-500"
                style={{ height: `${Math.max(12, (item.value / max) * 100)}%` }}
              />
            </div>
            <span className="truncate text-center text-[10px] font-medium text-muted">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OutputBlocks({ blocks, className }: OutputBlocksProps) {
  if (!blocks.length) return null;

  return (
    <div className={cn('space-y-5', className)}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return (
              <h3
                key={i}
                className="font-serif text-[17px] font-bold tracking-tight text-ink"
              >
                {block.text}
              </h3>
            );

          case 'paragraph':
            return (
              <p key={i} className="font-serif text-[15px] leading-[1.82] text-ink-2">
                {block.text}
              </p>
            );

          case 'bullet_list':
            return (
              <ul key={i} className="list-disc space-y-2 pl-5 font-serif text-[15px] leading-[1.75] text-ink-2">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );

          case 'metric_section':
            return (
              <section key={i} className="space-y-3">
                <h3 className="font-serif text-[17px] font-bold tracking-tight text-ink">
                  {block.title}
                </h3>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {block.items.map((item, j) => (
                    <div
                      key={j}
                      className="rounded-[14px] border border-faint-2 bg-white/80 px-4 py-3.5 shadow-[0_2px_12px_rgba(28,24,20,.04)]"
                    >
                      <p className="font-serif text-[clamp(22px,4vw,28px)] font-bold leading-none tracking-tight text-ink">
                        {item.value}
                      </p>
                      <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                        {item.label}
                      </p>
                      {item.hint && (
                        <p className="mt-1 text-[11px] text-teal">{item.hint}</p>
                      )}
                    </div>
                  ))}
                </div>
                {block.chart && block.chart.items.length >= 2 && (
                  <BarChartBlock
                    title={block.chart.title}
                    unit={block.chart.unit}
                    items={block.chart.items}
                  />
                )}
              </section>
            );

          case 'kpi_grid':
            return (
              <div
                key={i}
                className="grid gap-2.5 sm:grid-cols-2"
              >
                {block.items.map((item, j) => (
                  <div
                    key={j}
                    className="rounded-[14px] border border-faint-2 bg-white/80 px-4 py-3.5 shadow-[0_2px_12px_rgba(28,24,20,.04)]"
                  >
                    <p className="font-serif text-[clamp(22px,4vw,28px)] font-bold leading-none tracking-tight text-ink">
                      {item.value}
                    </p>
                    <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                      {item.label}
                    </p>
                    {item.hint && (
                      <p className="mt-1 text-[11px] text-teal">{item.hint}</p>
                    )}
                  </div>
                ))}
              </div>
            );

          case 'bar_chart':
            return (
              <BarChartBlock
                key={i}
                title={block.title}
                unit={block.unit}
                items={block.items}
              />
            );

          case 'callout':
            return (
              <div
                key={i}
                className={cn(
                  'rounded-[14px] border px-4 py-3.5',
                  block.variant === 'risk' && 'border-accent/20 bg-accent/[0.06]',
                  block.variant === 'insight' && 'border-teal/25 bg-teal/[0.06]',
                  (!block.variant || block.variant === 'default') && 'border-faint-2 bg-paper-2/80',
                )}
              >
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-accent">
                  {block.title}
                </p>
                <p className="text-[13px] leading-relaxed text-ink-3">{block.body}</p>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
