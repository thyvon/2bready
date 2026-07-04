'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import { useNavItems, isNavItemActive, type NavItem } from '@/components/layouts/nav-items';
import { navPillTransition } from '@/lib/motion';

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, item);

  return (
    <Tooltip title={item.label} placement="right" disableHoverListener>
      <Link href={item.href} style={{ textDecoration: 'none' }}>
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1.5,
            py: 0.875,
            borderRadius: 1,
            fontSize: '0.875rem',
            fontWeight: active ? 500 : 400,
            color: active ? 'text.primary' : 'text.secondary',
            '&:hover': { color: 'text.primary' },
          }}
        >
          {active && (
            <motion.div
              layoutId="sidebar-nav-pill"
              transition={navPillTransition}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 6,
                background: 'var(--2br-nav-active-bg)',
                zIndex: 0,
              }}
            />
          )}
          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {item.icon}
            <Typography variant="body2" sx={{ fontWeight: 'inherit' }} color="inherit">
              {item.label}
            </Typography>
          </Box>
        </Box>
      </Link>
    </Tooltip>
  );
}

export default function DashboardSidebar() {
  const navItems = useNavItems();

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
    </Box>
  );
}
