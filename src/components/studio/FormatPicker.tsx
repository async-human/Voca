'use client';

import { cn } from '@/lib/cn';
import type { OutputFormat } from '@/lib/constants';
import { FORMATS } from '@/lib/constants';

export const FORMAT_TIPS: Record<OutputFormat, string> = {
  email: 'Say who it\'s for, what you need, and any deadline.',
  slack: 'Mention if it\'s urgent, who needs to act, and any links.',
  report: 'Lead with the headline finding, then supporting details.',
  linkedin: 'Start with the hook — why should someone stop scrolling?',
  journal: 'No structure needed. Just talk through what\'s on your mind.',
};

interface FormatPickerProps {
  value: OutputFormat;
  onChange: (format: OutputFormat) => void;
  disabled?: boolean;
  variant?: 'dark' | 'light';
}

export function FormatPicker({ value, onChange, disabled, variant = 'dark' }: FormatPickerProps) {
  const isDark = variant === 'dark';

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {FORMATS.map((f) => {
        const active = value === f.id;
        return (
          <button
            key={f.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(f.id)}
            className={cn(
              'flex shrink-0 cursor-pointer flex-col items-start rounded-[14px] border px-4 py-2.5 text-left transition-all duration-200',
              isDark
                ? active
                  ? 'border-accent/45 bg-accent/15 shadow-[0_4px_20px_rgba(191,59,42,.15)]'
                  : 'border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/7'
                : active
                  ? 'border-ink bg-ink shadow-[0_4px_20px_rgba(28,24,20,.12)]'
                  : 'border-faint-2 bg-paper hover:border-faint hover:bg-white/80',
              disabled && 'cursor-not-allowed opacity-40',
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-all',
                  active
                    ? 'bg-accent-2 shadow-[0_0_8px_rgba(217,79,60,.7)]'
                    : isDark ? 'bg-white/25' : 'bg-faint',
                )}
              />
              <span
                className={cn(
                  'text-[13px] font-semibold',
                  active ? (isDark ? 'text-white/95' : 'text-paper') : (isDark ? 'text-white/55' : 'text-ink-2'),
                )}
              >
                {f.name}
              </span>
            </span>
            <span
              className={cn(
                'mt-0.5 pl-3.5 font-mono text-[9px] tracking-wide',
                active ? (isDark ? 'text-white/40' : 'text-white/45') : (isDark ? 'text-white/25' : 'text-faint'),
              )}
            >
              {f.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}
