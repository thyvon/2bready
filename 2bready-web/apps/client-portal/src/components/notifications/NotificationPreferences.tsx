'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from '@/lib/i18n';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreference,
} from '@/lib/notification-api';

const TYPE_ICONS: Record<string, string> = {
  payment_confirmed: 'Payment Confirmed',
  payment_rejected: 'Payment Rejected',
  audit_approved: 'Audit Approved',
  document_verified: 'Document Verified',
  document_expired: 'Document Expired',
  subscription_cancelled: 'Subscription Cancelled',
};

export function NotificationPreferences() {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; type: 'success' | 'error' }>({
    open: false,
    type: 'success',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getNotificationPreferences();
        if (!cancelled) setPreferences(data);
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleToggle = (type: string, channel: 'email_enabled' | 'database_enabled') => {
    setPreferences((prev) =>
      prev.map((p) =>
        p.type === type ? { ...p, [channel]: !p[channel] } : p,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateNotificationPreferences(
        preferences.map((p) => ({
          type: p.type,
          email_enabled: p.email_enabled,
          database_enabled: p.database_enabled,
        })),
      );
      setPreferences(updated);
      setSnackbar({ open: true, type: 'success' });
    } catch {
      setSnackbar({ open: true, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={60} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        {t('notification_preferences.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('notification_preferences.description')}
      </Typography>

      {/* Header row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 80px 80px',
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
          Type
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', textAlign: 'center' }}>
          {t('notification_preferences.email')}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', textAlign: 'center' }}>
          {t('notification_preferences.in_app')}
        </Typography>
      </Box>

      {/* Preference rows */}
      {preferences.map((pref) => (
        <Box
          key={pref.type}
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 80px',
            gap: 1,
            alignItems: 'center',
            px: 2,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Typography variant="body2">
            {TYPE_ICONS[pref.type] ?? pref.label}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Switch
              size="small"
              checked={pref.email_enabled}
              onChange={() => handleToggle(pref.type, 'email_enabled')}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Switch
              size="small"
              checked={pref.database_enabled}
              onChange={() => handleToggle(pref.type, 'database_enabled')}
            />
          </Box>
        </Box>
      ))}

      {/* Save button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '...' : t('notification_preferences.save')}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, type: 'success' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.type} onClose={() => setSnackbar({ open: false, type: 'success' })}>
          {snackbar.type === 'success' ? t('notification_preferences.saved') : 'Error'}
        </Alert>
      </Snackbar>
    </Box>
  );
}
