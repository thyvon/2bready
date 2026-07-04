'use client';

import type { ReactNode } from 'react';
import DashboardIcon from '@mui/icons-material/GridViewOutlined';
import BusinessIcon from '@mui/icons-material/BusinessOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import RouteIcon from '@mui/icons-material/RouteOutlined';
import PaymentIcon from '@mui/icons-material/CreditCardOutlined';
import VerifiedIcon from '@mui/icons-material/VerifiedOutlined';
import SupportIcon from '@mui/icons-material/HelpOutlineOutlined';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import ArticleIcon from '@mui/icons-material/ArticleOutlined';
import FolderSharedIcon from '@mui/icons-material/FolderSharedOutlined';

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

const COMPANY_NAV: NavItemDef[] = [
  { labelKey: 'nav.dashboard',    href: '/company',           icon: <DashboardIcon fontSize="small" /> },
  { labelKey: 'nav.company',      href: '/company/profile',   icon: <BusinessIcon fontSize="small" /> },
  { labelKey: 'nav.journey',      href: '/company/journey',   icon: <RouteIcon fontSize="small" /> },
  { labelKey: 'nav.documents',    href: '/company/documents',  icon: <DescriptionIcon fontSize="small" /> },
  { labelKey: 'nav.subscription', href: '/company/billing',   icon: <PaymentIcon fontSize="small" /> },
  { labelKey: 'nav.audit',        href: '/company/audit',     icon: <AssignmentIcon fontSize="small" /> },
  { labelKey: 'nav.trust_badge',  href: '/company/badge',     icon: <VerifiedIcon fontSize="small" /> },
  { labelKey: 'nav.data_room',    href: '/company/data-room', icon: <FolderSharedIcon fontSize="small" /> },
  { labelKey: 'nav.sops',         href: '/company/sops',      icon: <ArticleIcon fontSize="small" /> },
  { labelKey: 'nav.support',      href: '/company/support',   icon: <SupportIcon fontSize="small" /> },
];

const AUDITOR_NAV: NavItemDef[] = [
  { labelKey: 'nav.dashboard', href: '/auditor',         icon: <DashboardIcon fontSize="small" /> },
  { labelKey: 'nav.my_audits', href: '/auditor/audits',  icon: <AssignmentIcon fontSize="small" /> },
  { labelKey: 'nav.support',   href: '/auditor/support', icon: <SupportIcon fontSize="small" /> },
];

const ADMIN_NAV: NavItemDef[] = [
  { labelKey: 'nav.dashboard',  href: '/admin',              icon: <DashboardIcon fontSize="small" /> },
  { labelKey: 'nav.companies',  href: '/admin/companies',    icon: <BusinessIcon fontSize="small" /> },
  { labelKey: 'nav.users',      href: '/admin/users',        icon: <PeopleIcon fontSize="small" /> },
  { labelKey: 'nav.packages',   href: '/admin/packages',     icon: <PaymentIcon fontSize="small" /> },
  { labelKey: 'nav.audits',     href: '/admin/audits',       icon: <AssignmentIcon fontSize="small" /> },
  { labelKey: 'nav.documents',  href: '/admin/documents',    icon: <DescriptionIcon fontSize="small" /> },
  { labelKey: 'nav.journey',    href: '/admin/journey',      icon: <RouteIcon fontSize="small" /> },
  { labelKey: 'nav.support',    href: '/admin/support',      icon: <SupportIcon fontSize="small" /> },
  { labelKey: 'nav.settings',   href: '/admin/settings',     icon: <SettingsIcon fontSize="small" /> },
];

export function useNavItems(): NavItem[] {
  const { hasAnyRole } = useAuthStore();
  const { t } = useTranslation();

  const defs = hasAnyRole(['admin', 'staff', 'finance'])
    ? ADMIN_NAV
    : hasAnyRole(['auditor'])
    ? AUDITOR_NAV
    : COMPANY_NAV;

  return defs.map((d) => ({ label: t(d.labelKey), href: d.href, icon: d.icon }));
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  const isSectionRoot = item.href === '/company' || item.href === '/admin' || item.href === '/auditor';
  return pathname === item.href || (!isSectionRoot && pathname.startsWith(item.href));
}
