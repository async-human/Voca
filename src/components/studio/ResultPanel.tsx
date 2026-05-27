'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { PLATFORM_LABELS, type DeliveryDestination, type PlatformConnection } from '@/lib/delivery';
import type { SessionResult } from '@/lib/types';
import { ALL_FORMATS, formatMeta, type OutputFormat } from '@/lib/constants';
import {
  normalizeStructuredFacts,
  reportHasVisuals,
  resolveOutputBlocks,
} from '@/lib/reportBlocks';
import { DestinationPicker, destinationSummary } from './DestinationPicker';
import { OutputBlocks } from './OutputBlocks';

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
  onDeliverWorkflow?: () => void;
  workflowDelivering?: boolean;
  workflowDelivered?: boolean;
  gmailSendMode?: 'draft' | 'send';
  onGmailSendModeChange?: (mode: 'draft' | 'send') => void;
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
  onDeliverWorkflow,
  workflowDelivering,
  workflowDelivered,
  gmailSendMode = 'draft',
  onGmailSendModeChange,
  regenerating,
  delivering,
  delivered,
  copied,
  historyMode,
}: ResultPanelProps) {
  const [showWhy, setShowWhy] = useState(true);
  const [plainEdit, setPlainEdit] = useState(false);
  const gen = data.generation;
  if (!gen) return null;

  const resolvedFormat = format ?? gen.format;

  const meta = formatMeta(gen.format);
  const others = ALL_FORMATS.filter((f) => f.id !== gen.format);
  const hasWorkflowPlan = (gen.output_meta?.approval_bundle?.actions?.length ?? 0) > 0;
  const explanations = gen.explanations ?? [];
  const displayText = outputText ?? gen.output_text;
  const structuredFacts =
    normalizeStructuredFacts(gen.output_meta?.structured_facts) ??
    normalizeStructuredFacts(data.intent?.numerical_facts);
  const effectiveBlocks = resolveOutputBlocks(
    gen.output_meta?.blocks,
    displayText,
    resolvedFormat,
    data.clean_transcript || data.raw_transcript,
    structuredFacts,
  );
  const hasVisuals = reportHasVisuals(effectiveBlocks);
  const showRichView = effectiveBlocks.length > 0 && !plainEdit;
  const editable = !!onOutputChange && !historyMode;

  useEffect(() => {
    setPlainEdit(false);
  }, [gen.output_text, gen.format, hasVisuals]);

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
          : deliveryDestination.platform === 'gmail' && gmailSendMode === 'draft'
            ? 'Save Gmail draft'
            : `Send via ${PLATFORM_LABELS[deliveryDestination.platform]}`
    : null;

  const workflowLabel = workflowDelivered
    ? 'Workflow done ✓'
    : workflowDelivering
      ? 'Running workflow…'
      : gmailSendMode === 'draft'
        ? 'Run workflow (draft + CRM)'
        : 'Run workflow (send + CRM)';

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
          {!historyMode && hasWorkflowPlan && onDeliverWorkflow && (
            <button
              type="button"
              onClick={onDeliverWorkflow}
              disabled={workflowDelivering || workflowDelivered}
              className={cn(
                'cursor-pointer rounded-full border border-teal/30 px-5 py-2 text-[13px] font-semibold transition-all duration-200',
                workflowDelivered
                  ? 'bg-teal/10 text-teal'
                  : 'bg-teal/90 text-paper hover:bg-teal disabled:opacity-60',
              )}
            >
              {workflowLabel}
            </button>
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

        {gen.output_meta?.workflow_type && (
          <p className="mb-4 rounded-xl border border-faint-2 bg-paper px-4 py-3 font-mono text-[11px] text-muted">
            Workflow · {formatMeta(gen.output_meta.workflow_type as OutputFormat).label}
          </p>
        )}

        {gen.output_meta?.approval_bundle?.actions?.length ? (
          <div className="mb-4 rounded-[14px] border border-faint-2 bg-white/65 px-4 py-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">Approval plan</p>
              {gen.output_meta.approval_bundle.risk_level && (
                <span className="rounded-full bg-accent/10 px-2.5 py-1 font-mono text-[9px] text-accent">
                  {gen.output_meta.approval_bundle.risk_level} risk
                </span>
              )}
            </div>
            <div className="space-y-2">
              {gen.output_meta.approval_bundle.actions.map((action) => (
                <div key={action.id} className="rounded-xl border border-faint-2/80 bg-paper px-3 py-2">
                  <p className="text-[13px] font-semibold text-ink-2">{action.title}</p>
                  {action.approval_reason && (
                    <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{action.approval_reason}</p>
                  )}
                </div>
              ))}
            </div>
            {gen.output_meta.approval_bundle.missing_fields?.length ? (
              <p className="mt-3 text-[12px] leading-relaxed text-accent">
                Missing: {gen.output_meta.approval_bundle.missing_fields.join(', ')}
              </p>
            ) : null}
          </div>
        ) : null}

        {gen.output_meta?.crm_note && (
          <div className="mb-4 rounded-[14px] border border-faint-2 bg-white/65 px-4 py-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">CRM note</p>
              {gen.output_meta.deal_stage_signal && (
                <span className="rounded-full bg-teal/10 px-2.5 py-1 font-mono text-[9px] text-teal">
                  {gen.output_meta.deal_stage_signal.replaceAll('_', ' ')}
                </span>
              )}
            </div>
            <dl className="grid gap-2 text-[13px] leading-relaxed text-ink-3 md:grid-cols-2">
              {[
                ['Contact', [gen.output_meta.crm_note.contact, gen.output_meta.crm_note.company].filter(Boolean).join(' at ')],
                ['Outcome', gen.output_meta.crm_note.call_outcome?.replaceAll('_', ' ')],
                ['Pain', gen.output_meta.crm_note.pain_identified],
                ['Next action', gen.output_meta.crm_note.next_action],
              ].map(([label, value]) =>
                value ? (
                  <div key={label}>
                    <dt className="font-mono text-[9px] uppercase tracking-wide text-faint">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ) : null,
              )}
            </dl>
            {gen.output_meta.crm_note.key_points?.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-4 text-[13px] leading-relaxed text-ink-3">
                {gen.output_meta.crm_note.key_points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        {showRichView && (
          <>
            <OutputBlocks blocks={effectiveBlocks} />
            {editable && (
              <button
                type="button"
                onClick={() => setPlainEdit(true)}
                className="mt-5 cursor-pointer font-mono text-[10px] uppercase tracking-[0.1em] text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                Edit as plain text →
              </button>
            )}
          </>
        )}

        {plainEdit && hasVisuals && editable && (
          <button
            type="button"
            onClick={() => setPlainEdit(false)}
            className="mb-4 cursor-pointer font-mono text-[10px] uppercase tracking-[0.1em] text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            ← Back to charts & cards
          </button>
        )}

        {!showRichView && editable ? (
          <textarea
            value={displayText}
            onChange={(e) => onOutputChange?.(e.target.value)}
            rows={Math.min(16, Math.max(6, displayText.split('\n').length + 1))}
            className="w-full resize-y rounded-[14px] border border-faint-2 bg-white/70 px-4 py-3 font-serif text-[15px] leading-[1.82] text-ink-2 outline-none focus:border-ink/25"
          />
        ) : !showRichView ? (
          <div className="font-serif text-[15px] leading-[1.82] whitespace-pre-wrap text-ink-2">
            {displayText}
          </div>
        ) : null}

        {showRichView && (
          <details className="mt-5 group">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-ink">
              View plain text for copy
            </summary>
            <p className="mt-3 rounded-[14px] border border-faint-2 bg-white/60 px-4 py-3 font-serif text-[14px] leading-[1.75] whitespace-pre-wrap text-ink-2">
              {displayText}
            </p>
          </details>
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
            gmailSendMode={gmailSendMode}
            onGmailSendModeChange={onGmailSendModeChange}
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
