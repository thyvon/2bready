'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import SectionCard from '@/components/ui/SectionCard';
import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';
import FormSelect from '@/components/forms/FormSelect';
import { useToast } from '@/components/feedback/ToastProvider';
import { useAuthStore } from '@/store/auth.store';
import { getMailSetting, updateMailSetting, sendMailSettingTest } from '@/domains/settings/api';
import { mailSettingSchema, type MailSettingInput } from '@/domains/settings/schemas';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

// Mirrors settings/page.tsx's (Google OAuth) Integrations tab exactly, same
// admin-only defense-in-depth redirect for a direct URL visit.
export default function EmailSettingsPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const { t } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [passwordConfigured, setPasswordConfigured] = useState(false);
  // Tracks the persisted config (host + from_address actually saved on the
  // backend), not the live form — "Send test email" tests what's saved, not
  // whatever's currently typed but unsaved in the fields.
  const [configured, setConfigured] = useState(false);
  const [serverError, setServerError] = useState('');
  const [testing, setTesting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MailSettingInput>({
    resolver: zodResolver(mailSettingSchema),
    defaultValues: { host: '', port: 587, username: '', password: '', encryption: 'tls', from_address: '', from_name: '' },
  });

  useEffect(() => {
    if (!hasRole('admin')) router.replace('/settings/profile');
  }, [hasRole, router]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const setting = await getMailSetting();
        if (!cancelled) {
          reset({
            host: setting.host ?? '',
            port: setting.port ?? 587,
            username: setting.username ?? '',
            password: '',
            encryption: setting.encryption ?? 'tls',
            from_address: setting.from_address ?? '',
            from_name: setting.from_name ?? '',
          });
          setPasswordConfigured(setting.password_configured);
          setConfigured(!!setting.host && !!setting.from_address);
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

  const submit = async (data: MailSettingInput) => {
    setServerError('');
    try {
      const updated = await updateMailSetting({
        host: data.host,
        port: Number(data.port),
        username: data.username || undefined,
        password: data.password || undefined,
        encryption: data.encryption,
        from_address: data.from_address,
        from_name: data.from_name,
      });
      setPasswordConfigured(updated.password_configured);
      setConfigured(!!updated.host && !!updated.from_address);
      reset({
        host: updated.host ?? '',
        port: updated.port ?? 587,
        username: updated.username ?? '',
        password: '',
        encryption: updated.encryption ?? 'tls',
        from_address: updated.from_address ?? '',
        from_name: updated.from_name ?? '',
      });
      toast.success(t('settings.mail_saved'));
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const sendTest = async () => {
    setServerError('');
    setTesting(true);
    try {
      const result = await sendMailSettingTest();
      toast.success(result.message);
    } catch (err) {
      setServerError(getApiError(err).message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center py-16">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <SectionCard
      title={t('settings.mail_title')}
      action={
        <Chip
          label={configured ? t('settings.mail_configured') : t('settings.mail_not_configured')}
          color={configured ? 'success' : 'default'}
          size="small"
          variant="outlined"
        />
      }
    >
      <Box component="form" onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
        <Typography variant="body2" color="text.secondary">
          {t('settings.mail_desc')}
        </Typography>

        {serverError && <Alert severity="error">{serverError}</Alert>}

        <Box className="flex gap-4">
          <Box className="flex-1">
            <FieldLabel>{t('settings.mail_host')}</FieldLabel>
            <FormTextField
              placeholder="smtp.example.com"
              fullWidth
              error={!!errors.host}
              helperText={errors.host?.message}
              {...register('host')}
            />
          </Box>
          <Box sx={{ width: 140 }}>
            <FieldLabel>{t('settings.mail_port')}</FieldLabel>
            <FormTextField
              type="number"
              placeholder="587"
              fullWidth
              error={!!errors.port}
              helperText={errors.port?.message}
              {...register('port')}
            />
          </Box>
        </Box>

        <Box className="flex gap-4">
          <Box className="flex-1">
            <FieldLabel>{t('settings.mail_username')}</FieldLabel>
            <FormTextField fullWidth error={!!errors.username} helperText={errors.username?.message} {...register('username')} />
          </Box>
          <Box className="flex-1">
            <FieldLabel>{t('settings.mail_password')}</FieldLabel>
            <FormTextField
              type="password"
              placeholder={passwordConfigured ? t('settings.mail_password_hint_configured') : t('settings.mail_password_hint_empty')}
              fullWidth
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register('password')}
            />
          </Box>
        </Box>

        <Box sx={{ width: 200 }}>
          <FieldLabel>{t('settings.mail_encryption')}</FieldLabel>
          <Controller
            name="encryption"
            control={control}
            render={({ field }) => (
              <FormSelect {...field} fullWidth>
                <MenuItem value="tls">{t('settings.mail_encryption_tls')}</MenuItem>
                <MenuItem value="ssl">{t('settings.mail_encryption_ssl')}</MenuItem>
                <MenuItem value="">{t('settings.mail_encryption_none')}</MenuItem>
              </FormSelect>
            )}
          />
        </Box>

        <Box className="flex gap-4">
          <Box className="flex-1">
            <FieldLabel>{t('settings.mail_from_address')}</FieldLabel>
            <FormTextField
              placeholder="noreply@example.com"
              fullWidth
              error={!!errors.from_address}
              helperText={errors.from_address?.message}
              {...register('from_address')}
            />
          </Box>
          <Box className="flex-1">
            <FieldLabel>{t('settings.mail_from_name')}</FieldLabel>
            <FormTextField
              placeholder="2bReady"
              fullWidth
              error={!!errors.from_name}
              helperText={errors.from_name?.message}
              {...register('from_name')}
            />
          </Box>
        </Box>

        <Box className="flex justify-end gap-3">
          <Button variant="outlined" loading={testing} disabled={!configured} onClick={sendTest}>
            {t('settings.mail_send_test')}
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {t('common.save')}
          </Button>
        </Box>
      </Box>
    </SectionCard>
  );
}
