'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import TopbarIcon from '@mui/icons-material/ViewHeadlineOutlined';
import SidebarIcon from '@mui/icons-material/ViewSidebarOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import { useColorScheme } from '@mui/material/styles';
import { useLayoutStore, type NavMode } from '@/store/layout.store';
import { useTranslation } from '@/lib/i18n';
import { LOCALES } from '@/store/locale.store';

const DRAWER_WIDTH = 320;

const THEME_MODES = ['light', 'dark', 'system'] as const;
const THEME_ICONS = {
  light: <LightModeOutlinedIcon fontSize="small" />,
  dark: <DarkModeOutlinedIcon fontSize="small" />,
  system: <SettingsBrightnessOutlinedIcon fontSize="small" />,
};

function LayoutCard({
  mode,
  active,
  icon,
  label,
  description,
  onClick,
}: {
  mode: NavMode;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        p: 2.5,
        borderRadius: 2,
        cursor: 'pointer',
        border: '2px solid',
        borderColor: active ? 'primary.main' : 'divider',
        bgcolor: active ? 'action.selected' : 'background.paper',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: active ? 'primary.main' : 'action.hover',
          bgcolor: active ? 'action.selected' : 'action.hover',
        },
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      {/* Layout preview — small visual representation of the layout */}
      <Box
        sx={{
          width: '100%',
          height: 56,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: mode === 'topbar' ? 'column' : 'row',
        }}
      >
        {mode === 'topbar' ? (
          <>
            {/* Topbar preview — horizontal bar at top */}
            <Box sx={{ height: 12, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }} />
            <Box sx={{ flex: 1, display: 'flex', gap: 0.5, p: 0.5 }}>
              <Box sx={{ flex: 1, bgcolor: 'action.selected', borderRadius: 0.5 }} />
              <Box sx={{ flex: 2, bgcolor: 'action.selected', borderRadius: 0.5 }} />
            </Box>
          </>
        ) : (
          <>
            {/* Sidebar preview — vertical bar on left */}
            <Box sx={{ width: 18, bgcolor: 'action.hover', borderRight: '1px solid', borderColor: 'divider' }} />
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, p: 0.5 }}>
              <Box sx={{ height: 4, bgcolor: 'action.selected', borderRadius: 0.5, width: '70%' }} />
              <Box sx={{ height: 4, bgcolor: 'action.selected', borderRadius: 0.5, width: '90%' }} />
              <Box sx={{ height: 4, bgcolor: 'action.selected', borderRadius: 0.5, width: '60%' }} />
            </Box>
          </>
        )}
      </Box>

      {/* Label and icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ color: active ? 'primary.main' : 'text.secondary' }}>{icon}</Box>
        <Typography variant="body2" sx={{ fontWeight: active ? 600 : 500, color: active ? 'primary.main' : 'text.primary' }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.4 }}>
        {description}
      </Typography>

      {/* Active indicator dot */}
      {active && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'primary.main',
          }}
        />
      )}
    </Box>
  );
}

export function SettingsDrawer() {
  const { t, locale, setLocale } = useTranslation();
  const { mode, setMode } = useColorScheme();
  const { navMode, setNavMode, sidebarCollapsed, toggleSidebarCollapsed, settingsDrawerOpen, setSettingsDrawerOpen } = useLayoutStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);
  const currentMode = (mounted && mode ? mode : 'system') as (typeof THEME_MODES)[number];

  return (
    <Drawer
      anchor="right"
      open={settingsDrawerOpen}
      onClose={() => setSettingsDrawerOpen(false)}
      slotProps={{
        paper: {
          sx: {
            width: DRAWER_WIDTH,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('settings.title' as never)}
        </Typography>
        <IconButton size="small" onClick={() => setSettingsDrawerOpen(false)} aria-label={t('common.close')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Layout mode section */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
            {t('settings.nav_mode' as never)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {t('settings.nav_mode_desc' as never)}
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <LayoutCard
              mode="topbar"
              active={navMode === 'topbar'}
              icon={<TopbarIcon fontSize="small" />}
              label={t('settings.topbar' as never)}
              description={t('settings.topbar_desc' as never)}
              onClick={() => setNavMode('topbar')}
            />
            <LayoutCard
              mode="sidebar"
              active={navMode === 'sidebar'}
              icon={<SidebarIcon fontSize="small" />}
              label={t('settings.sidebar' as never)}
              description={t('settings.sidebar_desc' as never)}
              onClick={() => setNavMode('sidebar')}
            />
          </Box>
        </Box>

        {/* Sidebar options — only visible in sidebar mode */}
        {navMode === 'sidebar' && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
              {t('settings.sidebar_options' as never)}
            </Typography>

            <Box
              onClick={toggleSidebarCollapsed}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleSidebarCollapsed();
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'action.hover' },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {t('settings.collapsed' as never)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {sidebarCollapsed ? (t('settings.collapsed_desc' as never) as string) : (t('settings.expanded_desc' as never) as string)}
                </Typography>
              </Box>
              {sidebarCollapsed ? <ChevronRightIcon fontSize="small" sx={{ color: 'action.active' }} /> : <ChevronLeftIcon fontSize="small" sx={{ color: 'action.active' }} />}
            </Box>
          </Box>
        )}

        {/* Language */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
            {t('header.language')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {LOCALES.map((option) => (
              <Button
                key={option.code}
                size="small"
                onClick={() => setLocale(option.code)}
                sx={{
                  flex: 1,
                  py: 1.5,
                  border: '1px solid',
                  borderColor: option.code === locale ? 'primary.main' : 'divider',
                  color: option.code === locale ? 'primary.main' : 'text.secondary',
                  bgcolor: option.code === locale ? 'action.selected' : 'transparent',
                  fontWeight: option.code === locale ? 600 : 400,
                  '&:hover': { bgcolor: option.code === locale ? 'action.selected' : 'action.hover' },
                }}
              >
                {option.badge}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Theme */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
            {t('theme.section_label')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {THEME_MODES.map((m) => (
              <IconButton
                key={m}
                size="small"
                disabled={!mounted}
                onClick={() => setMode(m)}
                aria-label={t(`theme.${m}_label`)}
                sx={{
                  flex: 1,
                  py: 1.5,
                  border: '1px solid',
                  borderColor: m === currentMode ? 'primary.main' : 'divider',
                  color: m === currentMode ? 'primary.main' : 'text.secondary',
                  bgcolor: m === currentMode ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: m === currentMode ? 'action.selected' : 'action.hover' },
                }}
              >
                {THEME_ICONS[m]}
              </IconButton>
            ))}
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
