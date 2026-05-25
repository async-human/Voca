import { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-paper text-muted">Completing sign-in…</div>}>
      <AuthCallbackClient />
    </Suspense>
  );
}
