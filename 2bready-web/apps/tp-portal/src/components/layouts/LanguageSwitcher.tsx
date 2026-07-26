'use client';

import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import CheckIcon from '@mui/icons-material/Check';
import Tooltip from '@mui/material/Tooltip';

import { useTranslation, type Locale } from '@/lib/i18n';
import { LOCALES, getLocaleConfig } from '@/store/locale.store';

// Flag emoji (🇬🇧/🇰🇭) render as a merged flag picture only when the OS has a
// color-emoji font supporting that ligature — many Linux setups don't, and
// silently fall back to the two bare letters ("GB"/"KH") side by side. A
// plain styled badge looks the same everywhere, regardless of the visitor's
// system fonts. Badge/label text comes from LOCALES (locale.store.ts) — the
// single source of truth for supported locales — not a map hardcoded here.
function LocaleBadge({ locale }: { locale: Locale }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: '6px',
        bgcolor: 'action.selected',
        color: 'text.primary',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      {getLocaleConfig(locale).badge}
    </Box>
  );
}

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSelect = (next: Locale) => {
    setLocale(next);
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title={t('header.language')}>
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label={t('header.language')}
        >
          <LocaleBadge locale={locale} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 180 } } }}
      >
        {LOCALES.map((option) => (
          <MenuItem
            key={option.code}
            selected={option.code === locale}
            onClick={() => handleSelect(option.code)}
            sx={{ gap: 1.5 }}
          >
            <LocaleBadge locale={option.code} />
            <ListItemText primary={option.label} />
            {option.code === locale && <CheckIcon fontSize="small" color="action" />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
