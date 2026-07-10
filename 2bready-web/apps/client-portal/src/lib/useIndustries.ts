'use client';

import { useEffect, useState } from 'react';

// client-portal has no auth/API wiring at all yet (onboarding runs before any
// real session exists here) — this hits the one industry endpoint that's
// genuinely public (see IndustryController::publicIndex on the backend) so
// the setup wizard can show real, admin-managed industries instead of a
// hardcoded list, without needing to bootstrap the rest of the API layer.
// No static fallback on failure: the fetched id is what gets submitted as
// industry_id, so silently falling back to a fake id would produce a company
// with a bogus industry rather than a visibly failed/loading state.
export interface IndustryOption {
  id: string;
  code: string;
  name: string;
  name_kh: string | null;
  sort_order: number;
}

type ApiResponseShape<T> = { data: T };

export function useIndustries() {
  const [industries, setIndustries] = useState<IndustryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/industry-options`)
      .then((res) => {
        if (!res.ok) throw new Error(`Unexpected status ${res.status}`);
        return res.json() as Promise<ApiResponseShape<IndustryOption[]>>;
      })
      .then((body) => {
        if (cancelled) return;
        setIndustries(body.data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { industries, loading, error };
}
