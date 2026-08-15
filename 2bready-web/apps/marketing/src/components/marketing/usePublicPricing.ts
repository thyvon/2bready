'use client';

import { useEffect, useState } from 'react';
import publicApi from '@/lib/publicApi';
import { pricingPlans as staticPricingPlans } from './content';

const PUBLIC_PACKAGES_ENDPOINT = '/pricing';

// Matches PublicPackageGroupResource — the API now returns ONE package per
// journey level with the monthly/yearly prices nested under `prices` (each
// price carries its own id so a visitor can subscribe to a specific cadence).
type ApiPackageGroup = {
  id: string;
  name: string;
  name_kh: string | null;
  description: string;
  audit_fee_cents: string | number;
  price_cents?: never;
  billing_period?: never;
  journey_level_code: string;
  pathway_name?: string;
  pillar?: string;
  milestones?: Array<{
    id: string;
    name: string;
    sort_order: number;
  }>;
  industry_code: string | null;
  tier: string;
  sort_order: number;
  prices?: Array<{
    id: string;
    billing_period: 'monthly' | 'yearly' | 'one_time';
    price_cents: number;
  }>;
};

type ApiResponseShape<T> = {
  data: T;
};

type PricingPlan = {
  level: string;
  icon: 'compliance' | 'product' | 'operational' | 'global';
  name: string;
  monthlyCents: number | null;
  yearlyCents: number | null;
  /** The TP firm's manual-audit fee at this level, in cents. */
  auditFeeCents: number;
  fee: string;
  description: string;
  /** Real journey milestones for this level (falls back to static features). */
  milestones: readonly string[];
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

// The API is the source of truth for level, name, price, period, milestones
// and the audit fee. Static content only augments what the API does not
// return (icon, CTA) — matched by position so the card order follows
// sort_order. Works for any number of packages.
//
// Each level ships as a single group whose `prices` array holds its monthly +
// yearly options, `milestones` its real journey milestone names (the card's
// feature checklist), and `audit_fee_cents` the TP firm's manual-audit fee.
// The landing page shows one card per level with a Monthly / Yearly toggle;
// both cadences are carried here and the section renders the selected one
// (plus a "save X%" badge when yearly is cheaper).
function buildPlans(apiGroups: ApiPackageGroup[]): PricingPlan[] {
  const fallbackIcon: PricingPlan['icon'] = 'compliance';

  const sorted = [...apiGroups].sort((a, b) => a.sort_order - b.sort_order);

  return sorted.map((pkg, i) => {
    const staticPlan = staticPricingPlans[i];
    const prices = pkg.prices ?? [];
    const findPrice = (period: 'monthly' | 'yearly') => prices.find((p) => p.billing_period === period)?.price_cents ?? null;
    const milestones = (pkg.milestones ?? []).map((m) => m.name);
    const auditFeeCents = Number(pkg.audit_fee_cents ?? 0);

    return {
      level: pkg.journey_level_code,
      icon: staticPlan?.icon ?? fallbackIcon,
      name: pkg.name || staticPlan?.name || 'Pathway',
      monthlyCents: findPrice('monthly'),
      yearlyCents: findPrice('yearly'),
      auditFeeCents,
      fee: auditFeeCents === 0 ? 'No verification fee' : `+${formatPrice(auditFeeCents)} manual audit fee`,
      description: pkg.description || staticPlan?.description || '',
      milestones: milestones.length > 0 ? milestones : (staticPlan?.features ?? []),
      cta: staticPlan?.cta ?? { label: 'Get Started', href: '/#cta' },
    };
  });
}

// Static fallback renders only until the API answers — its strings are the
// pre-API copy (`$49 / yr` etc.). The shape mirrors the API-driven plan so the
// section never has to branch on the source.
const staticFallbackPlans: PricingPlan[] = staticPricingPlans.map((plan, i) => ({
  level: plan.level,
  icon: plan.icon,
  name: plan.name,
  monthlyCents: i === 0 ? 0 : null,
  yearlyCents: parseFloat(plan.price.replace('$', '').replace(',', '')) || 0,
  auditFeeCents: 0,
  fee: plan.fee,
  description: plan.description,
  milestones: plan.features,
  cta: plan.cta,
}));

export function usePublicPricing() {
  const [plans, setPlans] = useState<PricingPlan[]>(staticFallbackPlans);

  useEffect(() => {
    let cancelled = false;

    publicApi
      .get<ApiResponseShape<ApiPackageGroup[]>>(PUBLIC_PACKAGES_ENDPOINT)
      .then((res) => {
        if (cancelled) return;
        const packages = res.data.data; // unwrap Laravel's { data: [...] } envelope
        if (!Array.isArray(packages) || packages.length === 0) return; // keep static fallback
        setPlans(buildPlans(packages));
      })
      .catch(() => {
        // Silent fallback — public page must never look broken.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return plans;
}
