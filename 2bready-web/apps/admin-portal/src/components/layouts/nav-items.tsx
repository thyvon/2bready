'use client';

import type { ReactNode } from 'react';
import DashboardIcon from '@mui/icons-material/GridViewOutlined';
import BusinessIcon from '@mui/icons-material/BusinessOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import RouteIcon from '@mui/icons-material/RouteOutlined';
import PaymentIcon from '@mui/icons-material/CreditCardOutlined';
import SupportIcon from '@mui/icons-material/HelpOutlineOutlined';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';

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
  { labelKey: 'nav.packages',   href: '/packages',    icon: <PaymentIcon fontSize="small" /> },
  { labelKey: 'nav.payments',   href: '/payments',    icon: <ReceiptLongIcon fontSize="small" /> },
  { labelKey: 'nav.audits',     href: '/audits',      icon: <AssignmentIcon fontSize="small" /> },
  { labelKey: 'nav.documents',  href: '/documents',   icon: <DescriptionIcon fontSize="small" /> },
  { labelKey: 'nav.journey',    href: '/journey',     icon: <RouteIcon fontSize="small" /> },
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
