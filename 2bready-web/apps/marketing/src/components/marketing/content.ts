import { adminUrl } from '@/lib/admin-url';

export const heroContent = {
  tagline: 'Comply. Scale. Lead.',
  headline: 'The Digital Trust Engine for ASEAN.',
  subheadline:
    'A unified compliance and growth platform establishing verifiable trust between ambitious SMEs, Institutional Banks, Governments, and Global Investors.',
  primaryCta: { label: 'Explore Pathways', href: '/#pricing' },
  secondaryCta: { label: 'Why 2bReady?', href: '/#stakeholders' },
};

export const heroPills = [
  { icon: 'shield', label: 'Bank-Grade Security' },
  { icon: 'globe', label: 'ADMIT Global Ecosystem' },
] as const;

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
    period: '/ yr',
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
    period: '/ yr',
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
    period: '/ yr',
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
    period: '/ yr',
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
    'Our hybrid evaluation model — combining AI extraction with ADMIT Unit expert verification — delivers uncompromising reliability across all sectors.',
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
    description: 'Utilize the GoInvestors Smart Data Room to review certified pre-money valuations, independent audits, and institutional-grade financial forecasts.',
  },
] as const;

export const howItWorksContent = {
  title: 'How It Works',
  subtitle:
    'From registration to a verified badge — a clear, guided path to establishing trust with customers, partners, investors, and financial institutions.',
};

export const howItWorksSteps = [
  {
    icon: 'account',
    name: 'Create an Account & Set Up Your Company',
    description: 'Register your account and complete your company profile to get started.',
  },
  {
    icon: 'journey',
    name: 'Activate Your Customer Journey',
    description: 'Unlock your selected compliance or business readiness pathway to begin the journey.',
  },
  {
    icon: 'upload',
    name: 'Upload Required Documents',
    description: 'Submit the required business documents and supporting evidence through the platform.',
  },
  {
    icon: 'audit',
    name: 'Complete the Readiness Audit',
    description: 'Perform a self-assessment or work with an auditor to evaluate your compliance and readiness.',
  },
  {
    icon: 'badge',
    name: 'Verification & Trust Badge',
    description:
      'Once your submission is successfully verified, your company receives a Verified Trust Badge, demonstrating compliance and increasing credibility with customers, partners, investors, and financial institutions.',
  },
] as const;

export const ctaContent = {
  title: 'Ready to Get Started?',
  subtitle: 'Join ASEAN SMEs building verified trust with customers, banks, and investors on 2bReady.',
  cta: { label: 'Call to Action', href: adminUrl('/register') },
};

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