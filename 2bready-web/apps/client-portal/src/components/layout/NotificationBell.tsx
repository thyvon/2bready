'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { EmptyState } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from '@/lib/notification-api';

export function NotificationBell() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await listNotifications(1, 10);
        if (!cancelled) {
          setNotifications(res.data);
          setUnreadCount(res.meta.unread_count);
        }
      } catch {
        // Silently fail — bell just shows empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  };

  const bell = (
    <Badge badgeContent={unreadCount > 0 ? unreadCount : undefined} color="error" variant="dot">
      <IconButton
        size="small"
        onClick={(e) => setAnchorEl((current) => (current ? null : e.currentTarget))}
        aria-label={t('header.notifications')}
        sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
      >
        <NotificationsOutlinedIcon fontSize="small" />
      </IconButton>
    </Badge>
  );

  const notificationList = (
    <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
      {notifications.length === 0 && !loading ? (
        <EmptyState title={t('header.no_notifications')} />
      ) : (
        <>
          {unreadCount > 0 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                px: 2,
                pt: 1,
              }}
            >
              <IconButton size="small" onClick={handleMarkAllAsRead} aria-label="Mark all as read">
                <DoneAllIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
          {notifications.map((notification) => (
            <Box
              key={notification.id}
              onClick={() => {
                if (!notification.read_at) {
                  handleMarkAsRead(notification.id);
                }
              }}
              sx={{
                px: 2,
                py: 1.5,
                cursor: 'pointer',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: notification.read_at ? 'transparent' : 'action.hover',
                '&:hover': { bgcolor: 'action.selected' },
              }}
            >
              <Typography variant="body2" noWrap sx={{ fontWeight: notification.read_at ? 400 : 600 }}>
                {notification.data.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {notification.data.message}
              </Typography>
            </Box>
          ))}
        </>
      )}
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <>
          {bell}
          {open && (
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
                {notificationList}
              </Paper>
            </ClickAwayListener>
          )}
        </>
      ) : (
        <>
          {bell}
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
                  width: 340,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                }}
              >
                {notificationList}
              </Paper>
            </ClickAwayListener>
          </Popper>
        </>
      )}
    </>
  );
}
