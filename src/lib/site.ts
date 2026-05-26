/** Canonical origin for auth redirects (must match Supabase Site URL). */
export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function authCallbackUrl(next = '/app/'): string {
  const origin = getSiteOrigin() || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
