'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getPublicPackages, type PackageGroup } from '@/lib/package-api';

interface PackageContextValue {
  packages: PackageGroup[];
  loading: boolean;
}

const PackageContext = createContext<PackageContextValue | null>(null);

// Same reasoning as JourneyProvider: PillarCard, JourneyTree (via the
// journey page), TrustBadgeJourney, and the Billing page all need the same
// real per-level pricing/tier data — fetched once here and shared, instead
// of each reaching for the old hardcoded LEVEL_META/PRICING_BY_LEVEL maps.
export default function PackageProvider({ children }: { children: React.ReactNode }) {
  const [packages, setPackages] = useState<PackageGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getPublicPackages();
        if (!cancelled) setPackages(data);
      } catch {
        if (!cancelled) setPackages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<PackageContextValue>(() => ({ packages, loading }), [packages, loading]);

  return <PackageContext.Provider value={value}>{children}</PackageContext.Provider>;
}

export function usePackages() {
  const ctx = useContext(PackageContext);
  if (!ctx) throw new Error('usePackages must be used within PackageProvider');
  return ctx;
}
