'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { getSession, regenerateSession } from '@/lib/api';
import { formatMeta, type OutputFormat } from '@/lib/constants';
import type { SessionResult, SessionSummary } from '@/lib/types';
import { ResultPanel } from './ResultPanel';

const EXPAND_EASE = [0.16, 1, 0.3, 1] as const;

interface SessionHistoryPanelProps {
  sessions: SessionSummary[];
  loading?: boolean;
  error?: string;
  accessToken: string;
  onRefresh: () => void;
}

function formatWhen(iso?: string) {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatDuration(ms?: number) {
  if (!ms) return null;
  const seconds = Math.round(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function SmoothCollapse({ open, children }: { open: boolean; children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    if (!open) {
      setHeight(0);
      return;
    }

    const measure = () => setHeight(el.scrollHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, children]);

  return (
    <motion.div
      initial={false}
      animate={{
        height: open ? height : 0,
        opacity: open ? 1 : 0,
      }}
      transition={{
        height: { duration: 0.48, ease: EXPAND_EASE },
        opacity: { duration: open ? 0.32 : 0.2, ease: 'easeOut', delay: open ? 0.06 : 0 },
      }}
      className="overflow-hidden border-t border-faint-2/80 will-change-[height,opacity]"
    >
      <div ref={innerRef}>{children}</div>
    </motion.div>
  );
}

function HistoryDetailSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-5">
      <div className="h-4 w-28 animate-pulse rounded bg-faint-2/80" />
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-faint-2/60" />
        <div className="h-3 w-[92%] animate-pulse rounded bg-faint-2/60" />
        <div className="h-3 w-[78%] animate-pulse rounded bg-faint-2/60" />
      </div>
      <div className="h-32 animate-pulse rounded-[18px] bg-faint-2/50" />
    </div>
  );
}

export function SessionHistoryPanel({
  sessions,
  loading,
  error,
  accessToken,
  onRefresh,
}: SessionHistoryPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailsById, setDetailsById] = useState<Record<string, SessionResult>>({});
  const detailsRef = useRef(detailsById);
  detailsRef.current = detailsById;

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState('');
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const loadSession = useCallback(
    async (id: string) => {
      if (detailsRef.current[id]) return detailsRef.current[id];

      setLoadingId(id);
      setDetailError('');
      try {
        const data = await getSession(accessToken, id);
        setDetailsById((prev) => ({ ...prev, [id]: data }));
        return data;
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : 'Could not load session');
        return null;
      } finally {
        setLoadingId((current) => (current === id ? null : current));
      }
    },
    [accessToken],
  );

  const openSession = useCallback(
    async (id: string) => {
      if (expandedId === id) {
        setExpandedId(null);
        setDetailError('');
        return;
      }

      setExpandedId(id);
      setDetailError('');
      await loadSession(id);
    },
    [expandedId, loadSession],
  );

  useEffect(() => {
    if (!expandedId) return;
    const node = cardRefs.current[expandedId];
    if (!node) return;

    const frame = requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [expandedId, loadingId, detailsById]);

  async function handleCopy() {
    const text = expandedId ? detailsById[expandedId]?.generation?.output_text : undefined;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  }

  async function handleRegenerate(nextFormat: OutputFormat) {
    if (!expandedId) return;
    setRegenerating(true);
    setCopied(false);
    try {
      await regenerateSession(accessToken, expandedId, nextFormat);
      const data = await getSession(accessToken, expandedId);
      setDetailsById((prev) => ({ ...prev, [expandedId]: data }));
      onRefresh();
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Regenerate failed');
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-[18px] border border-faint-2 bg-white/60" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[18px] border border-accent/15 bg-accent/8 px-4 py-3.5 text-sm text-accent-2">
        {error}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-[22px] border border-faint-2 bg-white/70 px-6 py-10 text-center">
        <p className="font-serif text-lg font-bold text-ink">No sessions yet</p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Completed recordings show up here with their polished output. Audio isn&apos;t kept — only text.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="mb-4 text-[13px] leading-relaxed text-muted">
        Polished outputs and transcripts are saved. Original audio is deleted after processing for privacy.
      </p>

      {sessions.map((session) => {
        const genFormat = session.generation_format ?? session.format;
        const meta = formatMeta(genFormat);
        const expanded = expandedId === session.id;
        const subject = session.output_meta?.subject;
        const detail = detailsById[session.id];
        const isLoading = loadingId === session.id;

        return (
          <div
            key={session.id}
            ref={(node) => {
              cardRefs.current[session.id] = node;
            }}
            className={cn(
              'overflow-hidden rounded-[18px] border bg-white/70 shadow-[0_8px_28px_rgba(28,24,20,.04)] transition-[border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
              expanded
                ? 'border-ink/10 shadow-[0_16px_48px_rgba(28,24,20,.08)]'
                : 'border-faint-2 hover:border-faint-2/80',
            )}
          >
            <button
              type="button"
              onClick={() => openSession(session.id)}
              aria-expanded={expanded}
              className="flex w-full cursor-pointer items-start gap-4 px-5 py-4 text-left md:px-6"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-medium text-paper">
                    {meta.name}
                  </span>
                  <span className="font-mono text-[10px] text-muted">{formatWhen(session.created_at)}</span>
                  {session.duration_ms != null && (
                    <span className="font-mono text-[10px] text-faint">{formatDuration(session.duration_ms)}</span>
                  )}
                  {session.clarity_score != null && (
                    <span className="rounded-full bg-teal/10 px-2 py-0.5 font-mono text-[9px] text-teal">
                      Clarity {Math.round(session.clarity_score)}
                    </span>
                  )}
                </div>
                {subject && (
                  <p className="mt-2 font-mono text-[10px] text-accent">Subject · {subject}</p>
                )}
                <p className="mt-2 line-clamp-2 font-serif text-[14px] leading-relaxed text-ink-3">
                  {session.output_preview || 'No output saved'}
                </p>
              </div>
              <motion.span
                initial={false}
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.4, ease: EXPAND_EASE }}
                className="mt-1 shrink-0 text-muted"
              >
                ↓
              </motion.span>
            </button>

            <SmoothCollapse open={expanded}>
              {isLoading && !detail && <HistoryDetailSkeleton />}
              {expanded && detailError && !detail && !isLoading && (
                <p className="px-5 py-4 text-sm text-accent-2 md:px-6">{detailError}</p>
              )}
              {detail && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EXPAND_EASE, delay: isLoading ? 0 : 0.04 }}
                  className="p-4 md:p-5"
                >
                  <ResultPanel
                    data={detail}
                    onCopy={handleCopy}
                    onNew={() => {
                      setExpandedId(null);
                      setDetailError('');
                    }}
                    onRegenerate={handleRegenerate}
                    regenerating={regenerating}
                    copied={copied}
                    historyMode
                  />
                </motion.div>
              )}
            </SmoothCollapse>
          </div>
        );
      })}
    </div>
  );
}
