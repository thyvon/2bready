'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import SectionCard from '@/components/ui/SectionCard';
import FormSwitch from '@/components/forms/FormSwitch';
import { ConfirmDialog } from '@2bready/ui-core';
import { useToast } from '@/components/feedback/ToastProvider';
import { useAuthStore } from '@/store/auth.store';
import { getTwoFactorSetting, updateTwoFactorSetting } from '@/domains/settings/api';
import { twoFactorSettingSchema, type TwoFactorSettingInput } from '@/domains/settings/schemas';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

// Mirrors settings/page.tsx's (Google OAuth) Integrations tab, same
// admin-only defense-in-depth redirect for a direct URL visit.
export default function SecuritySettingsPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const { t } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');
  const [savedEnabled, setSavedEnabled] = useState(true);
  // Turning this off is a platform-wide override of every account's own 2FA
  // requirement (role-derived default, per-user exemption tri-state, and
  // even an already-enrolled admin) — see IssueAuthTokenAction on the API
  // side. Confirmed explicitly since it's the kind of toggle you don't want
  // flipped by a stray click.
  const [pendingDisable, setPendingDisable] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { isSubmitting },
  } = useForm<TwoFactorSettingInput>({
    resolver: zodResolver(twoFactorSettingSchema),
    defaultValues: { enabled: true },
  });

  useEffect(() => {
    if (!hasRole('admin')) router.replace('/settings/profile');
  }, [hasRole, router]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const setting = await getTwoFactorSetting();
        if (!cancelled) {
          reset({ enabled: setting.enabled });
          setSavedEnabled(setting.enabled);
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

  const save = async (enabled: boolean) => {
    setServerError('');
    try {
      const updated = await updateTwoFactorSetting(enabled);
      reset({ enabled: updated.enabled });
      setSavedEnabled(updated.enabled);
      toast.success(t('settings.two_factor_saved'));
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const submit = async (data: TwoFactorSettingInput) => {
    if (savedEnabled && !data.enabled) {
      setPendingDisable(true);
      return;
    }
    await save(data.enabled);
  };

  if (loading) {
    return (
      <Box className="flex justify-center py-16">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <SectionCard title={t('settings.two_factor_title')}>
        <Box component="form" onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
          <Typography variant="body2" color="text.secondary">
            {t('settings.two_factor_desc')}
          </Typography>

          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Controller
            name="enabled"
            control={control}
            render={({ field }) => (
              <FormSwitch checked={field.value} onChange={field.onChange} label={t('settings.two_factor_enabled_label')} />
            )}
          />

          <Box className="flex justify-end">
            <Button type="submit" variant="contained" loading={isSubmitting}>
              {t('common.save')}
            </Button>
          </Box>
        </Box>
      </SectionCard>

      <ConfirmDialog
        open={pendingDisable}
        title={t('settings.confirm_two_factor_disable_title')}
        description={t('settings.confirm_two_factor_disable_desc')}
        confirmLabel={t('settings.confirm_two_factor_disable_action')}
        danger
        loading={isSubmitting}
        onCancel={() => {
          setPendingDisable(false);
          reset({ enabled: savedEnabled });
        }}
        onConfirm={async () => {
          await save(getValues('enabled'));
          setPendingDisable(false);
        }}
      />
    </>
  );
}
