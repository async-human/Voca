'use client';

import { Nav } from '@/components/studio/Nav';
import { AuthGate } from '@/components/studio/AuthGate';
import { StudioCanvas } from '@/components/studio/StudioCanvas';
import { useAuth } from '@/hooks/useAuth';

export default function StudioPage() {
  const { session, loading, authMsg, setAuthMsg, signInWithEmail, signOut } = useAuth();

  return (
    <>
      <Nav
        email={session?.user.email}
        onSignOut={session ? signOut : undefined}
      />
      {!session ? (
        <AuthGate
          loading={loading}
          message={authMsg}
          onSignIn={async (email) => {
            setAuthMsg('Sending…');
            await signInWithEmail(email);
          }}
        />
      ) : (
        <StudioCanvas accessToken={session.access_token} />
      )}
    </>
  );
}
