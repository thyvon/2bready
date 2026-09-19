'use client';

import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PaymentIcon from '@mui/icons-material/Payment';
import GavelIcon from '@mui/icons-material/Gavel';
import DescriptionIcon from '@mui/icons-material/Description';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import UndoIcon from '@mui/icons-material/Undo';
import { EmptyState } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from '@/lib/notification-api';

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  payment: <PaymentIcon fontSize="small" sx={{ color: 'success.main' }} />,
  audit: <GavelIcon fontSize="small" sx={{ color: 'info.main' }} />,
  document: <DescriptionIcon fontSize="small" sx={{ color: 'warning.main' }} />,
  subscription: <SubscriptionsIcon fontSize="small" sx={{ color: 'error.main' }} />,
};

function getNotificationIcon(type: string): React.ReactNode {
  // Extract category from class name (e.g. "App\\...\\PaymentConfirmedNotification" → "payment")
  const lower = type.toLowerCase();
  if (lower.includes('payment')) return NOTIFICATION_ICONS.payment;
  if (lower.includes('audit')) return NOTIFICATION_ICONS.audit;
  if (lower.includes('document')) return NOTIFICATION_ICONS.document;
  if (lower.includes('subscription')) return NOTIFICATION_ICONS.subscription;
  return NOTIFICATION_ICONS.document;
}

function groupByDate(notifications: Notification[]): Map<string, Notification[]> {
  const groups = new Map<string, Notification[]>();
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  for (const n of notifications) {
    const d = new Date(n.created_at).toDateString();
    let key: string;
    if (d === today) key = 'today';
    else if (d === yesterday) key = 'yesterday';
    else key = 'earlier';

    const existing = groups.get(key) ?? [];
    existing.push(n);
    groups.set(key, existing);
  }

  return groups;
}

// Simple notification sound — plays once on new notification
const NOTIFICATION_SOUND = typeof Audio !== 'undefined'
  ? new Audio('data:audio/wav;base64,UklGRl9vT19teleXAVlbm5ZUmFtZQ==')
  : null;

export function NotificationBell() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const prevUnreadRef = useRef(0);

  // Undo state
  const [undoSnackbar, setUndoSnackbar] = useState<{ open: boolean; notificationId: string; wasRead: boolean }>({
    open: false,
    notificationId: '',
    wasRead: false,
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await listNotifications(1, 20);
        if (!cancelled) {
          setNotifications(res.data);
          setUnreadCount(res.meta.unread_count);
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  // Play sound on new unread notification
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current && prevUnreadRef.current > 0) {
      NOTIFICATION_SOUND?.play().catch(() => { /* autoplay blocked */ });
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  const handleMarkAsRead = async (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    const wasRead = notification?.read_at !== null;

    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Show undo snackbar
      setUndoSnackbar({ open: true, notificationId: id, wasRead });
    } catch {
      // Silently fail
    }
  };

  const handleUndoMarkAsRead = async () => {
    // Optimistically revert
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === undoSnackbar.notificationId ? { ...n, read_at: undoSnackbar.wasRead ? new Date().toISOString() : null } : n,
      ),
    );
    setUnreadCount((prev) => (undoSnackbar.wasRead ? prev : prev + 1));
    setUndoSnackbar({ open: false, notificationId: '', wasRead: false });
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

  const grouped = groupByDate(notifications);

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

  const dateLabels: Record<string, string> = {
    today: t('header.today'),
    yesterday: t('header.yesterday'),
    earlier: t('header.earlier'),
  };

  const notificationPanel = (
    <Box sx={{ maxHeight: 440, overflowY: 'auto' }}>
      {notifications.length === 0 && !loading ? (
        <EmptyState title={t('header.no_notifications')} />
      ) : (
        <>
          {/* Header actions */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {t('header.notifications')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {unreadCount > 0 && (
                <IconButton size="small" onClick={handleMarkAllAsRead} aria-label={t('header.mark_all_read')}>
                  <DoneAllIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* Grouped notifications */}
          {Array.from(grouped.entries()).map(([group, items]) => (
            <Box key={group}>
              <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  {dateLabels[group] ?? group}
                </Typography>
              </Box>
              {items.map((notification) => (
                <Box
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read_at) {
                      handleMarkAsRead(notification.id);
                    }
                    if (notification.data.action_url) {
                      window.location.href = notification.data.action_url;
                    }
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: notification.read_at ? 'transparent' : 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {/* Icon */}
                  <Box
                    sx={{
                      mt: 0.25,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'action.hover',
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ fontWeight: notification.read_at ? 400 : 600 }}
                    >
                      {notification.data.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                      {notification.data.message}
                    </Typography>
                  </Box>

                  {/* Unread dot */}
                  {!notification.read_at && (
                    <Box
                      sx={{
                        mt: 1,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Box>
              ))}
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
                  maxWidth: 380,
                  zIndex: 20,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                }}
              >
                {notificationPanel}
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
                  width: 380,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                }}
              >
                {notificationPanel}
              </Paper>
            </ClickAwayListener>
          </Popper>
        </>
      )}

      {/* Undo snackbar */}
      <Snackbar
        open={undoSnackbar.open}
        autoHideDuration={4000}
        onClose={() => setUndoSnackbar({ open: false, notificationId: '', wasRead: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={handleUndoMarkAsRead} startIcon={<UndoIcon />}>
              {t('header.undo')}
            </Button>
          }
        >
          {t('header.marked_as_read')}
        </MuiAlert>
      </Snackbar>
    </>
  );
}
