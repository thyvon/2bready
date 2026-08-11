'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { useNavItems, isNavItemActive, type NavItem } from '@/components/layouts/nav-items';
import { useLayoutStore } from '@/store/layout.store';
import { useTranslation } from '@/lib/i18n';
import { useBrandLogoForTheme } from '@/domains/branding/hooks';
import { BrandLogo } from '@2bready/ui-core';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 72;

function NavLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, item);

  return (
    <Tooltip title={item.label} placement="right" disableHoverListener={!collapsed}>
      <Link href={item.href} onClick={onNavigate} style={{ textDecoration: 'none' }}>
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 1.5,
            px: collapsed ? 0 : 1.5,
            py: 0.875,
            borderRadius: 1,
            fontSize: '0.875rem',
            fontWeight: active ? 500 : 400,
            color: active ? 'text.primary' : 'text.secondary',
            transition: 'color 0.15s ease',
            '&:hover': { color: 'text.primary' },
          }}
        >
          {/* Always rendered (not conditionally mounted) — see admin-portal's
              identical NavLink for why: an opacity toggle has no mount/unmount
              race to lose, unlike a shared framer-motion layoutId pill. */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '6px',
              bgcolor: 'var(--2br-nav-active-bg)',
              opacity: active ? 1 : 0,
              transition: 'opacity 0.15s ease',
              zIndex: 0,
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {item.icon}
            {!collapsed && (
              <Typography variant="body2" sx={{ fontWeight: 'inherit', whiteSpace: 'nowrap' }} color="inherit">
                {item.label}
              </Typography>
            )}
          </Box>
        </Box>
      </Link>
    </Tooltip>
  );
}

function SidebarContent({
  navItems,
  collapsed,
  onNavigate,
}: {
  navItems: NavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const logoUrl = useBrandLogoForTheme();

  return (
    <>
      {/* Logo — the admin-uploaded platform logo for the current theme when
          one exists (business branding), otherwise the placeholder mark. */}
      <Box
        sx={{
          px: collapsed ? 0 : 3,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid',
          borderColor: 'divider',
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        <BrandLogo
          logoUrl={logoUrl}
          height={56}
          maxWidth={collapsed ? 44 : 200}
          fallback={<Box sx={{ width: 20, height: 20, borderRadius: '5px', bgcolor: 'text.primary', flexShrink: 0 }} />}
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 1.5, py: 2 }} className="flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </Box>
    </>
  );
}

interface DashboardSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function DashboardSidebar({ mobileOpen, onMobileClose }: DashboardSidebarProps) {
  const navItems = useNavItems();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useLayoutStore();
  const { t } = useTranslation();

  return (
    <>
      {/* Desktop — permanent, sticky, collapsible to an icon-only rail. Mobile
          drawer below is always full-width (collapsing an overlay you close
          entirely anyway isn't useful) so this preference doesn't apply there. */}
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          flexShrink: 0,
          height: '100vh',
          position: 'sticky',
          top: 0,
          flexDirection: 'column',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
        }}
      >
        <SidebarContent navItems={navItems} collapsed={sidebarCollapsed} />

        <Box
          sx={{
            p: 1,
            display: 'flex',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-end',
            flexShrink: 0,
          }}
        >
          <Tooltip title={sidebarCollapsed ? t('header.expand_sidebar') : t('header.collapse_sidebar')} placement="right">
            <IconButton
              size="small"
              onClick={toggleSidebarCollapsed}
              aria-label={sidebarCollapsed ? t('header.expand_sidebar') : t('header.collapse_sidebar')}
              sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
            >
              {sidebarCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Mobile — off-canvas drawer, toggled from DashboardHeader's menu button */}
      <Drawer
        variant="temporary"
        open={Boolean(mobileOpen)}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' } }}
        slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH, display: 'flex', flexDirection: 'column' } } }}
      >
        <SidebarContent navItems={navItems} collapsed={false} onNavigate={onMobileClose} />
      </Drawer>
    </>
  );
}
