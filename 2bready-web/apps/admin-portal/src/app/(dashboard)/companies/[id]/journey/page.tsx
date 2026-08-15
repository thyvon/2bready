'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import UploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';

import SectionCard from '@/components/ui/SectionCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { ConfirmDialog, DocumentUploadPreviewDialog, FormDatePicker } from '@2bready/ui-core';
import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';
import FormSelect from '@/components/forms/FormSelect';
import FormSwitch from '@/components/forms/FormSwitch';
import { useToast } from '@/components/feedback/ToastProvider';
import { useTranslation } from '@/lib/i18n';
import {
  getCompanyJourney,
  completeMilestone,
  createExtraRequirement,
  createExtraRequirementChild,
  updateExtraRequirement,
  deleteExtraRequirement,
} from '@/domains/journey/api';
import { JourneyTree } from '@/domains/journey/components/JourneyTree';
import { findDocument, type Journey, type JourneyDocument } from '@/domains/journey/types';
import { documentTemplateFormSchema, documentTemplateFormDefaults, type DocumentTemplateFormInput } from '@/domains/journey-template/schemas';
import { RECURRENCE_KINDS, recurrenceKindNeedsMonths, recurrenceKindIsPeriodic, type RecurrenceKind } from '@/domains/journey-template/recurrence-kind';
import { verifyDocument, rejectDocument, getPreviewUrl, uploadDocument } from '@/domains/document/api';
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
  const { t } = useTranslation();

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [signingOff, setSigningOff] = useState<string | null>(null);

  const [acting, setActing] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  // Staff uploading a document on this company's behalf (e.g. received by
  // email/in person) — staged locally first via DocumentUploadPreviewDialog,
  // same pattern client-portal's own Journey page uses for its uploads.
  const [stagedUpload, setStagedUpload] = useState<{ doc: JourneyDocument; file: File } | null>(null);
  const [uploading, setUploading] = useState(false);

  const [extraDialog, setExtraDialog] = useState<{
    milestoneId: string;
    parentDocumentId: string | null;
    editing: JourneyDocument | null;
  } | null>(null);
  const [pendingDeleteExtra, setPendingDeleteExtra] = useState<JourneyDocument | null>(null);
  const [deletingExtra, setDeletingExtra] = useState(false);
  const [extraServerError, setExtraServerError] = useState('');
  const [extraRecurrenceKind, setExtraRecurrenceKind] = useState<RecurrenceKind>('one_time');

  const extraForm = useForm<DocumentTemplateFormInput>({
    resolver: zodResolver(documentTemplateFormSchema),
    defaultValues: documentTemplateFormDefaults,
  });

  // Re-fetches the journey in place — never flips `loading` or remounts the
  // tree, so scroll position and accordion state survive every mutation
  // (verify/reject/upload/sign-off/extra CRUD). Same SPA behaviour as
  // client-portal's JourneyProvider.refetch.
  const refetch = useCallback(async () => {
    const journeyData = await getCompanyJourney(params.id);
    setJourney(journeyData);
    return journeyData;
  }, [params.id]);

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
  }, [params.id]);

  const handleSignOff = async (milestoneId: string) => {
    setSigningOff(milestoneId);
    try {
      await completeMilestone(params.id, milestoneId);
      toast.success('Milestone signed off.');
      await refetch();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setSigningOff(null);
    }
  };

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

  // A verified/rejected document can auto-complete its milestone (see
  // CompleteMilestoneOnDocumentVerified) — reload the whole tree so that
  // shows up immediately, not just the one document's own status.
  const handleVerify = async (comment?: string) => {
    if (!preview) return;
    setActing(true);
    try {
      await verifyDocument(preview.documentId, comment);
      toast.success('Document verified.');
      setPreview(null);
      await refetch();
      refreshCounts();
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
      toast.success('Document rejected.');
      setPreview(null);
      await refetch();
      refreshCounts();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActing(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!stagedUpload) return;
    const { doc, file } = stagedUpload;
    setUploading(true);
    try {
      await uploadDocument(company.id, doc.id, file);
      toast.success(`${doc.name} uploaded — now being scanned.`);
      setStagedUpload(null);
      await refetch();
      refreshCounts();
      // The malware scan runs on a background queue worker, not on this
      // request — poll for a bit so the tree updates itself the moment the
      // scan finishes (pending_scan → review), mirroring client-portal's
      // own Journey page, instead of leaving a stale "being scanned" toast.
      void pollForScanResult(doc.id, doc.name);
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setUploading(false);
    }
  };

  // Polls the real journey every 2.5s (up to ~20s) after an upload, stopping
  // as soon as this specific document leaves the "pending_scan" bucket — i.e.
  // the background scan job (Horizon) has actually run. Fire-and-forget from
  // the caller; the tree re-renders on its own via refetch()'s setState.
  async function pollForScanResult(documentId: string, docName: string) {
    for (let attempt = 0; attempt < 8; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const fresh = await refetch();
      const doc = findDocument(fresh, documentId);
      if (doc && doc.status !== 'pending_scan') {
        toast.success(`${docName} scan complete — now ${doc.status === 'review' ? 'In Review' : 'Verified'}.`);
        return;
      }
    }
  }

  const openAddExtra = (milestoneId: string, parentDocumentId: string | null) => {
    extraForm.reset(documentTemplateFormDefaults);
    setExtraRecurrenceKind('one_time');
    setExtraServerError('');
    setExtraDialog({ milestoneId, parentDocumentId, editing: null });
  };
  const openEditExtra = (doc: JourneyDocument) => {
    extraForm.reset({
      name: doc.name,
      description: '',
      is_required: doc.is_required,
      client_can_add_subdocs: doc.client_can_add_subdocs ?? false,
      recurrence_type: doc.recurrence_type,
      expiry_months: doc.expiry_months ?? undefined,
      effective_since: doc.effective_since ? doc.effective_since.slice(0, 10) : '',
      sort_order: 0,
    });
    setExtraRecurrenceKind(doc.recurrence_type);
    setExtraServerError('');
    setExtraDialog({ milestoneId: '', parentDocumentId: null, editing: doc });
  };
  const submitExtra = async (data: DocumentTemplateFormInput) => {
    if (!extraDialog) return;
    setExtraServerError('');
    try {
      const parsed = documentTemplateFormSchema.parse(data);
      const payload = { ...parsed, description: parsed.description || undefined, effective_since: parsed.effective_since || undefined };
      if (extraDialog.editing) {
        await updateExtraRequirement(extraDialog.editing.id, payload);
      } else if (extraDialog.parentDocumentId) {
        await createExtraRequirementChild(params.id, extraDialog.parentDocumentId, payload);
      } else {
        await createExtraRequirement(params.id, extraDialog.milestoneId, payload);
      }
      toast.success(extraDialog.editing ? 'Extra requirement updated.' : 'Extra requirement added.');
      setExtraDialog(null);
      await refetch();
    } catch (err) {
      setExtraServerError(getApiError(err).message);
    }
  };
  const handleDeleteExtra = async () => {
    if (!pendingDeleteExtra) return;
    setDeletingExtra(true);
    try {
      await deleteExtraRequirement(pendingDeleteExtra.id);
      toast.success('Extra requirement deleted.');
      setPendingDeleteExtra(null);
      await refetch();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setDeletingExtra(false);
    }
  };

  // Same states client-portal itself offers an upload/re-upload action for
  // — nothing on file yet, or the last attempt didn't hold up. A document
  // still pending_scan/review/verified already has a real file to look at
  // via Preview instead.
  const needsUpload = (doc: JourneyDocument) => ['pending', 'rejected', 'expired', 'scan_failed'].includes(doc.status);

  const renderDocAction = (doc: JourneyDocument) => (
    <Box className="flex items-center gap-2" sx={{ flexShrink: 0 }}>
      <StatusBadge status={doc.status} />
      {doc.document_id && (
        <Tooltip title="Preview">
          <IconButton size="small" onClick={() => handlePreview(doc.document_id!, doc.name, doc.status)}>
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {needsUpload(doc) && (
        <Tooltip title={doc.document_id ? 'Re-upload' : 'Upload'}>
          <IconButton size="small" component="label">
            {doc.document_id ? <RefreshOutlinedIcon fontSize="small" /> : <UploadOutlinedIcon fontSize="small" />}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) setStagedUpload({ doc, file });
              }}
            />
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
      {/* No wrapping SectionCard — each level is its own Accordion/card,
          same as the taxonomy editor, rather than nesting every level
          inside one shared card. */}
      <JourneyTree
        levels={journey.levels}
        onSignOff={handleSignOff}
        signingOffId={signingOff}
        renderDocAction={renderDocAction}
        extras={{ onAddExtra: openAddExtra, onEditExtra: openEditExtra, onDeleteExtra: setPendingDeleteExtra }}
        onPreviewDocument={handlePreview}
      />

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

      <DocumentUploadPreviewDialog
        open={stagedUpload !== null}
        title={stagedUpload?.doc.name ?? ''}
        file={stagedUpload?.file ?? null}
        confirming={uploading}
        onConfirm={() => void handleConfirmUpload()}
        onReplace={(file) => setStagedUpload((prev) => (prev ? { ...prev, file } : prev))}
        onCancel={() => setStagedUpload(null)}
      />

      <Dialog open={!!extraDialog} onClose={() => setExtraDialog(null)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={extraForm.handleSubmit(submitExtra)} noValidate>
          <DialogTitle>{extraDialog?.editing ? 'Edit Extra Requirement' : 'Add Extra Requirement'}</DialogTitle>
          <DialogContent className="flex flex-col gap-5" sx={{ pt: '8px !important' }}>
            {extraServerError && <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>{extraServerError}</Box>}
            <Box>
              <FieldLabel>Document name</FieldLabel>
              <FormTextField
                fullWidth
                autoFocus
                error={!!extraForm.formState.errors.name}
                helperText={extraForm.formState.errors.name?.message}
                {...extraForm.register('name')}
              />
            </Box>
            <Box>
              <FieldLabel>Description</FieldLabel>
              <FormTextField
                fullWidth
                multiline
                rows={2}
                error={!!extraForm.formState.errors.description}
                helperText={extraForm.formState.errors.description?.message}
                {...extraForm.register('description')}
              />
            </Box>
            <Box>
              <FieldLabel>{t('journey_template.recurrence_kind')}</FieldLabel>
              <FormSelect
                fullWidth
                value={extraRecurrenceKind}
                onChange={(e) => {
                  const kind = e.target.value as RecurrenceKind;
                  setExtraRecurrenceKind(kind);
                  extraForm.setValue('recurrence_type', kind, { shouldValidate: true });
                  if (!recurrenceKindNeedsMonths(kind)) {
                    extraForm.setValue('expiry_months', undefined, { shouldValidate: true });
                  }
                }}
              >
                {RECURRENCE_KINDS.map((kind) => (
                  <MenuItem key={kind} value={kind}>
                    {t(`journey_template.recurrence_kind.${kind}`)}
                  </MenuItem>
                ))}
              </FormSelect>
            </Box>
            {recurrenceKindNeedsMonths(extraRecurrenceKind) && (
              <Box>
                <FieldLabel>{t('journey_template.expiry_custom_months')}</FieldLabel>
                <FormTextField
                  type="number"
                  fullWidth
                  placeholder={t('journey_template.expiry_months_placeholder')}
                  slotProps={{ htmlInput: { step: '1', min: 1 } }}
                  error={!!extraForm.formState.errors.expiry_months}
                  helperText={extraForm.formState.errors.expiry_months?.message}
                  {...extraForm.register('expiry_months')}
                />
              </Box>
            )}
            {recurrenceKindIsPeriodic(extraRecurrenceKind) && (
              <Box>
                <FieldLabel>{t('journey_template.effective_since_label')}</FieldLabel>
                <Controller
                  name="effective_since"
                  control={extraForm.control}
                  render={({ field }) => (
                    <FormDatePicker
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      fullWidth
                      helperText={t('journey_template.effective_since_hint')}
                      error={!!extraForm.formState.errors.effective_since}
                    />
                  )}
                />
              </Box>
            )}
            <FormSwitch
              checked={extraForm.watch('is_required')}
              onChange={(checked) => extraForm.setValue('is_required', checked)}
              label="Required"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="text" onClick={() => setExtraDialog(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" loading={extraForm.formState.isSubmitting}>
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDeleteExtra}
        title="Delete extra requirement?"
        description={`Delete "${pendingDeleteExtra?.name ?? ''}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deletingExtra}
        onCancel={() => setPendingDeleteExtra(null)}
        onConfirm={handleDeleteExtra}
      />
    </>
  );
}
