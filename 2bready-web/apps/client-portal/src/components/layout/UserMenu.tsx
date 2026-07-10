'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useColorScheme } from '@mui/material/styles';
import { useTranslation } from '@/lib/i18n';
import { LOCALES } from '@/store/locale.store';
import { useAuthStore } from '@/store/auth.store';
import { logout } from '@/lib/auth-api';

const THEME_MODES = ['light', 'dark', 'system'] as const;
const THEME_ICONS = {
  light: <LightModeOutlinedIcon fontSize="small" />,
  dark: <DarkModeOutlinedIcon fontSize="small" />,
  system: <SettingsBrightnessOutlinedIcon fontSize="small" />,
};

function MenuSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ px: 2, py: 0.5, display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}
    >
      {children}
    </Typography>
  );
}

// Language and theme used to be separate navbar icons; both live here
// instead, so the always-visible header cluster only has account-adjacent
// controls that don't fit a single icon.
export function UserMenu() {
  const { t, locale, setLocale } = useTranslation();
  const { mode, setMode } = useColorScheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
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

  // Same hydration guard as ui-core's ThemeToggle: `mode` resolves
  // differently on the server/first-client-render than after MUI syncs from
  // storage, so gate on a mount effect rather than `mode` truthiness to
  // avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);
  const currentMode = (mounted && mode ? mode : 'system') as (typeof THEME_MODES)[number];

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

        <MenuItem component={Link} href="/settings" onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <SettingsOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('nav.settings')} />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />
        <MenuSectionLabel>{t('header.language')}</MenuSectionLabel>
        {/* Badge-style, inlined and centered — same compact treatment as the
            theme row below, for one consistent "picker row" pattern instead
            of two differently-shaped controls in the same menu. */}
        <Box sx={{ display: 'flex', gap: 0.5, px: 2, py: 0.5, justifyContent: 'center' }}>
          {LOCALES.map((option) => (
            <Button
              key={option.code}
              size="small"
              onClick={() => setLocale(option.code)}
              sx={{
                minWidth: 44,
                border: '1px solid',
                borderColor: option.code === locale ? 'primary.main' : 'divider',
                color: option.code === locale ? 'primary.main' : 'text.secondary',
                bgcolor: option.code === locale ? 'action.selected' : 'transparent',
              }}
            >
              {option.badge}
            </Button>
          ))}
        </Box>

        <Divider sx={{ my: 0.5 }} />
        <MenuSectionLabel>{t('theme.section_label')}</MenuSectionLabel>
        {/* Icon-only, inlined and centered — light/dark/system read fine from
            their icons alone, and three stacked full-width rows here was
            just spending extra vertical space for no clarity gain. */}
        <Box sx={{ display: 'flex', gap: 0.5, px: 2, py: 0.5, justifyContent: 'center' }}>
          {THEME_MODES.map((m) => (
            <IconButton
              key={m}
              size="small"
              disabled={!mounted}
              onClick={() => setMode(m)}
              aria-label={t(`theme.${m}_label`)}
              sx={{
                border: '1px solid',
                borderColor: m === currentMode ? 'primary.main' : 'divider',
                color: m === currentMode ? 'primary.main' : 'text.secondary',
                bgcolor: m === currentMode ? 'action.selected' : 'transparent',
              }}
            >
              {THEME_ICONS[m]}
            </IconButton>
          ))}
        </Box>

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
