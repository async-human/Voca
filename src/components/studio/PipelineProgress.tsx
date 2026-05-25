'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { PIPELINE_STEPS, STEP_LABELS, type PipelineStep } from '@/lib/constants';

interface PipelineProgressProps {
  current: PipelineStep;
}

export function PipelineProgress({ current }: PipelineProgressProps) {
  const curIdx = PIPELINE_STEPS.indexOf(current);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-6 border-t border-white/7 pt-6"
    >
      <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">Processing</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PIPELINE_STEPS.map((step, i) => {
          const done = i < curIdx;
          const active = i === curIdx;
          return (
            <motion.div
              key={step}
              layout
              className={cn(
                'rounded-xl border px-2.5 py-3 transition-colors duration-300',
                done && 'border-teal/20 bg-teal/8',
                active && 'border-accent/30 bg-accent/12',
                !done && !active && 'border-white/6 bg-white/3',
              )}
            >
              <div
                className={cn(
                  'mb-1.5 font-mono text-[9px]',
                  done && 'text-teal',
                  active && 'text-accent-2',
                  !done && !active && 'text-white/25',
                )}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <div
                className={cn(
                  'text-[11px] font-medium leading-snug',
                  active && 'text-white/85',
                  done && 'text-white/55',
                  !done && !active && 'text-white/35',
                )}
              >
                {STEP_LABELS[step]}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
