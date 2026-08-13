'use client';

import { useEffect, useState } from 'react';
import publicApi from '@/lib/publicApi';
import { pricingPlans as staticPricingPlans } from './content';

const PUBLIC_PACKAGES_ENDPOINT = '/pricing';

type ApiPackage = {
  id: string;
  name: string;
  name_kh: string | null;
  description: string;
  price_cents: number;
  billing_period: 'monthly' | 'yearly' | 'one_time';
  journey_level_code: string;
  industry_code: string | null;
  tier: string;
  sort_order: number;
};

type ApiResponseShape<T> = {
  data: T;
};

type PricingPlan = {
  level: string;
  icon: 'compliance' | 'product' | 'operational' | 'global';
  name: string;
  price: string;
  priceCents: number;
  period: string;
  fee: string;
  description: string;
  features: readonly string[];
  cta: { label: string; href: string };
};

function formatPrice(priceCents: number) {
  const dollars = priceCents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

// The API is the source of truth for level, name, price and period.
// Static content only augments what the API does not return (icon, features,
// audit fee line, CTA) — matched by position so the card order follows
// sort_order. Works for any number of packages.
//
// Each level now has TWO packages (monthly + yearly) — the landing page
// shows one card per level, using the yearly row (the headline offer); the
// full monthly/yearly choice lives on the client billing page's toggle.
function buildPlans(apiPackages: ApiPackage[]): PricingPlan[] {
  const fallbackIcon: PricingPlan['icon'] = 'compliance';
  const byLevel = new Map<string, ApiPackage>();

  for (const pkg of [...apiPackages].sort((a, b) => a.sort_order - b.sort_order)) {
    const key = pkg.journey_level_code || pkg.name;
    const existing = byLevel.get(key);
    // Prefer the yearly row; fall back to whatever exists (e.g. a one-time add-on).
    if (!existing || existing.billing_period !== 'yearly') {
      byLevel.set(key, pkg.billing_period === 'yearly' ? pkg : existing ?? pkg);
    }
  }

  const sorted = [...byLevel.values()].sort((a, b) => a.sort_order - b.sort_order);

  return sorted.map((pkg, i) => {
    const staticPlan = staticPricingPlans[i];
    return {
      level: pkg.journey_level_code,
      icon: staticPlan?.icon ?? fallbackIcon,
      name: pkg.name || staticPlan?.name || 'Pathway',
      price: formatPrice(pkg.price_cents),
      priceCents: pkg.price_cents,
      period: `/ ${pkg.billing_period}`,
      fee: staticPlan?.fee ?? '',
      description: pkg.description || staticPlan?.description || '',
      features: staticPlan?.features ?? [],
      cta: staticPlan?.cta ?? { label: 'Get Started', href: '/#cta' },
    };
  });
}

export function usePublicPricing() {
  const [plans, setPlans] = useState<PricingPlan[]>(
    staticPricingPlans as unknown as PricingPlan[]
  );

  useEffect(() => {
    let cancelled = false;

    publicApi
      .get<ApiResponseShape<ApiPackage[]>>(PUBLIC_PACKAGES_ENDPOINT)
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
