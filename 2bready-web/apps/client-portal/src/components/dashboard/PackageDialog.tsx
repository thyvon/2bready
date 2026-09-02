'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import { PricingCard } from './PricingCard';
import { ConfirmDialog } from '@2bready/ui-core';
import { buildLevelPricing, type LevelPricing, type BillingPeriod } from '@/lib/billing-data';
import { useJourney } from '@/components/JourneyProvider';
import { usePackages } from '@/components/PackageProvider';
import { useToast } from '@/components/ToastProvider';
import { subscribeToPackage } from '@/lib/subscription-api';
import { getApiError, formatCents } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface PackageDialogProps {
  open: boolean;
  onClose: () => void;
  levelCode?: string;
}

export function PackageDialog({ open, onClose, levelCode }: PackageDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { journey, subscriptions, refetchAll } = useJourney();
  const { packages } = usePackages();
  const [period, setPeriod] = useState<BillingPeriod>('yearly');
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);

  const allLevelPricing = useMemo(
    () => buildLevelPricing(packages, journey?.levels ?? [], period),
    [packages, journey, period],
  );

  const pricing: LevelPricing | null = useMemo(() => {
    const filtered = levelCode
      ? allLevelPricing.filter((p) => p.pkg.journey_level_code === levelCode)
      : allLevelPricing;
    return filtered[0] ?? null;
  }, [allLevelPricing, levelCode]);

  function statusFor(p: LevelPricing): 'free' | 'active' | 'pending' | 'none' {
    if (p.pkg.tier === 'free') return 'free';
    const ids = new Set([p.pkg.id, p.monthly?.id, p.yearly?.id].filter((id): id is string => Boolean(id)));
    const sub = subscriptions.find((s) => s.package && ids.has(s.package.id) && s.status !== 'cancelled');
    if (!sub) return 'none';
    return sub.status === 'active' ? 'active' : 'pending';
  }

  function handleSelect() {
    if (!pricing) return;
    const price = pricing.pkg.price_cents === 0 ? 'free' : `${formatCents(pricing.pkg.price_cents, 'USD')}/${pricing.pkg.billing_period}`;
    setConfirmAction({
      title: t('billing.confirm_start', { name: pricing.pkg.name, price }),
      description: '',
      onConfirm: async () => {
        setConfirmAction(null);
        setSubscribing(pricing!.pkg.id);
        try {
          await subscribeToPackage(pricing!.pkg.id);
          await refetchAll();
          toast.success(t('billing.toast_started', { name: pricing!.pkg.name }));
          onClose();
        } catch (err) {
          toast.error(getApiError(err).message || t('billing.toast_could_not_start'));
        } finally {
          setSubscribing(null);
        }
      },
    });
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}>
        {pricing && (
          <Box sx={{ p: 3 }}>
            <PricingCard
              pricing={pricing}
              status={statusFor(pricing)}
              loading={subscribing === pricing.pkg.id}
              onSelect={handleSelect}
              period={period}
              onPeriodChange={setPeriod}
            />
          </Box>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title ?? ''}
        description={confirmAction?.description ?? ''}
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
