'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { listAudits } from '@/domains/audit/api';
import type { Audit } from '@/domains/audit/types';
import { useToast } from '@/components/feedback/ToastProvider';
import { getApiError, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function AuditsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const data = await listAudits();
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
  }, []);

  const columns: Column<Audit>[] = [
    { key: 'company', label: t('tp.company_name_col'), render: (a) => a.company?.name ?? a.company_id },
    { key: 'journey_level', label: t('tp.audit_level_col'), render: (a) => a.journey_level },
    { key: 'score', label: t('tp.audit_score_col'), render: (a) => (a.score != null ? `${a.score}%` : '—') },
    { key: 'submitted_at', label: t('tp.audit_submitted_col'), render: (a) => (a.submitted_at ? formatDate(a.submitted_at) : '—') },
    { key: 'status', label: t('tp.status_col'), render: (a) => <StatusBadge status={a.status} /> },
  ];

  return (
    <>
      <PageHeader title={t('tp.audits_title')} />

      <SectionCard noPadding>
        <DataTable
          columns={columns}
          rows={audits}
          getRowId={(a) => a.id}
          loading={loading}
          onRowClick={(a) => router.push(`/audits/${a.id}`)}
          emptyTitle={t('tp.no_audits')}
          emptyDescription={t('tp.no_audits_desc')}
        />
      </SectionCard>
    </>
  );
}