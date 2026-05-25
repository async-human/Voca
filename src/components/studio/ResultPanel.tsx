'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { SessionResult } from '@/lib/types';
import { FORMATS, formatMeta, type OutputFormat } from '@/lib/constants';

interface ResultPanelProps {
  data: SessionResult;
  onCopy: () => void;
  onNew: () => void;
  onRegenerate: (format: OutputFormat) => void;
  regenerating?: boolean;
  copied?: boolean;
  historyMode?: boolean;
}

export function ResultPanel({
  data,
  onCopy,
  onNew,
  onRegenerate,
  regenerating,
  copied,
  historyMode,
}: ResultPanelProps) {
  const [showWhy, setShowWhy] = useState(true);
  const gen = data.generation;
  if (!gen) return null;

  const meta = formatMeta(gen.format);
  const others = FORMATS.filter((f) => f.id !== gen.format);
  const explanations = gen.explanations ?? [];

  return (
    <motion.div
      initial={historyMode ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'overflow-hidden border border-faint-2 bg-[#faf7f2]/95',
        historyMode ? 'rounded-[18px]' : 'rounded-[22px] shadow-[0_24px_64px_rgba(28,24,20,.08)]',
      )}
    >
      <div className="h-0.5 bg-gradient-to-r from-accent-3 via-accent-2 to-accent" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-faint-2/80 px-6 py-4 md:px-7">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Your {meta.name.toLowerCase()}</p>
          <h2 className="font-serif text-lg font-bold tracking-tight text-ink">{meta.label}</h2>
        </div>
        <div className="flex items-center gap-2">
          {data.clarity_score != null && (
            <span className="rounded-full bg-teal/10 px-2.5 py-1 font-mono text-[9px] text-teal">
              Clarity {Math.round(data.clarity_score)}
            </span>
          )}
          <button
            type="button"
            onClick={onCopy}
            className={cn(
              'cursor-pointer rounded-full px-5 py-2 text-[13px] font-semibold transition-all duration-200',
              copied
                ? 'bg-teal/10 text-teal'
                : 'bg-ink text-paper hover:bg-accent hover:shadow-[0_6px_20px_rgba(191,59,42,.2)]',
            )}
          >
            {copied ? 'Copied ✓' : 'Copy text'}
          </button>
        </div>
      </div>

      {/* Output */}
      <div className="px-6 py-6 md:px-7">
        {gen.output_meta?.subject && (
          <p className="mb-4 rounded-xl border border-faint-2 bg-paper px-4 py-3 font-mono text-[11px] text-accent">
            Subject · {gen.output_meta.subject}
          </p>
        )}
        <div className="font-serif text-[15px] leading-[1.82] whitespace-pre-wrap text-ink-2">
          {gen.output_text}
        </div>
      </div>

      {/* Explanations accordion */}
      {explanations.length > 0 && (
        <div className="border-t border-faint-2/80">
          <button
            type="button"
            onClick={() => setShowWhy((v) => !v)}
            className="flex w-full cursor-pointer items-center justify-between px-6 py-4 text-left md:px-7"
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
              Why we changed it ({explanations.length})
            </span>
            <span className={cn('text-muted transition-transform duration-200', showWhy && 'rotate-180')}>↓</span>
          </button>
          <AnimatePresence>
            {showWhy && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid gap-2 px-6 pb-5 md:grid-cols-2 md:px-7">
                  {explanations.map((ex, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-faint-2/80 bg-white/60 px-4 py-3.5"
                    >
                      <p className="mb-1 font-mono text-[9px] uppercase tracking-wide text-accent">
                        {ex.tag || ex.label || 'Change'}
                      </p>
                      <p className="text-[13px] leading-relaxed text-ink-3">{ex.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-faint-2/80 px-6 py-4 md:px-7">
        <div className="flex flex-wrap gap-1.5">
          <span className="mr-1 self-center font-mono text-[9px] uppercase tracking-wide text-faint">Also as</span>
          {others.map((f) => (
            <button
              key={f.id}
              type="button"
              disabled={regenerating}
              onClick={() => onRegenerate(f.id)}
              className={cn(
                'cursor-pointer rounded-full border border-faint-2 px-3 py-1.5 text-[11px] font-medium text-muted transition-colors hover:border-ink hover:text-ink',
                regenerating && 'cursor-not-allowed opacity-40',
              )}
            >
              {f.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {!historyMode && (
            <Link
              href="/app/history/"
              className="text-[13px] font-medium text-muted no-underline underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              View history →
            </Link>
          )}
          {!historyMode && (
            <Link
              href="/app/voice/"
              className="text-[13px] font-medium text-accent no-underline underline-offset-4 transition-colors hover:underline"
            >
              Your voice updated →
            </Link>
          )}
          <button
            type="button"
            onClick={onNew}
            className="cursor-pointer text-[13px] font-medium text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            {historyMode ? 'Close' : 'New recording →'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
