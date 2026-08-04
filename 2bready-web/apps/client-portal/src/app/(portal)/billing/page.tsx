'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
import { getApiError } from '@2bready/api-client';
import { Breadcrumbs, SectionCard, EmptyState, StatusBadge } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { useNavItems } from '@/components/layout/nav-items';
import { PricingCard } from '@/components/dashboard/PricingCard';
import { buildLevelPricing, type LevelPricing } from '@/lib/billing-data';
import { useJourney } from '@/components/JourneyProvider';
import { usePackages } from '@/components/PackageProvider';
import { PageLoader } from '@/components/PageLoader';
import { useToast } from '@/components/ToastProvider';
import {
  subscribeToPackage,
  listMySubscriptions,
  listMyPayments,
  submitManualPayment,
  type Subscription,
  type Payment,
  type BankTransferGatewayData,
} from '@/lib/subscription-api';

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  awaiting_confirmation: 'Awaiting Confirmation',
  confirmed: 'Confirmed',
  failed: 'Failed',
  rejected: 'Rejected',
};

function formatCents(cents: number, currency: string): string {
  return `${currency === 'USD' ? '$' : currency + ' '}${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

export default function BillingPage() {
  const { t } = useTranslation();
  const { all } = useNavItems();
  const item = all.find((i) => i.href === '/billing');
  const toast = useToast();

  const { journey, loading: journeyLoading } = useJourney();
  const { packages, loading: packagesLoading } = usePackages();
  const levelPricing = buildLevelPricing(packages, journey?.levels ?? []);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<{ payment: Payment; gatewayData: BankTransferGatewayData } | null>(null);

  async function refresh() {
    const [subs, pays] = await Promise.all([listMySubscriptions(), listMyPayments()]);
    setSubscriptions(subs);
    setPayments(pays);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [subs, pays] = await Promise.all([listMySubscriptions(), listMyPayments()]);
        if (!cancelled) {
          setSubscriptions(subs);
          setPayments(pays);
        }
      } catch {
        // No subscriptions/payments yet is a valid empty state, not an error.
      } finally {
        if (!cancelled) setPaymentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function statusFor(packageId: string, tier: string): 'free' | 'active' | 'pending' | 'none' {
    if (tier === 'free') return 'free';
    const sub = subscriptions.find((s) => s.package?.id === packageId && s.status !== 'cancelled');
    if (!sub) return 'none';
    return sub.status === 'active' ? 'active' : 'pending';
  }

  // Both actions here create/advance a real Subscription or Payment record —
  // confirm before doing anything, same as admin-portal's own
  // window.confirm() convention for its "Reject Payment" action.
  async function handleSelect(pricing: LevelPricing) {
    const price = pricing.pkg.price_cents === 0 ? 'free' : `${formatCents(pricing.pkg.price_cents, 'USD')}/${pricing.pkg.billing_period}`;
    if (!window.confirm(`Start the ${pricing.pkg.name} pathway for ${price}? You'll get real bank transfer details to complete it.`)) return;

    setSubscribing(pricing.pkg.id);
    try {
      const result = await subscribeToPackage(pricing.pkg.id);
      setBankDetails({ payment: result.payment, gatewayData: result.gateway_data });
      await refresh();
      toast.success(`${pricing.pkg.name} pathway started — complete the bank transfer to activate it.`);
    } catch (err) {
      toast.error(getApiError(err).message || 'Could not start this pathway. Please try again.');
    } finally {
      setSubscribing(null);
    }
  }

  // Reconstructs the same shape the post-subscribe dialog uses, but from a
  // payment row's own fields — lets the company revisit bank details for any
  // pending manual_bank_transfer payment, not just right after creating it.
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

  async function handleMarkSent(paymentId: string) {
    if (!window.confirm("Confirm you've sent the bank transfer? This notifies our finance team to verify and activate your pathway.")) return;

    setSubmitting(paymentId);
    try {
      await submitManualPayment(paymentId);
      setBankDetails(null);
      await refresh();
      toast.success("Marked as sent — we'll confirm it once finance verifies the transfer.");
    } catch (err) {
      toast.error(getApiError(err).message || 'Could not submit this payment. Please try again.');
    } finally {
      setSubmitting(null);
    }
  }

  if (journeyLoading || packagesLoading || paymentsLoading) return <PageLoader />;

  return (
    <Box className="flex flex-col gap-6">
      <Breadcrumbs
        icon={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '8px',
              bgcolor: 'text.primary',
              color: 'background.paper',
              flexShrink: 0,
            }}
          >
            {item?.icon}
          </Box>
        }
        items={[{ label: t('nav.overview'), href: '/' }, { label: item?.label ?? 'Billing' }]}
      />

      <Typography variant="body2" color="text.secondary">
        Progress your enterprise from foundational legal licensing to institutional investment readiness. Each
        pathway is priced and verified independently — select only the levels you need.
      </Typography>

      <SectionCard title="Standardized Service Pathways" subtitle="Each pathway unlocks one compliance level">
        <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {levelPricing.map((pricing) => (
            <PricingCard
              key={pricing.pkg.id}
              pricing={pricing}
              status={statusFor(pricing.pkg.id, pricing.pkg.tier)}
              loading={subscribing === pricing.pkg.id}
              onSelect={() => handleSelect(pricing)}
            />
          ))}
        </Box>
      </SectionCard>

      <SectionCard title="Payment History">
        {payments.length === 0 ? (
          <EmptyState
            icon={<ReceiptLongOutlinedIcon fontSize="inherit" />}
            title="No payment history yet"
            description="Invoices and receipts will appear here once you select a paid pathway."
          />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.gateway_reference ?? '—'}</TableCell>
                  <TableCell>{payment.payable_type === 'tp_hire' ? 'TP Hire' : 'Package'}</TableCell>
                  <TableCell>{formatCents(payment.amount_cents, payment.currency)}</TableCell>
                  <TableCell>{formatDate(payment.submitted_at)}</TableCell>
                  <TableCell>
                    <StatusBadge status={payment.status} label={PAYMENT_STATUS_LABEL[payment.status]} />
                  </TableCell>
                  <TableCell align="right">
                    {payment.status === 'pending' && payment.method === 'manual_bank_transfer' && (
                      <Box className="flex justify-end gap-2">
                        <Button size="small" variant="text" onClick={() => handleViewBankDetails(payment)}>
                          {t('billing.view_bank_details')}
                        </Button>
                        <Button size="small" variant="outlined" loading={submitting === payment.id} onClick={() => handleMarkSent(payment.id)}>
                          I&apos;ve Sent It
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
        <DialogTitle>Complete Your Bank Transfer</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Send the exact amount below, using the reference so we can match your payment.
          </Typography>
          {bankDetails && (
            <Box className="flex flex-col gap-1.5">
              <Typography variant="body2">
                <strong>Bank:</strong> {bankDetails.gatewayData.bank_name}
              </Typography>
              <Typography variant="body2">
                <strong>Account name:</strong> {bankDetails.gatewayData.account_name}
              </Typography>
              <Typography variant="body2">
                <strong>Account number:</strong> {bankDetails.gatewayData.account_number}
              </Typography>
              <Typography variant="body2">
                <strong>Reference:</strong> {bankDetails.gatewayData.reference}
              </Typography>
              <Typography variant="body2">
                <strong>Amount:</strong> {formatCents(bankDetails.gatewayData.amount_cents, bankDetails.gatewayData.currency)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBankDetails(null)} color="inherit">
            I&apos;ll Do This Later
          </Button>
          <Button
            variant="contained"
            loading={bankDetails ? submitting === bankDetails.payment.id : false}
            onClick={() => bankDetails && handleMarkSent(bankDetails.payment.id)}
          >
            I&apos;ve Sent The Transfer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
