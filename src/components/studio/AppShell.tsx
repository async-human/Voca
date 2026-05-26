'use client';

import { Nav } from '@/components/studio/Nav';
import { AuthGate } from '@/components/studio/AuthGate';
import { useAuth } from '@/hooks/useAuth';

interface AppShellProps {
  children: (accessToken: string) => React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { session, loading, authMsg, signInWithGoogle, signOut } = useAuth();

  return (
    <>
      <Nav
        email={session?.user.email}
        signedIn={!!session}
        onSignOut={session ? signOut : undefined}
      />
      {!session ? (
        <AuthGate
          loading={loading}
          message={authMsg}
          onSignInWithGoogle={signInWithGoogle}
        />
      ) : (
        children(session.access_token)
      )}
    </>
  );
}
