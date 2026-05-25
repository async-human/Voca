'use client';

import { cn } from '@/lib/cn';

interface RecordButtonProps {
  recording: boolean;
  processing: boolean;
  onClick: () => void;
}

export function RecordButton({ recording, processing, onClick }: RecordButtonProps) {
  return (
    <div className="flex flex-col items-center gap-5">
      <button
        type="button"
        aria-label={recording ? 'Stop recording' : 'Start recording'}
        disabled={processing}
        onClick={onClick}
        className={cn(
          'group relative flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0',
          processing && 'cursor-not-allowed opacity-50',
        )}
      >
        {/* Ambient outer ring — sets the stage */}
        <span
          className={cn(
            'absolute h-[106px] w-[106px] rounded-full border transition-all duration-500',
            recording
              ? 'border-accent/22 scale-105'
              : 'border-white/[0.06] group-hover:border-white/11',
          )}
        />
        {/* Inner ring */}
        <span
          className={cn(
            'absolute h-[88px] w-[88px] rounded-full border transition-all duration-300',
            recording ? 'border-accent/52 scale-110' : 'border-white/11 group-hover:border-white/26',
          )}
        />
        {/* Expanding ping when recording */}
        {recording && (
          <span className="absolute h-[96px] w-[96px] animate-ping rounded-full border border-accent/18 opacity-60" />
        )}
        {/* Main button */}
        <span
          className={cn(
            'relative flex h-[74px] w-[74px] items-center justify-center rounded-full',
            'bg-gradient-to-br from-accent-2 to-accent',
            'shadow-[0_8px_32px_rgba(191,59,42,.44),inset_0_1px_0_rgba(255,255,255,.18),inset_0_-1px_0_rgba(0,0,0,.12)]',
            'transition-transform duration-200 group-hover:scale-[1.05] group-active:scale-[0.97]',
            recording && 'rec-pulse',
          )}
        >
          {recording ? (
            <span className="block h-[15px] w-[15px] rounded-[4px] bg-white/95" />
          ) : (
            <span className="block h-[18px] w-[18px] rounded-full bg-white/95 shadow-[inset_0_1px_2px_rgba(0,0,0,.08)]" />
          )}
        </span>
      </button>

      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-white/42">
          {recording ? 'Tap to finish' : processing ? 'Working on it…' : 'Tap to speak'}
        </p>
        {!recording && !processing && (
          <p className="mt-1 text-[11px] text-white/20">Up to 60 seconds · rambling is fine</p>
        )}
      </div>
    </div>
  );
}
