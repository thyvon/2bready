import { useEffect, useState } from 'react';
import { listIndustries } from './api';
import type { Industry } from './types';

// Module-level cache: industries are a small, rarely-changing reference dataset.
// Multiple components (companies, journey-templates, packages, dialogs) all
// call useIndustries() — this ensures only one HTTP request fires and all
// consumers share the result.
let cachedIndustries: Industry[] | null = null;
let inflightPromise: Promise<Industry[]> | null = null;

export function useIndustries() {
  const [industries, setIndustries] = useState<Industry[]>(cachedIndustries ?? []);
  const [loading, setLoading] = useState(cachedIndustries === null);

  useEffect(() => {
    if (cachedIndustries) {
      setIndustries(cachedIndustries);
      setLoading(false);
      return;
    }

    let cancelled = false;

    // Deduplicate concurrent callers — they all share the same in-flight request.
    const promise = inflightPromise ?? listIndustries();
    inflightPromise = promise;

    promise
      .then((data) => {
        cachedIndustries = data;
        if (!cancelled) setIndustries(data);
      })
      .finally(() => {
        inflightPromise = null;
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { industries, loading };
}
