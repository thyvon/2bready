import { useEffect, useState } from 'react';
import { listIndustries } from './api';
import type { Industry } from './types';

export function useIndustries() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    listIndustries()
      .then((data) => {
        if (!cancelled) setIndustries(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { industries, loading };
}
