'use client';

import { useColorScheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';

const CYCLE: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];

const ICONS = {
  light:  <LightModeOutlinedIcon fontSize="small" />,
  dark:   <DarkModeOutlinedIcon fontSize="small" />,
  system: <SettingsBrightnessOutlinedIcon fontSize="small" />,
};

const LABELS = {
  light:  'Light mode — click for dark',
  dark:   'Dark mode — click for system',
  system: 'System theme — click for light',
};

export default function ThemeToggle() {
  const { mode, setMode } = useColorScheme();

  if (!mode) return null;

  const current = (mode as 'light' | 'dark' | 'system') ?? 'system';
  const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];

  return (
    <Tooltip title={LABELS[current]} arrow>
      <IconButton
        size="small"
        onClick={() => setMode(next)}
        sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        aria-label="toggle color scheme"
      >
        {ICONS[current]}
      </IconButton>
    </Tooltip>
  );
}
