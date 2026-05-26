'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

interface RecordingPlaybackProps {
  src: string;
  durationSeconds: number;
  className?: string;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function RecordingPlayback({ src, durationSeconds, className }: RecordingPlaybackProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);

  const total = durationSeconds > 0 ? durationSeconds : 0;
  const progress = total > 0 ? Math.min(1, current / total) : 0;

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
    };
    const onTime = () => setCurrent(audio.currentTime);
    const onLoaded = () => setReady(true);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);

    return () => {
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
    };
  }, [src]);

  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setReady(false);
  }, [src]);

  const circumference = 2 * Math.PI * 22;
  const strokeOffset = circumference * (1 - progress);

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-[18px] border border-white/[0.1] bg-white/[0.06] px-4 py-3.5',
        className,
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause recording' : 'Play recording'}
        className="group relative flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent-2/60"
      >
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 52 52" aria-hidden>
          <circle
            cx="26"
            cy="26"
            r="22"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="2"
          />
          <circle
            cx="26"
            cy="26"
            r="22"
            fill="none"
            stroke="rgba(217,79,60,0.85)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            className="transition-[stroke-dashoffset] duration-150 ease-linear"
          />
        </svg>
        <span
          className={cn(
            'relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300',
            playing
              ? 'bg-accent-2 shadow-[0_0_24px_rgba(217,79,60,.45)]'
              : 'bg-white/[0.12] group-hover:bg-accent-2/90 group-hover:shadow-[0_0_20px_rgba(217,79,60,.35)]',
          )}
        >
          {playing ? (
            <span className="flex gap-[3px]">
              <span className="h-3.5 w-[3px] rounded-sm bg-paper" />
              <span className="h-3.5 w-[3px] rounded-sm bg-paper" />
            </span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 text-paper">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
            Your raw recording
          </p>
          <p className="font-mono text-[10px] tabular-nums tracking-wide text-white/50">
            {formatTime(current || 0)} / {formatTime(total || (ready ? audioRef.current?.duration ?? 0 : 0))}
          </p>
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-3 via-accent-2 to-accent transition-[width] duration-150 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] leading-snug text-white/28">
          {playing ? 'Playing original voice note' : 'Hear exactly what you said before polish'}
        </p>
      </div>
    </div>
  );
}
