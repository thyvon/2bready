'use client';

import { useState } from 'react';
import Link from 'next/link';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import { useTranslation } from '@/lib/i18n';

// No auth session exists yet for client-portal (a distinct future task), so
// this doesn't fabricate a name/photo or a "Sign out" action with nothing
// to sign out of — just a generic avatar and a link to the one real,
// already-built settings page. Extend with real profile data/sign-out once
// client-portal auth exists, not before.
export function UserMenu() {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} aria-label={t('header.account')}>
        <Avatar sx={{ width: 28, height: 28, bgcolor: 'text.primary', color: 'background.paper' }}>
          <PersonOutlineIcon sx={{ fontSize: 18 }} />
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 200 } } }}
      >
        <MenuItem component={Link} href="/settings" onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <SettingsOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('nav.settings')} />
        </MenuItem>
      </Menu>
    </>
  );
}
