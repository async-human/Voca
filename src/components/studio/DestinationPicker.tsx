'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { OutputFormat } from '@/lib/constants';
import {
  FORMAT_PLATFORMS,
  PLATFORM_LABELS,
  type DeliveryDestination,
  type DeliveryPlatform,
  type GmailSendMode,
  type PlatformConnection,
} from '@/lib/delivery';
import { PlatformIcon } from './PlatformIcon';

interface DestinationPickerProps {
  format: OutputFormat;
  connections: PlatformConnection[];
  value: DeliveryDestination | null;
  onChange: (value: DeliveryDestination | null) => void;
  recipientEmail: string;
  onRecipientEmailChange: (email: string) => void;
  gmailSendMode?: GmailSendMode;
  onGmailSendModeChange?: (mode: GmailSendMode) => void;
  onDeliver?: () => void;
  deliverLabel?: string | null;
  delivering?: boolean;
  delivered?: boolean;
  disabled?: boolean;
  variant?: 'studio' | 'result';
}

function platformSubtitle(conn: PlatformConnection) {
  if (conn.platform === 'gmail') return conn.metadata.email || 'Your Gmail';
  if (conn.platform === 'notion') {
    return conn.metadata.database_id ? 'Database configured' : 'Set database in Connect';
  }
  if (conn.platform === 'zapier') return conn.label || 'Webhook';
  return conn.label;
}

function isReady(conn: PlatformConnection) {
  if (conn.platform === 'notion') return !!conn.metadata.database_id;
  return true;
}

export function DestinationPicker({
  format,
  connections,
  value,
  onChange,
  recipientEmail,
  onRecipientEmailChange,
  gmailSendMode = 'draft',
  onGmailSendModeChange,
  onDeliver,
  deliverLabel,
  delivering,
  delivered,
  disabled,
  variant = 'studio',
}: DestinationPickerProps) {
  const allowed = FORMAT_PLATFORMS[format];
  const options = connections.filter((c) => allowed.includes(c.platform));
  const isResult = variant === 'result';

  if (options.length === 0) {
    return (
      <div
        className={cn(
          'rounded-[16px] border border-dashed border-faint-2 bg-white/40 px-4 py-4',
          isResult && 'bg-paper/80',
        )}
      >
        <p className="text-[13px] leading-relaxed text-muted">
          {isResult
            ? 'Want to send this somewhere instead of copying?'
            : 'Send polished text straight to Gmail, Notion, or Zapier after you review it.'}
        </p>
        <Link
          href="/app/connections/"
          className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-accent no-underline hover:underline"
        >
          Set up connections →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
          {isResult ? 'Deliver to' : 'Send to (optional)'}
        </p>
        {!isResult && (
          <span className="font-mono text-[9px] text-faint">Review before send</span>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left transition-all duration-200',
            !value
              ? 'border-ink bg-ink text-paper shadow-sm'
              : 'border-faint-2 bg-white/60 text-ink hover:border-ink/20',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
              !value ? 'border-white/20 bg-white/10' : 'border-faint-2 bg-paper',
            )}
          >
            <span className="text-[11px] font-bold">⌘C</span>
          </span>
          <span>
            <span className="block text-[13px] font-semibold">Copy only</span>
            <span className={cn('block text-[11px]', !value ? 'text-paper/70' : 'text-muted')}>
              Paste it yourself
            </span>
          </span>
        </button>

        {options.map((conn) => {
          const selected = value?.connection_id === conn.id;
          const ready = isReady(conn);
          return (
            <button
              key={conn.id}
              type="button"
              disabled={disabled || !ready}
              onClick={() =>
                onChange({
                  connection_id: conn.id,
                  platform: conn.platform,
                  to: conn.platform === 'gmail' ? recipientEmail : undefined,
                  database_id: conn.metadata.database_id,
                  mode: conn.platform === 'gmail' ? gmailSendMode : undefined,
                })
              }
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left transition-all duration-200',
                selected
                  ? 'border-ink bg-ink text-paper shadow-sm'
                  : 'border-faint-2 bg-white/60 text-ink hover:border-ink/20',
                (!ready || disabled) && 'cursor-not-allowed opacity-55',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
                  selected ? 'border-white/20 bg-white/10' : 'border-faint-2 bg-paper text-ink',
                )}
              >
                <PlatformIcon platform={conn.platform} size="sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">
                  {PLATFORM_LABELS[conn.platform]}
                </span>
                <span className={cn('block truncate text-[11px]', selected ? 'text-paper/70' : 'text-muted')}>
                  {!ready ? 'Finish setup in Connect' : platformSubtitle(conn)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {value?.platform === 'gmail' && (
        <div className="space-y-3 rounded-[14px] border border-faint-2 bg-white/70 px-4 py-3">
          <div>
            <label className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
              Recipient
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => {
                onRecipientEmailChange(e.target.value);
                onChange({ ...value, to: e.target.value, mode: gmailSendMode });
              }}
              placeholder="colleague@company.com"
              disabled={disabled}
              className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
            />
          </div>
          {onGmailSendModeChange && (
            <div>
              <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                Gmail delivery mode
              </p>
              <div className="flex gap-2">
                {(['draft', 'send'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onGmailSendModeChange(mode);
                      onChange({ ...value, mode });
                    }}
                    className={cn(
                      'cursor-pointer rounded-full px-3 py-1.5 font-mono text-[9px] uppercase tracking-wide transition-colors',
                      gmailSendMode === mode
                        ? 'bg-ink text-paper'
                        : 'border border-faint-2 text-muted hover:text-ink',
                    )}
                  >
                    {mode === 'draft' ? 'Draft in Gmail' : 'Send immediately'}
                  </button>
                ))}
              </div>
            </div>
          )}
          {onDeliver && deliverLabel && (
            <button
              type="button"
              onClick={onDeliver}
              disabled={disabled || delivering || delivered || !recipientEmail.trim()}
              className={cn(
                'w-full cursor-pointer rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all duration-200',
                delivered
                  ? 'bg-teal/10 text-teal'
                  : 'bg-accent text-paper hover:shadow-[0_6px_20px_rgba(191,59,42,.25)] disabled:cursor-not-allowed disabled:opacity-55',
              )}
            >
              {delivered ? 'Delivered ✓' : delivering ? 'Working…' : deliverLabel}
            </button>
          )}
          {isResult && onDeliver && !recipientEmail.trim() && (
            <p className="text-[12px] leading-relaxed text-muted">
              Add a recipient above, then use the button to create the Gmail draft or send.
            </p>
          )}
        </div>
      )}

      {value && value.platform !== 'gmail' && (
        <p className="text-[12px] leading-relaxed text-muted">
          {value.platform === 'notion' && 'Creates a new page in your linked Notion database.'}
          {value.platform === 'zapier' && 'Posts to your Zapier webhook — route to WhatsApp, Slack, and more.'}
        </p>
      )}
    </div>
  );
}

export function destinationSummary(dest: DeliveryDestination | null, recipientEmail: string): string | null {
  if (!dest) return null;
  if (dest.platform === 'gmail') {
    const to = dest.to || recipientEmail;
    const mode = dest.mode === 'send' ? 'send' : 'draft';
    return to ? `Gmail ${mode} → ${to}` : 'Gmail → add recipient';
  }
  return `${PLATFORM_LABELS[dest.platform]} · ready to send`;
}
