'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { BrandLogo } from '@2bready/ui-core';
import { BrandMark } from './BrandMark';
import { useThemeBrandLogo } from '@/lib/branding';

import { useNavItems, isNavItemActive, type NavItem } from '@/components/layout/nav-items';
import { useLayoutStore } from '@/store/layout.store';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 72;

/* ── Single nav link ────────────────────────────────────────────────────── */

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
            fontWeight: active ? 600 : 400,
            color: active ? '#ffffff' : 'rgba(255,255,255,0.65)',
            transition: 'color 0.15s ease, background-color 0.15s ease',
            '&:hover': {
              color: '#ffffff',
              bgcolor: 'rgba(255,255,255,0.08)',
            },
          }}
        >
          {/* Active indicator — green accent bar */}
          {active && (
            <Box
              sx={{
                position: 'absolute',
                left: collapsed ? '50%' : 0,
                top: '50%',
                transform: collapsed ? 'translate(-50%, -50%)' : 'translateY(-50%)',
                width: collapsed ? 16 : 3,
                height: collapsed ? 16 : '60%',
                borderRadius: '0 4px 4px 0',
                bgcolor: '#71B77C',
              }}
            />
          )}

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

/* ── Sidebar body (shared by desktop + drawer) ──────────────────────────── */

function SidebarBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { all: navItems } = useNavItems();
  const logoUrl = useThemeBrandLogo();

  return (
    <>
      {/* Logo */}
      <Box
        component={Link}
        href="/"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          px: collapsed ? 0 : 1.5,
          py: 2,
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        <BrandLogo
          logoUrl={logoUrl}
          height={collapsed ? 28 : 32}
          maxWidth={collapsed ? 28 : 140}
          fallback={<BrandMark size={collapsed ? 20 : 22} />}
        />
      </Box>

      {/* Nav list */}
      <Box sx={{ flex: 1, px: 1.5, py: 2 }} className="flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </Box>
    </>
  );
}

/* ── Desktop sidebar (permanent, sticky) ────────────────────────────────── */

export function DesktopSidebar() {
  const { sidebarCollapsed } = useLayoutStore();

  return (
    <Box
      sx={{
        width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        flexShrink: 0,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        borderRight: 'none',
        bgcolor: '#183659',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
      }}
    >
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <SidebarBody collapsed={sidebarCollapsed} />
      </Box>
    </Box>
  );
}

/* ── Mobile drawer (temporary, off-canvas) ──────────────────────────────── */

export function SidebarDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ display: { xs: 'block', md: 'none' } }}
      slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH, display: 'flex', flexDirection: 'column', bgcolor: '#183659' } } }}
    >
      <SidebarBody collapsed={false} onNavigate={onClose} />
    </Drawer>
  );
}
