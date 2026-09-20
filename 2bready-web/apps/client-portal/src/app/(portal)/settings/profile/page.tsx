'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';

import { SectionCard } from '@2bready/ui-core';
import FormTextField from '@/components/forms/FormTextField';
import { useAuthStore } from '@/store/auth.store';
import { updateProfile, changePassword } from '@/lib/profile-api';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/ToastProvider';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  password: z.string().min(8, 'Must be at least 8 characters').regex(/[A-Z]/, 'Must contain an uppercase letter').regex(/[0-9]/, 'Must contain a number'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, { message: 'Passwords do not match', path: ['password_confirmation'] });
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { t } = useTranslation();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [serverError, setServerError] = useState('');

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', password: '', password_confirmation: '' },
  });

  const handleProfileSubmit = async (data: ProfileForm) => {
    setServerError('');
    try {
      const updated = await updateProfile(data);
      updateUser(updated);
      toast.success(t('settings.profile_saved'));
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const handlePasswordSubmit = async (data: PasswordForm) => {
    setServerError('');
    try {
      await changePassword(data);
      toast.success(t('settings.password_saved'));
      passwordForm.reset();
    } catch (err) {
      const msg = getApiError(err).message;
      setServerError(msg.includes('current_password') ? t('settings.password_wrong_current') : msg);
    }
  };

  if (!user) return null;

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }} className="flex flex-col gap-6">
      {/* Profile overview */}
      <SectionCard>
        <Box className="flex items-center gap-4">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.25rem',
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </Box>
          <Box>
            <Typography variant="h6">{user.name}</Typography>
            <Typography variant="body2" color="text.secondary">{user.email}</Typography>
          </Box>
        </Box>

        <Box className="flex items-center justify-between gap-4 mt-6 pt-4" sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">{t('settings.profile_two_factor')}</Typography>
          <Chip
            label={user.totp_enabled ? t('settings.profile_two_factor_on') : t('settings.profile_two_factor_off')}
            color={user.totp_enabled ? 'success' : 'default'}
            size="small"
            variant="outlined"
          />
        </Box>
      </SectionCard>

      {/* Edit profile form */}
      <SectionCard title={t('settings.profile_edit_title')}>
        <Box component="form" onSubmit={profileForm.handleSubmit(handleProfileSubmit)} noValidate className="flex flex-col gap-4">
          {serverError && <Alert severity="error" onClose={() => setServerError('')}>{serverError}</Alert>}

          <FormTextField
            label={t('settings.profile_name_label')}
            fullWidth
            error={!!profileForm.formState.errors.name}
            helperText={profileForm.formState.errors.name?.message}
            {...profileForm.register('name')}
          />

          <FormTextField
            label={t('settings.profile_email_label')}
            type="email"
            fullWidth
            error={!!profileForm.formState.errors.email}
            helperText={profileForm.formState.errors.email?.message}
            {...profileForm.register('email')}
          />

          <Box className="flex justify-end">
            <Button type="submit" variant="contained" loading={profileForm.formState.isSubmitting}>
              {t('settings.profile_save')}
            </Button>
          </Box>
        </Box>
      </SectionCard>

      {/* Change password form */}
      <SectionCard title={t('settings.password_title')}>
        <Box component="form" onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} noValidate className="flex flex-col gap-4">
          <FormTextField
            label={t('settings.password_current_label')}
            type="password"
            fullWidth
            error={!!passwordForm.formState.errors.current_password}
            helperText={passwordForm.formState.errors.current_password?.message}
            {...passwordForm.register('current_password')}
          />

          <Divider />

          <FormTextField
            label={t('settings.password_new_label')}
            type="password"
            fullWidth
            error={!!passwordForm.formState.errors.password}
            helperText={passwordForm.formState.errors.password?.message}
            {...passwordForm.register('password')}
          />

          <FormTextField
            label={t('settings.password_confirm_label')}
            type="password"
            fullWidth
            error={!!passwordForm.formState.errors.password_confirmation}
            helperText={passwordForm.formState.errors.password_confirmation?.message}
            {...passwordForm.register('password_confirmation')}
          />

          <Box className="flex justify-end">
            <Button type="submit" variant="contained" loading={passwordForm.formState.isSubmitting}>
              {t('settings.password_save')}
            </Button>
          </Box>
        </Box>
      </SectionCard>
    </Box>
  );
}
