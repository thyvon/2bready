'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import FilterListIcon from '@mui/icons-material/FilterListOutlined';

import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import FormSelect from '@/components/forms/FormSelect';
import { useToast } from '@/components/feedback/ToastProvider';
import { listPayments, confirmPayment, rejectPayment } from '@/domains/payment/api';
import type { Payment } from '@/domains/payment/types';
import { useCompanyWorkspaceOptional } from '@/domains/company/workspace-context';
import { getApiError, formatCents, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface PaymentsListViewProps {
  // Set from within a company workspace tab to pre-scope the queue to just
  // that company — omitted on the global /payments page, which reviews
  // across every company.
  companyId?: string;
}

export default function PaymentsListView({ companyId }: PaymentsListViewProps) {
  const toast = useToast();
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('awaiting_confirmation');
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setPayments(await listPayments(status || undefined, companyId));
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const data = await listPayments(status || undefined, companyId);
        if (!cancelled) setPayments(data);
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
  }, [status, companyId]);

  const handleConfirm = async (payment: Payment) => {
    setActingOn(payment.id);
    try {
      await confirmPayment(payment.id);
      toast.success(t('admin.payment_confirmed'));
      load();
      workspace?.refreshCounts();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActingOn(null);
    }
  };

  const handleReject = async (payment: Payment) => {
    if (!window.confirm(t('admin.confirm_reject_payment'))) return;
    setActingOn(payment.id);
    try {
      await rejectPayment(payment.id);
      toast.success(t('admin.payment_rejected'));
      load();
      workspace?.refreshCounts();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActingOn(null);
    }
  };

  const columns: Column<Payment>[] = [
    { key: 'gateway_reference', label: t('admin.reference_col'), render: (p) => p.gateway_reference ?? '—' },
    { key: 'amount_cents', label: t('billing.amount'), render: (p) => formatCents(p.amount_cents, p.currency) },
    { key: 'method', label: t('admin.method_col'), render: (p) => t(p.method === 'stripe' ? 'billing.method_stripe' : 'billing.method_bank_transfer') },
    { key: 'submitted_at', label: t('admin.submitted_col'), render: (p) => (p.submitted_at ? formatDate(p.submitted_at) : '—') },
    { key: 'status', label: t('common.status'), render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (p) =>
        p.status === 'awaiting_confirmation' ? (
          <Box className="flex justify-end gap-2">
            <Button size="small" variant="outlined" color="error" disabled={actingOn === p.id} onClick={() => handleReject(p)}>
              {t('admin.reject')}
            </Button>
            <Button size="small" variant="contained" loading={actingOn === p.id} onClick={() => handleConfirm(p)}>
              {t('admin.confirm')}
            </Button>
          </Box>
        ) : null,
    },
  ];

  return (
    <SectionCard noPadding>
      <Box sx={{ p: 2 }}>
        <FormSelect
          label={t('common.status')}
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 220 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><FilterListIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> } }}
        >
          <MenuItem value="">{t('common.all')}</MenuItem>
          <MenuItem value="awaiting_confirmation">{t('status.awaiting_confirmation')}</MenuItem>
          <MenuItem value="pending">{t('status.pending')}</MenuItem>
          <MenuItem value="confirmed">{t('status.confirmed')}</MenuItem>
          <MenuItem value="rejected">{t('status.rejected')}</MenuItem>
        </FormSelect>
      </Box>

      <DataTable
        columns={columns}
        rows={payments}
        getRowId={(p) => p.id}
        loading={loading}
        emptyTitle={t('admin.no_payments')}
        emptyDescription={t('admin.no_payments_desc')}
      />
    </SectionCard>
  );
}
