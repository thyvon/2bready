'use client';

import type { ReactNode } from 'react';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import { useTranslation, type TranslationKey } from '@/lib/i18n';

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface NavItemDef {
  labelKey: TranslationKey;
  href: string;
  icon: ReactNode;
}

// This app only ever serves one role (auditor) — no admin-portal-style
// role-branching needed, just the flat list. Dashboard is a placeholder for
// a future analytics view; Companies is where the actual company-list +
// per-company Journey review work happens (mirrors admin-portal's own
// Dashboard/Companies split).
const NAV_ITEMS: NavItemDef[] = [
  { labelKey: 'nav.dashboard', href: '/dashboard', icon: <SpaceDashboardOutlinedIcon fontSize="small" /> },
  { labelKey: 'nav.companies', href: '/companies', icon: <BusinessOutlinedIcon fontSize="small" /> },
  { labelKey: 'nav.settings', href: '/settings', icon: <SettingsOutlinedIcon fontSize="small" /> },
];

export function useNavItems(): NavItem[] {
  const { t } = useTranslation();

  return NAV_ITEMS.map((d) => ({ label: t(d.labelKey), href: d.href, icon: d.icon }));
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
