import { levelTotalDocs, type JourneyLevel } from './journey-api';
import type { Package } from './package-api';

// Real pricing now — Package.price_cents/billing_period/tier, matched to
// its real journey level via journey_level_code. This used to be a fully
// local PRICING_BY_LEVEL map (a duplicate of what's now real Package data);
// removed once Package gained real tier/journey_level_id columns.
//
// Each level has TWO Package rows (monthly + yearly) so the customer can pick
// their billing cadence; grouping by level here gives the billing page the
// per-period prices it needs to render the Monthly/Yearly toggle.
export type BillingPeriod = 'monthly' | 'yearly' | 'one_time';

export interface LevelPricing {
  /** The package for the currently-selected billing period. */
  pkg: Package;
  level: JourneyLevel | null;
  /** Monthly and yearly rows for the same level, for the cadence toggle. */
  monthly: Package | null;
  yearly: Package | null;
}

export function buildLevelPricing(packages: Package[], levels: JourneyLevel[], period: BillingPeriod = 'yearly'): LevelPricing[] {
  const levelsByCode = new Map(levels.map((level) => [level.code, level]));
  const byLevel = new Map<string, { monthly: Package | null; yearly: Package | null }>();

  for (const pkg of packages) {
    const key = pkg.journey_level_code ?? pkg.id;
    const group = byLevel.get(key) ?? { monthly: null, yearly: null };
    if (pkg.billing_period === 'monthly') group.monthly = pkg;
    if (pkg.billing_period === 'yearly') group.yearly = pkg;
    byLevel.set(key, group);
  }

  const result: LevelPricing[] = [];
  for (const [key, group] of byLevel) {
    const pkg = period === 'monthly' ? (group.monthly ?? group.yearly) : (group.yearly ?? group.monthly);
    if (!pkg) continue;
    result.push({
      pkg,
      level: key && levelsByCode.has(key) ? (levelsByCode.get(key) ?? null) : null,
      monthly: group.monthly,
      yearly: group.yearly,
    });
  }

  // Keep the packages' own sort_order (L1 → L4), not insertion order of the map.
  const order = new Map(packages.map((p, i) => [p.id, i]));
  return result.sort((a, b) => (order.get(a.pkg.id) ?? 0) - (order.get(b.pkg.id) ?? 0));
}

export function levelSummary(level: JourneyLevel | null): string {
  if (!level) return '';
  return `${level.milestones.length} milestones · ${levelTotalDocs(level)} documents`;
}
