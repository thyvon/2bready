'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CheckIcon from '@mui/icons-material/Check';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import { useColorScheme } from '@mui/material/styles';
import { useTranslation } from '@/lib/i18n';
import { LOCALES } from '@/store/locale.store';

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

// No auth session exists yet for client-portal (a distinct future task), so
// this doesn't fabricate a name/photo or a "Sign out" action with nothing
// to sign out of — just a generic avatar and a link to the one real,
// already-built settings page. Language and theme used to be separate
// navbar icons; both now live here instead, so the always-visible header
// cluster only has account-adjacent controls that don't fit a single icon.
export function UserMenu() {
  const { t, locale, setLocale } = useTranslation();
  const { mode, setMode } = useColorScheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
        <MenuItem component={Link} href="/settings" onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <SettingsOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('nav.settings')} />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />
        <MenuSectionLabel>{t('header.language')}</MenuSectionLabel>
        {LOCALES.map((option) => (
          <MenuItem key={option.code} selected={option.code === locale} onClick={() => setLocale(option.code)} sx={{ gap: 1.5 }}>
            <ListItemText primary={option.label} />
            {option.code === locale && <CheckIcon fontSize="small" color="action" />}
          </MenuItem>
        ))}

        <Divider sx={{ my: 0.5 }} />
        <MenuSectionLabel>{t('theme.section_label')}</MenuSectionLabel>
        {THEME_MODES.map((m) => (
          <MenuItem key={m} disabled={!mounted} selected={m === currentMode} onClick={() => setMode(m)} sx={{ gap: 1.5 }}>
            <ListItemIcon>{THEME_ICONS[m]}</ListItemIcon>
            <ListItemText primary={t(`theme.${m}_label`)} />
            {m === currentMode && <CheckIcon fontSize="small" color="action" />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
