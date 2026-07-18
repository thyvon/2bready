'use client';

import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import ViewHeadlineOutlinedIcon from '@mui/icons-material/ViewHeadlineOutlined';

import { useLayoutStore, type NavOrientation } from '@/store/layout.store';
import { useTranslation } from '@/lib/i18n';

const OPTIONS: Array<{ value: NavOrientation; labelKey: 'header.sidebar' | 'header.topbar'; descKey: 'header.sidebar_desc' | 'header.topbar_desc'; icon: React.ReactNode }> = [
  {
    value: 'vertical',
    labelKey: 'header.sidebar',
    descKey: 'header.sidebar_desc',
    icon: <ViewSidebarOutlinedIcon fontSize="small" />,
  },
  {
    value: 'horizontal',
    labelKey: 'header.topbar',
    descKey: 'header.topbar_desc',
    icon: <ViewHeadlineOutlinedIcon fontSize="small" />,
  },
];

export default function LayoutSwitcher() {
  const { navOrientation, setNavOrientation } = useLayoutStore();
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
        {t('header.nav_layout')}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        {t('header.nav_layout_desc')}
      </Typography>

      <ToggleButtonGroup
        value={navOrientation}
        exclusive
        onChange={(_, value: NavOrientation | null) => value && setNavOrientation(value)}
        sx={{ display: 'flex', gap: 1.5 }}
      >
        {OPTIONS.map((option) => (
          <ToggleButton
            key={option.value}
            value={option.value}
            sx={{
              flex: 1,
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 0.5,
              px: 2,
              py: 1.5,
              textTransform: 'none',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '8px', // matches SectionCard/MuiCard — see that file's comment
              '&.Mui-selected': {
                borderColor: 'primary.main',
                bgcolor: 'var(--2br-nav-active-bg)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {option.icon}
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{t(option.labelKey)}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'left' }}>
              {t(option.descKey)}
            </Typography>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
