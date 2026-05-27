'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { OutputFormat } from '@/lib/constants';
import { FORMATS } from '@/lib/constants';

export const FORMAT_TIPS: Record<OutputFormat, string> = {
  email: "Say who it's for, what you need, and any deadline.",
  slack: "Mention if it's urgent, who needs to act, and any links.",
  report: 'Lead with the headline finding, then supporting details.',
  linkedin: 'Start with the hook — why should someone stop scrolling?',
  journal: "No structure needed. Just talk through what's on your mind.",
  post_call_followup: 'Mention the prospect, pain, outcome, and exact next step.',
  crm_note: 'Summarize the call outcome, pain, objections, and next action.',
  voicemail_script: 'Say who you called and the hook they should hear.',
  pipeline_update: 'Group deals by hot, warm, and cold with next actions.',
};

function EmailIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1.5" y="3" width="11" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.5 5.5L7 9l5.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SlackIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M5.5 2.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM5.5 5.5v3M8.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM8.5 8.5v-3M2 8.5h3M9 5.5h3"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReportIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function LinkedInIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function JournalIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M9.5 2L12 4.5 5.5 11H3v-2.5L9.5 2z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M2 13h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const FORMAT_ICONS: Record<OutputFormat, ReactNode> = {
  email: <EmailIcon />,
  slack: <SlackIcon />,
  report: <ReportIcon />,
  linkedin: <LinkedInIcon />,
  journal: <JournalIcon />,
  post_call_followup: <EmailIcon />,
  crm_note: <ReportIcon />,
  voicemail_script: <SlackIcon />,
  pipeline_update: <ReportIcon />,
};

const FORMAT_ICONS_SM: Record<OutputFormat, ReactNode> = {
  email: <EmailIcon size={11} />,
  slack: <SlackIcon size={11} />,
  report: <ReportIcon size={11} />,
  linkedin: <LinkedInIcon size={11} />,
  journal: <JournalIcon size={11} />,
  post_call_followup: <EmailIcon size={11} />,
  crm_note: <ReportIcon size={11} />,
  voicemail_script: <SlackIcon size={11} />,
  pipeline_update: <ReportIcon size={11} />,
};

interface FormatPickerProps {
  value: OutputFormat;
  onChange: (format: OutputFormat) => void;
  disabled?: boolean;
  variant?: 'dark' | 'light';
}

export function FormatPicker({ value, onChange, disabled, variant = 'dark' }: FormatPickerProps) {
  const isDark = variant === 'dark';

  if (!isDark) {
    return (
      <div className="overflow-x-auto pb-0.5 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-1 rounded-[20px] border border-faint-2/65 bg-paper-2/55 p-1">
          {FORMATS.map((f) => {
            const active = value === f.id;
            return (
              <button
                key={f.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(f.id)}
                className={cn(
                  'flex shrink-0 cursor-pointer flex-col items-start rounded-[14px] px-4 py-2.5 text-left transition-all duration-200',
                  active
                    ? 'bg-ink text-paper shadow-[0_2px_12px_rgba(28,24,20,.18),inset_0_1px_0_rgba(255,255,255,.06)]'
                    : 'text-ink-2 hover:bg-white/65 hover:shadow-[0_1px_6px_rgba(28,24,20,.06)]',
                  disabled && 'cursor-not-allowed opacity-40',
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'transition-colors duration-200',
                      active ? 'text-white/55' : 'text-muted',
                    )}
                  >
                    {FORMAT_ICONS[f.id]}
                  </span>
                  <span
                    className={cn(
                      'text-[13px] font-semibold transition-colors duration-200',
                      active ? 'text-paper' : 'text-ink-2',
                    )}
                  >
                    {f.name}
                  </span>
                </div>
                <span
                  className={cn(
                    'mt-0.5 pl-[21px] font-mono text-[9px] uppercase tracking-wider transition-colors duration-200',
                    active ? 'text-white/32' : 'text-faint',
                  )}
                >
                  {f.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

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
              'flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 transition-all duration-200',
              active
                ? 'border-accent/40 bg-accent/12 shadow-[0_2px_12px_rgba(191,59,42,.1)]'
                : 'border-white/8 bg-white/[0.05] hover:border-white/16 hover:bg-white/[0.08]',
              disabled && 'cursor-not-allowed opacity-40',
            )}
          >
            <span
              className={cn(
                'transition-colors duration-200',
                active ? 'text-accent-2/75' : 'text-white/28',
              )}
            >
              {FORMAT_ICONS_SM[f.id]}
            </span>
            <span
              className={cn(
                'text-[12px] font-medium transition-colors duration-200',
                active ? 'text-white/90' : 'text-white/45',
              )}
            >
              {f.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
