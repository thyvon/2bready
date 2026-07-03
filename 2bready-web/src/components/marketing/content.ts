export const heroContent = {
  tagline: 'Comply. Scale. Lead.',
  headline: 'Compliance readiness, built into a trust engine',
  subheadline:
    "2bReady turns audit-readiness into a guided, verifiable journey — documents, auditors, and trust badges in one platform your investors and banks can actually trust.",
  primaryCta: { label: 'Get started free', href: '/register' },
  secondaryCta: { label: 'See how it works', href: '/#features' },
};

export const heroPills = [
  { icon: 'shield', label: 'Bank-grade security' },
  { icon: 'timeline', label: 'Guided compliance journey' },
  { icon: 'groups', label: 'Real auditor network' },
] as const;

export const trustScorePreviewContent = {
  score: 72,
  levels: ['L1', 'L2', 'L3', 'L4'],
  activeLevels: 3,
  caption: 'Operational Excellence badge in progress',
};

export const featuresContent = {
  title: 'Everything audit-readiness needs',
  subtitle: 'Eight modules that take a company from first registration to a verified, investor-ready trust badge.',
};

export const features = [
  { icon: 'userManagement', title: 'User management', description: 'Multi-role access with company, auditor, and admin permissions built in.' },
  { icon: 'dashboard', title: 'Live dashboard', description: 'Trust score, milestone tracking, and notifications in one KPI overview.' },
  { icon: 'journey', title: 'Compliance journey', description: 'Comply, Scale, Lead — four levels with progress and trust-badge milestones.' },
  { icon: 'dataCenter', title: 'Secure data center', description: 'Upload, search, and version every compliance document behind a protected vault.' },
  { icon: 'audit', title: 'Audit management', description: 'Pending reviews, approvals, and full audit-log history, exportable on demand.' },
  { icon: 'auditors', title: 'Auditor marketplace', description: 'Match with verified third-party auditors and track review status end to end.' },
  { icon: 'dataRoom', title: 'Smart data room', description: 'Time-limited, permissioned links for investors and banks to review evidence.' },
  { icon: 'sop', title: 'SOP management', description: 'Publish SOPs, collect employee sign-off, and track acknowledgment automatically.' },
] as const;

export const journeyContent = {
  title: 'One journey, four levels, a permanent trust badge',
  subtitle:
    "Every milestone is verified and anchored to your company's digital trust profile — visible to auditors, banks, and investors the moment it's earned.",
};

export const journeyLevels = [
  { level: 'L1', group: 'Comply', title: 'Compliance readiness', description: 'Legal registration, tax, and labor compliance verified.' },
  { level: 'L2', group: 'Comply', title: 'Product excellence', description: 'Quality, safety, and IP standards certified.' },
  { level: 'L3', group: 'Scale', title: 'Operational excellence', description: 'SOPs, financial workflows, and reporting in place.' },
  { level: 'L4', group: 'Lead', title: 'Global readiness', description: 'Independent audits and export-grade standards achieved.' },
] as const;

export const ctaContent = {
  title: 'Ready to become audit-ready?',
  description: 'Create your company profile and start your first compliance level today — no credit card required.',
  primaryCta: { label: 'Get started free', href: '/register' },
  secondaryCta: { label: 'Sign in', href: '/login' },
};

export const pricingContent = {
  title: 'Standardized service pathways',
  subtitle:
    'Progress your enterprise from foundational legal licensing to institutional investment readiness. Each level is verified and permanently anchored in your digital trust profile.',
};

export const pricingPlans = [
  {
    level: 'L1',
    icon: 'compliance',
    name: 'The Launchpad',
    badge: 'Bronze Foundation · Licensed',
    price: '$0',
    period: '/ year',
    fee: 'No verification fee',
    features: [
      'MoC Business Registration',
      'Articles of Incorporation (AoI)',
      'ISIC Code Analysis & Selection',
      'Business Name Reservation Certificate',
      'Annual Patent Tax (with expiry tracking)',
      'VAT Certificate',
      'Bank Account E-Filing Receipt',
      'MLVT Enterprise Declaration',
      'NSSF Membership Card',
      'Internal Company Regulations',
      'Shareholder ID/Passport',
      'Lease Agreement / Land Title',
      'Company Stamp & Digital Signature',
    ],
    cta: { label: 'Start Free', href: '/register' },
  },
  {
    level: 'L2',
    icon: 'product',
    name: 'Product Engineering',
    badge: 'Silver Quality · Certified',
    price: '$49',
    period: '/ year',
    fee: '+ $25 one-time verification fee',
    features: [
      'Lab Certificate of Analysis (CoA) – expiry tracked',
      'Nutrition Facts Table',
      'Shelf-life Study Report',
      'Product Registration Certificate',
      'GHP/GMP/HACCP Certificate – expiry tracked',
      'Trademark Registration Certificate',
      'GS1 Membership & GTIN Tracker',
      'Final Approved Label Artwork',
      'COGS Analysis (Cost of Goods Sold)',
    ],
    cta: { label: 'Subscribe', href: '/register?level=l2' },
  },
  {
    level: 'L3',
    icon: 'operational',
    name: 'Operational Excellence',
    badge: 'Gold Structure · Optimized',
    price: '$99',
    period: '/ year',
    fee: '+ $75 one-time verification fee',
    features: [
      'Organizational Chart',
      'Job Descriptions for all roles',
      'Master SOP Inventory',
      'Core SOPs (Production & Warehouse)',
      'CAS Standard Chart of Accounts',
      'Balance Sheet',
      'Income Statement (P&L)',
      'Cash Flow Statement',
      'Bank Reconciliation Report',
      'Tax Return E-Filing Records',
    ],
    cta: { label: 'Subscribe', href: '/register?level=l3' },
  },
  {
    level: 'L4',
    icon: 'global',
    name: 'Global Readiness',
    badge: 'Platinum Prestige · Investable',
    price: '$199',
    period: '/ year',
    fee: '+ $150 one-time verification fee',
    features: [
      'CBC Credit Report (expiry 3-6 months)',
      'Independent Audited Financial Statements',
      'Financial Projections & Business Valuation',
      'Market Gap Analysis Report',
      'ISO / BRC / Halal Certificates – expiry tracked',
      'Incoterms & International Logistics Strategy',
    ],
    cta: { label: 'Subscribe', href: '/register?level=l4' },
  },
] as const;