'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMyJourney, type Journey } from '@/lib/journey-api';

interface JourneyContextValue {
  journey: Journey | null;
  loading: boolean;
  /** Re-fetches the journey — call after any mutation that changes document/milestone status (e.g. a real upload) so every consumer sees the fresh real state instead of a locally-simulated one. Returns the fresh journey so a caller can inspect it immediately (e.g. to poll for one specific document's status changing), without waiting for a re-render. */
  refetch: () => Promise<Journey | null>;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

// Six pages under (portal) (Overview, Journey, Data Room, SOPs, Trust Badge,
// Billing) all need the same company's real journey tree — fetched once
// here instead of once per page, and shared via context rather than each
// page repeating its own useState/useEffect fetch.
export default function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getMyJourney();
        if (!cancelled) setJourney(data);
      } catch {
        // No journey yet (no template match for this company's
        // country/industry) or a transient fetch error — either way,
        // every consumer treats journey === null as "nothing real to
        // show yet", not an error state.
        if (!cancelled) setJourney(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Not guarded by the mount effect's `cancelled` flag — this only ever runs
  // from a user-triggered event handler (e.g. after a real upload), never
  // racing an unmount the way the initial mount fetch can.
  const refetch = useCallback(async () => {
    try {
      const data = await getMyJourney();
      setJourney(data);
      return data;
    } catch {
      setJourney(null);
      return null;
    }
  }, []);

  const value = useMemo<JourneyContextValue>(() => ({ journey, loading, refetch }), [journey, loading, refetch]);

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('useJourney must be used within JourneyProvider');
  return ctx;
}
