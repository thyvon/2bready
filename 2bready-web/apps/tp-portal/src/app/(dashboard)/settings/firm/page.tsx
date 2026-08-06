'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import SectionCard from '@/components/ui/SectionCard';
import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';
import { firmProfileSchema, type FirmProfileFormInput } from '@/domains/firm/schemas';
import { getMyFirm, updateFirmProfile } from '@/domains/firm/api';
import { useToast } from '@/components/feedback/ToastProvider';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function FirmProfilePage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [firmId, setFirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FirmProfileFormInput>({
    resolver: zodResolver(firmProfileSchema),
    defaultValues: { name: '', name_kh: '' },
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const firm = await getMyFirm();
        if (cancelled) return;
        setFirmId(firm.id);
        reset({ name: firm.name, name_kh: firm.name_kh ?? '' });
      } catch (err) {
        if (!cancelled) setLoadError(getApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: FirmProfileFormInput) => {
    if (!firmId) return;
    try {
      const firm = await updateFirmProfile(firmId, { name: data.name, name_kh: data.name_kh || null });
      reset({ name: firm.name, name_kh: firm.name_kh ?? '' });
      toast.success(t('firm.profile_update_success'));
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  return (
    <>
      {loadError ? (
        <SectionCard>
          <Box sx={{ color: 'text.secondary', py: 2 }}>{loadError}</Box>
        </SectionCard>
      ) : (
        <SectionCard title={t('firm.profile_card_title')} subtitle={t('firm.profile_subtitle')}>
          {!loading && (
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <FieldLabel>{t('firm.name')}</FieldLabel>
                  <FormTextField
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    {...register('name')}
                  />
                </Box>
                <Box>
                  <FieldLabel>{t('firm.name_kh')}</FieldLabel>
                  <FormTextField
                    fullWidth
                    error={!!errors.name_kh}
                    helperText={errors.name_kh?.message}
                    {...register('name_kh')}
                  />
                </Box>
                <Box>
                  <Button type="submit" variant="contained" loading={isSubmitting}>
                    {t('firm.save_profile')}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </SectionCard>
      )}
    </>
  );
}
