'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FieldLabel from '@/components/forms/FieldLabel';
import FormSelect from '@/components/forms/FormSelect';
import FormTextField from '@/components/forms/FormTextField';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/feedback/ToastProvider';
import { useJourneyTemplate } from '@/domains/journey-template/hooks';
import {
  createJourneyLevel,
  updateJourneyLevel,
  deleteJourneyLevel,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  createDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate,
} from '@/domains/journey-template/api';
import type { JourneyLevel, Milestone, DocumentTemplate } from '@/domains/journey-template/types';
import {
  journeyLevelFormSchema,
  journeyLevelFormDefaults,
  type JourneyLevelFormInput,
  milestoneFormSchema,
  milestoneFormDefaults,
  type MilestoneFormInput,
  documentTemplateFormSchema,
  documentTemplateFormDefaults,
  type DocumentTemplateFormInput,
} from '@/domains/journey-template/schemas';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

type PendingDelete =
  | { kind: 'level'; item: JourneyLevel }
  | { kind: 'milestone'; item: Milestone }
  | { kind: 'document_template'; item: DocumentTemplate };

export default function JourneyTemplateDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();
  const { journeyTemplate, loading, reload } = useJourneyTemplate(params.id);

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff'])) router.replace('/dashboard');
  }, [hasAnyRole, router]);

  const [levelDialog, setLevelDialog] = useState<{ editing: JourneyLevel | null } | null>(null);
  const [milestoneDialog, setMilestoneDialog] = useState<{ levelId: string; editing: Milestone | null } | null>(null);
  const [docDialog, setDocDialog] = useState<{ milestoneId: string; editing: DocumentTemplate | null } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState('');

  const levelForm = useForm<JourneyLevelFormInput>({
    resolver: zodResolver(journeyLevelFormSchema),
    defaultValues: journeyLevelFormDefaults,
  });
  const milestoneForm = useForm<MilestoneFormInput>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: milestoneFormDefaults,
  });
  const docForm = useForm<DocumentTemplateFormInput>({
    resolver: zodResolver(documentTemplateFormSchema),
    defaultValues: documentTemplateFormDefaults,
  });

  const openCreateLevel = () => {
    levelForm.reset(journeyLevelFormDefaults);
    setServerError('');
    setLevelDialog({ editing: null });
  };
  const openEditLevel = (level: JourneyLevel) => {
    levelForm.reset({
      code: level.code,
      name: level.name,
      pathway_name: level.pathway_name,
      pillar: level.pillar,
      sort_order: level.sort_order,
    });
    setServerError('');
    setLevelDialog({ editing: level });
  };
  const submitLevel = async (data: JourneyLevelFormInput) => {
    if (!journeyTemplate || !levelDialog) return;
    setServerError('');
    try {
      const parsed = journeyLevelFormSchema.parse(data);
      if (levelDialog.editing) {
        await updateJourneyLevel(levelDialog.editing.id, parsed);
      } else {
        await createJourneyLevel(journeyTemplate.id, parsed);
      }
      toast.success(levelDialog.editing ? t('journey_template.level_update_success') : t('journey_template.level_create_success'));
      setLevelDialog(null);
      reload();
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const openCreateMilestone = (levelId: string) => {
    milestoneForm.reset(milestoneFormDefaults);
    setServerError('');
    setMilestoneDialog({ levelId, editing: null });
  };
  const openEditMilestone = (levelId: string, milestone: Milestone) => {
    milestoneForm.reset({ name: milestone.name, sort_order: milestone.sort_order });
    setServerError('');
    setMilestoneDialog({ levelId, editing: milestone });
  };
  const submitMilestone = async (data: MilestoneFormInput) => {
    if (!milestoneDialog) return;
    setServerError('');
    try {
      const parsed = milestoneFormSchema.parse(data);
      if (milestoneDialog.editing) {
        await updateMilestone(milestoneDialog.editing.id, parsed);
      } else {
        await createMilestone(milestoneDialog.levelId, parsed);
      }
      toast.success(
        milestoneDialog.editing ? t('journey_template.milestone_update_success') : t('journey_template.milestone_create_success')
      );
      setMilestoneDialog(null);
      reload();
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const openCreateDoc = (milestoneId: string) => {
    docForm.reset(documentTemplateFormDefaults);
    setServerError('');
    setDocDialog({ milestoneId, editing: null });
  };
  const openEditDoc = (milestoneId: string, doc: DocumentTemplate) => {
    docForm.reset({
      name: doc.name,
      description: doc.description ?? '',
      is_required: doc.is_required,
      expiry_months: doc.expiry_months ?? undefined,
      sort_order: doc.sort_order,
    });
    setServerError('');
    setDocDialog({ milestoneId, editing: doc });
  };
  const submitDoc = async (data: DocumentTemplateFormInput) => {
    if (!docDialog) return;
    setServerError('');
    try {
      const parsed = documentTemplateFormSchema.parse(data);
      const payload = { ...parsed, description: parsed.description || undefined };
      if (docDialog.editing) {
        await updateDocumentTemplate(docDialog.editing.id, payload);
      } else {
        await createDocumentTemplate(docDialog.milestoneId, payload);
      }
      toast.success(docDialog.editing ? t('journey_template.doc_update_success') : t('journey_template.doc_create_success'));
      setDocDialog(null);
      reload();
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (pendingDelete.kind === 'level') await deleteJourneyLevel(pendingDelete.item.id);
      if (pendingDelete.kind === 'milestone') await deleteMilestone(pendingDelete.item.id);
      if (pendingDelete.kind === 'document_template') await deleteDocumentTemplate(pendingDelete.item.id);
      toast.success(t('journey_template.delete_node_success'));
      setPendingDelete(null);
      reload();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !journeyTemplate) {
    return (
      <Box className="flex justify-center py-16">
        <CircularProgress size={28} />
      </Box>
    );
  }

  const levels = [...(journeyTemplate.levels ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <PageHeader
        title={journeyTemplate.name}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateLevel}>
            {t('journey_template.add_level')}
          </Button>
        }
      />

      {levels.length === 0 && (
        <SectionCard>
          <Typography variant="body2" color="text.secondary">
            {t('journey_template.no_levels')}
          </Typography>
        </SectionCard>
      )}

      {levels.map((level) => {
        const milestones = [...(level.milestones ?? [])].sort((a, b) => a.sort_order - b.sort_order);
        return (
          <Accordion
            key={level.id}
            defaultExpanded
            sx={{ mb: 1.5, borderRadius: '8px !important', '&:before': { display: 'none' } }}
            disableGutters
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box className="flex items-center gap-2 w-full pr-2">
                <Chip label={level.code} size="small" />
                <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>{level.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(`journey_template.pillar.${level.pillar}`)}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditLevel(level);
                  }}
                  aria-label={t('common.edit')}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete({ kind: 'level', item: level });
                  }}
                  aria-label={t('common.delete')}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {milestones.map((milestone) => {
                const docs = [...(milestone.document_templates ?? [])].sort((a, b) => a.sort_order - b.sort_order);
                return (
                  <Box key={milestone.id} sx={{ mb: 2, pl: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
                    <Box className="flex items-center gap-2 pl-2">
                      <Typography sx={{ fontWeight: 500, flexGrow: 1 }}>{milestone.name}</Typography>
                      <IconButton size="small" onClick={() => openEditMilestone(level.id, milestone)} aria-label={t('common.edit')}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setPendingDelete({ kind: 'milestone', item: milestone })}
                        aria-label={t('common.delete')}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box sx={{ pl: 3, mt: 0.5 }}>
                      {docs.map((doc) => (
                        <Box key={doc.id} className="flex items-center gap-2 py-0.5">
                          <Typography variant="body2" sx={{ flexGrow: 1 }}>
                            {doc.name}
                          </Typography>
                          {doc.is_required && <Chip label={t('journey_template.required')} size="small" variant="outlined" />}
                          {doc.expiry_months != null && (
                            <Chip label={t('journey_template.expires_in', { months: String(doc.expiry_months) })} size="small" variant="outlined" />
                          )}
                          <IconButton size="small" onClick={() => openEditDoc(milestone.id, doc)} aria-label={t('common.edit')}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setPendingDelete({ kind: 'document_template', item: doc })}
                            aria-label={t('common.delete')}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                      <Button size="small" startIcon={<AddIcon fontSize="small" />} onClick={() => openCreateDoc(milestone.id)}>
                        {t('journey_template.add_document_template')}
                      </Button>
                    </Box>
                  </Box>
                );
              })}
              <Button size="small" startIcon={<AddIcon fontSize="small" />} onClick={() => openCreateMilestone(level.id)}>
                {t('journey_template.add_milestone')}
              </Button>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* ─── Level dialog ─── */}
      <Dialog open={!!levelDialog} onClose={() => setLevelDialog(null)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={levelForm.handleSubmit(submitLevel)} noValidate>
          <DialogTitle>{levelDialog?.editing ? t('journey_template.edit_level') : t('journey_template.add_level')}</DialogTitle>
          <DialogContent className="flex flex-col gap-5" sx={{ pt: '8px !important' }}>
            {serverError && <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>{serverError}</Box>}
            <Box className="flex gap-4">
              <Box className="flex-1">
                <FieldLabel>{t('journey_template.level_code')}</FieldLabel>
                <FormTextField
                  fullWidth
                  autoFocus
                  error={!!levelForm.formState.errors.code}
                  helperText={levelForm.formState.errors.code?.message}
                  {...levelForm.register('code')}
                />
              </Box>
              <Box className="flex-1">
                <FieldLabel>{t('journey_template.sort_order')}</FieldLabel>
                <FormTextField
                  type="number"
                  fullWidth
                  slotProps={{ htmlInput: { step: '1', min: 0 } }}
                  error={!!levelForm.formState.errors.sort_order}
                  helperText={levelForm.formState.errors.sort_order?.message}
                  {...levelForm.register('sort_order')}
                />
              </Box>
            </Box>
            <Box>
              <FieldLabel>{t('journey_template.level_name')}</FieldLabel>
              <FormTextField
                fullWidth
                error={!!levelForm.formState.errors.name}
                helperText={levelForm.formState.errors.name?.message}
                {...levelForm.register('name')}
              />
            </Box>
            <Box>
              <FieldLabel>{t('journey_template.pathway_name')}</FieldLabel>
              <FormTextField
                fullWidth
                error={!!levelForm.formState.errors.pathway_name}
                helperText={levelForm.formState.errors.pathway_name?.message}
                {...levelForm.register('pathway_name')}
              />
            </Box>
            <Box>
              <FieldLabel>{t('journey_template.pillar_col')}</FieldLabel>
              <Controller
                name="pillar"
                control={levelForm.control}
                render={({ field }) => (
                  <FormSelect {...field} fullWidth>
                    <MenuItem value="comply">{t('journey_template.pillar.comply')}</MenuItem>
                    <MenuItem value="scale">{t('journey_template.pillar.scale')}</MenuItem>
                    <MenuItem value="lead">{t('journey_template.pillar.lead')}</MenuItem>
                  </FormSelect>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="text" onClick={() => setLevelDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="contained" loading={levelForm.formState.isSubmitting}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ─── Milestone dialog ─── */}
      <Dialog open={!!milestoneDialog} onClose={() => setMilestoneDialog(null)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={milestoneForm.handleSubmit(submitMilestone)} noValidate>
          <DialogTitle>
            {milestoneDialog?.editing ? t('journey_template.edit_milestone') : t('journey_template.add_milestone')}
          </DialogTitle>
          <DialogContent className="flex flex-col gap-5" sx={{ pt: '8px !important' }}>
            {serverError && <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>{serverError}</Box>}
            <Box>
              <FieldLabel>{t('journey_template.milestone_name')}</FieldLabel>
              <FormTextField
                fullWidth
                autoFocus
                error={!!milestoneForm.formState.errors.name}
                helperText={milestoneForm.formState.errors.name?.message}
                {...milestoneForm.register('name')}
              />
            </Box>
            <Box>
              <FieldLabel>{t('journey_template.sort_order')}</FieldLabel>
              <FormTextField
                type="number"
                fullWidth
                slotProps={{ htmlInput: { step: '1', min: 0 } }}
                error={!!milestoneForm.formState.errors.sort_order}
                helperText={milestoneForm.formState.errors.sort_order?.message}
                {...milestoneForm.register('sort_order')}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="text" onClick={() => setMilestoneDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="contained" loading={milestoneForm.formState.isSubmitting}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ─── Document template dialog ─── */}
      <Dialog open={!!docDialog} onClose={() => setDocDialog(null)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={docForm.handleSubmit(submitDoc)} noValidate>
          <DialogTitle>{docDialog?.editing ? t('journey_template.edit_document_template') : t('journey_template.add_document_template')}</DialogTitle>
          <DialogContent className="flex flex-col gap-5" sx={{ pt: '8px !important' }}>
            {serverError && <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>{serverError}</Box>}
            <Box>
              <FieldLabel>{t('journey_template.doc_name')}</FieldLabel>
              <FormTextField
                fullWidth
                autoFocus
                error={!!docForm.formState.errors.name}
                helperText={docForm.formState.errors.name?.message}
                {...docForm.register('name')}
              />
            </Box>
            <Box>
              <FieldLabel>{t('journey_template.doc_description')}</FieldLabel>
              <FormTextField
                fullWidth
                multiline
                rows={2}
                error={!!docForm.formState.errors.description}
                helperText={docForm.formState.errors.description?.message}
                {...docForm.register('description')}
              />
            </Box>
            <Box className="flex gap-4">
              <Box className="flex-1">
                <FieldLabel>{t('journey_template.expiry_months')}</FieldLabel>
                <FormTextField
                  type="number"
                  fullWidth
                  placeholder={t('journey_template.expiry_months_placeholder')}
                  slotProps={{ htmlInput: { step: '1', min: 1 } }}
                  error={!!docForm.formState.errors.expiry_months}
                  helperText={docForm.formState.errors.expiry_months?.message}
                  {...docForm.register('expiry_months')}
                />
              </Box>
              <Box className="flex-1">
                <FieldLabel>{t('journey_template.sort_order')}</FieldLabel>
                <FormTextField
                  type="number"
                  fullWidth
                  slotProps={{ htmlInput: { step: '1', min: 0 } }}
                  error={!!docForm.formState.errors.sort_order}
                  helperText={docForm.formState.errors.sort_order?.message}
                  {...docForm.register('sort_order')}
                />
              </Box>
            </Box>
            <Controller
              name="is_required"
              control={docForm.control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label={t('journey_template.is_required')}
                />
              )}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="text" onClick={() => setDocDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="contained" loading={docForm.formState.isSubmitting}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        title={t('journey_template.confirm_delete_node_title')}
        description={
          pendingDelete?.kind === 'level'
            ? t('journey_template.confirm_delete_level_desc', { name: pendingDelete.item.name })
            : pendingDelete?.kind === 'milestone'
              ? t('journey_template.confirm_delete_milestone_desc', { name: pendingDelete.item.name })
              : t('journey_template.confirm_delete_doc_desc', { name: pendingDelete?.item.name ?? '' })
        }
        confirmLabel={t('common.delete')}
        danger
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
