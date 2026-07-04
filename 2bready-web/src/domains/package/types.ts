// Local types — Package/Payment endpoints aren't in api.generated.ts yet
// (regenerate via `npm run generate:types` once the backend is reachable,
// then swap these for the generated schema types).

export type BillingPeriod = 'monthly' | 'yearly' | 'one_time';

export type Package = {
  id: string;
  name: string;
  name_kh: string | null;
  description: string | null;
  price_cents: number;
  billing_period: BillingPeriod;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type StorePackagePayload = {
  name: string;
  name_kh?: string;
  description?: string;
  price_cents: number;
  billing_period?: BillingPeriod;
  is_active?: boolean;
  sort_order?: number;
};

export type UpdatePackagePayload = Partial<StorePackagePayload>;
