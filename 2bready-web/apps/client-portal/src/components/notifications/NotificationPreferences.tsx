'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import { useTranslation, type TranslationKey } from '@/lib/i18n';
import { useToast } from '@/components/ToastProvider';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreference,
} from '@/lib/notification-api';

const TYPE_LABELS: Record<string, TranslationKey> = {
  payment_confirmed: 'notification_preferences.type_payment_confirmed',
  payment_rejected: 'notification_preferences.type_payment_rejected',
  audit_approved: 'notification_preferences.type_audit_approved',
  document_verified: 'notification_preferences.type_document_verified',
  document_expired: 'notification_preferences.type_document_expired',
  subscription_cancelled: 'notification_preferences.type_subscription_cancelled',
};

export function NotificationPreferences() {
  const { t } = useTranslation();
  const toast = useToast();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      toast.success(t('notification_preferences.saved'));
    } catch {
      toast.error(t('notification_preferences.save_error'));
    } finally {
      setSaving(false);
    }
  };

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
          {t('notification_preferences.type')}
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
            {TYPE_LABELS[pref.type] ? t(TYPE_LABELS[pref.type]) : pref.label}
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
      {!loading && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '...' : t('notification_preferences.save')}
          </Button>
        </Box>
      )}
    </Box>
  );
}
