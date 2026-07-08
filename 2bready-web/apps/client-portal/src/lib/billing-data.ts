import { BADGE_LEVELS, levelDocCount, type BadgeLevel, type LevelCode } from './journey-data';

// Per-level pricing, matching Landing Page_2bReady-9.html's "Standardized
// Service Pathways" section (Project Documents/) — each level is its own
// purchasable pathway (annual price + a separate one-time manual audit fee),
// not bundled into a flat subscription tier. The audit fee is the same
// mechanic as the TP Marketplace's per-level pricing (see Audits page /
// tp-data.ts) — here it represents the platform's own baseline verification
// fee before a company optionally hires a specific named firm.
export interface LevelPricing {
  level: BadgeLevel;
  annualPriceCents: number;
  auditFeeCents: number;
}

const PRICING_BY_LEVEL: Record<LevelCode, { annual: number; audit: number }> = {
  L1: { annual: 0, audit: 0 },
  L2: { annual: 4900, audit: 2500 },
  L3: { annual: 9900, audit: 7500 },
  L4: { annual: 19900, audit: 15000 },
};

export const LEVEL_PRICING: LevelPricing[] = BADGE_LEVELS.map((level) => ({
  level,
  annualPriceCents: PRICING_BY_LEVEL[level.level].annual,
  auditFeeCents: PRICING_BY_LEVEL[level.level].audit,
}));

export function levelSummary(level: BadgeLevel): string {
  return `${level.milestones.length} milestones · ${levelDocCount(level)} documents`;
}
