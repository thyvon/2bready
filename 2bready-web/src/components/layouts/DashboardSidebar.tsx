'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';

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

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const COMPANY_NAV: NavItem[] = [
  { label: 'Dashboard',    href: '/company',           icon: <DashboardIcon fontSize="small" /> },
  { label: 'Company',      href: '/company/profile',   icon: <BusinessIcon fontSize="small" /> },
  { label: 'Journey',      href: '/company/journey',   icon: <RouteIcon fontSize="small" /> },
  { label: 'Documents',    href: '/company/documents',  icon: <DescriptionIcon fontSize="small" /> },
  { label: 'Subscription', href: '/company/billing',   icon: <PaymentIcon fontSize="small" /> },
  { label: 'Audit',        href: '/company/audit',     icon: <AssignmentIcon fontSize="small" /> },
  { label: 'Trust Badge',  href: '/company/badge',     icon: <VerifiedIcon fontSize="small" /> },
  { label: 'Data Room',    href: '/company/data-room', icon: <FolderSharedIcon fontSize="small" /> },
  { label: 'SOPs',         href: '/company/sops',      icon: <ArticleIcon fontSize="small" /> },
  { label: 'Support',      href: '/company/support',   icon: <SupportIcon fontSize="small" /> },
];

const AUDITOR_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/auditor',         icon: <DashboardIcon fontSize="small" /> },
  { label: 'My Audits', href: '/auditor/audits',  icon: <AssignmentIcon fontSize="small" /> },
  { label: 'Support',   href: '/auditor/support', icon: <SupportIcon fontSize="small" /> },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard',  href: '/admin',              icon: <DashboardIcon fontSize="small" /> },
  { label: 'Companies',  href: '/admin/companies',    icon: <BusinessIcon fontSize="small" /> },
  { label: 'Users',      href: '/admin/users',        icon: <PeopleIcon fontSize="small" /> },
  { label: 'Packages',   href: '/admin/packages',     icon: <PaymentIcon fontSize="small" /> },
  { label: 'Audits',     href: '/admin/audits',       icon: <AssignmentIcon fontSize="small" /> },
  { label: 'Documents',  href: '/admin/documents',    icon: <DescriptionIcon fontSize="small" /> },
  { label: 'Journey',    href: '/admin/journey',      icon: <RouteIcon fontSize="small" /> },
  { label: 'Support',    href: '/admin/support',      icon: <SupportIcon fontSize="small" /> },
  { label: 'Settings',   href: '/admin/settings',     icon: <SettingsIcon fontSize="small" /> },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = pathname === item.href || (item.href !== '/company' && item.href !== '/admin' && item.href !== '/auditor' && pathname.startsWith(item.href));

  return (
    <Tooltip title={item.label} placement="right" disableHoverListener>
      <Link href={item.href} style={{ textDecoration: 'none' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1.5,
            py: 0.875,
            borderRadius: 1,
            fontSize: '0.875rem',
            fontWeight: active ? 500 : 400,
            color: active ? 'text.primary' : 'text.secondary',
            bgcolor: active ? 'var(--2br-nav-active-bg)' : 'transparent',
            transition: 'all 0.1s ease',
            '&:hover': {
              color: 'text.primary',
              bgcolor: 'var(--2br-nav-hover-bg)',
            },
          }}
        >
          {item.icon}
          <Typography variant="body2" sx={{ fontWeight: 'inherit' }} color="inherit">
            {item.label}
          </Typography>
        </Box>
      </Link>
    </Tooltip>
  );
}

export default function DashboardSidebar() {
  const { hasAnyRole } = useAuthStore();

  const navItems = hasAnyRole(['admin', 'staff', 'finance'])
    ? ADMIN_NAV
    : hasAnyRole(['auditor'])
    ? AUDITOR_NAV
    : COMPANY_NAV;

  return (
    <Box
      component="aside"
      sx={{
        width: 240,
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 3, height: 56, display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', gap: 1.5 }}>
        <Box sx={{ width: 20, height: 20, borderRadius: '5px', bgcolor: 'text.primary', flexShrink: 0 }} />
        <Typography sx={{ fontWeight: 700, letterSpacing: '-0.04em', fontSize: '0.9375rem', color: 'text.primary' }}>
          2bReady
        </Typography>
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 2 }} className="flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </Box>

      <Divider />

      {/* Settings link at bottom */}
      <Box sx={{ px: 1.5, py: 1.5 }}>
        <NavLink item={{ label: 'Settings', href: '/settings', icon: <SettingsIcon fontSize="small" /> }} />
      </Box>
    </Box>
  );
}
