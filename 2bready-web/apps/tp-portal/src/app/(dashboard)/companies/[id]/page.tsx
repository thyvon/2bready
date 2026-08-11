'use client';

import { use, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { JourneyTree } from '@/domains/journey/components/JourneyTree';
import { DocumentPreviewDialog } from '@/domains/journey/components/DocumentPreviewDialog';
import { getCompanyJourney, getPreviewUrl } from '@/domains/journey/api';
import type { Journey, JourneyDocument } from '@/domains/journey/types';
import { listMyCompanies, verifyDocument, rejectDocument } from '@/domains/hires/api';
import { useToast } from '@/components/feedback/ToastProvider';
import { getApiError } from '@/lib/utils';
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

export default function CompanyJourneyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = use(params);
  const toast = useToast();
  const { t } = useTranslation();

  const [companyName, setCompanyName] = useState<string | null>(null);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [acting, setActing] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const [companies, journeyData] = await Promise.all([listMyCompanies(), getCompanyJourney(companyId)]);
        if (cancelled) return;
        setCompanyName(companies.find((c) => c.id === companyId)?.name ?? null);
        setJourney(journeyData);
      } catch (err) {
        if (!cancelled) setLoadError(getApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [companyId, reloadKey]);

  // Takes primitives, not a JourneyDocument, so both the current document's
  // preview button and a past history entry's preview icon (which has no
  // JourneyDocument of its own, just an id/status) can call the same
  // function — reused as-is by JourneyTree's onPreviewDocument prop.
  const handlePreview = async (documentId: string, title: string, status: string) => {
    setPreview({ documentId, title, status, url: null, mimeType: null, loading: true, error: null });
    try {
      const result = await getPreviewUrl(documentId);
      setPreview((prev) => (prev && prev.documentId === documentId ? { ...prev, url: result.url, mimeType: result.mime_type, loading: false } : prev));
    } catch (err) {
      setPreview((prev) => (prev && prev.documentId === documentId ? { ...prev, loading: false, error: getApiError(err).message } : prev));
    }
  };

  // A verified/rejected document can auto-complete its milestone — reload
  // the whole tree so that shows up immediately, not just the one
  // document's own status.
  const handleVerify = async (comment?: string) => {
    if (!preview) return;
    setActing(true);
    try {
      await verifyDocument(preview.documentId, comment);
      toast.success(t('tp.document_verified'));
      setPreview(null);
      setReloadKey((k) => k + 1);
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
      toast.success(t('tp.document_rejected'));
      setPreview(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActing(false);
    }
  };

  const renderDocAction = (doc: JourneyDocument) => (
    <Box className="flex items-center gap-2" sx={{ flexShrink: 0 }}>
      <StatusBadge status={doc.status} />
      {doc.document_id && (
        <Tooltip title={t('journey.preview')}>
          <IconButton size="small" onClick={() => handlePreview(doc.document_id!, doc.name, doc.status)}>
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  return (
    <>
      <PageHeader title={companyName ?? t('common.loading')} />

      {loading ? (
        <Box className="flex justify-center py-16">
          <CircularProgress />
        </Box>
      ) : loadError ? (
        <Alert severity="error">{loadError}</Alert>
      ) : !journey || journey.levels.length === 0 ? (
        <SectionCard>
          <Box sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>{t('journey.no_levels')}</Box>
        </SectionCard>
      ) : (
        <>
          {/* No wrapping SectionCard — each level is its own Accordion/card,
              same as admin-portal's Journey tab. */}
          <JourneyTree levels={journey.levels} renderDocAction={renderDocAction} onPreviewDocument={handlePreview} />

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
      )}
    </>
  );
}
