'use client';

import { useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import ThemeToggle from '@/components/ui/ThemeToggle';
import BrandMark from '@/components/marketing/BrandMark';

const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
];

export default function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Box
      component="header"
      sx={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, md: 4 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'color-mix(in srgb, var(--mui-palette-background-paper) 80%, transparent)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Typography
        component={Link}
        href="/"
        variant="body1"
        sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary', textDecoration: 'none' }}
      >
        <BrandMark size={22} />
        2bReady
      </Typography>

      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3 }}>
        {NAV_LINKS.map((link) => (
          <Typography
            key={link.href}
            component={Link}
            href={link.href}
            variant="body2"
            sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'text.primary' } }}
          >
            {link.label}
          </Typography>
        ))}
      </Box>

      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
        <ThemeToggle />
        <Button component={Link} href="/login" size="small" sx={{ color: 'text.primary' }}>
          Sign in
        </Button>
        <Button component={Link} href="/register" variant="contained" size="small">
          Get started
        </Button>
      </Box>

      <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
        <ThemeToggle />
        <IconButton size="small" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <MenuIcon />
        </IconButton>
      </Box>

      <Drawer anchor="right" open={menuOpen} onClose={() => setMenuOpen(false)}>
        <Box sx={{ width: 260, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_LINKS.map((link) => (
            <Typography
              key={link.href}
              component={Link}
              href={link.href}
              variant="body1"
              onClick={() => setMenuOpen(false)}
              sx={{ color: 'text.primary', textDecoration: 'none', fontWeight: 500 }}
            >
              {link.label}
            </Typography>
          ))}
          <Button component={Link} href="/login" variant="outlined" onClick={() => setMenuOpen(false)}>
            Sign in
          </Button>
          <Button component={Link} href="/register" variant="contained" onClick={() => setMenuOpen(false)}>
            Get started
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
