'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

interface NavProps {
  email?: string;
  onSignOut?: () => void;
}

export function Nav({ email, onSignOut }: NavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-4 md:px-10',
        'backdrop-blur-xl transition-colors duration-300',
        scrolled ? 'border-b border-faint-2 bg-paper/92' : 'border-b border-transparent bg-paper/72',
      )}
    >
      <Link href="/" className="flex items-baseline gap-1 no-underline">
        <span className="font-serif text-[21px] font-bold tracking-tight text-ink">Vokal</span>
        <span className="mb-0.5 h-[5px] w-[5px] rounded-full bg-accent" />
      </Link>
      <div className="flex items-center gap-3 md:gap-4">
        {email && (
          <span className="hidden max-w-[200px] truncate rounded-full border border-faint-2 bg-white/50 px-3.5 py-1.5 text-xs text-muted sm:inline">
            {email}
          </span>
        )}
        <Link href="/" className="text-[13px] font-medium text-muted no-underline transition-colors hover:text-ink">
          Home
        </Link>
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-accent/8 hover:text-accent"
          >
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
