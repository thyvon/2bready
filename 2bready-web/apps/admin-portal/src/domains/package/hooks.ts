import { useEffect, useState } from 'react';
import { listJourneyLevels } from './api';
import type { JourneyLevel } from './types';

export function useJourneyLevels() {
  const [journeyLevels, setJourneyLevels] = useState<JourneyLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    listJourneyLevels()
      .then((data) => {
        if (!cancelled) setJourneyLevels(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { journeyLevels, loading };
}
