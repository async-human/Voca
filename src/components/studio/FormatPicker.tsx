'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import type { OutputFormat } from '@/lib/constants';
import { FORMATS } from '@/lib/constants';

interface FormatPickerProps {
  value: OutputFormat;
  onChange: (format: OutputFormat) => void;
  disabled?: boolean;
  variant?: 'sidebar' | 'inline';
}

export function FormatPicker({ value, onChange, disabled, variant = 'sidebar' }: FormatPickerProps) {
  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap justify-center gap-2">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(f.id)}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200',
              value === f.id
                ? 'border-accent/45 bg-accent/15 text-white/92'
                : 'border-white/10 bg-white/4 text-white/38 hover:border-white/20 hover:text-white/70',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <span
              className={cn(
                'h-[7px] w-[7px] shrink-0 rounded-full transition-all',
                value === f.id ? 'bg-accent-2 shadow-[0_0_8px_rgba(217,79,60,.8)]' : 'bg-white/20',
              )}
            />
            {f.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <aside className="rounded-[24px] border border-faint-2 bg-white/65 p-[18px] backdrop-blur-md md:p-[22px]">
      <span className="mb-3.5 block font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Output format</span>
      <div className="flex flex-row flex-wrap gap-2 md:flex-col md:gap-1.5">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(f.id)}
            className={cn(
              'flex w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-[14px] border border-transparent px-3.5 py-2.5 text-left transition-all duration-200',
              value === f.id
                ? 'border-ink bg-ink shadow-[0_6px_24px_rgba(28,24,20,.14)]'
                : 'hover:border-faint-2 hover:bg-white/80',
              disabled && 'cursor-not-allowed opacity-50',
              'max-md:flex-1 max-md:basis-[calc(50%-4px)]',
            )}
          >
            <span
              className={cn(
                'h-[7px] w-[7px] shrink-0 rounded-full',
                value === f.id ? 'bg-accent-2 shadow-[0_0_10px_rgba(217,79,60,.7)]' : 'bg-faint-2',
              )}
            />
            <span className="min-w-0">
              <span className={cn('block text-[13px] font-semibold', value === f.id ? 'text-paper' : 'text-ink-2')}>
                {f.name}
              </span>
              <span className={cn('block font-mono text-[9px] tracking-wide', value === f.id ? 'text-white/45' : 'text-faint')}>
                {f.desc}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="mt-5 border-t border-faint-2 pt-[18px] text-xs leading-relaxed text-muted">
        <strong className="mb-2 block font-mono text-[10px] font-normal uppercase tracking-[0.1em] text-faint">Tip</strong>
        Say who it&apos;s for, what you need, and any must-include details. Rambling is fine — that&apos;s what we&apos;re for.
      </div>
    </aside>
  );
}

export function FormatPickerMotion(props: FormatPickerProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}>
      <FormatPicker {...props} />
    </motion.div>
  );
}
