'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FilterListIcon from '@mui/icons-material/FilterListOutlined';

import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import FormSelect from '@/components/forms/FormSelect';
import { useToast } from '@/components/feedback/ToastProvider';
import { listDocuments, verifyDocument, rejectDocument, getPreviewUrl } from '@/domains/document/api';
import type { Document } from '@/domains/document/types';
import { DocumentPreviewDialog } from '@/domains/document/components/DocumentPreviewDialog';
import { getApiError, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface PreviewState {
  documentId: string;
  title: string;
  status: string;
  url: string | null;
  mimeType: string | null;
  loading: boolean;
  error: string | null;
}

// The cross-company back-office review queue. A company's own workspace
// doesn't have a parallel scoped version of this — its documents live inside
// the Journey tab instead, reviewed in the context of the milestone they
// gate (see companies/[id]/journey/page.tsx), the same merge client-portal
// already made between its own Journey and Documents pages.
export default function DocumentsListView() {
  const toast = useToast();
  const { t } = useTranslation();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('review');
  const [acting, setActing] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);

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
    setPreview({ documentId: document.id, title: document.document_template?.name ?? document.original_filename, status: document.status, url: null, mimeType: null, loading: true, error: null });
    try {
      const result = await getPreviewUrl(document.id);
      setPreview((prev) => (prev && prev.documentId === document.id ? { ...prev, url: result.url, mimeType: result.mime_type, loading: false } : prev));
    } catch (err) {
      setPreview((prev) => (prev && prev.documentId === document.id ? { ...prev, loading: false, error: getApiError(err).message } : prev));
    }
  };

  const handleVerify = async (comment?: string) => {
    if (!preview) return;
    setActing(true);
    try {
      await verifyDocument(preview.documentId, comment);
      toast.success(t('admin.document_verified'));
      setPreview(null);
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async (comment: string) => {
    if (!preview) return;
    setActing(true);
    try {
      await rejectDocument(preview.documentId, comment);
      toast.success(t('admin.document_rejected'));
      setPreview(null);
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActing(false);
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
        </Box>
      ),
    },
  ];

  return (
    <>
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

      <DocumentPreviewDialog
        key={preview?.documentId ?? 'none'}
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview?.title ?? ''}
        url={preview?.url ?? null}
        mimeType={preview?.mimeType ?? null}
        loading={preview?.loading ?? false}
        error={preview?.error ?? null}
        status={preview?.status}
        onVerify={handleVerify}
        onReject={handleReject}
        acting={acting}
      />
    </>
  );
}
