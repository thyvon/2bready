'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';

import { useNavItems, isNavItemActive } from '@/components/layouts/nav-items';
import HeaderActions from '@/components/layouts/HeaderActions';
import NavMenuPopover from '@/components/layouts/NavMenuPopover';
import { useTranslation } from '@/lib/i18n';

export default function DashboardNavHorizontal() {
  const navItems = useNavItems();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const activeItem = navItems.find((item) => isNavItemActive(pathname, item));

  return (
    <Box
      component="header"
      sx={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 1.5 },
        px: { xs: 1.5, sm: 3 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Logo — wordmark hidden below sm to leave room for the menu button + actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
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

      {/* Menu button — opens the nav picker instead of listing every item inline.
          Label is truncated (not wrapped) since translated/Khmer labels can run long
          enough to break onto a second line and blow out the topbar's fixed height. */}
      <Button
        variant="outlined"
        size="small"
        startIcon={<MenuOutlinedIcon fontSize="small" />}
        onClick={(e) => setMenuAnchor(e.currentTarget)}
        sx={{ color: 'text.primary', borderColor: 'divider', fontWeight: 500, minWidth: 0, maxWidth: { xs: 120, sm: 220 } }}
      >
        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeItem?.label ?? t('nav.menu')}
        </Box>
      </Button>

      <NavMenuPopover anchorEl={menuAnchor} onClose={() => setMenuAnchor(null)} navItems={navItems} />

      <Box sx={{ flex: 1 }} />

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <HeaderActions />
      </Box>
    </Box>
  );
}
