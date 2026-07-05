'use client';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CloseIcon from '@mui/icons-material/Close';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import { useColorScheme } from '@mui/material/styles';

import LayoutSwitcher from '@/components/layouts/LayoutSwitcher';
import { useTranslation } from '@/lib/i18n';

interface ControlCenterDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function ControlCenterDrawer({ open, onClose }: ControlCenterDrawerProps) {
  const { mode, setMode } = useColorScheme();
  const { t } = useTranslation();

  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: 360, maxWidth: '100vw' } } }}>
      <Box
        sx={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>{t('header.control_center')}</Typography>
        <IconButton size="small" onClick={onClose} aria-label={t('header.close_control_center')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>{t('header.theme')}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {t('header.theme_desc')}
          </Typography>

          {mode && (
            <ToggleButtonGroup
              value={mode}
              exclusive
              fullWidth
              onChange={(_, value: 'light' | 'dark' | 'system' | null) => value && setMode(value)}
            >
              <ToggleButton value="light" sx={{ textTransform: 'none', gap: 0.75 }}>
                <LightModeOutlinedIcon fontSize="small" />
                {t('header.light')}
              </ToggleButton>
              <ToggleButton value="dark" sx={{ textTransform: 'none', gap: 0.75 }}>
                <DarkModeOutlinedIcon fontSize="small" />
                {t('header.dark')}
              </ToggleButton>
              <ToggleButton value="system" sx={{ textTransform: 'none', gap: 0.75 }}>
                <SettingsBrightnessOutlinedIcon fontSize="small" />
                {t('header.auto')}
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>

        <Divider />

        <LayoutSwitcher />
      </Box>
    </Drawer>
  );
}
