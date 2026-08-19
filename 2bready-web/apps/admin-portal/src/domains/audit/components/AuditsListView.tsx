'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import FilterListIcon from '@mui/icons-material/FilterListOutlined';

import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import FormSelect from '@/components/forms/FormSelect';
import { useToast } from '@/components/feedback/ToastProvider';
import { listAudits } from '@/domains/audit/api';
import type { Audit, AuditStatus } from '@/domains/audit/types';
import { getApiError, formatDate } from '@/lib/utils';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

const AUDIT_STATUSES: { value: AuditStatus | ''; labelKey: TranslationKey }[] = [
  { value: '', labelKey: 'common.all' },
  { value: 'pending', labelKey: 'status.pending' },
  { value: 'in_progress', labelKey: 'status.in_progress' },
  { value: 'submitted', labelKey: 'status.submitted' },
  { value: 'approved', labelKey: 'status.approved' },
  { value: 'rejected', labelKey: 'status.rejected' },
  { value: 'cancelled', labelKey: 'status.cancelled' },
];

export default function AuditsListView() {
  const toast = useToast();
  const { t } = useTranslation();

  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const data = await listAudits(status || undefined);
        if (!cancelled) setAudits(data);
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
  }, [status]);

  const columns: Column<Audit>[] = [
    { key: 'company', label: t('admin.company_col'), render: (a) => a.company?.name ?? a.company_id },
    { key: 'journey_level', label: t('audit.level_col'), render: (a) => a.journey_level },
    { key: 'tp_partner', label: t('audit.firm_col'), render: (a) => a.tp_partner?.name ?? '—' },
    { key: 'auditor', label: t('audit.auditor_col'), render: (a) => a.auditor?.name ?? '—' },
    { key: 'score', label: t('audit.score_col'), render: (a) => (a.score != null ? `${a.score}%` : '—') },
    { key: 'submitted_at', label: t('audit.submitted_col'), render: (a) => (a.submitted_at ? formatDate(a.submitted_at) : '—') },
    { key: 'status', label: t('common.status'), render: (a) => <StatusBadge status={a.status} /> },
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
          {AUDIT_STATUSES.filter((s) => s.value !== '').map((s) => (
            <MenuItem key={s.value} value={s.value}>{t(s.labelKey)}</MenuItem>
          ))}
        </FormSelect>
      </Box>

      <DataTable
        columns={columns}
        rows={audits}
        getRowId={(a) => a.id}
        loading={loading}
        emptyTitle={t('audit.no_audits')}
        emptyDescription={t('audit.no_audits_desc')}
      />
    </SectionCard>
  );
}