'use client';

import { cn } from '@/lib/cn';

export type StudioPhase = 'setup' | 'recording' | 'processing' | 'result';

const STEPS = [
  { id: 'setup' as const, label: 'Choose format' },
  { id: 'recording' as const, label: 'Speak' },
  { id: 'processing' as const, label: 'Polish' },
  { id: 'result' as const, label: 'Review' },
];

function phaseIndex(phase: StudioPhase) {
  return STEPS.findIndex((s) => s.id === phase);
}

interface StudioStepsProps {
  phase: StudioPhase;
}

export function StudioSteps({ phase }: StudioStepsProps) {
  const current = phaseIndex(phase);

  return (
    <div className="mb-8">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-300',
                    done && 'bg-teal text-white',
                    active && 'bg-ink text-paper shadow-[0_4px_16px_rgba(28,24,20,.18)]',
                    !done && !active && 'border border-faint-2 bg-paper text-faint',
                  )}
                >
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    'hidden text-[10px] font-medium sm:block',
                    active && 'text-ink',
                    done && 'text-muted',
                    !done && !active && 'text-faint',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-px flex-1 transition-colors duration-500',
                    i < current ? 'bg-teal/40' : 'bg-faint-2',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function getStudioPhase(
  isRecording: boolean,
  isProcessing: boolean,
  hasResult: boolean,
): StudioPhase {
  if (hasResult && !isProcessing && !isRecording) return 'result';
  if (isProcessing) return 'processing';
  if (isRecording) return 'recording';
  return 'setup';
}
