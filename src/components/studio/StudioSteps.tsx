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
    <div className="mb-9">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-semibold transition-all duration-300',
                    done && 'bg-teal/85 text-white shadow-[0_2px_8px_rgba(42,122,114,.22)]',
                    active && 'bg-ink text-paper shadow-[0_3px_12px_rgba(28,24,20,.2)]',
                    !done && !active && 'border border-faint-2/80 bg-paper text-faint',
                  )}
                >
                  {done ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                      <path
                        d="M2 5.5l2 2 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    'hidden text-[9.5px] font-medium sm:block transition-colors duration-300',
                    active && 'text-ink',
                    done && 'text-teal/60',
                    !done && !active && 'text-faint',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="relative mx-3 mb-[18px] h-px flex-1 overflow-hidden rounded-full bg-faint-2/50">
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full bg-teal/40 transition-all duration-700 ease-in-out',
                      i < current ? 'w-full' : 'w-0',
                    )}
                  />
                </div>
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
