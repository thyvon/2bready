'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getPublicPackages, type PackageGroup } from '@/lib/package-api';
import { useAuthStore } from '@/store/auth.store';

interface PackageContextValue {
  packages: PackageGroup[];
  loading: boolean;
  error: boolean;
  refetch: () => Promise<void>;
}

const PackageContext = createContext<PackageContextValue | null>(null);

export default function PackageProvider({ children }: { children: React.ReactNode }) {
  const currentCompanyId = useAuthStore((s) => s.user?.current_company_id ?? null);
  const [packages, setPackages] = useState<PackageGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getPublicPackages();
      setPackages(data);
    } catch {
      setError(true);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await getPublicPackages();
        if (!cancelled) setPackages(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentCompanyId]);

  const value = useMemo<PackageContextValue>(() => ({ packages, loading, error, refetch: fetchPackages }), [packages, loading, error, fetchPackages]);

  return <PackageContext.Provider value={value}>{children}</PackageContext.Provider>;
}

export function usePackages() {
  const ctx = useContext(PackageContext);
  if (!ctx) throw new Error('usePackages must be used within PackageProvider');
  return ctx;
}
