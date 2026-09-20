import { levelTotalDocs, type JourneyLevel, type JourneyMilestone, type JourneyDocument } from './journey-api';
import type { PackageGroup, PackagePrice } from './package-api';
import type { components } from '@2bready/api-client';
import type { TranslationKey } from './i18n';

type JourneyPillar = components['schemas']['JourneyPillar'];

// Real pricing now — the public /pricing endpoint returns one PackageGroup per
// journey level with the monthly + yearly options nested under `prices`
// (each carrying its own id for subscribing to a specific cadence). This used
// to be a fully local PRICING_BY_LEVEL map (a duplicate of what's now real
// Package data); removed once Package gained real tier/journey_level_id columns.
//
// buildLevelPricing flattens the per-period prices so the billing page can
// render the Monthly/Yearly toggle and pass the selected period's package id
// to subscribeToPackage.
export type BillingPeriod = 'monthly' | 'yearly' | 'one_time';

export interface LevelPricing {
  /** The package for the currently-selected billing period. */
  pkg: PackagePrice & {
    name: string;
    name_kh: string | null;
    description: string | null;
    tier: components['schemas']['Tier'];
    journey_level_code: string | undefined;
  };
  level: JourneyLevel | null;
  /** Monthly and yearly prices for the same level, for the cadence toggle. */
  monthly: PackagePrice | null;
  yearly: PackagePrice | null;
}

/**
 * Build a synthetic JourneyLevel from a PackageGroup when no real journey
 * exists (e.g. company's industry/country has no JourneyTemplate yet).
 * The public pricing endpoint already carries code, milestones, and
 * document-templates — enough to render the pathway card.
 */
function buildSyntheticLevel(group: PackageGroup): JourneyLevel | null {
  if (!group.journey_level_code) return null;

  const milestones: JourneyMilestone[] = (group.milestones ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    sort_order: m.sort_order,
    completed: '',
    documents: (m.document_templates ?? []).map(
      (dt) =>
        ({
          id: dt.id,
          document_id: '',
          name: dt.name,
          is_required: true,
          client_can_add_subdocs: false,
          parent_id: null,
          recurrence_type: 'one_time',
          expiry_months: null,
          status: 'pending',
          verified_at: null,
          company_id: null,
          history: [],
          children: [],
        }) satisfies JourneyDocument,
    ),
  }));

  return {
    id: `synthetic-${group.journey_level_code}`,
    code: group.journey_level_code,
    name: group.name,
    pathway_name: group.pathway_name ?? group.name,
    pillar: (group.pillar ?? 'verify') as JourneyPillar,
    unlocked: false,
    medal_image_url: null,
    milestones,
  };
}

export function buildLevelPricing(packages: PackageGroup[], levels: JourneyLevel[], period: BillingPeriod = 'yearly'): LevelPricing[] {
  const levelsByCode = new Map(levels.map((level) => [level.code, level]));

  return packages
    .map((group) => {
      const prices = group.prices ?? [];
      const monthly = prices.find((p) => p.billing_period === 'monthly') ?? null;
      const yearly = prices.find((p) => p.billing_period === 'yearly') ?? null;
      const pkg = period === 'monthly' ? (monthly ?? yearly) : (yearly ?? monthly);
      if (!pkg) return null;

      const level =
        (group.journey_level_code && levelsByCode.get(group.journey_level_code)) ??
        buildSyntheticLevel(group);

      return {
        pkg: {
          ...pkg,
          name: group.name,
          name_kh: group.name_kh,
          description: group.description,
          tier: group.tier,
          journey_level_code: group.journey_level_code,
        },
        level,
        monthly,
        yearly,
      };
    })
    .filter((p): p is LevelPricing => p !== null);
}

export function levelSummary(level: JourneyLevel | null, t: (key: TranslationKey, vars?: Record<string, string | number>) => string): string {
  if (!level) return '';
  return t('billing.level_summary', { milestones: level.milestones.length, documents: levelTotalDocs(level) });
}
