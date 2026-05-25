'use client';

import { useCallback, useEffect, useState } from 'react';
import { listConnections } from '@/lib/api';
import type { PlatformConnection } from '@/lib/delivery';

export function useConnections(accessToken: string, refreshKey = 0) {
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setError('');
      const data = await listConnections(accessToken);
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load connections');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  return { connections, loading, error, refresh };
}
