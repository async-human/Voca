'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import type { SessionResult } from '@/lib/types';
import { FORMATS, formatMeta, type OutputFormat } from '@/lib/constants';

interface ResultPanelProps {
  data: SessionResult;
  onCopy: () => void;
  onNew: () => void;
  onRegenerate: (format: OutputFormat) => void;
  regenerating?: boolean;
}

export function ResultPanel({ data, onCopy, onNew, onRegenerate, regenerating }: ResultPanelProps) {
  const gen = data.generation;
  if (!gen) return null;

  const meta = formatMeta(gen.format);
  const others = FORMATS.filter((f) => f.id !== gen.format);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="mt-5 overflow-hidden rounded-[24px] border border-faint-2 bg-white/78 shadow-[0_20px_60px_rgba(28,24,20,.07)] backdrop-blur-xl"
    >
      <div className="h-0.5 bg-gradient-to-r from-accent-3 via-accent-2 to-accent" />
      <div className="p-7 md:p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Generated output</span>
            <h2 className="font-serif text-xl font-bold tracking-tight">{meta.label}</h2>
            {data.clarity_score != null && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 font-mono text-[10px] tracking-wide text-teal">
                <span className="h-[5px] w-[5px] rounded-full bg-teal" />
                Clarity {Math.round(data.clarity_score)}
              </span>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="cursor-pointer rounded-full border border-faint-2 bg-paper px-[18px] py-2 text-[13px] font-medium text-muted transition-colors hover:border-ink hover:text-ink"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={onNew}
              className="cursor-pointer rounded-full border border-faint-2 bg-paper px-[18px] py-2 text-[13px] font-medium text-muted transition-colors hover:border-ink hover:text-ink"
            >
              New
            </button>
          </div>
        </div>

        <div className="mb-7 rounded-2xl border border-faint-2 bg-paper px-[26px] py-7">
          {gen.output_meta?.subject && (
            <p className="mb-4 border-b border-faint-2 pb-3.5 font-mono text-[10px] tracking-wide text-accent">
              Subject · {gen.output_meta.subject}
            </p>
          )}
          <div className="font-serif text-base leading-[1.78] whitespace-pre-wrap text-ink-2">{gen.output_text}</div>
        </div>

        {(gen.explanations?.length ?? 0) > 0 && (
          <>
            <span className="mb-3 block font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Why we changed it</span>
            <div className="mb-6 grid gap-2.5 sm:grid-cols-2">
              {gen.explanations!.map((ex, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-[14px] border border-faint-2 bg-white/70 p-[18px] transition-shadow hover:shadow-[0_8px_24px_rgba(28,24,20,.06)]"
                >
                  <div className="mb-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-accent">
                    <span className="h-1 w-1 rounded-full bg-accent" />
                    {ex.tag || ex.label || 'Change'}
                  </div>
                  <p className="text-[13px] leading-relaxed text-ink-3">{ex.text}</p>
                </motion.div>
              ))}
            </div>
          </>
        )}

        <div className="border-t border-faint-2 pt-[22px]">
          <span className="mb-3 block font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Switch format — same recording</span>
          <div className="flex flex-wrap gap-2">
            {others.map((f) => (
              <button
                key={f.id}
                type="button"
                disabled={regenerating}
                onClick={() => onRegenerate(f.id)}
                className={cn(
                  'cursor-pointer rounded-full border border-faint-2 bg-paper px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-ink hover:text-ink',
                  regenerating && 'cursor-not-allowed opacity-50',
                )}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
