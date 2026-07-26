'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useState } from 'react';

import UserAvatar from '@/components/ui/UserAvatar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageSwitcher from '@/components/layouts/LanguageSwitcher';
import { useAuthStore } from '@/store/auth.store';
import { logout } from '@/domains/auth/api';
import { useTranslation } from '@/lib/i18n';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, clearAuth } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    try {
      await logout();
    } finally {
      clearAuth();
      router.replace('/login');
    }
  };

  return (
    <Box
      component="header"
      sx={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, sm: 3 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <IconButton onClick={onMenuClick} sx={{ display: { xs: 'inline-flex', md: 'none' } }} aria-label={t('header.open_menu')}>
        <MenuOutlinedIcon />
      </IconButton>
      <Box sx={{ display: { xs: 'none', md: 'block' } }} />

      <Box className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 0.5 }}>
          <UserAvatar name={user?.name} />
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} slotProps={{ paper: { sx: { mt: 0.5, minWidth: 200 } } }}>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <MenuItem onClick={() => { setAnchorEl(null); router.push('/settings/profile'); }}>
            <ListItemIcon><PersonOutlineOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('nav.profile')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><LogoutOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('header.sign_out')}</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
