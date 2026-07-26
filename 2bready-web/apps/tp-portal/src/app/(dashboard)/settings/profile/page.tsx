'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

import SectionCard from '@/components/ui/SectionCard';
import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';
import { updateProfileSchema, changePasswordSchema, type UpdateProfileFormInput, type ChangePasswordFormInput } from '@/domains/profile/schemas';
import { updateProfile, changePassword } from '@/domains/profile/api';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/feedback/ToastProvider';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function ProfilePage() {
  const { t } = useTranslation();
  const toast = useToast();
  const router = useRouter();
  const { user, token, setAuth, clearAuth } = useAuthStore();

  const profileForm = useForm<UpdateProfileFormInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  });

  const passwordForm = useForm<ChangePasswordFormInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSaveProfile = async (data: UpdateProfileFormInput) => {
    try {
      const updated = await updateProfile(data);
      if (token) setAuth(updated, token);
      toast.success(t('profile.update_success'));
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  const onChangePassword = async (data: ChangePasswordFormInput) => {
    try {
      await changePassword(data);
      toast.success(t('profile.password_changed'));
      passwordForm.reset();
      // The backend revokes every token on a successful password change
      // (see ChangeOwnPasswordAction) — this session's own token is included,
      // so the next authenticated request would 401 anyway. Log out now
      // rather than let that happen on an arbitrary later click.
      clearAuth();
      router.replace('/login');
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>{t('profile.title')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('profile.subtitle')}</Typography>
      </Box>

      <SectionCard>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} noValidate>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <FieldLabel>{t('profile.name')}</FieldLabel>
              <FormTextField
                fullWidth
                error={!!profileForm.formState.errors.name}
                helperText={profileForm.formState.errors.name?.message}
                {...profileForm.register('name')}
              />
            </Box>
            <Box>
              <FieldLabel>{t('profile.email')}</FieldLabel>
              <FormTextField
                type="email"
                fullWidth
                error={!!profileForm.formState.errors.email}
                helperText={profileForm.formState.errors.email?.message}
                {...profileForm.register('email')}
              />
            </Box>
            <Box>
              <Button type="submit" variant="contained" loading={profileForm.formState.isSubmitting}>
                {t('profile.save_changes')}
              </Button>
            </Box>
          </Box>
        </form>
      </SectionCard>

      <Divider />

      <SectionCard title={t('profile.change_password_title')}>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} noValidate>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <FieldLabel>{t('profile.current_password')}</FieldLabel>
              <FormTextField
                type="password"
                fullWidth
                autoComplete="current-password"
                error={!!passwordForm.formState.errors.current_password}
                helperText={passwordForm.formState.errors.current_password?.message}
                {...passwordForm.register('current_password')}
              />
            </Box>
            <Box>
              <FieldLabel>{t('profile.new_password')}</FieldLabel>
              <FormTextField
                type="password"
                fullWidth
                autoComplete="new-password"
                error={!!passwordForm.formState.errors.password}
                helperText={passwordForm.formState.errors.password?.message}
                {...passwordForm.register('password')}
              />
            </Box>
            <Box>
              <FieldLabel>{t('profile.confirm_new_password')}</FieldLabel>
              <FormTextField
                type="password"
                fullWidth
                autoComplete="new-password"
                error={!!passwordForm.formState.errors.password_confirmation}
                helperText={passwordForm.formState.errors.password_confirmation?.message}
                {...passwordForm.register('password_confirmation')}
              />
            </Box>
            <Box>
              <Button type="submit" variant="outlined" loading={passwordForm.formState.isSubmitting}>
                {t('profile.change_password')}
              </Button>
            </Box>
          </Box>
        </form>
      </SectionCard>
    </Box>
  );
}
