'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMyJourney, allDocuments, countVerified, type Journey } from '@/lib/journey-api';
import { listMySubscriptions, type Subscription } from '@/lib/subscription-api';
import { listTrustBadges, type TrustBadge } from '@/lib/trust-badge-api';
import type { LevelBadgeLink } from '@/components/dashboard/LevelCardsGrid';

interface JourneyContextValue {
  journey: Journey | null;
  loading: boolean;
  /** Derived stats — computed once when journey changes, not per-consumer. */
  totalDocs: number;
  verifiedDocs: number;
  overallPct: number;
  /** Level codes with an active subscription. */
  activeLevelCodes: Set<string>;
  /** Raw subscription list — for pages that need full subscription objects (e.g. Billing statusFor, Data Room enterprise tier check). */
  subscriptions: Subscription[];
  /** Trust badges + derived badge-by-level map. */
  trustBadges: TrustBadge[];
  badgesByLevel: Map<string, LevelBadgeLink>;
  /** Whether listTrustBadges() failed — consumers (e.g. trust-badge page) use
   *  this to show an ErrorState with retry, not a misleading empty state. */
  trustBadgesError: boolean;
  /** Re-fetches the journey — call after any mutation that changes document/milestone status (e.g. a real upload) so every consumer sees the fresh real state instead of a locally-simulated one. Returns the fresh journey so a caller can inspect it immediately (e.g. to poll for one specific document's status changing), without waiting for a re-render. */
  refetch: () => Promise<Journey | null>;
  /** Re-fetches journey + subscriptions + trust badges — call after a mutation
   *  that affects any of the three (e.g. subscribeToPackage, admin payment
   *  confirmation) so the overview's "Active Plan" chips and trust badge
   *  sections stay in sync without a full page reload. */
  refetchAll: () => Promise<void>;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

// Every page under (portal) needs journey data; overview, navbar, and several
// others also need subscriptions + trust badges.  Fetching all three once in
// the layout means pages render instantly with everything already available.
export default function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLevelCodes, setActiveLevelCodes] = useState<Set<string>>(new Set());
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [trustBadges, setTrustBadges] = useState<TrustBadge[]>([]);
  const [badgesByLevel, setBadgesByLevel] = useState<Map<string, LevelBadgeLink>>(new Map());
  const [trustBadgesError, setTrustBadgesError] = useState(false);

  async function fetchAll(): Promise<{ ok: boolean }> {
    const [journeyResult, subResult, badgeResult] = await Promise.allSettled([
      getMyJourney(),
      listMySubscriptions(),
      listTrustBadges(),
    ]);

    // Journey
    if (journeyResult.status === 'fulfilled') {
      setJourney(journeyResult.value);
    } else {
      setJourney(null);
    }

    // Subscriptions → active level codes + raw list
    if (subResult.status === 'fulfilled') {
      const subs = subResult.value;
      setSubscriptions(subs);
      setActiveLevelCodes(
        new Set(
          subs
            .filter((s) => s.status === 'active' && s.package?.journey_level_code)
            .map((s) => s.package!.journey_level_code!),
        ),
      );
    }

    // Trust badges → badges by level
    if (badgeResult.status === 'fulfilled') {
      const badges = badgeResult.value;
      setTrustBadges(badges);
      setTrustBadgesError(false);
      const map = new Map<string, LevelBadgeLink>();
      for (const badge of badges) {
        if (!map.has(badge.level)) {
          map.set(badge.level, {
            pdfUrl: badge.certificate?.pdf_url ?? null,
            auditId: badge.audit_id,
          });
        }
      }
      setBadgesByLevel(map);
    } else {
      setTrustBadgesError(true);
    }

    return { ok: true };
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      await fetchAll();
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

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

  // Re-fetch all three — call after a mutation that affects any of them
  // (e.g. subscribeToPackage, admin payment confirmation) so overview chips
  // and trust badge sections stay in sync without a page reload.
  const refetchAll = useCallback(async () => {
    await fetchAll();
  }, []);

  const { totalDocs, verifiedDocs, overallPct } = useMemo(() => {
    const docs = allDocuments(journey);
    const total = docs.length;
    const verified = countVerified(docs);
    return {
      totalDocs: total,
      verifiedDocs: verified,
      overallPct: total === 0 ? 0 : Math.round((verified / total) * 100),
    };
  }, [journey]);

  const value = useMemo<JourneyContextValue>(
    () => ({ journey, loading, totalDocs, verifiedDocs, overallPct, activeLevelCodes, subscriptions, trustBadges, badgesByLevel, trustBadgesError, refetch, refetchAll }),
    [journey, loading, totalDocs, verifiedDocs, overallPct, activeLevelCodes, subscriptions, trustBadges, badgesByLevel, trustBadgesError, refetch, refetchAll],
  );

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('useJourney must be used within JourneyProvider');
  return ctx;
}
