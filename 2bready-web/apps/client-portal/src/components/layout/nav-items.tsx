export interface NavItem {
  label: string;
  href: string;
  /** Used by both each domain's stub page and the Overview tile grid — one source, not duplicated per page. */
  description?: string;
}

// Flat, Drata-style domain list — one entry per domain that exists today
// (see 2bready-api domains). "Vault" and "legal-consent" from the MVP v3
// proposal are future domains, not yet built — intentionally not listed here
// until they exist. "Documents" below maps to the existing `document` domain.
//
// Split into primary (shown inline in the navbar, mirrors the marketing
// site's 5-link nav) and secondary (tucked behind "More" so the bar stays
// clean instead of listing all 10 domains inline).
export const PRIMARY_NAV = [
  { label: 'Overview', href: '/' },
  {
    label: 'Compliance Journey',
    href: '/journey',
    description: 'Your guided, step-by-step compliance checklist will appear here.',
  },
  {
    label: 'Audits',
    href: '/audits',
    description: 'Audit requests, status, and findings for your company will appear here.',
  },
  {
    label: 'Documents',
    href: '/documents',
    description: 'Upload and manage your compliance documents here.',
  },
  {
    label: 'Trust Badge',
    href: '/trust-badge',
    description: 'Your shareable trust badge and public status page will appear here.',
  },
] as const satisfies readonly NavItem[];

export const SECONDARY_NAV = [
  {
    label: 'Data Room',
    href: '/data-room',
    description: 'Documents shared with auditors and other third parties will appear here.',
  },
  {
    label: 'SOPs',
    href: '/sops',
    description: 'Your standard operating procedures library will appear here.',
  },
  {
    label: 'Billing',
    href: '/billing',
    description: 'Your subscription plan and payment history will appear here.',
  },
  {
    label: 'Company Settings',
    href: '/settings',
    description: 'Your company profile and account settings will appear here.',
  },
  {
    label: 'Support',
    href: '/support',
    description: 'Contact support and view your open tickets here.',
  },
] as const satisfies readonly NavItem[];

export const CLIENT_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV] as const;

// Literal union of every valid nav href (e.g. '/' | '/journey' | '/audits' | ...)
// derived from CLIENT_NAV itself — so passing a stale/typo'd href to
// DomainStubPage is a compile error, not a silent runtime fallback.
export type DomainHref = (typeof CLIENT_NAV)[number]['href'];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/') return pathname === '/';
  return pathname === item.href || pathname.startsWith(item.href + '/');
}
