'use client';

import { useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';
import UploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { getApiError } from '@2bready/api-client';
import api from '@/lib/api';
import {
  Breadcrumbs,
  SectionCard,
  EmptyState,
  StatusBadge,
  DocumentPreviewDialog,
  DocumentUploadPreviewDialog,
  PillToggle,
  ConfirmDialog,
} from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { useNavItems } from '@/components/layout/nav-items';
import { PageHeader } from '@/components/layout/PageHeader';
import { JourneyTree, type RenderDocAction } from '@/components/dashboard/JourneyTree';
import { useJourney } from '@/components/JourneyProvider';
import { usePackages } from '@/components/PackageProvider';
import { PageLoader } from '@/components/PageLoader';
import { useToast } from '@/components/ToastProvider';
import { useAuthStore } from '@/store/auth.store';
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
import { getLegalConsentStatus } from '@/lib/legal-consent-api';
import { LegalConsentDialog } from '@/components/LegalConsentDialog';

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
  const currentCompanyId = useAuthStore((s) => s.user?.current_company_id ?? null);

  const levels = useMemo(() => journey?.levels ?? [], [journey]);
  const totalDocs = allDocuments(journey).length;
  const tierMap = useMemo(() => tierByLevelCode(packages), [packages]);

  // Template id → journey level code, for resolving a document's restriction
  // from the upload path (which only has the template id, not the level
  // context the tree rows carry).
  const levelByDocumentId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const level of levels) {
      for (const milestone of level.milestones) {
        for (const doc of milestone.documents) {
          map[doc.id] = level.code;
        }
      }
    }
    return map;
  }, [levels]);

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

  // Add/edit sub-document dialog state
  const [addSubDoc, setAddSubDoc] = useState<{ doc: JourneyDocument | null; name: string; editing: boolean }>({ doc: null, name: '', editing: false });

  // Delete sub-document confirmation state
  const [deleteSubDoc, setDeleteSubDoc] = useState<JourneyDocument | null>(null);

  // Legal consent gate (v3 §4.2): restricted P3/P4 (L3/L4) documents require
  // an accepted consent before preview/upload. We check status lazily on the
  // action (never pre-flight the whole journey) and queue the action to run
  // once consent is recorded server-side.
  const [consentGate, setConsentGate] = useState<{
    levelCode: string;
    textEn: string;
    textKh: string;
    run: () => void;
  } | null>(null);

  // L3/L4 documents are restricted — mirror of the backend's
  // pathwayForLevel() (LegalConsentService). Anything else passes straight
  // through with no modal.
  const isRestrictedLevel = (code: string) => code === 'L3' || code === 'L4';

  // Wraps a restricted action (preview/upload) in the consent check: if the
  // user already holds a current-version consent for the level the action
  // runs immediately; otherwise the consent dialog opens and `run` fires
  // only after the server records acceptance.
  const gateByLevel = async (levelCode: string, run: () => void) => {
    if (!isRestrictedLevel(levelCode)) {
      run();
      return;
    }
    try {
      const status = await getLegalConsentStatus(levelCode);
      if (status.accepted) {
        run();
        return;
      }
      setConsentGate({ levelCode, textEn: status.text_en, textKh: status.text_kh, run });
    } catch (err) {
      toast.error(getApiError(err).message || 'Could not check consent.');
    }
  };

  function handleBackfillUpload(doc: JourneyDocument, entry: DocumentHistoryEntry) {
    setBackfillTarget({ doc, entry });
    backfillFileInputRef.current?.click();
  }

  function openAddSubDoc(doc: JourneyDocument) {
    setAddSubDoc({ doc, name: '', editing: false });
  }

  function openEditSubDoc(doc: JourneyDocument) {
    setAddSubDoc({ doc, name: doc.name, editing: true });
  }

  async function handleConfirmAddSubDoc() {
    if (!addSubDoc.doc || !addSubDoc.name.trim()) return;
    try {
      if (addSubDoc.editing) {
        await api.patch(`/my/document-templates/${addSubDoc.doc.id}`, {
          name: addSubDoc.name.trim(),
        });
        toast.success('Sub-document updated.');
      } else {
        await api.post(`/my/document-templates/${addSubDoc.doc.id}/children`, {
          name: addSubDoc.name.trim(),
          description: '',
          is_required: false,
          client_can_add_subdocs: false,
          recurrence_type: 'one_time',
        });
        toast.success('Sub-document added.');
      }
      setAddSubDoc({ doc: null, name: '', editing: false });
      await refetch();
    } catch (err) {
      toast.error(getApiError(err).message || 'Could not save sub-document.');
    }
  }

  async function handleDeleteSubDoc(doc: JourneyDocument) {
    setDeleteSubDoc(doc);
  }

  async function handleConfirmDeleteSubDoc() {
    if (!deleteSubDoc) return;
    try {
      await api.delete(`/my/document-templates/${deleteSubDoc.id}`);
      toast.success('Sub-document deleted.');
      await refetch();
    } catch (err) {
      toast.error(getApiError(err).message || 'Could not delete sub-document.');
    } finally {
      setDeleteSubDoc(null);
    }
  }

  function handleCancelDeleteSubDoc() {
    setDeleteSubDoc(null);
  }

  function handleCancelAddSubDoc() {
    setAddSubDoc({ doc: null, name: '', editing: false });
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
    const levelCode = ctx.level.code;

    if (!levelUnlocked) {
      return (
        <Box className="flex items-center gap-2" sx={{ flexShrink: 0 }}>
          <StatusBadge status={status} label={DOC_STATUS_LABEL[status]} />
          <Tooltip title={`Upgrade to ${TIER_LABELS[tierMap[levelCode]] ?? 'a paid'} plan to unlock this level`}>
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
            {doc.document_id && (
              <Tooltip title="Preview">
                <IconButton size="small" onClick={() => void gateByLevel(levelCode, () => handlePreview(doc.document_id!, doc.name))}>
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {status === 'verified' && (
              <Tooltip title="Download">
                <IconButton size="small">
                  <DownloadOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
        {doc.client_can_add_subdocs && (
          <Tooltip title="Add sub-document">
            <IconButton size="small" onClick={() => openAddSubDoc(doc)}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {doc.company_id === currentCompanyId && doc.parent_id && (
          <>
            <Tooltip title="Edit sub-document">
              <IconButton size="small" onClick={() => openEditSubDoc(doc)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete sub-document">
              <IconButton size="small" color="error" onClick={() => handleDeleteSubDoc(doc)}>
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
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

    const upload = async () => {
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
    };

    // Restricted L3/L4 uploads need an accepted consent first — the backend
    // rejects them otherwise, so gate before the request, not on its 403.
    await gateByLevel(levelByDocumentId[doc.id] ?? '', upload);
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

      <PageHeader
        eyebrow="Journey → Level → Milestone → Documents"
        title="Your full compliance checklist"
        subtitle={`${levels.length} levels · ${totalDocs} documents total. Search or filter to find a document, or click a milestone to browse its checklist — Pro and Enterprise levels stay visible so you can see what upgrading unlocks.`}
      />

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

      {/* Add sub-document dialog */}
      <Dialog open={addSubDoc.doc !== null} onClose={handleCancelAddSubDoc} maxWidth="sm" fullWidth>
        <DialogTitle>{addSubDoc.editing ? t('journey.edit_sub_document_title') : t('journey.add_sub_document_title')}</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TextField
            autoFocus
            label={t('journey.sub_document_name_label')}
            placeholder={t('journey.sub_document_name_placeholder')}
            fullWidth
            value={addSubDoc.name}
            onChange={(e) => setAddSubDoc({ ...addSubDoc, name: e.target.value })}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="text" onClick={handleCancelAddSubDoc}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleConfirmAddSubDoc} disabled={!addSubDoc.name.trim()}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete sub-document confirmation */}
      <ConfirmDialog
        open={deleteSubDoc !== null}
        onCancel={handleCancelDeleteSubDoc}
        title={t('journey.delete_sub_document_title')}
        description={t('journey.delete_sub_document_desc', { name: deleteSubDoc?.name ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={handleConfirmDeleteSubDoc}
      />

      {/* Legal consent — required before acting on restricted L3/L4 documents */}
      <LegalConsentDialog
        open={consentGate !== null}
        levelCode={consentGate?.levelCode ?? ''}
        textEn={consentGate?.textEn ?? ''}
        textKh={consentGate?.textKh ?? ''}
        onCancel={() => setConsentGate(null)}
        onAccepted={() => {
          const run = consentGate?.run;
          setConsentGate(null);
          run?.();
        }}
      />
    </Box>
  );
}
