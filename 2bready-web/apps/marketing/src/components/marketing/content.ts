import { adminUrl } from '@/lib/admin-url';

export const heroContent = {
  tagline: 'Comply. Scale. Lead.',
  headline: 'Compliance readiness, built into a trust engine',
  subheadline:
    "2bReady turns audit-readiness into a guided, verifiable journey — documents, auditors, and trust badges in one platform your investors and banks can actually trust.",
  primaryCta: { label: 'Get started free', href: adminUrl('/register') },
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
  primaryCta: { label: 'Get started free', href: adminUrl('/register') },
  secondaryCta: { label: 'Sign in', href: adminUrl('/login') },
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
    name: 'Compliance Readiness',
    price: '$0',
    period: '/ year',
    fee: 'No verification fee',
    description: 'Authoritative legal and tax structuring.',
    features: [
      'Verified MoC & Tax Registration',
      'ISIC Code & Articles of Incorporation',
      'Automated Patent & VAT Tracking',
      'NSSF & MLVT Labor Compliance',
    ],
    cta: { label: 'Start Free', href: adminUrl('/register') },
  },
  {
    level: 'L2',
    icon: 'product',
    name: 'Product Excellence',
    price: '$49',
    period: '/ year',
    fee: '+ $25 manual audit fee',
    description: 'Certified quality and safety standards.',
    features: [
      'Lab CoA & Nutrition Verification',
      'GHP / GMP / HACCP Monitoring',
      'Trademark & GS1 Barcoding',
      'Cost of Goods Sold (COGS) Analysis',
    ],
    cta: { label: 'Select Pathway', href: adminUrl('/register?level=l2') },
  },
  {
    level: 'L3',
    icon: 'operational',
    name: 'Operational Excellence',
    price: '$99',
    period: '/ year',
    fee: '+ $75 manual audit fee',
    description: 'Robust managerial and financial workflows.',
    features: [
      'Master SOP Architecture',
      'CAS-Compliant Chart of Accounts',
      'Financial Statement Preparation',
      'Bank Reconciliation & Tax Matching',
    ],
    cta: { label: 'Select Pathway', href: adminUrl('/register?level=l3') },
  },
  {
    level: 'L4',
    icon: 'global',
    name: 'Global Readiness',
    price: '$199',
    period: '/ year',
    fee: '+ $150 manual audit fee',
    description: 'Institutional investment & export grade.',
    features: [
      'Certified Independent Financial Audits',
      'Financial Forecasting & Valuation',
      'Global Standards (ISO, BRC, Halal)',
      'Export Logistics & ESG Reporting',
    ],
    cta: { label: 'Select Pathway', href: adminUrl('/register?level=l4') },
  },
] as const;

export const portfolioContent = {
  title: 'Trusted by Leading ASEAN Enterprises & Ecosystem Partners',
};

export const portfolioClients = [
  'Mekong Agri',
  'VATTANAC Mfg',
  'TonleSap Exports',
  'SovannMera',
] as const;

export const portfolioPartners = [
  'USAID Harvest III',
  'CAPRED Connect',
  'GIZ-EU CAPSAFE',
  'CamFEIA',
] as const;

export const stakeholdersContent = {
  title: 'Built for the Entire Ecosystem',
  subtitle:
    'Our hybrid evaluation model — combining AI extraction with expert verification — delivers uncompromising reliability across all sectors.',
};

export const stakeholders = [
  {
    icon: 'sme',
    title: 'ASEAN SMEs',
    description: 'Achieve audit-readiness, eliminate administrative bottlenecks, and scale operations securely without the overhead of massive compliance teams.',
  },
  {
    icon: 'banks',
    title: 'Institutional Banks',
    description: 'Access verified, bank-grade financial data through a Zero-Trust secure vault, accelerating loan approvals and mitigating risk.',
  },
  {
    icon: 'government',
    title: 'Governments & NGOs',
    description: 'Ensure strict adherence to local laws while supporting development partners in mapping SME growth and ESG sustainability.',
  },
  {
    icon: 'investors',
    title: 'Global Investors',
    description: 'Utilize the Smart Data Room to review certified pre-money valuations, independent audits, and institutional-grade financial forecasts.',
  },
] as const;

export const ecosystemContent = {
  title: 'The ADMIT Global Ecosystem',
  subtitle:
    'Achieving verified badges on the 2bReady platform directly unlocks premium connectivity to our specialized growth and commerce subsidiaries.',
};

export const ecosystemPartners = [
  {
    icon: 'consulting',
    name: 'ADMIT Unit',
    description: 'Expert consulting, Master SOP drafting, and dedicated compliance auditing to establish your operational foundation.',
  },
  {
    icon: 'commerce',
    name: '2bgro Commerce',
    description: 'Access exclusive B2B commerce channels utilizing your verified L2 Product Excellence badge.',
  },
  {
    icon: 'logistics',
    name: '2bShip Logistics',
    description: 'Premium cross-border fulfillment and supply chain solutions unlocked by achieving L3 Operational Excellence.',
  },
  {
    icon: 'investment',
    name: 'GoInvestors',
    description: 'Secure, institutional deal-room access reserved exclusively for L4 Global enterprises seeking capital injection.',
  },
] as const;

export const footerContent = {
  tagline: 'The Digital Trust Engine',
  poweredBy: 'Powered by ADMIT Global',
  copyright: '© 2026 2bReady – ADMIT Global Co., Ltd. Empowering ASEAN SMEs to Comply. Scale. Lead.',
};

export const footerColumns = [
  {
    title: 'Professional Services',
    items: [
      { label: 'Compliance Auditing' },
      { label: 'SOP Development' },
      { label: 'Financial Structuring' },
      { label: 'Export Readiness' },
    ],
  },
  {
    title: 'Headquarters',
    items: [
      { label: 'Phnom Penh, Cambodia' },
      { label: 'support@2bready.asia', href: 'mailto:support@2bready.asia' },
      { label: '+855 23 999 888', href: 'tel:+85523999888' },
    ],
  },
  {
    title: 'Legal & Security',
    items: [
      { label: 'Zero-Trust Policy', href: '/security' },
      { label: 'Data Protection (AWS)', href: '/security#data-protection' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
] as const;