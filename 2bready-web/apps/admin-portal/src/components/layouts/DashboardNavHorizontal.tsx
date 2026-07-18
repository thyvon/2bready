'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useNavGroups, isNavItemActive } from '@/components/layouts/nav-items';
import NavMegaMenu from '@/components/layouts/NavMegaMenu';
import HeaderActions from '@/components/layouts/HeaderActions';

// Vercel-style top nav: plain top-level links sit directly in the bar, and
// only the entries that actually cluster into a real category (Access,
// Billing, Compliance) become a hover mega-menu — see nav-items.tsx's
// useNavGroups(). Always renders at >= md width (layout.tsx only mounts this
// when !isMobile, sidebar/drawer covers everything below that), so there's
// no mobile fallback to design for here.
export default function DashboardNavHorizontal() {
  const entries = useNavGroups();
  const pathname = usePathname();

  return (
    <Box
      component="header"
      sx={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: { xs: 1.5, sm: 3 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, mr: 1.5 }}>
        <Box sx={{ width: 20, height: 20, borderRadius: '5px', bgcolor: 'text.primary', flexShrink: 0 }} />
        <Typography
          sx={{
            display: { xs: 'none', sm: 'block' },
            fontWeight: 700,
            letterSpacing: '-0.04em',
            fontSize: '0.9375rem',
            color: 'text.primary',
            whiteSpace: 'nowrap',
          }}
        >
          2bReady
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflowX: 'auto' }}>
        {entries.map((entry) =>
          entry.type === 'group' ? (
            <NavMegaMenu key={entry.label} group={entry} />
          ) : (
            <Button
              key={entry.href}
              component={Link}
              href={entry.href}
              sx={{
                color: isNavItemActive(pathname, entry) ? 'text.primary' : 'text.secondary',
                fontWeight: isNavItemActive(pathname, entry) ? 600 : 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                px: 1.5,
                py: 0.75,
                borderRadius: 999,
                whiteSpace: 'nowrap',
                bgcolor: isNavItemActive(pathname, entry) ? 'var(--2br-nav-active-bg)' : 'transparent',
                '&:hover': { bgcolor: 'var(--2br-overlay-hover)', color: 'text.primary' },
              }}
            >
              {entry.label}
            </Button>
          )
        )}
      </Box>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <HeaderActions />
      </Box>
    </Box>
  );
}
