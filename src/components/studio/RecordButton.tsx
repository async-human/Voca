'use client';

import { cn } from '@/lib/cn';

interface RecordButtonProps {
  recording: boolean;
  processing: boolean;
  onClick: () => void;
}

export function RecordButton({ recording, processing, onClick }: RecordButtonProps) {
  return (
    <div className="flex flex-col items-center gap-4">
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
        {/* Outer ring */}
        <span
          className={cn(
            'absolute h-[88px] w-[88px] rounded-full border transition-all duration-300',
            recording ? 'border-accent/50 scale-110' : 'border-white/10 group-hover:border-white/25',
          )}
        />
        {/* Pulse ring when recording */}
        {recording && (
          <span className="absolute h-[88px] w-[88px] animate-ping rounded-full border border-accent/30 opacity-40" />
        )}
        {/* Main button */}
        <span
          className={cn(
            'relative flex h-[72px] w-[72px] items-center justify-center rounded-full',
            'bg-gradient-to-br from-accent-2 to-accent shadow-[0_8px_32px_rgba(191,59,42,.4),inset_0_0_0_1px_rgba(255,255,255,.12)]',
            'transition-transform duration-200 group-hover:scale-105 group-active:scale-[0.97]',
            recording && 'rec-pulse',
          )}
        >
          {recording ? (
            <span className="block h-4 w-4 rounded-[3px] bg-white" />
          ) : (
            <span className="block h-5 w-5 rounded-full bg-white" />
          )}
        </span>
      </button>

      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/50">
          {recording ? 'Tap to finish' : processing ? 'Working on it…' : 'Tap to speak'}
        </p>
        {!recording && !processing && (
          <p className="mt-1 text-[11px] text-white/25">Up to 60 seconds · rambling is fine</p>
        )}
      </div>
    </div>
  );
}
