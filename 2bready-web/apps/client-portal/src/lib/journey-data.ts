// Business model mined from the project owner's own concept prototype
// (Project Documents/2bReady_Port_third_Parthy — "Just Project Owner
// Concept"), not invented here: 3 pillars gated by subscription tier, each
// backed by a real document pathway (P1-P4). Structure matches the signed-off
// taxonomy (see project memory): Journey > Level > Milestone > documents —
// a Milestone is a named, orderable sub-unit of a level (what
// MilestoneCompletion tracks progress against), not just a document group.
// Plain strings for now, not translation keys — the shape of this page is
// still expected to change (per explicit user direction), so full i18n is
// deferred until the design settles.
export type Tier = 'free' | 'pro' | 'enterprise';

export const TIER_LABELS: Record<Tier, string> = {
  free: 'FREE',
  pro: 'PRO',
  enterprise: 'ENTERPRISE',
};

export interface Pillar {
  id: 'comply' | 'scale' | 'lead';
  label: string;
  name: string;
  sub: string;
  description: string;
  tier: Tier;
  /** Total documents required across this pillar's pathway(s) — Comply=P1(13), Scale=P2+P3(9+10=19), Lead=P4(6). */
  totalDocs: number;
}

export const PILLARS: Pillar[] = [
  {
    id: 'comply',
    label: 'Foundation',
    name: 'Comply',
    sub: 'Audit-Ready · Local Laws',
    description: 'Precision in GDT, MoC, MLVT compliance. Risk mitigation and full regulatory alignment.',
    tier: 'free',
    totalDocs: 13,
  },
  {
    id: 'scale',
    label: 'Momentum',
    name: 'Scale',
    sub: 'Automation · Efficiency',
    description: 'Remove bottlenecks of manual paperwork. Financial clarity and operational excellence.',
    tier: 'pro',
    totalDocs: 19,
  },
  {
    id: 'lead',
    label: 'Vision',
    name: 'Lead',
    sub: 'Investor Ready · Regional',
    description: 'Market authority, investor confidence, and regional expansion beyond Cambodia.',
    tier: 'enterprise',
    totalDocs: 6,
  },
];

export type LevelCode = 'L1' | 'L2' | 'L3' | 'L4';

export interface Milestone {
  name: string;
  docs: string[];
}

export interface BadgeLevel {
  level: LevelCode;
  emoji: string;
  name: string;
  pathwayName: string;
  pillar: Pillar['id'];
  tier: Tier;
  milestones: Milestone[];
}

export const BADGE_LEVELS: BadgeLevel[] = [
  {
    level: 'L1',
    emoji: '🔶',
    name: 'Bronze',
    pathwayName: 'The Launchpad',
    pillar: 'comply',
    tier: 'free',
    milestones: [
      {
        name: 'Corporate & Legal',
        docs: [
          'MoC Registration',
          'Articles of Incorporation',
          'ISIC Code Selection Analysis',
          'Business Name Reservation Certificate',
        ],
      },
      {
        name: 'Tax Compliance',
        docs: ['Annual Patent Tax', 'Value Added Tax (VAT) Certificate', 'Bank Account E-Filing Receipt'],
      },
      {
        name: 'Labor & NSSF',
        docs: ['Enterprise Opening Declaration (MLVT)', 'NSSF Membership Card', 'Company Internal Rules'],
      },
      {
        name: 'ID & Site Assets',
        docs: ['Shareholder ID / Passport', 'Lease Agreement or Land Title', 'Company Stamp Image & Digital Signature'],
      },
    ],
  },
  {
    level: 'L2',
    emoji: '🥈',
    name: 'Silver',
    pathwayName: 'Product Engineering',
    pillar: 'scale',
    tier: 'pro',
    milestones: [
      {
        name: 'Food Science',
        docs: ['Lab Report (Lab CoA)', 'Nutrition Facts Table', 'Shelf-life Test Report'],
      },
      {
        name: 'Regulatory & IP',
        docs: [
          'Product Registration Certificate',
          'Hygiene Standard Certificate (GHP/GMP/HACCP)',
          'Trademark Registration Certificate',
          'GS1 Membership and GTIN Tracker Table',
        ],
      },
      {
        name: 'Packaging & Value',
        docs: ['Final Label Artwork File', 'Cost of Goods Sold (COGS) Analysis'],
      },
    ],
  },
  {
    level: 'L3',
    emoji: '🥇',
    name: 'Gold',
    pathwayName: 'Operational Excellence',
    pillar: 'scale',
    tier: 'pro',
    milestones: [
      {
        name: 'SOP & Structure',
        docs: ['Organizational Chart', 'Job Descriptions', 'SOP Master Inventory', 'Core SOP Documents (Production & Warehouse)'],
      },
      {
        name: 'Audit-Ready Finance',
        docs: [
          'CAS Standard Accounting Chart',
          'Balance Sheet',
          'Income Statement / P&L',
          'Cash Flow Statement',
          'Bank Reconciliation Report',
          'Tax Return E-Filing Records',
        ],
      },
    ],
  },
  {
    level: 'L4',
    emoji: '💎',
    name: 'Platinum',
    pathwayName: 'Global Readiness',
    pillar: 'lead',
    tier: 'enterprise',
    milestones: [
      {
        name: 'Investable Finance',
        docs: ['CBC Credit Reports', 'Independent Audited Financial Reports', 'Financial Projections & Business Valuation'],
      },
      {
        name: 'Export Readiness',
        docs: [
          'Market Gap Analysis Report',
          'International Standard Certificates (ISO, BRC, Halal)',
          'International Logistics Strategy (Incoterms)',
        ],
      },
    ],
  },
];

/** Convenience accessor — every document across every milestone in a level. */
export function levelDocCount(level: BadgeLevel): number {
  return level.milestones.reduce((sum, m) => sum + m.docs.length, 0);
}

// Re-verification windows called out explicitly in the signed-off taxonomy —
// everything else has no expiry (a one-time document, e.g. Articles of
// Incorporation).
export const EXPIRY_MONTHS: Record<string, number> = {
  'Annual Patent Tax': 6,
  'Lab Report (Lab CoA)': 6,
  'CBC Credit Reports': 6,
  'Hygiene Standard Certificate (GHP/GMP/HACCP)': 12,
  'International Standard Certificates (ISO, BRC, Halal)': 12,
  'Independent Audited Financial Reports': 12,
};

export type DocStatus = 'pending' | 'verified' | 'review' | 'rejected' | 'expired';

export interface DocumentRow {
  name: string;
  level: LevelCode;
  levelName: string;
  milestone: string;
  tier: Tier;
  /** Every document is honestly "pending" until real upload/verification exists. */
  status: DocStatus;
  expiryMonths?: number;
}

/** Flattens every level/milestone into one list — the source for the Documents page's table. */
export function getAllDocuments(): DocumentRow[] {
  return BADGE_LEVELS.flatMap((level) =>
    level.milestones.flatMap((milestone) =>
      milestone.docs.map((name) => ({
        name,
        level: level.level,
        levelName: `${level.level} ${level.name}`,
        milestone: milestone.name,
        tier: level.tier,
        status: 'pending' as const,
        expiryMonths: EXPIRY_MONTHS[name],
      })),
    ),
  );
}
