'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import SectionCard from '@/components/ui/SectionCard';
import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';
import { pricingSchema, type PricingFormInput } from '@/domains/firm/schemas';
import { getMyFirm, updateFirmPricing } from '@/domains/firm/api';
import { useToast } from '@/components/feedback/ToastProvider';
import { getApiError, formatCents } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

const LEVELS: Array<{ key: 'price_l2' | 'price_l3' | 'price_l4'; labelKey: 'firm.level_2' | 'firm.level_3' | 'firm.level_4' }> = [
  { key: 'price_l2', labelKey: 'firm.level_2' },
  { key: 'price_l3', labelKey: 'firm.level_3' },
  { key: 'price_l4', labelKey: 'firm.level_4' },
];

export default function FirmPricingPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [firmId, setFirmId] = useState<string | null>(null);
  const [currentCents, setCurrentCents] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PricingFormInput>({
    resolver: zodResolver(pricingSchema),
    defaultValues: { price_l2: '', price_l3: '', price_l4: '' },
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const firm = await getMyFirm();
        if (cancelled) return;
        setFirmId(firm.id);
        setCurrentCents({
          price_l2: firm.price_l2_cents,
          price_l3: firm.price_l3_cents,
          price_l4: firm.price_l4_cents,
        });
        reset({
          price_l2: firm.price_l2_cents != null ? String(firm.price_l2_cents / 100) : '',
          price_l3: firm.price_l3_cents != null ? String(firm.price_l3_cents / 100) : '',
          price_l4: firm.price_l4_cents != null ? String(firm.price_l4_cents / 100) : '',
        });
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

  const onSubmit = async (data: PricingFormInput) => {
    if (!firmId) return;
    try {
      const firm = await updateFirmPricing(firmId, {
        price_l2_cents: data.price_l2 ? Math.round(Number(data.price_l2) * 100) : null,
        price_l3_cents: data.price_l3 ? Math.round(Number(data.price_l3) * 100) : null,
        price_l4_cents: data.price_l4 ? Math.round(Number(data.price_l4) * 100) : null,
      });
      setCurrentCents({
        price_l2: firm.price_l2_cents,
        price_l3: firm.price_l3_cents,
        price_l4: firm.price_l4_cents,
      });
      toast.success(t('firm.update_success'));
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
        <SectionCard title={t('firm.pricing_card_title')} subtitle={t('firm.pricing_subtitle')}>
          {!loading && (
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {LEVELS.map(({ key, labelKey }) => (
                  <Box key={key}>
                    <FieldLabel>{t(labelKey)}</FieldLabel>
                    <FormTextField
                      fullWidth
                      placeholder="0.00"
                      error={!!errors[key]}
                      helperText={
                        errors[key]?.message ??
                        (currentCents[key] != null ? `${t('firm.current_price')}: ${formatCents(currentCents[key]!)}` : t('firm.price_hint'))
                      }
                      {...register(key)}
                    />
                  </Box>
                ))}
                <Box>
                  <Button type="submit" variant="contained" loading={isSubmitting}>
                    {t('firm.save')}
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
