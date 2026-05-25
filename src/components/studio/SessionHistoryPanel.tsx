'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/cn';
import { getSession, regenerateSession } from '@/lib/api';
import { formatMeta, type OutputFormat } from '@/lib/constants';
import type { SessionResult, SessionSummary } from '@/lib/types';
import { ResultPanel } from './ResultPanel';

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
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function formatDuration(ms?: number) {
  if (!ms) return null;
  const seconds = Math.round(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function SessionHistoryPanel({
  sessions,
  loading,
  error,
  accessToken,
  onRefresh,
}: SessionHistoryPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionResult | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const openSession = useCallback(
    async (id: string) => {
      if (expandedId === id) {
        setExpandedId(null);
        setDetail(null);
        return;
      }
      setExpandedId(id);
      setDetail(null);
      setDetailError('');
      setDetailLoading(true);
      try {
        const data = await getSession(accessToken, id);
        setDetail(data);
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : 'Could not load session');
      } finally {
        setDetailLoading(false);
      }
    },
    [accessToken, expandedId],
  );

  async function handleCopy() {
    const text = detail?.generation?.output_text;
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
      setDetail(data);
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

        return (
          <motion.div
            key={session.id}
            layout
            className="overflow-hidden rounded-[18px] border border-faint-2 bg-white/70 shadow-[0_8px_28px_rgba(28,24,20,.04)]"
          >
            <button
              type="button"
              onClick={() => openSession(session.id)}
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
              <span className={cn('mt-1 text-muted transition-transform duration-200', expanded && 'rotate-180')}>↓</span>
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-faint-2/80"
                >
                  <div className="p-4 md:p-5">
                    {detailLoading && (
                      <div className="h-40 animate-pulse rounded-[18px] bg-faint-2/60" />
                    )}
                    {detailError && (
                      <p className="text-sm text-accent-2">{detailError}</p>
                    )}
                    {detail && !detailLoading && (
                      <ResultPanel
                        data={detail}
                        onCopy={handleCopy}
                        onNew={() => {
                          setExpandedId(null);
                          setDetail(null);
                        }}
                        onRegenerate={handleRegenerate}
                        regenerating={regenerating}
                        copied={copied}
                        historyMode
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
