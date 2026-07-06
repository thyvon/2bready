'use client';

import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { EmptyState } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';

// No notification backend exists yet for client-portal, so this deliberately
// doesn't fake an unread-count badge or sample data — it's a real, working
// dropdown that just has nothing in it today (the same honest EmptyState
// pattern used everywhere else in the app), not a placeholder.
export function NotificationBell() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const content = <EmptyState title={t('header.no_notifications')} />;

  return (
    <>
      <Tooltip title={t('header.notifications')}>
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl((current) => (current ? null : e.currentTarget))}
          aria-label={t('header.notifications')}
          sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          <NotificationsOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {isMobile ? (
        // Still a plain popup, not a modal — just not anchored to the bell.
        // Popper.js re-applies its own inline `transform` for anchor-relative
        // positioning on every reposition tick, so a CSS override on the
        // Popper itself gets clobbered a moment later. Skipping Popper
        // entirely on mobile and centering a plain fixed-position Paper is
        // what actually sticks.
        open && (
          <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
            <Paper
              sx={{
                position: 'fixed',
                top: 72,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100vw - 32px)',
                maxWidth: 340,
                zIndex: 20,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
                overflow: 'hidden',
              }}
            >
              {content}
            </Paper>
          </ClickAwayListener>
        )
      ) : (
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="bottom-end"
          modifiers={[{ name: 'preventOverflow', options: { padding: 16 } }]}
          sx={{ zIndex: 20 }}
        >
          <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
            <Paper
              sx={{
                mt: 1,
                width: 300,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
                overflow: 'hidden',
              }}
            >
              {content}
            </Paper>
          </ClickAwayListener>
        </Popper>
      )}
    </>
  );
}
