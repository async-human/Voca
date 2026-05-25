'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { PLATFORM_LABELS, type DeliveryDestination, type PlatformConnection } from '@/lib/delivery';
import type { SessionResult } from '@/lib/types';
import { FORMATS, formatMeta, type OutputFormat } from '@/lib/constants';
import { DestinationPicker, destinationSummary } from './DestinationPicker';

interface ResultPanelProps {
  data: SessionResult;
  format?: OutputFormat;
  connections?: PlatformConnection[];
  outputText?: string;
  onOutputChange?: (text: string) => void;
  deliveryDestination?: DeliveryDestination | null;
  onDestinationChange?: (value: DeliveryDestination | null) => void;
  recipientEmail?: string;
  onRecipientEmailChange?: (email: string) => void;
  onCopy: () => void;
  onNew: () => void;
  onRegenerate: (format: OutputFormat) => void;
  onDeliver?: () => void;
  regenerating?: boolean;
  delivering?: boolean;
  delivered?: boolean;
  copied?: boolean;
  historyMode?: boolean;
}

export function ResultPanel({
  data,
  format,
  connections = [],
  outputText,
  onOutputChange,
  deliveryDestination,
  onDestinationChange,
  recipientEmail = '',
  onRecipientEmailChange,
  onCopy,
  onNew,
  onRegenerate,
  onDeliver,
  regenerating,
  delivering,
  delivered,
  copied,
  historyMode,
}: ResultPanelProps) {
  const [showWhy, setShowWhy] = useState(true);
  const gen = data.generation;
  if (!gen) return null;

  const resolvedFormat = format ?? gen.format;

  const meta = formatMeta(gen.format);
  const others = FORMATS.filter((f) => f.id !== gen.format);
  const explanations = gen.explanations ?? [];
  const displayText = outputText ?? gen.output_text;
  const editable = !!onOutputChange && !historyMode;
  const canSend = !!onDeliver && !!deliveryDestination;
  const gmailMissingRecipient =
    deliveryDestination?.platform === 'gmail' && !(deliveryDestination.to || recipientEmail)?.trim();

  const sendLabel = deliveryDestination
    ? delivered
      ? 'Sent ✓'
      : delivering
        ? 'Sending…'
        : gmailMissingRecipient
          ? 'Add recipient'
          : `Send via ${PLATFORM_LABELS[deliveryDestination.platform]}`
    : null;

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

      {delivered && deliveryDestination && (
        <div className="border-b border-teal/15 bg-teal/[0.06] px-6 py-3 md:px-7">
          <p className="text-[13px] font-medium text-teal">
            Delivered · {destinationSummary(deliveryDestination, recipientEmail)}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-faint-2/80 px-6 py-4 md:px-7">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Your {meta.name.toLowerCase()}</p>
          <h2 className="font-serif text-lg font-bold tracking-tight text-ink">{meta.label}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.clarity_score != null && (
            <span className="rounded-full bg-teal/10 px-2.5 py-1 font-mono text-[9px] text-teal">
              Clarity {Math.round(data.clarity_score)}
            </span>
          )}
          {!historyMode && canSend && sendLabel && (
            <button
              type="button"
              onClick={onDeliver}
              disabled={delivering || delivered || gmailMissingRecipient}
              className={cn(
                'cursor-pointer rounded-full px-5 py-2 text-[13px] font-semibold transition-all duration-200',
                delivered
                  ? 'bg-teal/10 text-teal'
                  : 'bg-accent text-paper hover:shadow-[0_6px_20px_rgba(191,59,42,.25)] disabled:opacity-60',
              )}
            >
              {sendLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onCopy}
            className={cn(
              'cursor-pointer rounded-full px-5 py-2 text-[13px] font-semibold transition-all duration-200',
              copied
                ? 'bg-teal/10 text-teal'
                : canSend && !delivered
                  ? 'border border-faint-2 bg-paper text-ink hover:border-ink/25'
                  : 'bg-ink text-paper hover:bg-accent hover:shadow-[0_6px_20px_rgba(191,59,42,.2)]',
            )}
          >
            {copied ? 'Copied ✓' : 'Copy text'}
          </button>
        </div>
      </div>

      <div className="px-6 py-6 md:px-7">
        {gen.output_meta?.subject && (
          <p className="mb-4 rounded-xl border border-faint-2 bg-paper px-4 py-3 font-mono text-[11px] text-accent">
            Subject · {gen.output_meta.subject}
          </p>
        )}
        {editable ? (
          <textarea
            value={displayText}
            onChange={(e) => onOutputChange?.(e.target.value)}
            rows={Math.min(16, Math.max(6, displayText.split('\n').length + 1))}
            className="w-full resize-y rounded-[14px] border border-faint-2 bg-white/70 px-4 py-3 font-serif text-[15px] leading-[1.82] text-ink-2 outline-none focus:border-ink/25"
          />
        ) : (
          <div className="font-serif text-[15px] leading-[1.82] whitespace-pre-wrap text-ink-2">
            {displayText}
          </div>
        )}
      </div>

      {!historyMode && onDestinationChange && onRecipientEmailChange && (
        <div className="border-t border-faint-2/80 bg-white/40 px-6 py-5 md:px-7">
          <DestinationPicker
            format={resolvedFormat}
            connections={connections}
            value={deliveryDestination ?? null}
            onChange={onDestinationChange}
            recipientEmail={recipientEmail}
            onRecipientEmailChange={onRecipientEmailChange}
            disabled={delivering || delivered}
            variant="result"
          />
        </div>
      )}

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
              href="/app/connections/"
              className="text-[13px] font-medium text-muted no-underline underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Connections
            </Link>
          )}
          {!historyMode && (
            <Link
              href="/app/history/"
              className="text-[13px] font-medium text-muted no-underline underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              History
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
