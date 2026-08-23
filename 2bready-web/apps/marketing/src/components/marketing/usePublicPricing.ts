'use client';

import { useEffect, useState } from 'react';
import publicApi from '@/lib/publicApi';
import { clientPortalUrl } from '@/lib/client-portal-url';

const PUBLIC_PACKAGES_ENDPOINT = '/pricing';

// Matches PublicPackageGroupResource — the API now returns ONE package per
// journey level with monthly/yearly prices nested under `prices`, its real
// journey milestones, and each milestone's MAIN (top-level, platform-owned)
// document template names — the public "what you'll need" taxonomy.
type ApiDocumentTemplate = {
  id: string;
  name: string;
};

type ApiMilestone = {
  id: string;
  name: string;
  sort_order: number;
  document_templates?: ApiDocumentTemplate[];
};

type ApiPackageGroup = {
  id: string;
  name: string;
  name_kh: string | null;
  description: string;
  audit_fee_cents: string | number;
  journey_level_code: string;
  pathway_name?: string;
  pillar?: string;
  milestones?: ApiMilestone[];
  industry_code: string | null;
  tier: string;
  sort_order: number;
  prices?: Array<{
    id: string;
    billing_period: 'monthly' | 'yearly' | 'one_time';
    price_cents: number;
  }>;
};

export type PlanMilestone = {
  name: string;
  /** MAIN document template names under this milestone — shown by the
   * card's "Show details" toggle. */
  documents: string[];
};

export type PricingPlan = {
  level: string;
  icon: 'compliance' | 'product' | 'operational' | 'global';
  name: string;
  monthlyCents: number | null;
  yearlyCents: number | null;
  /** The TP firm's manual-audit fee at this level, in cents. */
  auditFeeCents: number;
  fee: string;
  description: string;
  milestones: PlanMilestone[];
  cta: { label: string; href: string };
};

export function formatPrice(priceCents: number) {
  const dollars = priceCents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

// Whole-number percentage the yearly cadence saves vs paying monthly
// (monthly*12 vs yearly). Null when there's no meaningful saving (e.g. $0).
export function yearlySavePct(monthlyCents: number | null, yearlyCents: number | null): number | null {
  if (!monthlyCents || monthlyCents <= 0 || yearlyCents == null) return null;
  const monthlyTotal = monthlyCents * 12;
  if (yearlyCents >= monthlyTotal) return null;
  return Math.round((1 - yearlyCents / monthlyTotal) * 100);
}

// The API is the source of truth for EVERYTHING on the card — level, name,
// price, period, milestones and their main document templates, and the audit
// fee. Nothing static is mixed in; only the icon is position-matched. Works
// for any number of packages.
function buildPlans(apiGroups: ApiPackageGroup[]): PricingPlan[] {
  const fallbackIcon: PricingPlan['icon'] = 'compliance';

  const sorted = [...apiGroups].sort((a, b) => a.sort_order - b.sort_order);

  return sorted.map((pkg) => {
    const prices = pkg.prices ?? [];
    const findPrice = (period: 'monthly' | 'yearly') => prices.find((p) => p.billing_period === period)?.price_cents ?? null;
    const milestones: PlanMilestone[] = (pkg.milestones ?? []).map((m) => ({
      name: m.name,
      documents: (m.document_templates ?? []).map((t) => t.name),
    }));
    const auditFeeCents = Number(pkg.audit_fee_cents ?? 0);

    return {
      level: pkg.journey_level_code,
      icon: fallbackIcon,
      name: pkg.name,
      monthlyCents: findPrice('monthly'),
      yearlyCents: findPrice('yearly'),
      auditFeeCents,
      fee: auditFeeCents === 0 ? 'No verification fee' : `+${formatPrice(auditFeeCents)} manual audit fee`,
      description: pkg.description,
      milestones,
      // Company registration lives in the client portal (admin has no
      // self-signup); after signup + onboarding they pick this plan on
      // Billing. Level carried as a param for a future preselect hook.
      cta: { label: 'Select Pathway', href: `${clientPortalUrl('/register')}?level=${pkg.journey_level_code.toLowerCase()}` },
    };
  });
}

/**
 * Landing-page pricing, driven entirely by the public /pricing endpoint.
 * Returns [] while loading (or if the API is unreachable — a public page must
 * never look broken, so PricingSection renders skeletons rather than fake
 * hardcoded prices).
 */
export function usePublicPricing(): { plans: PricingPlan[]; loading: boolean } {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    publicApi
      .get<{ data: ApiPackageGroup[] }>(PUBLIC_PACKAGES_ENDPOINT)
      .then((res) => {
        if (cancelled) return;
        const packages = res.data.data; // unwrap Laravel's { data: [...] } envelope
        setPlans(Array.isArray(packages) ? buildPlans(packages) : []);
      })
      .catch(() => {
        if (!cancelled) setPlans([]); // silent — never surface errors on the landing page
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { plans, loading };
}
