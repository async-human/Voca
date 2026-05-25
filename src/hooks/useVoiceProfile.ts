'use client';

import { useCallback, useEffect, useState } from 'react';
import { getProfile } from '@/lib/api';
import type { UserProfile } from '@/lib/types';

export function useVoiceProfile(accessToken: string, refreshKey = 0) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setError('');
      const data = await getProfile(accessToken);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load profile');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  return { profile, loading, error, refresh };
}
