'use client';

import { use, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';

import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { listMyCompanies, listCompanyDocuments, verifyDocument, rejectDocument } from '@/domains/hires/api';
import type { Company, Document } from '@/domains/hires/types';
import { useToast } from '@/components/feedback/ToastProvider';
import { getApiError, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function CompanyDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = use(params);
  const { t } = useTranslation();
  const toast = useToast();

  const [company, setCompany] = useState<Company | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [pendingReject, setPendingReject] = useState<Document | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [companies, docs] = await Promise.all([listMyCompanies(), listCompanyDocuments(companyId)]);
      setCompany(companies.find((c) => c.id === companyId) ?? null);
      setDocuments(docs);
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
        const [companies, docs] = await Promise.all([listMyCompanies(), listCompanyDocuments(companyId)]);
        if (!cancelled) {
          setCompany(companies.find((c) => c.id === companyId) ?? null);
          setDocuments(docs);
        }
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
  }, [companyId]);

  const handleVerify = async (document: Document) => {
    setActingOn(document.id);
    try {
      await verifyDocument(document.id);
      toast.success(t('tp.document_verified'));
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActingOn(null);
    }
  };

  const handleReject = async () => {
    if (!pendingReject || !rejectReason.trim()) return;
    setActingOn(pendingReject.id);
    try {
      await rejectDocument(pendingReject.id, rejectReason.trim());
      toast.success(t('tp.document_rejected'));
      setPendingReject(null);
      setRejectReason('');
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActingOn(null);
    }
  };

  const canAct = (document: Document) => document.status === 'review';

  const columns: Column<Document>[] = [
    {
      key: 'name',
      label: t('tp.document_col'),
      render: (d) => d.document_template?.name ?? d.original_filename,
    },
    { key: 'status', label: t('tp.status_col'), render: (d) => <StatusBadge status={d.status} /> },
    { key: 'created_at', label: t('tp.uploaded_col'), render: (d) => (d.created_at ? formatDate(d.created_at) : '—') },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (d) =>
        canAct(d) ? (
          <Box className="flex justify-end gap-2">
            <Button size="small" variant="outlined" color="error" disabled={actingOn === d.id} onClick={() => setPendingReject(d)}>
              {t('tp.reject')}
            </Button>
            <Button size="small" variant="contained" loading={actingOn === d.id} onClick={() => handleVerify(d)}>
              {t('tp.verify')}
            </Button>
          </Box>
        ) : null,
    },
  ];

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {company ? t('tp.documents_title', { company: company.name }) : t('common.loading')}
        </Typography>
      </Box>

      <SectionCard noPadding>
        <DataTable
          columns={columns}
          rows={documents}
          getRowId={(d) => d.id}
          loading={loading}
          emptyTitle={t('tp.no_documents')}
          emptyDescription={t('tp.no_documents_desc')}
        />
      </SectionCard>

      <Dialog open={!!pendingReject} onClose={() => setPendingReject(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('tp.reject')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label={t('tp.reject_reason_label')}
            placeholder={t('tp.reject_reason_placeholder')}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingReject(null)}>{t('common.cancel')}</Button>
          <Button
            color="error"
            variant="contained"
            disabled={!rejectReason.trim()}
            loading={actingOn === pendingReject?.id}
            onClick={handleReject}
          >
            {t('tp.confirm_reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
