'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';

import { useNavItems, isNavItemActive } from '@/components/layouts/nav-items';
import HeaderActions from '@/components/layouts/HeaderActions';
import NavMenuDialog from '@/components/layouts/NavMenuDialog';
import { useTranslation } from '@/lib/i18n';

export default function DashboardNavHorizontal() {
  const navItems = useNavItems();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeItem = navItems.find((item) => isNavItemActive(pathname, item));

  return (
    <Box
      component="header"
      sx={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        <Box sx={{ width: 20, height: 20, borderRadius: '5px', bgcolor: 'text.primary', flexShrink: 0 }} />
        <Typography sx={{ fontWeight: 700, letterSpacing: '-0.04em', fontSize: '0.9375rem', color: 'text.primary', whiteSpace: 'nowrap' }}>
          2bReady
        </Typography>
      </Box>

      {/* Menu button — opens the nav picker instead of listing every item inline */}
      <Button
        variant="outlined"
        size="small"
        startIcon={<MenuOutlinedIcon fontSize="small" />}
        onClick={() => setMenuOpen(true)}
        sx={{ color: 'text.primary', borderColor: 'divider', fontWeight: 500 }}
      >
        {activeItem?.label ?? t('nav.menu')}
      </Button>

      <NavMenuDialog open={menuOpen} onClose={() => setMenuOpen(false)} navItems={navItems} />

      <Box sx={{ flex: 1 }} />

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <HeaderActions />
      </Box>
    </Box>
  );
}
