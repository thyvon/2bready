'use client';

import { useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import UploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { getApiError } from '@2bready/api-client';
import {
  Breadcrumbs,
  SectionCard,
  EmptyState,
  StatusBadge,
  DocumentPreviewDialog,
  DocumentUploadPreviewDialog,
  PillToggle,
} from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { useNavItems } from '@/components/layout/nav-items';
import { JourneyTree, type RenderDocAction } from '@/components/dashboard/JourneyTree';
import { useJourney } from '@/components/JourneyProvider';
import { usePackages } from '@/components/PackageProvider';
import { PageLoader } from '@/components/PageLoader';
import { useToast } from '@/components/ToastProvider';
import { TIER_LABELS } from '@/lib/journey-data';
import {
  allDocuments,
  findDocument,
  toDocStatus,
  DOC_STATUS_LABEL,
  type DocStatus,
  type JourneyLevel,
  type JourneyDocument,
  type DocumentHistoryEntry,
} from '@/lib/journey-api';
import { tierByLevelCode } from '@/lib/package-api';
import { uploadDocument, getPreviewUrl } from '@/lib/document-api';

const FILTERS: Array<{ key: DocStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'review', label: 'In Review' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'expired', label: 'Expired' },
];

interface PreviewState {
  open: boolean;
  title: string;
  url: string | null;
  mimeType: string | null;
  loading: boolean;
  error: string | null;
}

const CLOSED_PREVIEW: PreviewState = { open: false, title: '', url: null, mimeType: null, loading: false, error: null };

// One page for the whole journey — progress (badges, milestones, upgrade
// prompts) and document actions (upload/preview/download) used to be split
// across /journey and /documents, but both rendered the same tree over the
// same data. Merged rather than kept as two near-identical pages.
export default function JourneyPage() {
  const { t } = useTranslation();
  const { all } = useNavItems();
  const item = all.find((i) => i.href === '/journey');
  const { journey, loading, refetch } = useJourney();
  const { packages } = usePackages();
  const toast = useToast();

  const levels = useMemo(() => journey?.levels ?? [], [journey]);
  const totalDocs = allDocuments(journey).length;
  const tierMap = useMemo(() => tierByLevelCode(packages), [packages]);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<DocStatus | 'all'>('all');
  const isFiltering = query.trim().length > 0 || filter !== 'all';

  // Keyed by document id — more than one row could realistically be
  // uploading at once now that each row picks/uploads independently rather
  // than funneling through one shared dialog.
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());

  const [preview, setPreview] = useState<PreviewState>(CLOSED_PREVIEW);

  // Picking a file no longer uploads it immediately — it opens a local
  // preview first (see DocumentUploadPreviewDialog). "Save as Draft" stashes
  // the raw File here, keyed by document id, purely client-side (nothing is
  // sent to the server until the user actually confirms) — lost on
  // navigation/refresh, same as any unsaved browser form input.
  const [drafts, setDrafts] = useState<Record<string, File>>({});
  const [stagedUpload, setStagedUpload] = useState<{ doc: JourneyDocument; file: File; targetPeriodKey?: string } | null>(null);

  // A backfill "Upload" action (on a missing history row) has no input of
  // its own to wrap, unlike the main row's `component="label"` IconButton —
  // it just remembers which doc+period was clicked, then programmatically
  // opens the one hidden file input below.
  const [backfillTarget, setBackfillTarget] = useState<{ doc: JourneyDocument; entry: DocumentHistoryEntry } | null>(null);
  const backfillFileInputRef = useRef<HTMLInputElement>(null);

  function handleBackfillUpload(doc: JourneyDocument, entry: DocumentHistoryEntry) {
    setBackfillTarget({ doc, entry });
    backfillFileInputRef.current?.click();
  }

  const filteredLevels: JourneyLevel[] = useMemo(() => {
    if (!isFiltering) return levels;
    const q = query.trim().toLowerCase();
    return levels
      .map((level) => ({
        ...level,
        milestones: level.milestones
          .map((milestone) => ({
            ...milestone,
            documents: milestone.documents.filter((doc) => {
              const status = toDocStatus(doc.status);
              const matchesFilter = filter === 'all' || status === filter;
              const matchesQuery = !q || doc.name.toLowerCase().includes(q);
              return matchesFilter && matchesQuery;
            }),
          }))
          .filter((milestone) => milestone.documents.length > 0),
      }))
      .filter((level) => level.milestones.length > 0);
  }, [isFiltering, query, filter, levels]);

  const totalMatches = filteredLevels.reduce(
    (sum, level) => sum + level.milestones.reduce((s, m) => s + m.documents.length, 0),
    0,
  );

  const renderDocAction: RenderDocAction = (doc, ctx) => {
    const status = toDocStatus(doc.status);
    const levelUnlocked = ctx.level.unlocked;

    if (!levelUnlocked) {
      return (
        <Box className="flex items-center gap-2" sx={{ flexShrink: 0 }}>
          <StatusBadge status={status} label={DOC_STATUS_LABEL[status]} />
          <Tooltip title={`Upgrade to ${TIER_LABELS[tierMap[ctx.level.code]] ?? 'a paid'} plan to unlock this level`}>
            <LockOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
          </Tooltip>
        </Box>
      );
    }

    const isUploading = uploadingIds.has(doc.id);
    const draft = drafts[doc.id];

    // A draft already exists for this pending/rejected/expired document —
    // reopen the staging dialog with it directly rather than the OS file
    // picker, so the user doesn't have to re-pick from scratch.
    if (draft && status !== 'verified' && status !== 'review') {
      return (
        <Box className="flex items-center gap-2" sx={{ flexShrink: 0 }}>
          <StatusBadge status="draft" label="Draft" />
          <Tooltip title="Review draft">
            <IconButton size="small" onClick={() => setStagedUpload({ doc, file: draft })}>
              <DescriptionOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    }

    // A hidden file input inside a `component="label"` IconButton — clicking
    // the icon opens the OS file picker directly. Picking a file stages it
    // for local preview (DocumentUploadPreviewDialog) rather than uploading
    // immediately — the dialog's own Confirm/Save as Draft/Replace actions
    // decide what happens next.
    const filePicker = (
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // reset so re-selecting the same file re-fires onChange next time
          if (file) setStagedUpload({ doc, file });
        }}
      />
    );

    return (
      <Box className="flex items-center gap-2" sx={{ flexShrink: 0 }}>
        <StatusBadge status={status} label={DOC_STATUS_LABEL[status]} />
        {status === 'pending' && (
          <Tooltip title="Upload">
            <IconButton size="small" component="label" loading={isUploading} disabled={isUploading}>
              <UploadOutlinedIcon fontSize="small" />
              {filePicker}
            </IconButton>
          </Tooltip>
        )}
        {(status === 'rejected' || status === 'expired') && (
          <Tooltip title="Re-upload">
            <IconButton size="small" component="label" loading={isUploading} disabled={isUploading}>
              <RefreshOutlinedIcon fontSize="small" />
              {filePicker}
            </IconButton>
          </Tooltip>
        )}
        {(status === 'verified' || status === 'review') && (
          <>
            <Tooltip title="Preview">
              <IconButton size="small" onClick={() => doc.document_id && void handlePreview(doc.document_id, doc.name)}>
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {status === 'verified' && (
              <Tooltip title="Download">
                <IconButton size="small">
                  <DownloadOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </Box>
    );
  };

  // Confirms the currently staged file — actually uploads it. MIME/size
  // validation still happens for real, just server-side (see
  // StoreDocumentRequest); the toast surfaces whatever it says.
  async function handleConfirmUpload() {
    if (!stagedUpload) return;
    const { doc, file, targetPeriodKey } = stagedUpload;
    setUploadingIds((prev) => new Set(prev).add(doc.id));
    try {
      await uploadDocument(doc.id, file, targetPeriodKey);
      // Refetch immediately so the tree reflects the real new status
      // (pending_scan) right away — not on next navigation/reload.
      await refetch();
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[doc.id];
        return next;
      });
      setStagedUpload(null);
      toast.success(`${doc.name} uploaded — now being scanned.`);
      // The malware scan runs on a background queue worker, not on this
      // request — poll for a bit so the tree updates itself the moment the
      // scan finishes (pending_scan → review), instead of requiring a
      // manual page reload to see it.
      void pollForScanResult(doc.id, doc.name);
    } catch (err) {
      toast.error(getApiError(err).message || `Could not upload ${doc.name}. Please try again.`);
    } finally {
      setUploadingIds((prev) => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
    }
  }

  // Stashes the staged file locally — nothing is sent to the server. Lets
  // the user come back later via the row's "Review draft" button instead of
  // re-picking from the OS file dialog.
  function handleSaveDraft() {
    if (!stagedUpload) return;
    setDrafts((prev) => ({ ...prev, [stagedUpload.doc.id]: stagedUpload.file }));
    toast.info(`${stagedUpload.doc.name} saved as a draft — confirm or replace it anytime.`);
    setStagedUpload(null);
  }

  // Polls the real journey every 2.5s (up to ~20s) after an upload, stopping
  // as soon as this specific document leaves the "pending" bucket — i.e. the
  // background scan job (Horizon) has actually run. Fire-and-forget from the
  // caller; the tree re-renders on its own via refetch()'s setState, no
  // manual page reload needed to see "In Review" appear.
  async function pollForScanResult(documentId: string, docName: string) {
    for (let attempt = 0; attempt < 8; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const fresh = await refetch();
      const doc = findDocument(fresh, documentId);
      if (doc && toDocStatus(doc.status) !== 'pending') {
        toast.success(`${docName} scan complete — now ${DOC_STATUS_LABEL[toDocStatus(doc.status)]}.`);
        return;
      }
    }
  }

  // Takes a real Document id directly (not a JourneyDocument) so both the
  // main row's own preview button and a past history entry's preview icon
  // (which only ever has an entry id, not a full JourneyDocument) can share
  // this one function — same pattern admin-portal's Journey view uses,
  // minus `status`: client-portal's DocumentPreviewDialog is read-only for
  // every status (companies never see Verify/Reject), so there's nothing
  // here that would branch on it.
  async function handlePreview(documentId: string, title: string) {
    setPreview({ open: true, title, url: null, mimeType: null, loading: true, error: null });
    try {
      const result = await getPreviewUrl(documentId);
      setPreview((prev) => ({ ...prev, url: result.url, mimeType: result.mime_type, loading: false }));
    } catch (err) {
      setPreview((prev) => ({ ...prev, loading: false, error: getApiError(err).message || 'Could not load preview.' }));
    }
  }

  if (loading) return <PageLoader />;

  return (
    <Box className="flex flex-col gap-6">
      <Breadcrumbs
        icon={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '8px',
              bgcolor: 'text.primary',
              color: 'background.paper',
              flexShrink: 0,
            }}
          >
            {item?.icon}
          </Box>
        }
        items={[{ label: t('nav.overview'), href: '/' }, { label: item?.label ?? 'Compliance Journey' }]}
      />

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'primary.main' }}>
          Journey → Level → Milestone → Documents
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em', mt: 0.5 }}>
          Your full compliance checklist
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 640 }}>
          {levels.length} levels · {totalDocs} documents total. Search or filter to find a document, or click a
          milestone to browse its checklist — Pro and Enterprise levels stay visible so you can see what upgrading
          unlocks.
        </Typography>
      </Box>

      <SectionCard>
        <Box className="flex flex-col gap-4">
          <TextField
            size="small"
            placeholder="Search documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-focused': {
                  boxShadow:
                    '0 0 0 3px color-mix(in srgb, var(--mui-palette-primary-main) 15%, transparent), 0 6px 20px -6px color-mix(in srgb, var(--mui-palette-primary-main) 40%, transparent)',
                },
              },
            }}
          />

          <PillToggle options={FILTERS} value={filter} onChange={setFilter} layoutId="journey-filter-pill" />

          {totalMatches === 0 && <EmptyState title="No documents match" description="Try a different search term or filter." />}
        </Box>
      </SectionCard>

      {/* Outside the search/filter card — each level is its own Accordion/
          card below it, same as the taxonomy editor, rather than nesting
          every level inside one shared card. */}
      {totalMatches > 0 && (
        <JourneyTree
          levels={filteredLevels}
          isUnlocked={(level) => level.unlocked}
          tierFor={(level) => tierMap[level.code]}
          defaultMilestonesOpen={isFiltering}
          renderDocAction={renderDocAction}
          onBackfillUpload={handleBackfillUpload}
          onPreviewDocument={handlePreview}
        />
      )}

      {/* One shared hidden input for every backfill "Upload" action across
          the tree — handleBackfillUpload just remembers which doc+period
          was clicked, then opens this, rather than each history row
          wrapping its own component="label" input. */}
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        hidden
        ref={backfillFileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file && backfillTarget) {
            setStagedUpload({ doc: backfillTarget.doc, file, targetPeriodKey: backfillTarget.entry.period_key ?? undefined });
          }
          setBackfillTarget(null);
        }}
      />

      <DocumentPreviewDialog
        open={preview.open}
        onClose={() => setPreview(CLOSED_PREVIEW)}
        title={preview.title}
        url={preview.url}
        mimeType={preview.mimeType}
        loading={preview.loading}
        error={preview.error}
      />

      <DocumentUploadPreviewDialog
        open={stagedUpload !== null}
        title={stagedUpload?.doc.name ?? ''}
        file={stagedUpload?.file ?? null}
        backfillNotice={stagedUpload?.targetPeriodKey ? t('journey.upload_backfill_notice', { period: stagedUpload.targetPeriodKey }) : undefined}
        confirming={stagedUpload ? uploadingIds.has(stagedUpload.doc.id) : false}
        onConfirm={() => void handleConfirmUpload()}
        onSaveDraft={stagedUpload?.targetPeriodKey ? undefined : handleSaveDraft}
        onReplace={(file) => setStagedUpload((prev) => (prev ? { ...prev, file } : prev))}
        onCancel={() => setStagedUpload(null)}
      />
    </Box>
  );
}
