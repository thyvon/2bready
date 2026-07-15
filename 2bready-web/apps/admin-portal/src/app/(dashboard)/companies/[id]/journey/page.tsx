'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import SectionCard from '@/components/ui/SectionCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/components/feedback/ToastProvider';
import { getCompanyJourney, completeMilestone } from '@/domains/journey/api';
import { JourneyTree, type JourneyDocument } from '@/domains/journey/components/JourneyTree';
import type { Journey } from '@/domains/journey/types';
import { verifyDocument, rejectDocument, getPreviewUrl } from '@/domains/document/api';
import { DocumentPreviewDialog } from '@/domains/document/components/DocumentPreviewDialog';
import { getApiError } from '@/lib/utils';
import { useCompanyWorkspace } from '@/domains/company/workspace-context';

interface PreviewState {
  documentId: string;
  title: string;
  status: string;
  url: string | null;
  mimeType: string | null;
  loading: boolean;
  error: string | null;
}

export default function CompanyJourneyPage() {
  const params = useParams<{ id: string }>();
  const { company, refreshCounts } = useCompanyWorkspace();
  const toast = useToast();

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [signingOff, setSigningOff] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [acting, setActing] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const journeyData = await getCompanyJourney(params.id).catch((err) => {
          // A 404 here just means this company has no matching journey
          // template yet (e.g. no industry configured for its country) —
          // that's an expected state, not a load failure.
          if (getApiError(err).message.includes('No journey found')) return null;
          throw err;
        });
        if (!cancelled) setJourney(journeyData);
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
  }, [params.id, reloadKey]);

  const handleSignOff = async (milestoneId: string) => {
    setSigningOff(milestoneId);
    try {
      await completeMilestone(params.id, milestoneId);
      toast.success('Milestone signed off.');
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setSigningOff(null);
    }
  };

  const handlePreview = async (doc: JourneyDocument) => {
    if (!doc.document_id) return;
    const documentId = doc.document_id;
    setPreview({ documentId, title: doc.name, status: doc.status, url: null, mimeType: null, loading: true, error: null });
    try {
      const result = await getPreviewUrl(documentId);
      setPreview((prev) => (prev && prev.documentId === documentId ? { ...prev, url: result.url, mimeType: result.mime_type, loading: false } : prev));
    } catch (err) {
      setPreview((prev) => (prev && prev.documentId === documentId ? { ...prev, loading: false, error: getApiError(err).message } : prev));
    }
  };

  // A verified/rejected document can auto-complete its milestone (see
  // CompleteMilestoneOnDocumentVerified) — reload the whole tree so that
  // shows up immediately, not just the one document's own status.
  const handleVerify = async () => {
    if (!preview) return;
    setActing(true);
    try {
      await verifyDocument(preview.documentId);
      toast.success('Document verified.');
      setPreview(null);
      setReloadKey((k) => k + 1);
      refreshCounts();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!preview) return;
    setActing(true);
    try {
      await rejectDocument(preview.documentId, reason);
      toast.success('Document rejected.');
      setPreview(null);
      setReloadKey((k) => k + 1);
      refreshCounts();
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
        <Tooltip title="Preview">
          <IconButton size="small" onClick={() => handlePreview(doc)}>
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Box className="flex justify-center py-16">
        <CircularProgress />
      </Box>
    );
  }

  if (loadError) {
    return <Alert severity="error">{loadError}</Alert>;
  }

  if (!journey) {
    return (
      <SectionCard>
        <Typography color="text.secondary">
          No journey template matches {company.name}&apos;s country/industry yet.
        </Typography>
      </SectionCard>
    );
  }

  return (
    <>
      <SectionCard>
        <JourneyTree
          levels={journey.levels}
          onSignOff={handleSignOff}
          signingOffId={signingOff}
          renderDocAction={renderDocAction}
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
