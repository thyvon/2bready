'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import FormTextField from '@/components/forms/FormTextField';
import { useAuthStore } from '@/store/auth.store';
import { listAuditLogs } from '@/domains/audit-log/api';
import AuditLogDetailsDialog from '@/domains/audit-log/components/AuditLogDetailsDialog';
import type { AuditLog, AuditLogListFilters } from '@/domains/audit-log/types';
import { getApiError, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function AuditLogsPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const { t } = useTranslation();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<AuditLogListFilters>({});
  const [selected, setSelected] = useState<AuditLog | null>(null);

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff', 'finance'])) router.replace('/dashboard');
  }, [hasAnyRole, router]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError('');
      try {
        const { logs } = await listAuditLogs(filters);
        if (!cancelled) setLogs(logs);
      } catch (err) {
        if (!cancelled) setError(getApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const columns: Column<AuditLog>[] = [
    { key: 'created_at', label: t('audit_log.time'), render: (l) => formatDate(l.created_at) },
    { key: 'action', label: t('audit_log.action_col') },
    { key: 'actor_email', label: t('audit_log.actor'), render: (l) => l.actor_email ?? t('audit_log.system') },
    {
      key: 'auditable_type',
      label: t('audit_log.target'),
      render: (l) => (l.auditable_type ? `${l.auditable_type.split('\\').pop()} / ${l.auditable_id}` : '—'),
    },
    { key: 'ip_address', label: t('audit_log.ip_address'), render: (l) => l.ip_address ?? '—' },
  ];

  return (
    <>
      <PageHeader title={t('audit_log.title')} />

      <SectionCard noPadding>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, p: 2 }}>
          <FormTextField
            label={t('audit_log.filter_action')}
            size="small"
            placeholder="company.updated"
            value={filters.action ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value || undefined }))}
            sx={{ width: { xs: '100%', sm: 220 } }}
          />
          <FormTextField
            label={t('audit_log.filter_actor')}
            size="small"
            value={filters.search ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
            sx={{ width: { xs: '100%', sm: 220 } }}
          />
          <FormTextField
            label={t('audit_log.filter_from')}
            type="date"
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={filters.from ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined }))}
            sx={{ width: { xs: '100%', sm: 170 } }}
          />
          <FormTextField
            label={t('audit_log.filter_to')}
            type="date"
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={filters.to ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined }))}
            sx={{ width: { xs: '100%', sm: 170 } }}
          />
        </Box>

        {error && (
          <Box className="px-4 pb-4">
            <Box className="text-sm" sx={{ color: 'error.main' }}>{error}</Box>
          </Box>
        )}

        <DataTable
          columns={columns}
          rows={logs}
          getRowId={(l) => l.id}
          loading={loading}
          onRowClick={(l) => setSelected(l)}
          emptyTitle={t('audit_log.no_logs')}
          emptyDescription={t('audit_log.no_logs_desc')}
        />
      </SectionCard>

      <AuditLogDetailsDialog log={selected} onClose={() => setSelected(null)} />
    </>
  );
}
