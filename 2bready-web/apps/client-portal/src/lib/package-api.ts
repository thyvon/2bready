import api from '@/lib/api';
import type { components } from '@2bready/api-client';
import type { Tier } from '@/lib/journey-data';

// The public /pricing endpoint returns one entry per journey level, with the
// monthly/yearly prices nested under `prices` (each price carries its own id
// so a consumer can subscribe to a specific cadence). See the backend's
// PublicPackageGroupResource.
export type PackageGroup = components['schemas']['PublicPackageGroupResource'];
export type PackagePrice = components['schemas']['PublicPackagePriceResource'];

// Public, unauthenticated pricing list — real source of truth for per-level
// tier and price. Was previously duplicated as a hardcoded local map
// (journey-data.ts's old PRICING_BY_LEVEL / journey-api.ts's LEVEL_META
// tier field) before Package gained real `tier`/`journey_level_id` columns.
export async function getPublicPackages(): Promise<PackageGroup[]> {
  const res = await api.get<{ data: PackageGroup[] }>('/pricing');
  return res.data.data;
}

// Not every package gates a journey level (e.g. a future add-on package
// might not), so this only maps the ones that do.
export function tierByLevelCode(packages: PackageGroup[]): Record<string, Tier> {
  const map: Record<string, Tier> = {};
  for (const pkg of packages) {
    if (pkg.journey_level_code) map[pkg.journey_level_code] = pkg.tier;
  }
  return map;
}
