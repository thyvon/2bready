import type { components } from '@2bready/api-client';

export type Package = components['schemas']['PackageResource'];
export type BillingPeriod = components['schemas']['BillingPeriod'];
export type Tier = components['schemas']['Tier'];
export type JourneyLevel = components['schemas']['JourneyLevelResource'];

export type StorePackagePayload = {
  name: string;
  name_kh?: string;
  description?: string;
  price_cents: number;
  industry_id?: string;
  journey_level_id?: string;
  billing_period?: BillingPeriod;
  tier?: Tier;
  is_active?: boolean;
  sort_order?: number;
};

export type UpdatePackagePayload = Partial<StorePackagePayload>;
