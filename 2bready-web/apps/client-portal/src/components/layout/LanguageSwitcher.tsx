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

// Flag emoji (🇬🇧/🇰🇭) render as a merged flag picture only when the OS has a
// color-emoji font supporting that ligature — many Linux setups don't, and
// silently fall back to the two bare letters ("GB"/"KH") side by side. A
// plain styled badge looks the same everywhere, regardless of the visitor's
// system fonts.
const LOCALE_BADGES: Record<Locale, string> = {
  en: 'EN',
  kh: 'KH',
};

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  kh: 'ខ្មែរ',
};

function LocaleBadge({ locale }: { locale: Locale }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: '4px',
        bgcolor: 'action.selected',
        color: 'text.primary',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      {LOCALE_BADGES[locale]}
    </Box>
  );
}

export function LanguageSwitcher() {
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
          sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
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
        {(Object.keys(LOCALE_BADGES) as Locale[]).map((key) => (
          <MenuItem key={key} selected={key === locale} onClick={() => handleSelect(key)} sx={{ gap: 1.5 }}>
            <LocaleBadge locale={key} />
            <ListItemText primary={LOCALE_LABELS[key]} />
            {key === locale && <CheckIcon fontSize="small" color="action" />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
