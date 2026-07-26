'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';

import { useTranslation, type TranslationKey } from '@/lib/i18n';

const SIDEBAR_WIDTH = 240;

interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: <SpaceDashboardOutlinedIcon fontSize="small" /> },
  { href: '/settings/profile', labelKey: 'nav.profile', icon: <PersonOutlineOutlinedIcon fontSize="small" /> },
];

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const { t } = useTranslation();

  return (
    <Link href={item.href} onClick={onNavigate} style={{ textDecoration: 'none' }}>
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
          bgcolor: active ? 'action.selected' : 'transparent',
          '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
        }}
      >
        {item.icon}
        {t(item.labelKey)}
      </Box>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: SIDEBAR_WIDTH }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 2.5 }}>
        <Box sx={{ width: 20, height: 20, borderRadius: '5px', bgcolor: 'text.primary', flexShrink: 0 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          2bReady — TP Portal
        </Typography>
      </Box>
      <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, px: 1.5, flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </Box>
    </Box>
  );
}

interface DashboardSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function DashboardSidebar({ mobileOpen, onMobileClose }: DashboardSidebarProps) {
  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: SIDEBAR_WIDTH } }}
      >
        <SidebarContent onNavigate={onMobileClose} />
      </Drawer>
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <SidebarContent />
      </Box>
    </>
  );
}
