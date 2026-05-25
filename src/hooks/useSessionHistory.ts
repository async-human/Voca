'use client';

import { useCallback, useEffect, useState } from 'react';
import { listSessions } from '@/lib/api';
import type { SessionSummary } from '@/lib/types';

export function useSessionHistory(accessToken: string, refreshKey = 0) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setError('');
      const data = await listSessions(accessToken, { limit: 30, status: 'complete' });
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load history');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  return { sessions, loading, error, refresh };
}
