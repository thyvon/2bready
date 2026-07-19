'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';

import { useAuthStore } from '@/store/auth.store';
import { logout } from '@/domains/auth/api';
import ControlCenterDrawer from '@/components/layouts/ControlCenterDrawer';
import LanguageSwitcher from '@/components/layouts/LanguageSwitcher';
import UserAvatar from '@/components/ui/UserAvatar';
import { useTranslation } from '@/lib/i18n';

export default function HeaderActions() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);

  const handleLogout = async () => {
    try { await logout(); } catch { /* token may already be invalid */ }
    clearAuth();
    router.replace('/login');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <IconButton
        size="small"
        onClick={() => setControlCenterOpen(true)}
        aria-label={t('header.open_control_center')}
        sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
      >
        <TuneOutlinedIcon fontSize="small" />
      </IconButton>
      <ControlCenterDrawer open={controlCenterOpen} onClose={() => setControlCenterOpen(false)} />

      <LanguageSwitcher />

      {/* Notifications — wired in Sprint 7 */}
      <IconButton size="small" sx={{ color: 'text.secondary' }}>
        <NotificationsNoneIcon fontSize="small" />
      </IconButton>

      {/* User avatar */}
      <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
        <UserAvatar name={user?.name} />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 200 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{user?.name}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setAnchorEl(null); router.push('/settings/profile'); }} sx={{ gap: 1.5, fontSize: '0.875rem' }}>
          <PersonIcon fontSize="small" />
          {t('header.profile')}
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ gap: 1.5, fontSize: '0.875rem', color: 'error.main' }}>
          <LogoutIcon fontSize="small" />
          {t('header.sign_out')}
        </MenuItem>
      </Menu>
    </Box>
  );
}
