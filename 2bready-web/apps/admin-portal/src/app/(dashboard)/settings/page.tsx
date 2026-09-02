'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import SectionCard from '@/components/ui/SectionCard';
import PageSkeleton from '@/components/ui/PageSkeleton';
import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';
import FormSwitch from '@/components/forms/FormSwitch';
import { useToast } from '@/components/feedback/ToastProvider';
import { useAuthStore } from '@/store/auth.store';
import { getGoogleOAuthSetting, updateGoogleOAuthSetting } from '@/domains/settings/api';
import { googleOAuthSettingSchema, type GoogleOAuthSettingInput } from '@/domains/settings/schemas';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

// This is the Integrations tab's content — settings/layout.tsx owns the
// PageHeader and Tabs shell, and only renders this tab's link for admins
// (settings.manage is admin-only) — the redirect below is defense-in-depth
// for a direct URL visit, matching the pattern every other admin-only page
// in this app already uses.
export default function SettingsPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const { t } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [secretConfigured, setSecretConfigured] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GoogleOAuthSettingInput>({
    resolver: zodResolver(googleOAuthSettingSchema),
    defaultValues: { enabled: false, client_id: '', client_secret: '' },
  });

  useEffect(() => {
    if (!hasRole('admin')) router.replace('/settings/profile');
  }, [hasRole, router]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const setting = await getGoogleOAuthSetting();
        if (!cancelled) {
          reset({ enabled: setting.enabled, client_id: setting.client_id ?? '', client_secret: '' });
          setSecretConfigured(setting.client_secret_configured);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (data: GoogleOAuthSettingInput) => {
    setServerError('');
    try {
      const updated = await updateGoogleOAuthSetting({
        enabled: data.enabled,
        client_id: data.client_id,
        client_secret: data.client_secret || undefined,
      });
      setSecretConfigured(updated.client_secret_configured);
      reset({ enabled: updated.enabled, client_id: updated.client_id ?? '', client_secret: '' });
      toast.success(t('settings.google_oauth_saved'));
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  if (loading) {
    return <PageSkeleton sections={1} fieldsPerSection={4} />;
  }

  const enabled = watch('enabled');

  return (
    <>
      <SectionCard
        title={t('settings.google_oauth_title')}
        action={
          <Chip
            label={secretConfigured ? t('settings.google_oauth_configured') : t('settings.google_oauth_not_configured')}
            color={secretConfigured ? 'success' : 'default'}
            size="small"
            variant="outlined"
          />
        }
      >
        <Box component="form" onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
          <Typography variant="body2" color="text.secondary">
            {t('settings.google_oauth_desc')}
          </Typography>

          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Controller
            name="enabled"
            control={control}
            render={({ field }) => (
              <FormSwitch checked={field.value} onChange={field.onChange} label={t('settings.google_oauth_enabled_label')} />
            )}
          />

          <Box>
            <FieldLabel>{t('settings.google_oauth_client_id')}</FieldLabel>
            <FormTextField
              placeholder="xxxxxxxx.apps.googleusercontent.com"
              fullWidth
              error={!!errors.client_id}
              helperText={errors.client_id?.message}
              {...register('client_id')}
            />
          </Box>

          <Box>
            <FieldLabel>{t('settings.google_oauth_client_secret')}</FieldLabel>
            <FormTextField
              type="password"
              placeholder={secretConfigured ? t('settings.google_oauth_secret_hint_configured') : t('settings.google_oauth_secret_hint_empty')}
              fullWidth
              error={!!errors.client_secret}
              helperText={errors.client_secret?.message}
              {...register('client_secret')}
            />
          </Box>

          <Box className="flex justify-end">
            <Button type="submit" variant="contained" loading={isSubmitting} disabled={enabled && !secretConfigured && !watch('client_secret')}>
              {t('common.save')}
            </Button>
          </Box>
        </Box>
      </SectionCard>
    </>
  );
}
