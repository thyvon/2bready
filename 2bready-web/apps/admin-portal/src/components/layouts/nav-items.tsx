'use client';

import type { ReactNode } from 'react';
import DashboardIcon from '@mui/icons-material/GridViewOutlined';
import BusinessIcon from '@mui/icons-material/BusinessOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import PaymentIcon from '@mui/icons-material/CreditCardOutlined';
import SupportIcon from '@mui/icons-material/HelpOutlineOutlined';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';
import HistoryIcon from '@mui/icons-material/HistoryOutlined';
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';

import { useAuthStore } from '@/store/auth.store';
import { useTranslation } from '@/lib/i18n';

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface NavItemDef {
  labelKey: Parameters<ReturnType<typeof useTranslation>['t']>[0];
  href: string;
  icon: ReactNode;
}

const AUDITOR_NAV: NavItemDef[] = [
  { labelKey: 'nav.dashboard', href: '/auditor',         icon: <DashboardIcon fontSize="small" /> },
  { labelKey: 'nav.my_audits', href: '/auditor/audits',  icon: <AssignmentIcon fontSize="small" /> },
  { labelKey: 'nav.support',   href: '/auditor/support', icon: <SupportIcon fontSize="small" /> },
];

// Hrefs here are internal app routes (relative to this app's own root), NOT
// external URLs — next/link and router.push() both auto-prepend `basePath`
// (/admin in production, see next.config.ts) when resolving them. Writing
// "/admin" as a literal prefix in any of these was the actual bug behind the
// /admin/admin/* doubling: it manually duplicated what basePath already
// adds. The route folder structure under src/app/(dashboard)/ was renamed
// to match (no more redundant "admin" segment) — keep the two in sync.
const ADMIN_NAV: NavItemDef[] = [
  { labelKey: 'nav.dashboard',  href: '/',            icon: <DashboardIcon fontSize="small" /> },
  { labelKey: 'nav.companies',  href: '/companies',   icon: <BusinessIcon fontSize="small" /> },
  { labelKey: 'nav.users',      href: '/users',       icon: <PeopleIcon fontSize="small" /> },
  { labelKey: 'nav.roles',      href: '/roles',       icon: <BadgeIcon fontSize="small" /> },
  { labelKey: 'nav.packages',   href: '/packages',    icon: <PaymentIcon fontSize="small" /> },
  { labelKey: 'nav.payments',   href: '/payments',    icon: <ReceiptLongIcon fontSize="small" /> },
  { labelKey: 'nav.tp_partners', href: '/tp-partners', icon: <HandshakeOutlinedIcon fontSize="small" /> },
  { labelKey: 'nav.audits',     href: '/audits',      icon: <AssignmentIcon fontSize="small" /> },
  { labelKey: 'nav.documents',  href: '/documents',   icon: <DescriptionIcon fontSize="small" /> },
  { labelKey: 'nav.journey_templates', href: '/journey-templates', icon: <AccountTreeOutlinedIcon fontSize="small" /> },
  { labelKey: 'nav.audit_logs', href: '/audit-logs',  icon: <HistoryIcon fontSize="small" /> },
  { labelKey: 'nav.support',    href: '/support',     icon: <SupportIcon fontSize="small" /> },
  { labelKey: 'nav.settings',   href: '/settings',    icon: <SettingsIcon fontSize="small" /> },
];

// This app is back-office only (admin/staff/finance/auditor) — company_owner/
// company_member accounts belong exclusively in client-portal and have no nav
// here at all. If one somehow lands on a dashboard page, an empty nav is the
// correct degenerate case; the actual redirect-out lives in dashboard/page.tsx.
export function useNavItems(): NavItem[] {
  const { hasAnyRole } = useAuthStore();
  const { t } = useTranslation();

  const defs = hasAnyRole(['admin', 'staff', 'finance'])
    ? ADMIN_NAV
    : hasAnyRole(['auditor'])
    ? AUDITOR_NAV
    : [];

  return defs.map((d) => ({ label: t(d.labelKey), href: d.href, icon: d.icon }));
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  const isSectionRoot = item.href === '/' || item.href === '/auditor';
  return pathname === item.href || (!isSectionRoot && pathname.startsWith(item.href));
}

// ─── Grouped structure for the horizontal top nav's mega-menu ───────────────
// A second, purpose-built shape alongside useNavItems() above (which stays
// flat — the sidebar, mobile drawer, and PageHeader's breadcrumbs all still
// consume it unchanged). Only DashboardNavHorizontal reads this one.

export interface NavLinkEntry {
  type: 'link';
  label: string;
  href: string;
  icon: ReactNode;
}

export interface NavGroupEntry {
  type: 'group';
  label: string;
  items: { label: string; description: string; href: string; icon: ReactNode }[];
}

export type NavEntry = NavLinkEntry | NavGroupEntry;

type NavEntryDef =
  | { type: 'link'; labelKey: NavItemDef['labelKey']; href: string; icon: ReactNode }
  | {
      type: 'group';
      labelKey: NavItemDef['labelKey'];
      items: { labelKey: NavItemDef['labelKey']; descriptionKey: NavItemDef['labelKey']; href: string; icon: ReactNode }[];
    };

// Auditor's 3 items are too few to gain anything from grouping — plain links only.
const AUDITOR_NAV_ENTRIES: NavEntryDef[] = AUDITOR_NAV.map((d) => ({ type: 'link', ...d }));

const ADMIN_NAV_ENTRIES: NavEntryDef[] = [
  { type: 'link', labelKey: 'nav.dashboard', href: '/', icon: <DashboardIcon fontSize="small" /> },
  { type: 'link', labelKey: 'nav.companies', href: '/companies', icon: <BusinessIcon fontSize="small" /> },
  {
    type: 'group',
    labelKey: 'nav.group_access',
    items: [
      { labelKey: 'nav.users', descriptionKey: 'nav.desc_users', href: '/users', icon: <PeopleIcon fontSize="small" /> },
      { labelKey: 'nav.roles', descriptionKey: 'nav.desc_roles', href: '/roles', icon: <BadgeIcon fontSize="small" /> },
    ],
  },
  {
    type: 'group',
    labelKey: 'nav.group_billing',
    items: [
      { labelKey: 'nav.packages', descriptionKey: 'nav.desc_packages', href: '/packages', icon: <PaymentIcon fontSize="small" /> },
      { labelKey: 'nav.payments', descriptionKey: 'nav.desc_payments', href: '/payments', icon: <ReceiptLongIcon fontSize="small" /> },
      { labelKey: 'nav.tp_partners', descriptionKey: 'nav.desc_tp_partners', href: '/tp-partners', icon: <HandshakeOutlinedIcon fontSize="small" /> },
    ],
  },
  {
    type: 'group',
    labelKey: 'nav.group_compliance',
    items: [
      { labelKey: 'nav.documents', descriptionKey: 'nav.desc_documents', href: '/documents', icon: <DescriptionIcon fontSize="small" /> },
      { labelKey: 'nav.journey_templates', descriptionKey: 'nav.desc_journey_templates', href: '/journey-templates', icon: <AccountTreeOutlinedIcon fontSize="small" /> },
      { labelKey: 'nav.audits', descriptionKey: 'nav.desc_audits', href: '/audits', icon: <AssignmentIcon fontSize="small" /> },
      { labelKey: 'nav.audit_logs', descriptionKey: 'nav.desc_audit_logs', href: '/audit-logs', icon: <HistoryIcon fontSize="small" /> },
    ],
  },
  { type: 'link', labelKey: 'nav.support', href: '/support', icon: <SupportIcon fontSize="small" /> },
  { type: 'link', labelKey: 'nav.settings', href: '/settings', icon: <SettingsIcon fontSize="small" /> },
];

export function useNavGroups(): NavEntry[] {
  const { hasAnyRole } = useAuthStore();
  const { t } = useTranslation();

  const defs = hasAnyRole(['admin', 'staff', 'finance'])
    ? ADMIN_NAV_ENTRIES
    : hasAnyRole(['auditor'])
    ? AUDITOR_NAV_ENTRIES
    : [];

  return defs.map((d) =>
    d.type === 'link'
      ? { type: 'link', label: t(d.labelKey), href: d.href, icon: d.icon }
      : {
          type: 'group',
          label: t(d.labelKey),
          items: d.items.map((i) => ({ label: t(i.labelKey), description: t(i.descriptionKey), href: i.href, icon: i.icon })),
        }
  );
}
