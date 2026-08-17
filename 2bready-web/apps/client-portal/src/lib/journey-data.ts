// The compliance document taxonomy itself (levels, milestones, documents,
// per-document status) is signed off and lives in the database now —
// journey_templates/journey_levels/milestones/document_templates, served via
// GET /api/v1/journey (see lib/journey-api.ts). Per explicit owner
// direction, that taxonomy is never to be hardcoded outside the database
// again. What's left here is genuinely local: subscription-tier labels and
// pillar marketing copy — display-only text with no backend column, unlike
// the actual unlock decision, which reads the real Package.tier/level.unlocked
// data (see project memory).
export type Tier = 'free' | 'starter' | 'pro' | 'enterprise';

export const TIER_LABELS: Record<Tier, string> = {
  free: 'FREE',
  starter: 'STARTER',
  pro: 'PRO',
  enterprise: 'ENTERPRISE',
};

// Only 4 levels exist today (real data confirms this via journey.levels),
// but this stays a literal union rather than `string` so pricing/purchase
// state (billing-data.ts) gets exhaustiveness checking against the levels
// that are actually priced.
export type LevelCode = 'L1' | 'L2' | 'L3' | 'L4';

export interface Pillar {
  id: 'comply' | 'scale' | 'lead';
  label: string;
  name: string;
  sub: string;
  description: string;
  tier: Tier;
}

export const PILLARS: Pillar[] = [
  {
    id: 'comply',
    label: 'Foundation',
    name: 'Comply',
    sub: 'Audit-Ready · Local Laws',
    description: 'Precision in GDT, MoC, MLVT compliance. Risk mitigation and full regulatory alignment.',
    tier: 'starter',
  },
  {
    id: 'scale',
    label: 'Momentum',
    name: 'Scale',
    sub: 'Automation · Efficiency',
    description: 'Remove bottlenecks of manual paperwork. Financial clarity and operational excellence.',
    tier: 'pro',
  },
  {
    id: 'lead',
    label: 'Vision',
    name: 'Lead',
    sub: 'Investor Ready · Regional',
    description: 'Market authority, investor confidence, and regional expansion beyond Cambodia.',
    tier: 'enterprise',
  },
];
