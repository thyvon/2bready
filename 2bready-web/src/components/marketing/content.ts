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
