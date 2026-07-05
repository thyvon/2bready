'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';

import { isNavItemActive, type NavItem } from '@/components/layouts/nav-items';
import { useTranslation } from '@/lib/i18n';

interface NavMenuPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  navItems: NavItem[];
}

export default function NavMenuPopover({ anchorEl, onClose, navItems }: NavMenuPopoverProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            width: 420,
            maxWidth: 'calc(100vw - 32px)',
            borderRadius: 2,
            overflow: 'hidden',
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>{t('menu.title')}</Typography>
        <IconButton size="small" onClick={onClose} aria-label={t('header.close_menu')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Grid container spacing={1.5} sx={{ p: 2.5 }}>
        {navItems.map((item) => {
          const active = isNavItemActive(pathname, item);

          return (
            <Grid size={4} key={item.href}>
              <Link href={item.href} onClick={onClose} style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    py: 2.5,
                    px: 1,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: active ? 'primary.main' : 'divider',
                    bgcolor: active ? 'var(--2br-nav-active-bg)' : 'transparent',
                    color: active ? 'text.primary' : 'text.secondary',
                    transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                    '&:hover': { bgcolor: 'var(--2br-overlay-hover)', color: 'text.primary' },
                  }}
                >
                  {item.icon}
                  <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: active ? 500 : 400 }}>
                    {item.label}
                  </Typography>
                </Box>
              </Link>
            </Grid>
          );
        })}
      </Grid>
    </Popover>
  );
}
