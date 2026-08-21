import { useEffect, useState, useCallback } from 'react';
import { listSops } from './api';
import type { Sop } from './types';

/**
 * Hook for fetching and managing the list of SOPs.
 * Mirrors the `useJourneyLevels` pattern from the package domain.
 */
export function useSops() {
  const [sops, setSops] = useState<Sop[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSops();
      setSops(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const data = await listSops();
        if (!cancelled) setSops(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = useCallback(() => {
    load();
  }, [load]);

  return { sops, loading, refetch };
}