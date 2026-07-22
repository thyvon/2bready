'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import SectionCard from '@/components/ui/SectionCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@2bready/ui-core';
import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';
import FormSelect from '@/components/forms/FormSelect';
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
import type { Journey, JourneyDocument } from '@/domains/journey/types';
import { documentTemplateFormSchema, documentTemplateFormDefaults, type DocumentTemplateFormInput } from '@/domains/journey-template/schemas';
import { RECURRENCE_KINDS, recurrenceKindNeedsMonths, type RecurrenceKind } from '@/domains/journey-template/recurrence-kind';
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
  const { t } = useTranslation();

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [signingOff, setSigningOff] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [acting, setActing] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);

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
      recurrence_type: doc.recurrence_type,
      expiry_months: doc.expiry_months ?? undefined,
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
      const payload = { ...parsed, description: parsed.description || undefined };
      if (extraDialog.editing) {
        await updateExtraRequirement(extraDialog.editing.id, payload);
      } else if (extraDialog.parentDocumentId) {
        await createExtraRequirementChild(params.id, extraDialog.parentDocumentId, payload);
      } else {
        await createExtraRequirement(params.id, extraDialog.milestoneId, payload);
      }
      toast.success(extraDialog.editing ? 'Extra requirement updated.' : 'Extra requirement added.');
      setExtraDialog(null);
      setReloadKey((k) => k + 1);
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
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setDeletingExtra(false);
    }
  };

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
            <FormControlLabel
              control={
                <Switch
                  checked={extraForm.watch('is_required')}
                  onChange={(e) => extraForm.setValue('is_required', e.target.checked)}
                />
              }
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
