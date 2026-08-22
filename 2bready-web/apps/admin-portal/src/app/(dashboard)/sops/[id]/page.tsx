'use client';

import { use, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/components/feedback/ToastProvider';
import api from '@/lib/api';
import { getSop } from '@/domains/sop/api';
import type { Sop } from '@/domains/sop/types';
import { getSopStatus } from '@/domains/sop/types';
import { SopFormDialog } from '@/domains/sop/components/SopFormDialog';
import { useTranslation } from '@/lib/i18n';
import { getApiError, formatDate } from '@/lib/utils';

// Read-only detail view for a single SOP — content rendered as an embedded A4
// PDF (GET /sops/{id}/pdf, streamed on demand so it always reflects the latest
// edits) with a download action. Editing reuses SopFormDialog.
export default function SopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useTranslation();
  const toast = useToast();

  const [sop, setSop] = useState<Sop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  // Bumped after an edit save so the PDF blob refetches and the iframe shows
  // the fresh render instead of a stale document.
  const [pdfVersion, setPdfVersion] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const data = await getSop(id);
        if (!cancelled) setSop(data);
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
  }, [id]);

  // Fetch the PDF as a blob through the authenticated axios instance and
  // expose it via an object URL for the inline viewer.
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function load() {
      setLoadingPdf(true);
      setPdfError(false);
      try {
        const res = await api.get(`/sops/${id}/pdf`, { responseType: 'blob' });
        if (!cancelled) {
          objectUrl = URL.createObjectURL(res.data as Blob);
          setPdfUrl(objectUrl);
        }
      } catch {
        if (!cancelled) setPdfError(true);
      } finally {
        if (!cancelled) setLoadingPdf(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, pdfVersion]);

  // Refresh meta + PDF in place after an edit save — no spinner flash.
  async function handleUpdate() {
    toast.success(t('sop.updated'));
    try {
      setSop(await getSop(id));
    } catch {
      // keep showing the stale copy; the dialog already surfaced the error
    }
    setPdfVersion((n) => n + 1);
  }

  if (loading) {
    return (
      <Box className="flex justify-center" sx={{ py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !sop) {
    return (
      <Box className="flex flex-col gap-4">
        <PageHeader title={t('sop.list_title')} />
        <Alert severity="error">{error || t('sop.not_found')}</Alert>
        <Box>
          <Button startIcon={<ArrowBackIcon />} href="/sops">
            {t('common.back')}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col gap-6">
      <PageHeader
        title={sop.title}
        action={
          <Button variant="contained" startIcon={<EditOutlinedIcon />} onClick={() => setEditOpen(true)}>
            {t('common.edit')}
          </Button>
        }
      />

      <SectionCard>
        <Box className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary">
              {t('sop.status')}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <StatusBadge status={getSopStatus(sop)} />
            </Box>
          </Box>

          <Box sx={{ minWidth: 100 }}>
            <Typography variant="caption" color="text.secondary">
              {t('sop.version')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              v{sop.version}
            </Typography>
          </Box>

          <Box sx={{ minWidth: 140 }}>
            <Typography variant="caption" color="text.secondary">
              {t('sop.type')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {sop.is_global ? t('sop.type.global') : t('sop.type.company')}
            </Typography>
          </Box>

          <Box sx={{ minWidth: 140 }}>
            <Typography variant="caption" color="text.secondary">
              {t('sop.effective_at')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {sop.effective_at ? formatDate(sop.effective_at) : t('sop.immediate')}
            </Typography>
          </Box>

          {sop.company && (
            <Box sx={{ minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">
                {t('sop.company_id')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {sop.company.name}
              </Typography>
            </Box>
          )}

          {sop.created_by && (
            <Box sx={{ minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary">
                {t('sop.created_by')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {sop.created_by.name}
              </Typography>
            </Box>
          )}

          <Chip
            label={sop.is_active ? t('sop.status.active') : t('sop.status.draft')}
            size="small"
            color={sop.is_active ? 'success' : 'default'}
            variant={sop.is_active ? 'filled' : 'outlined'}
          />
        </Box>

        {sop.is_global && (sop.adoptions?.length ?? 0) > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {t('sop.adoptions', { count: sop.adoptions?.length ?? 0 })}
            </Typography>
          </>
        )}
      </SectionCard>

      <SectionCard
        title={t('sop.pdf_title')}
        subtitle={t('sop.pdf_subtitle')}
        action={
          pdfUrl && (
            <Button
              size="small"
              startIcon={<DownloadOutlinedIcon />}
              href={pdfUrl}
              download={`sop-${sop.title}-v${sop.version}.pdf`}
            >
              {t('sop.pdf_download')}
            </Button>
          )
        }
        noPadding
      >
        {loadingPdf ? (
          <Box className="flex justify-center" sx={{ py: 10 }}>
            <CircularProgress />
          </Box>
        ) : pdfError ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{t('sop.pdf_error')}</Alert>
          </Box>
        ) : (
          <iframe src={pdfUrl ?? ''} className="w-full rounded-b-xl" style={{ height: '78vh', border: 'none' }} title={sop.title} />
        )}
      </SectionCard>

      <SopFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleUpdate}
        initialData={sop}
        title={t('sop.edit_title')}
      />
    </Box>
  );
}