'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import FormSelect from '@/components/forms/FormSelect';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/feedback/ToastProvider';
import { listDocuments, verifyDocument, rejectDocument, getPreviewUrl } from '@/domains/document/api';
import type { Document } from '@/domains/document/types';
import { getApiError, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function AdminDocumentsPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('review');
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Document | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff', 'finance'])) router.replace('/dashboard');
  }, [hasAnyRole, router]);

  const load = async () => {
    setLoading(true);
    try {
      setDocuments(await listDocuments(status || undefined));
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
        const data = await listDocuments(status || undefined);
        if (!cancelled) setDocuments(data);
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

  const handlePreview = async (document: Document) => {
    try {
      const { url } = await getPreviewUrl(document.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  const handleVerify = async (document: Document) => {
    setActingOn(document.id);
    try {
      await verifyDocument(document.id);
      toast.success(t('admin.document_verified'));
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActingOn(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setActingOn(rejectTarget.id);
    try {
      await rejectDocument(rejectTarget.id, rejectReason.trim());
      toast.success(t('admin.document_rejected'));
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActingOn(null);
    }
  };

  const columns: Column<Document>[] = [
    { key: 'company', label: t('admin.company_col'), render: (d) => d.company?.name ?? '—' },
    { key: 'document_template', label: t('admin.document_col'), render: (d) => d.document_template?.name ?? '—' },
    { key: 'created_at', label: t('admin.uploaded_col'), render: (d) => formatDate(d.created_at) },
    { key: 'status', label: t('common.status'), render: (d) => <StatusBadge status={d.status} /> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (d) => (
        <Box className="flex justify-end gap-2">
          <Tooltip title={t('admin.preview')}>
            <IconButton size="small" onClick={() => handlePreview(d)}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {d.status === 'review' && (
            <>
              <Button size="small" variant="outlined" color="error" disabled={actingOn === d.id} onClick={() => setRejectTarget(d)}>
                {t('admin.reject')}
              </Button>
              <Button size="small" variant="contained" loading={actingOn === d.id} onClick={() => handleVerify(d)}>
                {t('admin.verify')}
              </Button>
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={t('admin.documents_title')} />

      <SectionCard noPadding>
        <Box sx={{ p: 2 }}>
          <FormSelect label={t('common.status')} size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 220 }}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            <MenuItem value="review">{t('status.review')}</MenuItem>
            <MenuItem value="verified">{t('status.verified')}</MenuItem>
            <MenuItem value="rejected">{t('status.rejected')}</MenuItem>
            <MenuItem value="expired">{t('status.expired')}</MenuItem>
            <MenuItem value="pending_scan">{t('status.pending_scan')}</MenuItem>
            <MenuItem value="scan_failed">{t('status.scan_failed')}</MenuItem>
          </FormSelect>
        </Box>

        <DataTable
          columns={columns}
          rows={documents}
          getRowId={(d) => d.id}
          loading={loading}
          emptyTitle={t('admin.no_documents')}
          emptyDescription={t('admin.no_documents_desc')}
        />
      </SectionCard>

      <Dialog open={rejectTarget !== null} onClose={() => setRejectTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('admin.reject_document_title')}</DialogTitle>
        <DialogContent className="flex flex-col gap-4" sx={{ pt: '8px !important' }}>
          <TextField
            autoFocus
            multiline
            minRows={3}
            fullWidth
            label={t('admin.reject_document_reason_label')}
            placeholder={t('admin.reject_document_reason_placeholder')}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="text" onClick={() => setRejectTarget(null)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!rejectReason.trim()}
            loading={actingOn === rejectTarget?.id}
            onClick={handleRejectSubmit}
          >
            {t('admin.reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
