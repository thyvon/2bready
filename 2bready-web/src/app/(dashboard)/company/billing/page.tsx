'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MuiLink from '@mui/material/Link';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import StatusBadge from '@/components/ui/StatusBadge';
import FieldLabel from '@/components/forms/FieldLabel';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/feedback/ToastProvider';
import { listPackages } from '@/domains/package/api';
import type { Package } from '@/domains/package/types';
import { listSubscriptions, listPayments, subscribeToPackage, submitPayment, captureLead } from '@/domains/payment/api';
import type { Subscription, Payment, PaymentMethod } from '@/domains/payment/types';
import { leadFormSchema, leadFormDefaults, type LeadFormInput } from '@/domains/payment/schemas';
import { getApiError, formatCents } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function CompanyBillingPage() {
  const { user } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();

  const [packages, setPackages] = useState<Package[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  const [pickerOpen, setPickerOpen] = useState<Package | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('manual_bank_transfer');
  const [subscribing, setSubscribing] = useState(false);
  const [submittingPaid, setSubmittingPaid] = useState(false);

  const [leadOpen, setLeadOpen] = useState(false);
  const {
    register: registerLead,
    handleSubmit: handleLeadSubmit,
    reset: resetLeadForm,
    formState: { errors: leadErrors, isSubmitting: submittingLead },
  } = useForm<LeadFormInput>({ resolver: zodResolver(leadFormSchema), defaultValues: leadFormDefaults });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const [pkgs, subs, pays] = await Promise.all([listPackages(), listSubscriptions(), listPayments()]);
        if (cancelled) return;
        setPackages(pkgs);

        const latestSub = subs[0] ?? null;
        setSubscription(latestSub);
        setPayment(latestSub ? pays.find((p) => p.subscription_id === latestSub.id) ?? null : null);
      } catch (err) {
        if (!cancelled) toast.error(getApiError(err).message);
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

  const handleSubscribe = async () => {
    if (!pickerOpen) return;
    setSubscribing(true);
    try {
      const result = await subscribeToPackage(pickerOpen.id, method);
      setSubscription(result.subscription);
      setPayment(result.payment);
      setPickerOpen(null);
      toast.success(t('billing.subscribe_success'));
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setSubscribing(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!payment) return;
    setSubmittingPaid(true);
    try {
      const updated = await submitPayment(payment.id);
      setPayment(updated);
      toast.success(t('billing.mark_paid_success'));
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setSubmittingPaid(false);
    }
  };

  const handleLeadCapture = async (data: LeadFormInput) => {
    try {
      await captureLead({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        company_name: data.company_name || undefined,
        source: 'paywall',
      });
      toast.success(t('lead.success'));
      setLeadOpen(false);
      resetLeadForm(leadFormDefaults);
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center py-16">
        <CircularProgress />
      </Box>
    );
  }

  const isActive = subscription?.status === 'active';
  const isPendingPayment = subscription?.status === 'pending' && payment;

  return (
    <>
      <PageHeader title={t('nav.subscription')} />

      {isActive && subscription && (
        <SectionCard title={t('billing.current_plan')}>
          <Box className="flex items-center gap-3">
            <StatusBadge status="active" />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>{subscription.package?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {subscription.package && formatCents(subscription.package.price_cents)} / {subscription.package && t(`package.billing_period.${subscription.package.billing_period}`)}
            </Typography>
          </Box>
        </SectionCard>
      )}

      {isPendingPayment && payment.method === 'manual_bank_transfer' && (
        <SectionCard title={t('billing.bank_transfer_title')} subtitle={t('billing.bank_transfer_subtitle')}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mb: 3 }}>
            {[
              [t('billing.bank_name'), t('billing.bank_name_value')],
              [t('billing.account_name'), t('billing.account_name_value')],
              [t('billing.account_number'), t('billing.account_number_value')],
              [t('billing.reference'), payment.gateway_reference ?? '—'],
              [t('billing.amount'), formatCents(payment.amount_cents, payment.currency)],
            ].map(([label, value], i, arr) => (
              <Box
                key={label}
                sx={{
                  display: 'flex', justifyContent: 'space-between', gap: 2, px: 2.5, py: 1.5,
                  borderBottom: i < arr.length - 1 ? '1px solid' : 'none', borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
              </Box>
            ))}
          </Box>

          {payment.status === 'pending' ? (
            <Box className="flex justify-end">
              <Button variant="contained" onClick={handleMarkPaid} loading={submittingPaid}>
                {t('billing.mark_paid')}
              </Button>
            </Box>
          ) : (
            <Alert severity="info">{t('billing.awaiting_confirmation')}</Alert>
          )}
        </SectionCard>
      )}

      {isPendingPayment && payment.method === 'stripe' && (
        <SectionCard title={t('billing.stripe_title')}>
          <Alert severity="info">{t('billing.stripe_coming_soon')}</Alert>
        </SectionCard>
      )}

      {!isActive && !isPendingPayment && (
        <Grid container spacing={3}>
          {packages.map((pkg) => (
            <Grid size={{ xs: 12, md: 4 }} key={pkg.id}>
              <SectionCard title={pkg.name}>
                <Typography variant="h4" sx={{ mb: 0.5 }}>{formatCents(pkg.price_cents)}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t(`package.billing_period.${pkg.billing_period}`)}
                </Typography>
                {pkg.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{pkg.description}</Typography>
                )}
                <Button variant="contained" fullWidth onClick={() => { setPickerOpen(pkg); setMethod('manual_bank_transfer'); }}>
                  {t('billing.choose_plan')}
                </Button>
              </SectionCard>
            </Grid>
          ))}
        </Grid>
      )}

      {!isActive && !isPendingPayment && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <MuiLink component="button" type="button" variant="body2" underline="hover" onClick={() => setLeadOpen(true)}>
            {t('billing.talk_to_sales')}
          </MuiLink>
        </Box>
      )}

      <Dialog open={leadOpen} onClose={() => setLeadOpen(false)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={handleLeadSubmit(handleLeadCapture)} noValidate>
          <DialogTitle>{t('lead.title')}</DialogTitle>
          <DialogContent className="flex flex-col gap-4" sx={{ pt: '8px !important' }}>
            <Typography variant="body2" color="text.secondary">{t('lead.subtitle')}</Typography>

            <Box>
              <FieldLabel>{t('lead.name')}</FieldLabel>
              <TextField fullWidth autoFocus error={!!leadErrors.name} helperText={leadErrors.name?.message} {...registerLead('name')} />
            </Box>
            <Box>
              <FieldLabel>{t('lead.email')}</FieldLabel>
              <TextField fullWidth type="email" error={!!leadErrors.email} helperText={leadErrors.email?.message} {...registerLead('email')} />
            </Box>
            <Box>
              <FieldLabel>{t('lead.phone')}</FieldLabel>
              <TextField fullWidth error={!!leadErrors.phone} helperText={leadErrors.phone?.message} {...registerLead('phone')} />
            </Box>
            <Box>
              <FieldLabel>{t('lead.company_name')}</FieldLabel>
              <TextField fullWidth error={!!leadErrors.company_name} helperText={leadErrors.company_name?.message} {...registerLead('company_name')} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="text" onClick={() => setLeadOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" loading={submittingLead}>{t('lead.submit')}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={!!pickerOpen} onClose={() => setPickerOpen(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('billing.choose_payment_method')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {pickerOpen?.name} — {pickerOpen && formatCents(pickerOpen.price_cents)}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <RadioGroup value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            <FormControlLabel value="manual_bank_transfer" control={<Radio />} label={t('billing.method_bank_transfer')} />
            <FormControlLabel value="stripe" control={<Radio />} label={t('billing.method_stripe')} />
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="text" onClick={() => setPickerOpen(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSubscribe} loading={subscribing}>{t('billing.confirm_choice')}</Button>
        </DialogActions>
      </Dialog>

      {!user?.current_company_id && <Alert severity="warning" sx={{ mt: 3 }}>{t('company.no_company_title')}</Alert>}
    </>
  );
}
