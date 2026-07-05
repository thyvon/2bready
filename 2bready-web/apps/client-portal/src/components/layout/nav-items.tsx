import type { ReactNode } from 'react';
import GridViewIcon from '@mui/icons-material/GridViewOutlined';
import RouteIcon from '@mui/icons-material/RouteOutlined';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';
import FolderSharedIcon from '@mui/icons-material/FolderSharedOutlined';
import ArticleIcon from '@mui/icons-material/ArticleOutlined';
import VerifiedIcon from '@mui/icons-material/VerifiedOutlined';
import CreditCardIcon from '@mui/icons-material/CreditCardOutlined';
import BusinessIcon from '@mui/icons-material/BusinessOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

// Flat, Drata-style top-level nav — one entry per domain that exists today
// (see 2bready-api domains). "Vault" and "legal-consent" from the MVP v3
// proposal are future domains, not yet built — intentionally not listed here
// until they exist. "Documents" below maps to the existing `document` domain.
export const CLIENT_NAV: NavItem[] = [
  { label: 'Overview',          href: '/',            icon: <GridViewIcon fontSize="small" /> },
  { label: 'Compliance Journey', href: '/journey',    icon: <RouteIcon fontSize="small" /> },
  { label: 'Audits',            href: '/audits',      icon: <AssignmentIcon fontSize="small" /> },
  { label: 'Documents',         href: '/documents',   icon: <LockIcon fontSize="small" /> },
  { label: 'Data Room',         href: '/data-room',   icon: <FolderSharedIcon fontSize="small" /> },
  { label: 'SOPs',              href: '/sops',        icon: <ArticleIcon fontSize="small" /> },
  { label: 'Trust Badge',       href: '/trust-badge', icon: <VerifiedIcon fontSize="small" /> },
  { label: 'Billing',           href: '/billing',     icon: <CreditCardIcon fontSize="small" /> },
  { label: 'Company Settings',  href: '/settings',    icon: <BusinessIcon fontSize="small" /> },
  { label: 'Support',           href: '/support',     icon: <HelpOutlineIcon fontSize="small" /> },
];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/') return pathname === '/';
  return pathname === item.href || pathname.startsWith(item.href + '/');
}
