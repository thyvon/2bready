'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/store/auth.store';
import { useLayoutStore } from '@/store/layout.store';
import { logout } from '@/lib/auth-api';

export function UserMenu() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { setSettingsDrawerOpen } = useLayoutStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    try {
      await logout();
    } catch {
      // Token may already be invalid/expired server-side — clear local
      // state regardless, the goal is "get the user logged out locally."
    }
    clearAuth();
    router.push('/login');
  };

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
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 220 } } }}
      >
        {user && (
          <>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {user.email}
              </Typography>
            </Box>
            <Divider sx={{ my: 0.5 }} />
          </>
        )}

        <MenuItem onClick={() => { setAnchorEl(null); setSettingsDrawerOpen(true); }}>
          <ListItemIcon>
            <TuneOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('settings.title' as never)} />
        </MenuItem>

        <MenuItem component={Link} href="/settings" onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <SettingsOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('nav.settings')} />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutOutlinedIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary={t('header.sign_out')} />
        </MenuItem>
      </Menu>
    </>
  );
}
