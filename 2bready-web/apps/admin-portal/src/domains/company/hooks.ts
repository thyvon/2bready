import { useEffect, useState } from 'react';
import { listIndustries, listIndustriesWithTemplates } from './api';
import type { Industry } from './types';

interface UseIndustriesOptions {
  /** Only return industries that have an active JourneyTemplate. */
  withTemplatesOnly?: boolean;
}

// Module-level caches: industries are a small, rarely-changing reference dataset.
// Multiple components (companies, journey-templates, packages, dialogs) all
// call useIndustries() — this ensures only one HTTP request fires and all
// consumers share the result.
let cachedAll: Industry[] | null = null;
let cachedWithTemplates: Industry[] | null = null;
let inflightAll: Promise<Industry[]> | null = null;
let inflightWithTemplates: Promise<Industry[]> | null = null;

export function useIndustries(options: UseIndustriesOptions = {}) {
  const withTemplatesOnly = options.withTemplatesOnly ?? false;

  const cache = withTemplatesOnly ? cachedWithTemplates : cachedAll;
  const [industries, setIndustries] = useState<Industry[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    if (cache) return;

    let cancelled = false;

    const fetcher = withTemplatesOnly ? listIndustriesWithTemplates : listIndustries;
    const inflightKey = withTemplatesOnly ? inflightWithTemplates : inflightAll;
    const promise = inflightKey ?? fetcher();

    if (withTemplatesOnly) {
      inflightWithTemplates = promise;
    } else {
      inflightAll = promise;
    }

    promise
      .then((data) => {
        if (withTemplatesOnly) {
          cachedWithTemplates = data;
        } else {
          cachedAll = data;
        }
        if (!cancelled) setIndustries(data);
      })
      .finally(() => {
        if (withTemplatesOnly) {
          inflightWithTemplates = null;
        } else {
          inflightAll = null;
        }
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withTemplatesOnly]);

  return { industries, loading };
}
