'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
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
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import FieldLabel from '@/components/forms/FieldLabel';
import FormSelect from '@/components/forms/FormSelect';
import { cardRestShadow, cardHoverShadowNeutral } from '@/lib/card-elevation';
import FormTextField from '@/components/forms/FormTextField';
import FormSwitch from '@/components/forms/FormSwitch';
import DocumentTemplateTree, { type DocumentDragData } from '@/domains/journey-template/components/DocumentTemplateTree';
import { RECURRENCE_KINDS, recurrenceKindNeedsMonths, recurrenceKindIsPeriodic, type RecurrenceKind } from '@/domains/journey-template/recurrence-kind';
import { ConfirmDialog, LevelMedal, UploadDropzone, FormDatePicker } from '@2bready/ui-core';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/feedback/ToastProvider';
import { useJourneyTemplate } from '@/domains/journey-template/hooks';
import {
  createJourneyLevel,
  updateJourneyLevel,
  deleteJourneyLevel,
  uploadJourneyLevelMedal,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  createDocumentTemplate,
  createDocumentTemplateChild,
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

function findDocumentById(docs: DocumentTemplate[], id: string): DocumentTemplate | null {
  for (const doc of docs) {
    if (doc.id === id) return doc;
    const found = findDocumentById(doc.children ?? [], id);
    if (found) return found;
  }
  return null;
}

// Replace-if-exists else append — used by the in-place tree mutations below.
function upsertInList<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...list, item];
  return list.map((x) => (x.id === item.id ? item : x));
}

export default function JourneyTemplateDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();
  const { journeyTemplate, loading, setJourneyTemplate, refresh } = useJourneyTemplate(params.id);

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff'])) router.replace('/dashboard');
  }, [hasAnyRole, router]);

  const [levelDialog, setLevelDialog] = useState<{ editing: JourneyLevel | null } | null>(null);
  const [milestoneDialog, setMilestoneDialog] = useState<{ levelId: string; editing: Milestone | null } | null>(null);
  const [docDialog, setDocDialog] = useState<{
    milestoneId: string;
    parentDocumentId: string | null;
    editing: DocumentTemplate | null;
  } | null>(null);
  const [docRecurrenceKind, setDocRecurrenceKind] = useState<RecurrenceKind>('one_time');
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [medalUploadOpen, setMedalUploadOpen] = useState(false);
  const [medalUploading, setMedalUploading] = useState(false);

  const dragSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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
      const saved =
        levelDialog.editing
          ? await updateJourneyLevel(levelDialog.editing.id, parsed)
          : await createJourneyLevel(journeyTemplate.id, parsed);
      upsertLevel(saved);
      toast.success(levelDialog.editing ? t('journey_template.level_update_success') : t('journey_template.level_create_success'));
      setLevelDialog(null);
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const handleMedalUpload = async (file: File) => {
    if (!levelDialog?.editing) return;
    setMedalUploading(true);
    try {
      const updated = await uploadJourneyLevelMedal(levelDialog.editing.id, file);
      setLevelDialog({ editing: updated });
      upsertLevel(updated);
      toast.success(t('journey_template.medal_upload_success'));
      setMedalUploadOpen(false);
    } catch (err) {
      toast.error(getApiError(err).message || t('journey_template.medal_upload_error'));
    } finally {
      setMedalUploading(false);
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
      const saved =
        milestoneDialog.editing
          ? await updateMilestone(milestoneDialog.editing.id, parsed)
          : await createMilestone(milestoneDialog.levelId, parsed);
      upsertMilestone(saved);
      toast.success(
        milestoneDialog.editing ? t('journey_template.milestone_update_success') : t('journey_template.milestone_create_success')
      );
      setMilestoneDialog(null);
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const openCreateDoc = (milestoneId: string) => {
    docForm.reset(documentTemplateFormDefaults);
    setDocRecurrenceKind('one_time');
    setServerError('');
    setDocDialog({ milestoneId, parentDocumentId: null, editing: null });
  };
  const openCreateSubDoc = (milestoneId: string, parentDocumentId: string) => {
    docForm.reset(documentTemplateFormDefaults);
    setDocRecurrenceKind('one_time');
    setServerError('');
    setDocDialog({ milestoneId, parentDocumentId, editing: null });
  };
  const openEditDoc = (milestoneId: string, doc: DocumentTemplate) => {
    docForm.reset({
      name: doc.name,
      description: doc.description ?? '',
      is_required: doc.is_required,
      client_can_add_subdocs: doc.client_can_add_subdocs ?? false,
      recurrence_type: doc.recurrence_type as RecurrenceKind,
      expiry_months: doc.expiry_months ?? undefined,
      effective_since: doc.effective_since ? doc.effective_since.slice(0, 10) : '',
      sort_order: doc.sort_order,
    });
    setDocRecurrenceKind(doc.recurrence_type as RecurrenceKind);
    setServerError('');
    setDocDialog({ milestoneId, parentDocumentId: doc.parent_id, editing: doc });
  };
  const submitDoc = async (data: DocumentTemplateFormInput) => {
    if (!docDialog) return;
    setServerError('');
    try {
      const parsed = documentTemplateFormSchema.parse(data);
      const payload = { ...parsed, description: parsed.description || undefined, effective_since: parsed.effective_since || undefined };
      const saved = docDialog.editing
        ? await updateDocumentTemplate(docDialog.editing.id, payload)
        : docDialog.parentDocumentId
          ? await createDocumentTemplateChild(docDialog.parentDocumentId, payload)
          : await createDocumentTemplate(docDialog.milestoneId, payload);
      if (docDialog.parentDocumentId && !docDialog.editing) {
        upsertDocumentChild(docDialog.parentDocumentId, docDialog.milestoneId, saved);
      } else {
        upsertDocument(docDialog.milestoneId, saved);
      }
      toast.success(docDialog.editing ? t('journey_template.doc_update_success') : t('journey_template.doc_create_success'));
      setDocDialog(null);
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  // In-place tree updates — the SPA counterpart to the old reload()-after-save:
  // every create/update/delete below mutates the in-memory journeyTemplate via
  // setJourneyTemplate (mirroring client-portal's refetch-in-place), so the
  // page never unmounts into a spinner or loses scroll position.

  function upsertLevel(level: JourneyLevel): void {
    setJourneyTemplate((prev) => {
      if (!prev) return prev;
      const levels = prev.levels ?? [];
      const idx = levels.findIndex((l) => l.id === level.id);
      const next = idx === -1 ? [...levels, level] : levels.map((l) => (l.id === level.id ? level : l));
      return { ...prev, levels: next };
    });
  }

  function upsertMilestone(milestone: Milestone): void {
    setJourneyTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        levels: (prev.levels ?? []).map((l) =>
          l.id !== milestone.journey_level_id
            ? l
            : {
                ...l,
                milestones: upsertInList(l.milestones ?? [], milestone),
              }
        ),
      };
    });
  }

  function upsertDocument(milestoneId: string, doc: DocumentTemplate): void {
    setJourneyTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        levels: (prev.levels ?? []).map((l) => ({
          ...l,
          milestones: (l.milestones ?? []).map((m) => {
            if (m.id !== milestoneId) return m;
            const docs = m.document_templates ?? [];
            const idx = docs.findIndex((d) => d.id === doc.id);
            const next = idx === -1 ? [...docs, doc] : docs.map((d) => (d.id === doc.id ? doc : d));
            return { ...m, document_templates: next };
          }),
        })),
      };
    });
  }

  function upsertDocumentChild(parentId: string, milestoneId: string, doc: DocumentTemplate): void {
    setJourneyTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        levels: (prev.levels ?? []).map((l) => ({
          ...l,
          milestones: (l.milestones ?? []).map((m) => {
            if (m.id !== milestoneId) return m;
            return {
              ...m,
              document_templates: (m.document_templates ?? []).map((d) =>
                d.id === parentId
                  ? { ...d, children: upsertInList(d.children ?? [], doc) }
                  : d
              ),
            };
          }),
        })),
      };
    });
  }

  function removeLevel(levelId: string): void {
    setJourneyTemplate((prev) => (prev ? { ...prev, levels: (prev.levels ?? []).filter((l) => l.id !== levelId) } : prev));
  }

  function removeMilestone(milestoneId: string): void {
    setJourneyTemplate((prev) =>
      prev
        ? {
            ...prev,
            levels: (prev.levels ?? []).map((l) => ({
              ...l,
              milestones: (l.milestones ?? []).filter((m) => m.id !== milestoneId),
            })),
          }
        : prev
    );
  }

  function removeDocument(docId: string): void {
    const strip = (docs: DocumentTemplate[]): DocumentTemplate[] =>
      docs.filter((d) => d.id !== docId).map((d) => ({ ...d, children: d.children ? strip(d.children) : d.children }));
    setJourneyTemplate((prev) =>
      prev
        ? {
            ...prev,
            levels: (prev.levels ?? []).map((l) => ({
              ...l,
              milestones: (l.milestones ?? []).map((m) => ({
                ...m,
                document_templates: strip(m.document_templates ?? []),
              })),
            })),
          }
        : prev
    );
  }

  // Reorders one sibling group (identified by milestoneId + parentId) inside
  // the in-memory tree — optimistic, so the drop feels instant instead of
  // waiting on a reload(). Recurses through every document node looking for
  // the one whose children match parentId, since a sibling group can be
  // nested to any depth.
  function reorderDocSiblings(docs: DocumentTemplate[], parentId: string | null, orderedIds: string[]): DocumentTemplate[] {
    if (parentId === null) {
      const byId = new Map(docs.map((d) => [d.id, d]));
      return orderedIds.map((id, i) => ({ ...byId.get(id)!, sort_order: i }));
    }
    return docs.map((d) => {
      if (d.id === parentId) {
        const children = d.children ?? [];
        const byId = new Map(children.map((c) => [c.id, c]));
        return { ...d, children: orderedIds.map((id, i) => ({ ...byId.get(id)!, sort_order: i })) };
      }
      return { ...d, children: reorderDocSiblings(d.children ?? [], parentId, orderedIds) };
    });
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !journeyTemplate) return;

    const data = active.data.current as DocumentDragData | undefined;
    if (!data) return;

    const level = journeyTemplate.levels?.find((l) => l.milestones?.some((m) => m.id === data.milestoneId));
    const milestone = level?.milestones?.find((m) => m.id === data.milestoneId);
    if (!level || !milestone) return;

    const siblingDocs =
      data.parentId === null
        ? (milestone.document_templates ?? [])
        : findDocumentById(milestone.document_templates ?? [], data.parentId)?.children ?? [];
    const sortedSiblings = [...siblingDocs].sort((a, b) => a.sort_order - b.sort_order);
    const oldIndex = sortedSiblings.findIndex((d) => d.id === active.id);
    const newIndex = sortedSiblings.findIndex((d) => d.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const orderedIds = arrayMove(sortedSiblings, oldIndex, newIndex).map((d) => d.id);

    setJourneyTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        levels: (prev.levels ?? []).map((l) =>
          l.id !== level.id
            ? l
            : {
                ...l,
                milestones: (l.milestones ?? []).map((m) =>
                  m.id !== milestone.id
                    ? m
                    : { ...m, document_templates: reorderDocSiblings(m.document_templates ?? [], data.parentId, orderedIds) }
                ),
              }
        ),
      };
    });

    try {
      await Promise.all(
        orderedIds.map((id, index) => {
          const original = sortedSiblings.find((d) => d.id === id);
          return original && original.sort_order !== index ? updateDocumentTemplate(id, { sort_order: index }) : null;
        })
      );
      toast.success(t('journey_template.reorder_success'));
    } catch (err) {
      toast.error(getApiError(err).message);
      refresh();
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (pendingDelete.kind === 'level') {
        const levelId = pendingDelete.item.id;
        await deleteJourneyLevel(levelId);
        removeLevel(levelId);
      }
      if (pendingDelete.kind === 'milestone') {
        const milestoneId = pendingDelete.item.id;
        await deleteMilestone(milestoneId);
        removeMilestone(milestoneId);
      }
      if (pendingDelete.kind === 'document_template') {
        const docId = pendingDelete.item.id;
        await deleteDocumentTemplate(docId);
        removeDocument(docId);
      }
      toast.success(t('journey_template.delete_node_success'));
      setPendingDelete(null);
    } catch (err) {
      toast.error(getApiError(err).message);
      refresh();
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

      <DndContext sensors={dragSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {levels.map((level) => {
        const milestones = [...(level.milestones ?? [])].sort((a, b) => a.sort_order - b.sort_order);
        return (
          <Accordion
            key={level.id}
            defaultExpanded
            sx={{
              borderRadius: '8px !important',
              boxShadow: cardRestShadow,
              transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { boxShadow: cardHoverShadowNeutral },
              '&:before': { display: 'none' },
              // See JourneyTree.tsx for why: MUI's built-in Accordion default
              // zeroes margin on `&.Mui-expanded:last-of-type`, which can fire
              // unexpectedly depending on DOM structure — spacing comes from
              // `gap` on the wrapping flex container instead, not margin here.
              '&.Mui-expanded': { margin: 0 },
            }}
            disableGutters
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box className="flex items-center gap-2 w-full pr-2">
                <LevelMedal code={level.code} imageUrl={level.medal_image_url} />
                <Chip label={level.code} size="small" />
                <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>{level.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(`journey_template.pillar.${level.pillar}`)}
                </Typography>
                <IconButton
                  component="span"
                  role="button"
                  tabIndex={0}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditLevel(level);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      openEditLevel(level);
                    }
                  }}
                  aria-label={t('common.edit')}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  component="span"
                  role="button"
                  tabIndex={0}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete({ kind: 'level', item: level });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setPendingDelete({ kind: 'level', item: level });
                    }
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
                    <Box
                      className="flex items-center gap-2 pl-2"
                      sx={{
                        mx: -1,
                        px: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.default',
                        transition: 'background-color 0.1s ease',
                        '&:hover': { bgcolor: 'var(--2br-overlay-row-hover)' },
                      }}
                    >
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
                      <DocumentTemplateTree
                        documents={docs}
                        milestoneId={milestone.id}
                        parentId={null}
                        onAdd={(parentId) => openCreateSubDoc(milestone.id, parentId)}
                        onEdit={(doc) => openEditDoc(milestone.id, doc)}
                        onDelete={(doc) => setPendingDelete({ kind: 'document_template', item: doc })}
                      />
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
      </Box>
      </DndContext>

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
            <Box>
              <FieldLabel>{t('journey_template.medal_image')}</FieldLabel>
              {levelDialog?.editing ? (
                <Box className="flex items-center gap-3">
                  <LevelMedal code={levelDialog.editing.code} imageUrl={levelDialog.editing.medal_image_url} size={64} />
                  <Button size="small" variant="outlined" disabled={medalUploading} onClick={() => setMedalUploadOpen(true)}>
                    {t('journey_template.upload_medal')}
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('journey_template.medal_save_level_first')}
                </Typography>
              )}
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

      <UploadDropzone
        open={medalUploadOpen}
        onClose={() => setMedalUploadOpen(false)}
        onUpload={(file) => void handleMedalUpload(file)}
        title={t('journey_template.upload_medal')}
        accept=".png,.jpg,.jpeg,.webp"
        maxSizeMB={2}
      />

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
          <DialogTitle>
            {docDialog?.editing
              ? t('journey_template.edit_document_template')
              : docDialog?.parentDocumentId
                ? t('journey_template.add_sub_document')
                : t('journey_template.add_document_template')}
          </DialogTitle>
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
                <FieldLabel>{t('journey_template.recurrence_kind')}</FieldLabel>
                <FormSelect
                  fullWidth
                  value={docRecurrenceKind}
                  onChange={(e) => {
                    const kind = e.target.value as RecurrenceKind;
                    setDocRecurrenceKind(kind);
                    docForm.setValue('recurrence_type', kind, { shouldValidate: true });
                    if (!recurrenceKindNeedsMonths(kind)) {
                      docForm.setValue('expiry_months', undefined, { shouldValidate: true });
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
            {recurrenceKindNeedsMonths(docRecurrenceKind) && (
              <Box>
                <FieldLabel>{t('journey_template.expiry_custom_months')}</FieldLabel>
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
            )}
            {recurrenceKindIsPeriodic(docRecurrenceKind) && (
              <Box>
                <FieldLabel>{t('journey_template.effective_since_label')}</FieldLabel>
                <Controller
                  name="effective_since"
                  control={docForm.control}
                  render={({ field }) => (
                    <FormDatePicker
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      fullWidth
                      helperText={t('journey_template.effective_since_hint')}
                      error={!!docForm.formState.errors.effective_since}
                    />
                  )}
                />
              </Box>
            )}
            <Controller
              name="is_required"
              control={docForm.control}
              render={({ field }) => <FormSwitch checked={field.value} onChange={field.onChange} label={t('journey_template.is_required')} />}
            />
            <Controller
              name="client_can_add_subdocs"
              control={docForm.control}
              render={({ field }) => <FormSwitch checked={field.value} onChange={field.onChange} label={t('journey_template.client_can_add_subdocs')} />}
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
