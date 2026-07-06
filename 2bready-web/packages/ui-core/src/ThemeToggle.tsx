'use client';

import { useEffect, useState } from 'react';
import { useColorScheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';

const CYCLE: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];

const ICONS = {
  light: <LightModeOutlinedIcon fontSize="small" />,
  dark: <DarkModeOutlinedIcon fontSize="small" />,
  system: <SettingsBrightnessOutlinedIcon fontSize="small" />,
};

const LABELS = {
  light: 'Light mode — click for dark',
  dark: 'Dark mode — click for system',
  system: 'System theme — click for light',
};

export function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  // MUI's `mode` is NOT a safe hydration guard by itself: the server resolves
  // it from the static `defaultMode="system"` prop (truthy), while the client's
  // first hydration render deliberately reports it as undefined until MUI syncs
  // from storage — so deriving disabled/labels straight from `mode` gives two
  // different attribute values for the same render pass, a hydration mismatch.
  // `mounted` is guaranteed false on both the server render and the client's
  // matching first render (only an effect flips it), so it's safe to gate on.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const ready = mounted && !!mode;
  const current = (ready ? mode : 'system') as 'light' | 'dark' | 'system';
  const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];

  return (
    <Tooltip title={ready ? LABELS[current] : ''} arrow>
      <span>
        <IconButton
          size="small"
          onClick={() => setMode(next)}
          disabled={!ready}
          sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
          aria-label="toggle color scheme"
        >
          {ICONS[current]}
        </IconButton>
      </span>
    </Tooltip>
  );
}
