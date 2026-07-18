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
import type { AuditLog, AuditLogListFilters, Pagination } from '@/domains/audit-log/types';
import { getApiError, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function AuditLogsPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const { t } = useTranslation();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<AuditLogListFilters>({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  // Any filter change invalidates the current page (e.g. page 3 of an
  // unfiltered list may not exist once a filter narrows the result set) —
  // update via this instead of setFilters directly so the two always move
  // together.
  const updateFilters = (patch: Partial<AuditLogListFilters>) => {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  };

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff', 'finance'])) router.replace('/dashboard');
  }, [hasAnyRole, router]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError('');
      try {
        const { logs, pagination } = await listAuditLogs({ ...filters, page, per_page: perPage });
        if (!cancelled) {
          setLogs(logs);
          setPagination(pagination);
        }
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
  }, [filters, page, perPage]);

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
            onChange={(e) => updateFilters({ action: e.target.value || undefined })}
            sx={{ width: { xs: '100%', sm: 220 } }}
          />
          <FormTextField
            label={t('audit_log.filter_actor')}
            size="small"
            value={filters.search ?? ''}
            onChange={(e) => updateFilters({ search: e.target.value || undefined })}
            sx={{ width: { xs: '100%', sm: 220 } }}
          />
          <FormTextField
            label={t('audit_log.filter_from')}
            type="date"
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={filters.from ?? ''}
            onChange={(e) => updateFilters({ from: e.target.value || undefined })}
            sx={{ width: { xs: '100%', sm: 170 } }}
          />
          <FormTextField
            label={t('audit_log.filter_to')}
            type="date"
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={filters.to ?? ''}
            onChange={(e) => updateFilters({ to: e.target.value || undefined })}
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
          pagination={
            pagination
              ? {
                  page,
                  perPage,
                  total: pagination.total,
                  onPageChange: setPage,
                  onPerPageChange: (newPerPage) => {
                    setPage(1);
                    setPerPage(newPerPage);
                  },
                }
              : undefined
          }
        />
      </SectionCard>

      <AuditLogDetailsDialog log={selected} onClose={() => setSelected(null)} />
    </>
  );
}
