'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface WaveformProps {
  levels: number[];
  live?: boolean;
}

export function Waveform({ levels, live }: WaveformProps) {
  return (
    <div className="mb-7 flex h-20 items-center justify-center gap-[3px]">
      {levels.map((level, i) => (
        <motion.span
          key={i}
          className={cn(
            'w-[3px] rounded-full',
            live
              ? 'bg-gradient-to-t from-accent-3 to-accent-2'
              : 'bg-gradient-to-t from-accent-3/40 to-accent-2/40',
          )}
          animate={{
            height: live ? Math.max(3, level * 72) : 4,
            opacity: live ? 0.35 + level * 0.65 : 0.25,
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.4 }}
        />
      ))}
    </div>
  );
}
