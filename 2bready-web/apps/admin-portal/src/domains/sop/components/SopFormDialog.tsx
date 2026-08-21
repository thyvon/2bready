'use client';

import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSopSchema, type CreateSopInput } from '../schemas';
import { useTranslation } from '@/lib/i18n';
import { getApiError } from '@/lib/utils';
import type { Sop } from '../types';
import { RichTextEditorField } from '@/components/forms/RichTextEditor';

// The form always submits the full field set (create and edit share the same
// shape); edit just appends the id. The partial update schema exists for other
// callers, but the dialog keeps one path.
export type SopFormValues = CreateSopInput & { id?: string };

interface SopFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SopFormValues) => Promise<void>;
  initialData?: Sop;
  title: string;
}

export function SopFormDialog({ open, onClose, onSubmit, initialData, title }: SopFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSopInput>({
    resolver: zodResolver(createSopSchema),
    defaultValues: {
      title: '',
      version: '1.0',
      content_en: '',
      content_kh: null,
      effective_at: null,
      is_active: false,
    },
  });

  const effectiveAt = useWatch({ control, name: 'effective_at' });
  const isActive = useWatch({ control, name: 'is_active' });
  const contentEn = useWatch({ control, name: 'content_en' });
  const contentKh = useWatch({ control, name: 'content_kh' });

  useEffect(() => {
    reset({
      title: initialData?.title ?? '',
      version: initialData?.version ?? '1.0',
      content_en: initialData?.content_en ?? '',
      content_kh: initialData?.content_kh ?? null,
      effective_at: initialData?.effective_at ?? null,
      is_active: initialData?.is_active ?? false,
    });
  }, [initialData, reset, open]);

  function handleClose() {
    setSubmitError(null);
    onClose();
  }

  async function handleSubmitForm(data: CreateSopInput) {
    setSubmitError(null);
    try {
      await onSubmit(isEdit ? { ...data, id: initialData!.id } : data);
    } catch (e) {
      setSubmitError(getApiError(e).message);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <form onSubmit={handleSubmit(handleSubmitForm)}>
        <DialogContent className="flex flex-col gap-4" sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          {submitError && (
            <Typography color="error" variant="body2">
              {submitError}
            </Typography>
          )}

          <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              fullWidth
              label={t('sop.title')}
              {...register('title')}
              error={!!errors.title}
              helperText={errors.title?.message}
            />

            <TextField
              fullWidth
              label={t('sop.version')}
              {...register('version')}
              error={!!errors.version}
              helperText={errors.version?.message}
            />
          </Box>

          <TextField
            fullWidth
            type="date"
            label={t('sop.effective_at')}
            value={effectiveAt ?? ''}
            onChange={(e) => setValue('effective_at', e.target.value || null)}
            slotProps={{ inputLabel: { shrink: true } }}
            helperText={t('sop.effective_at_hint')}
          />

          <RichTextEditorField
            label={t('sop.content_en')}
            value={contentEn ?? ''}
            onChange={(html) => setValue('content_en', html, { shouldValidate: true })}
            error={!!errors.content_en}
            helperText={errors.content_en?.message}
            placeholder={t('sop.content_en_placeholder')}
            minHeight={200}
          />

          <RichTextEditorField
            label={t('sop.content_kh')}
            value={contentKh ?? ''}
            onChange={(html) => setValue('content_kh', html || null, { shouldValidate: true })}
            error={!!errors.content_kh}
            helperText={errors.content_kh?.message}
            placeholder={t('sop.content_kh_placeholder')}
            minHeight={200}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={isActive || false}
                onChange={(e) => setValue('is_active', e.target.checked)}
              />
            }
            label={t('sop.is_active')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}