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

function mergeWithStatic(apiPackages: ApiPackage[]): PricingPlan[] {
  if (apiPackages.length !== staticPricingPlans.length) {
    return staticPricingPlans as unknown as PricingPlan[];
  }

  const sorted = [...apiPackages].sort((a, b) => a.sort_order - b.sort_order);

  return staticPricingPlans.map((staticPlan, i) => {
    const apiPlan = sorted[i];
    return {
      ...staticPlan,
      name: apiPlan.name || staticPlan.name,
      description: apiPlan.description || staticPlan.description,
      price: formatPrice(apiPlan.price_cents),
      period: `/ ${apiPlan.billing_period}`,
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
        setPlans(mergeWithStatic(packages));
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