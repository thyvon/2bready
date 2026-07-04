'use client';

import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import CheckIcon from '@mui/icons-material/Check';
import Tooltip from '@mui/material/Tooltip';

import { useTranslation, type Locale } from '@/lib/i18n';

const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  kh: '🇰🇭',
};

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  kh: 'ខ្មែរ',
};

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
          sx={{ fontSize: '1.1rem', lineHeight: 1 }}
        >
          {LOCALE_FLAGS[locale]}
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
        {(Object.keys(LOCALE_FLAGS) as Locale[]).map((key) => (
          <MenuItem key={key} selected={key === locale} onClick={() => handleSelect(key)} sx={{ gap: 1.5 }}>
            <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>{LOCALE_FLAGS[key]}</Typography>
            <ListItemText primary={LOCALE_LABELS[key]} />
            {key === locale && <CheckIcon fontSize="small" color="action" />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
