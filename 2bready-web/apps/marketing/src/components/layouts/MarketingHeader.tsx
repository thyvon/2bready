'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import ThemeToggle from '@/components/ui/ThemeToggle';
import BrandMark from '@/components/marketing/BrandMark';
import BrandLogo from '@/components/marketing/BrandLogo';
import NavHoverLink from '@/components/marketing/NavHoverLink';
import { useThemeBrandLogo } from '@/lib/branding';
import { clientPortalUrl } from '@/lib/client-portal-url';

const NAV_LINKS = [
  { label: 'Built For', href: '/#stakeholders' },
  { label: 'Pathways', href: '/#pricing' },
  { label: 'How It Works', href: '/#how-it-works' },
];

export default function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const logoUrl = useThemeBrandLogo();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 12,
        zIndex: 20,
        px: { xs: 1.5, md: 4 },
        pointerEvents: 'none',
        '& > *': { pointerEvents: 'auto' },
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          height: { xs: 56, md: 60 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr auto', md: '1fr auto 1fr' },
          alignItems: 'center',
          px: { xs: 2, md: 3 },
          borderRadius: { xs: '20px', md: '999px' },
          transition: 'box-shadow 0.3s ease, background-color 0.3s ease, transform 0.3s ease, max-width 0.3s ease',
          bgcolor: scrolled
            ? 'color-mix(in srgb, var(--mui-palette-background-paper) 78%, transparent)'
            : 'color-mix(in srgb, var(--mui-palette-background-paper) 55%, transparent)',
          backdropFilter: 'blur(16px) saturate(160%)',
          WebkitBackdropFilter: 'blur(16px) saturate(160%)',
          boxShadow: scrolled
            ? '0 12px 32px -12px rgba(16,24,40,0.25), 0 8px 24px -8px rgba(113,183,124,0.35), 0 0 24px -6px rgba(113,183,124,0.25)'
            : '0 4px 16px -8px rgba(16,24,40,0.12), 0 4px 20px -6px rgba(113,183,124,0.22), 0 0 18px -4px rgba(113,183,124,0.18)',
          mt: 1,
          '[data-mui-color-scheme="dark"] &': {
            boxShadow: scrolled
              ? '0 12px 32px -12px rgba(0,0,0,0.6), 0 10px 32px -8px rgba(113,183,124,0.5), 0 0 32px -4px rgba(113,183,124,0.35)'
              : '0 4px 16px -8px rgba(0,0,0,0.5), 0 6px 28px -6px rgba(113,183,124,0.38), 0 0 26px -4px rgba(113,183,124,0.3)',
          },
        }}
      >
        <Typography
          component={Link}
          href="/"
          variant="body1"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary', textDecoration: 'none' }}
        >
          <BrandLogo
            logoUrl={logoUrl}
            height={56}
            maxWidth={180}
            fallback={<BrandMark size={22} />}
          />
        </Typography>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
          {NAV_LINKS.map((link) => (
            <NavHoverLink
              key={link.href}
              href={link.href}
              label={link.label}
              sx={{ fontSize: '0.875rem', fontWeight: 800 }}
            />
          ))}
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
          <ThemeToggle />
          <Button component={Link} href={clientPortalUrl('/login')} variant="outlined" size="small">
            Client Portal
          </Button>
        </Box>

        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
          <ThemeToggle />
          <IconButton size="small" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <MenuIcon />
          </IconButton>
        </Box>
      </Box>

      <Drawer anchor="right" open={menuOpen} onClose={() => setMenuOpen(false)}>
        <Box sx={{ width: 260, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_LINKS.map((link) => (
            <NavHoverLink
              key={link.href}
              href={link.href}
              label={link.label}
              onClick={() => setMenuOpen(false)}
              sx={{ fontSize: '1rem', fontWeight: 500 }}
            />
          ))}
          <Button component={Link} href={clientPortalUrl('/login')} variant="outlined" onClick={() => setMenuOpen(false)}>
            Client Portal
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
