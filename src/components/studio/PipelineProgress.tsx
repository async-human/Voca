'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { PIPELINE_STEPS, STEP_LABELS, type PipelineStep } from '@/lib/constants';

interface PipelineProgressProps {
  current: PipelineStep;
}

export function PipelineProgress({ current }: PipelineProgressProps) {
  const curIdx = PIPELINE_STEPS.indexOf(current);
  const progress = Math.min(100, ((curIdx + 1) / PIPELINE_STEPS.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="mt-6 border-t border-white/7 pt-6"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
          {STEP_LABELS[current] || 'Processing'}…
        </p>
        <p className="font-mono text-[9px] text-white/25">{Math.round(progress)}%</p>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent-3 via-accent-2 to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Step pills */}
      <div className="flex flex-wrap gap-1.5">
        {PIPELINE_STEPS.filter((s) => s !== 'complete').map((step, i) => {
          const done = i < curIdx;
          const active = i === curIdx;
          return (
            <span
              key={step}
              className={cn(
                'rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wide transition-all duration-300',
                done && 'bg-teal/15 text-teal/80',
                active && 'bg-accent/20 text-accent-2',
                !done && !active && 'bg-white/4 text-white/25',
              )}
            >
              {STEP_LABELS[step]}
            </span>
          );
        })}
      </div>
    </motion.div>
  );
}
