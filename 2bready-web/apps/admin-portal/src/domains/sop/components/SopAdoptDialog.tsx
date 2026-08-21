'use client';

import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adoptSopSchema, type AdoptSopInput } from '../schemas';
import { useTranslation } from '@/lib/i18n';
import { getApiError } from '@/lib/utils';
import { adoptSop } from '../api';
import type { Sop } from '../types';
import { RichTextEditorField } from '@/components/forms/RichTextEditor';

interface SopAdoptDialogProps {
  open: boolean;
  onClose: () => void;
  onAdopted: () => void;
  sop: Sop | null;
}

export function SopAdoptDialog({ open, onClose, onAdopted, sop }: SopAdoptDialogProps) {
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    control,
  } = useForm<AdoptSopInput>({
    resolver: zodResolver(adoptSopSchema),
    defaultValues: {
      override_content_en: '',
      override_content_kh: '',
    },
  });

  const overrideEn = useWatch({ control, name: 'override_content_en' });
  const overrideKh = useWatch({ control, name: 'override_content_kh' });

  useEffect(() => {
    reset({ override_content_en: '', override_content_kh: '' });
  }, [reset, open, sop?.id]);

  function handleClose() {
    setSubmitError(null);
    onClose();
  }

  async function handleSubmitForm(data: AdoptSopInput) {
    if (!sop) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await adoptSop(sop.id, {
        override_content_en: data.override_content_en || undefined,
        override_content_kh: data.override_content_kh || undefined,
      });
      onAdopted();
    } catch (e) {
      setSubmitError(getApiError(e).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('sop.adopt_title', { title: sop?.title ?? '' })}</DialogTitle>
      <form onSubmit={handleSubmit(handleSubmitForm)}>
        <DialogContent className="flex flex-col gap-4" sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          {submitError && (
            <Typography color="error" variant="body2">
              {submitError}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            {t('sop.adopt_desc', { title: sop?.title ?? '' })}
          </Typography>

          <Box className="flex flex-col gap-4">
            <Typography variant="body2" color="text.secondary">
              {t('sop.override_note')}
            </Typography>

            <RichTextEditorField
              label={t('sop.content_en')}
              value={overrideEn ?? ''}
              onChange={(html) => setValue('override_content_en', html)}
              error={!!errors.override_content_en}
              helperText={errors.override_content_en?.message}
              placeholder={t('sop.content_en_placeholder')}
              minHeight={180}
            />

            <RichTextEditorField
              label={t('sop.content_kh')}
              value={overrideKh ?? ''}
              onChange={(html) => setValue('override_content_kh', html || null)}
              error={!!errors.override_content_kh}
              helperText={errors.override_content_kh?.message}
              placeholder={t('sop.content_kh_placeholder')}
              minHeight={180}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? t('common.saving') : t('sop.adopt')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}