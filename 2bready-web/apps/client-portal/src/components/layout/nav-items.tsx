import { useTranslation, type TranslationKey } from '@/lib/i18n';

export interface NavItem {
  label: string;
  href: string;
  /** Used by both each domain's stub page and the Overview tile grid — one source, not duplicated per page. */
  description?: string;
}

interface NavItemDef {
  labelKey: TranslationKey;
  href: string;
  descriptionKey?: TranslationKey;
}

// Flat, Drata-style domain list — one entry per domain that exists today
// (see 2bready-api domains). "Vault" and "legal-consent" from the MVP v3
// proposal are future domains, not yet built — intentionally not listed here
// until they exist. "Documents" below maps to the existing `document` domain.
//
// Split into primary (shown inline in the navbar, mirrors the marketing
// site's 5-link nav) and secondary (tucked behind "More" so the bar stays
// clean instead of listing all 10 domains inline).
//
// label/description live in en.ts/kh.ts (keyed here, resolved via
// useNavItems()) rather than as literal strings, so the nav is translated.
const PRIMARY_NAV_DEFS = [
  { labelKey: 'nav.overview', href: '/' },
  { labelKey: 'nav.journey', href: '/journey', descriptionKey: 'nav.journey_desc' },
  { labelKey: 'nav.audits', href: '/audits', descriptionKey: 'nav.audits_desc' },
  { labelKey: 'nav.documents', href: '/documents', descriptionKey: 'nav.documents_desc' },
  { labelKey: 'nav.trust_badge', href: '/trust-badge', descriptionKey: 'nav.trust_badge_desc' },
] as const satisfies readonly NavItemDef[];

const SECONDARY_NAV_DEFS = [
  { labelKey: 'nav.data_room', href: '/data-room', descriptionKey: 'nav.data_room_desc' },
  { labelKey: 'nav.sops', href: '/sops', descriptionKey: 'nav.sops_desc' },
  { labelKey: 'nav.billing', href: '/billing', descriptionKey: 'nav.billing_desc' },
  { labelKey: 'nav.settings', href: '/settings', descriptionKey: 'nav.settings_desc' },
  { labelKey: 'nav.support', href: '/support', descriptionKey: 'nav.support_desc' },
] as const satisfies readonly NavItemDef[];

const CLIENT_NAV_DEFS = [...PRIMARY_NAV_DEFS, ...SECONDARY_NAV_DEFS] as const;

// Literal union of every valid nav href (e.g. '/' | '/journey' | '/audits' | ...)
// derived from CLIENT_NAV_DEFS itself — so passing a stale/typo'd href to
// DomainStubPage is a compile error, not a silent runtime fallback.
export type DomainHref = (typeof CLIENT_NAV_DEFS)[number]['href'];

function resolve(t: ReturnType<typeof useTranslation>['t'], def: NavItemDef): NavItem {
  return {
    label: t(def.labelKey),
    href: def.href,
    description: def.descriptionKey ? t(def.descriptionKey) : undefined,
  };
}

// Resolves labels/descriptions through the active locale — a hook (not a
// plain export) because translation depends on client-side locale state.
export function useNavItems() {
  const { t } = useTranslation();
  return {
    primary: PRIMARY_NAV_DEFS.map((def) => resolve(t, def)),
    secondary: SECONDARY_NAV_DEFS.map((def) => resolve(t, def)),
    all: CLIENT_NAV_DEFS.map((def) => resolve(t, def)),
  };
}

export function isNavItemActive(pathname: string, item: { href: string }): boolean {
  if (item.href === '/') return pathname === '/';
  return pathname === item.href || pathname.startsWith(item.href + '/');
}
