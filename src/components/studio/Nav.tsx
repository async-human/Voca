'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

interface NavProps {
  email?: string;
  signedIn?: boolean;
  onSignOut?: () => void;
}

const APP_TABS = [
  { href: '/app/', label: 'Studio', match: (path: string) => path === '/app' || path === '/app/' },
  { href: '/app/history/', label: 'History', match: (path: string) => path.startsWith('/app/history') },
  { href: '/app/voice/', label: 'Your voice', match: (path: string) => path.startsWith('/app/voice') },
] as const;

export function Nav({ email, signedIn, onSignOut }: NavProps) {
  const pathname = usePathname();
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
      <div className="flex items-center gap-5 md:gap-8">
        <Link href="/" className="flex items-baseline gap-1 no-underline">
          <span className="font-serif text-[21px] font-bold tracking-tight text-ink">Vokal</span>
          <span className="mb-0.5 h-[5px] w-[5px] rounded-full bg-accent" />
        </Link>

        {signedIn && (
          <nav className="flex items-center rounded-full border border-faint-2 bg-white/50 p-0.5">
            {APP_TABS.map(({ href, label, match }) => {
              const active = match(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'rounded-full px-2.5 py-1.5 text-[11px] font-medium no-underline transition-all duration-200 md:px-3.5 md:text-[12px]',
                    active
                      ? 'bg-ink text-paper shadow-sm'
                      : 'text-muted hover:text-ink',
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

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
