'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { SectionCard, EmptyState, StatusBadge, PillToggle, ConfirmDialog } from '@2bready/ui-core';
import { getApiError, formatCents, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { PricingCard } from '@/components/dashboard/PricingCard';
import { buildLevelPricing, type LevelPricing, type BillingPeriod } from '@/lib/billing-data';
import { useJourney } from '@/components/JourneyProvider';
import { usePackages } from '@/components/PackageProvider';
import { useToast } from '@/components/ToastProvider';
import {
  subscribeToPackage,
  listMyPayments,
  submitManualPayment,
  type Payment,
  type BankTransferGatewayData,
} from '@/lib/subscription-api';
import type { TranslationKey } from '@/lib/i18n';

const PAYMENT_STATUS_I18N: Record<string, TranslationKey> = {
  pending: 'billing.payment_status_pending',
  awaiting_confirmation: 'billing.payment_status_awaiting_confirmation',
  confirmed: 'billing.payment_status_confirmed',
  failed: 'billing.payment_status_failed',
  rejected: 'billing.payment_status_rejected',
};

export default function BillingPage() {
  const { t } = useTranslation();
  const toast = useToast();

  const { journey, loading: loadingJourney, subscriptions, refetchAll } = useJourney();
  const { packages, loading: loadingPackages } = usePackages();
  const [period, setPeriod] = useState<BillingPeriod>('yearly');
  const levelPricing = buildLevelPricing(packages, journey?.levels ?? [], period);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentsError, setPaymentsError] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<{ payment: Payment; gatewayData: BankTransferGatewayData } | null>(null);

  // Confirm dialog state
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);

  const ready = !loadingJourney && !loadingPackages && !loadingPayments;

  async function refresh() {
    const pays = await listMyPayments();
    setPayments(pays);
    await refetchAll();
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pays = await listMyPayments();
        if (!cancelled) setPayments(pays);
      } catch {
        if (!cancelled) setPaymentsError(true);
      } finally {
        if (!cancelled) setLoadingPayments(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function statusFor(pricing: LevelPricing): 'free' | 'active' | 'pending' | 'none' {
    if (pricing.pkg.tier === 'free') return 'free';
    const ids = new Set([pricing.pkg.id, pricing.monthly?.id, pricing.yearly?.id].filter((id): id is string => Boolean(id)));
    const sub = subscriptions.find((s) => s.package && ids.has(s.package.id) && s.status !== 'cancelled');
    if (!sub) return 'none';
    return sub.status === 'active' ? 'active' : 'pending';
  }

  async function handleSelect(pricing: LevelPricing) {
    const price = pricing.pkg.price_cents === 0 ? 'free' : `${formatCents(pricing.pkg.price_cents, 'USD')}/${pricing.pkg.billing_period}`;
    setConfirmAction({
      title: t('billing.confirm_start', { name: pricing.pkg.name, price }),
      description: '',
      onConfirm: async () => {
        setConfirmAction(null);
        setSubscribing(pricing.pkg.id);
        try {
          const result = await subscribeToPackage(pricing.pkg.id);
          setBankDetails({ payment: result.payment, gatewayData: result.gateway_data });
          await refresh();
          toast.success(t('billing.toast_started', { name: pricing.pkg.name }));
        } catch (err) {
          toast.error(getApiError(err).message || t('billing.toast_could_not_start'));
        } finally {
          setSubscribing(null);
        }
      },
    });
  }

  function handleViewBankDetails(payment: Payment) {
    if (!payment.bank_name || !payment.account_name || !payment.account_number) return;
    setBankDetails({
      payment,
      gatewayData: {
        bank_name: payment.bank_name,
        account_name: payment.account_name,
        account_number: payment.account_number,
        reference: payment.gateway_reference ?? '',
        amount_cents: payment.amount_cents,
        currency: payment.currency,
      },
    });
  }

  function handleMarkSent(paymentId: string) {
    setConfirmAction({
      title: t('billing.confirm_mark_sent'),
      description: '',
      onConfirm: async () => {
        setConfirmAction(null);
        setSubmitting(paymentId);
        try {
          await submitManualPayment(paymentId);
          setBankDetails(null);
          await refresh();
          toast.success(t('billing.toast_marked_sent'));
        } catch (err) {
          toast.error(getApiError(err).message || t('billing.toast_could_not_submit'));
        } finally {
          setSubmitting(null);
        }
      },
    });
  }

  return (
    <Box className="flex flex-col gap-6">
      <Typography variant="body2" color="text.secondary">
        {t('billing.progress_subtitle')}
      </Typography>

      <SectionCard title={t('billing.pathways_title')} subtitle={t('billing.pathways_subtitle')}>
        <Box className="flex justify-end mb-4">
          <PillToggle
            options={[
              { key: 'monthly', label: t('billing.period_monthly_label') },
              { key: 'yearly', label: t('billing.period_yearly_label') },
            ]}
            value={period}
            onChange={setPeriod}
            layoutId="billing-period-toggle"
          />
        </Box>
        <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {!ready
            ? [0, 1, 2, 3].map((i) => (
                <Box
                  key={i}
                  sx={{
                    border: '2px solid',
                    borderColor: 'divider',
                    borderRadius: '12px',
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Skeleton variant="text" width="50%" height={20} />
                    <Skeleton variant="text" width="70%" height={28} />
                    <Skeleton variant="text" width="90%" height={14} />
                  </Box>
                  <Box>
                    <Skeleton variant="text" width="40%" height={32} />
                    <Skeleton variant="text" width="60%" height={12} sx={{ opacity: 0.5 }} />
                  </Box>
                  <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[1, 2, 3].map((j) => (
                      <Box key={j} className="flex items-start gap-2">
                        <Skeleton variant="rounded" width={18} height={18} sx={{ flexShrink: 0, borderRadius: '4px' }} />
                        <Skeleton variant="text" width={`${60 + (j % 3) * 15}%`} height={14} />
                      </Box>
                    ))}
                  </Box>
                  <Skeleton variant="rounded" height={40} sx={{ mt: 'auto', borderRadius: '20px' }} />
                </Box>
              ))
            : levelPricing.map((pricing) => (
                <PricingCard
                  key={pricing.pkg.id}
                  pricing={pricing}
                  status={statusFor(pricing)}
                  loading={subscribing === pricing.pkg.id}
                  onSelect={() => handleSelect(pricing)}
                />
              ))}
        </Box>
      </SectionCard>

      <SectionCard title={t('billing.payment_history_title')}>
        {!ready ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[0, 1, 2].map((i) => (
              <Box key={i} className="flex items-center gap-3">
                <Skeleton variant="text" width={100 + (i % 3) * 30} height={14} />
                <Skeleton variant="text" width={60} height={14} />
                <Skeleton variant="text" width={80} height={14} sx={{ ml: 'auto' }} />
                <Skeleton variant="text" width={90} height={14} />
                <Skeleton variant="rounded" width={100} height={22} sx={{ borderRadius: '12px' }} />
              </Box>
            ))}
          </Box>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={<ReceiptLongOutlinedIcon fontSize="inherit" />}
            title={paymentsError ? t('common.retry') : t('billing.no_payment_history_title')}
            description={paymentsError ? t('billing.toast_could_not_submit') : t('billing.no_payment_history_desc')}
            action={paymentsError ? <Button size="small" variant="outlined" onClick={() => window.location.reload()}>{t('common.retry')}</Button> : undefined}
          />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('billing.col_reference')}</TableCell>
                <TableCell>{t('billing.col_type')}</TableCell>
                <TableCell>{t('billing.col_amount')}</TableCell>
                <TableCell>{t('billing.col_submitted')}</TableCell>
                <TableCell>{t('billing.col_status')}</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.gateway_reference ?? '—'}</TableCell>
                  <TableCell>{payment.payable_type === 'tp_hire' ? t('billing.type_tp_hire') : t('billing.type_package')}</TableCell>
                  <TableCell>{formatCents(payment.amount_cents, payment.currency)}</TableCell>
                  <TableCell>{formatDate(payment.submitted_at ?? '')}</TableCell>
                  <TableCell>
                    <StatusBadge status={payment.status} label={t(PAYMENT_STATUS_I18N[payment.status] ?? 'billing.payment_status_pending')} />
                  </TableCell>
                  <TableCell align="right">
                    {payment.status === 'pending' && payment.method === 'manual_bank_transfer' && (
                      <Box className="flex justify-end gap-2">
                        <Button size="small" variant="text" onClick={() => handleViewBankDetails(payment)}>
                          {t('billing.view_bank_details')}
                        </Button>
                        <Button size="small" variant="outlined" loading={submitting === payment.id} onClick={() => handleMarkSent(payment.id)}>
                          {t('billing.btn_ive_sent_it')}
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <Dialog open={bankDetails !== null} onClose={() => setBankDetails(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('billing.bank_transfer_title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('billing.bank_transfer_desc')}
          </Typography>
          {bankDetails && (
            <Box className="flex flex-col gap-1.5">
              <Typography variant="body2">
                <strong>{t('billing.bank_label')}</strong> {bankDetails.gatewayData.bank_name}
              </Typography>
              <Typography variant="body2">
                <strong>{t('billing.account_name_label')}</strong> {bankDetails.gatewayData.account_name}
              </Typography>
              <Typography variant="body2">
                <strong>{t('billing.account_number_label')}</strong> {bankDetails.gatewayData.account_number}
              </Typography>
              <Typography variant="body2">
                <strong>{t('billing.reference_label')}</strong> {bankDetails.gatewayData.reference}
              </Typography>
              <Typography variant="body2">
                <strong>{t('billing.amount_label')}</strong> {formatCents(bankDetails.gatewayData.amount_cents, bankDetails.gatewayData.currency)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBankDetails(null)} color="inherit">
            {t('billing.btn_ill_do_this_later')}
          </Button>
          <Button
            variant="contained"
            loading={bankDetails ? submitting === bankDetails.payment.id : false}
            onClick={() => bankDetails && handleMarkSent(bankDetails.payment.id)}
          >
            {t('billing.btn_ive_sent_transfer')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction?.title ?? ''}
        description={confirmAction?.description ?? ''}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </Box>
  );
}
