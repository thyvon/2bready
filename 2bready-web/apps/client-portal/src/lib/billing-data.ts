import { levelTotalDocs, type JourneyLevel } from './journey-api';
import type { Package } from './package-api';

// Real pricing now — Package.price_cents/billing_period/tier, matched to
// its real journey level via journey_level_code. This used to be a fully
// local PRICING_BY_LEVEL map (a duplicate of what's now real Package data);
// removed once Package gained real tier/journey_level_id columns.
export interface LevelPricing {
  pkg: Package;
  level: JourneyLevel | null;
}

export function buildLevelPricing(packages: Package[], levels: JourneyLevel[]): LevelPricing[] {
  const levelsByCode = new Map(levels.map((level) => [level.code, level]));
  return packages.map((pkg) => ({
    pkg,
    level: pkg.journey_level_code ? (levelsByCode.get(pkg.journey_level_code) ?? null) : null,
  }));
}

export function levelSummary(level: JourneyLevel | null): string {
  if (!level) return '';
  return `${level.milestones.length} milestones · ${levelTotalDocs(level)} documents`;
}
