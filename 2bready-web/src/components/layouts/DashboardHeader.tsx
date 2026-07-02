'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';

import { useAuthStore } from '@/store/auth.store';
import { logout } from '@/domains/auth/api';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function DashboardHeader() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    try { await logout(); } catch { /* token may already be invalid */ }
    clearAuth();
    router.replace('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <Box
      component="header"
      sx={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 1,
        px: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <ThemeToggle />

      {/* Notifications — wired in Sprint 7 */}
      <IconButton size="small" sx={{ color: 'text.secondary' }}>
        <NotificationsNoneIcon fontSize="small" />
      </IconButton>

      {/* User avatar */}
      <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
        <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'text.primary', color: 'background.default' }}>
          {initials}
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
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{user?.name}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setAnchorEl(null); router.push('/settings/profile'); }} sx={{ gap: 1.5, fontSize: '0.875rem' }}>
          <PersonIcon fontSize="small" />
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ gap: 1.5, fontSize: '0.875rem', color: 'error.main' }}>
          <LogoutIcon fontSize="small" />
          Sign out
        </MenuItem>
      </Menu>
    </Box>
  );
}
