'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { VoiceProfile } from '@/lib/types';
import { FORMATS } from '@/lib/constants';

const TRAIT_LABELS: { key: keyof NonNullable<VoiceProfile['traits']>; label: string }[] = [
  { key: 'directness', label: 'Directness' },
  { key: 'conciseness', label: 'Conciseness' },
  { key: 'warmth', label: 'Warmth' },
  { key: 'formality', label: 'Formality' },
];

interface VoiceInsightsPanelProps {
  voiceProfile: VoiceProfile;
  loading?: boolean;
}

function TraitBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12px] font-medium text-ink-2">{label}</span>
        <span className="font-mono text-[10px] text-muted">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-faint-2/80">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent-3 via-accent-2 to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

export function VoiceInsightsPanel({ voiceProfile, loading }: VoiceInsightsPanelProps) {
  const [open, setOpen] = useState(true);

  const sessions = voiceProfile.sessions_count ?? 0;
  const hasData = sessions > 0;
  const traits = voiceProfile.traits ?? {};
  const hasTraits = TRAIT_LABELS.some((t) => traits[t.key] != null);

  const topPatterns = Object.entries(voiceProfile.pattern_counts ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const formatUsage = Object.entries(voiceProfile.format_usage ?? {})
    .sort((a, b) => b[1] - a[1]);

  const insights = voiceProfile.longitudinal_insights ?? [];
  const clarityHistory = voiceProfile.clarity_history ?? [];

  if (loading) {
    return (
      <div className="mb-6 rounded-[22px] border border-faint-2 bg-white/60 px-5 py-4 animate-pulse">
        <div className="h-4 w-32 rounded bg-faint-2" />
        <div className="mt-3 h-3 w-full rounded bg-faint-2/80" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 overflow-hidden rounded-[22px] border border-faint-2 bg-white/70 shadow-[0_12px_40px_rgba(28,24,20,.04)] backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left md:px-6"
      >
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Your voice</p>
          <p className="mt-0.5 font-serif text-lg font-bold tracking-tight text-ink">
            {hasData ? `${sessions} session${sessions === 1 ? '' : 's'} learned` : 'Building your profile…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {voiceProfile.avg_clarity_score != null && (
            <span className="hidden rounded-full bg-teal/10 px-2.5 py-1 font-mono text-[9px] text-teal sm:inline">
              Avg clarity {Math.round(voiceProfile.avg_clarity_score)}
            </span>
          )}
          <span className={cn('text-muted transition-transform duration-200', open && 'rotate-180')}>↓</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-faint-2/80 px-5 pb-5 pt-4 md:px-6 md:pb-6">
          {!hasData ? (
            <p className="text-[13px] leading-relaxed text-muted">
              Record a few sessions and Vokal will learn your style — trait scores, patterns, and clarity trends appear here.
            </p>
          ) : (
            <div className="space-y-5">
              {voiceProfile.summary && (
                <p className="text-[14px] leading-relaxed text-ink-3 italic">&ldquo;{voiceProfile.summary}&rdquo;</p>
              )}

              {hasTraits && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {TRAIT_LABELS.map(({ key, label }) =>
                    traits[key] != null ? (
                      <TraitBar key={key} label={label} value={traits[key]!} />
                    ) : null,
                  )}
                </div>
              )}

              {insights.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">Patterns over time</p>
                  <ul className="space-y-2">
                    {insights.map((item, i) => (
                      <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-3">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {topPatterns.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">Areas to watch</p>
                  <div className="flex flex-wrap gap-2">
                    {topPatterns.map(([pattern, count]) => (
                      <span
                        key={pattern}
                        className="rounded-full border border-faint-2 bg-paper px-3 py-1 font-mono text-[10px] text-muted"
                      >
                        {pattern.replace(/_/g, ' ')} · {count}×
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formatUsage.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">Formats you use</p>
                  <div className="flex flex-wrap gap-2">
                    {formatUsage.map(([fmt, count]) => {
                      const label = FORMATS.find((f) => f.id === fmt)?.name ?? fmt;
                      return (
                        <span key={fmt} className="rounded-full bg-ink px-3 py-1 text-[10px] font-medium text-paper">
                          {label} · {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {clarityHistory.length >= 2 && (
                <div>
                  <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">Recent clarity</p>
                  <div className="flex h-10 items-end gap-1">
                    {clarityHistory.slice(-10).map((score, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-accent-3/60 to-accent-2/80"
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(12, (score / 100) * 40)}px` }}
                        transition={{ delay: i * 0.04, duration: 0.4 }}
                        title={`${Math.round(score)}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
