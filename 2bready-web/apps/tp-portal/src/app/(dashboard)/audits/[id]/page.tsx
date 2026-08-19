'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';
import { ConfirmDialog } from '@2bready/ui-core';
import { getAudit, submitAudit } from '@/domains/audit/api';
import type { Audit } from '@/domains/audit/types';
import { submitAuditSchema, submitAuditDefaults, type SubmitAuditFormInput } from '@/domains/audit/schemas';
import { useToast } from '@/components/feedback/ToastProvider';
import { getApiError, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box className="flex items-start gap-3">
      <Box sx={{ color: 'text.secondary', mt: '2px' }}>{icon}</Box>
      <Box className="min-w-0">
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
      </Box>
    </Box>
  );
}

export default function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: auditId } = use(params);
  const { t } = useTranslation();
  const toast = useToast();

  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubmitAuditFormInput>({
    resolver: zodResolver(submitAuditSchema),
    defaultValues: submitAuditDefaults,
  });

  // Silent in-place refetch after submit — updates the audit without
  // flipping `loading`, so the page stays put. The mount effect below is
  // the only loader.
  const load = useCallback(async () => {
    try {
      const data = await getAudit(auditId);
      setAudit(data);
    } catch (err) {
      setLoadError(getApiError(err).message);
    }
  }, [auditId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const data = await getAudit(auditId);
        if (!cancelled) setAudit(data);
      } catch (err) {
        if (!cancelled) setLoadError(getApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [auditId]);

  const onConfirmSubmit = async (data: SubmitAuditFormInput) => {
    try {
      await submitAudit(auditId, { score: Number(data.score), feedback: data.feedback || null });
      toast.success(t('tp.audit_submit_success'));
      setConfirmSubmit(false);
      reset(submitAuditDefaults);
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  if (loading) {
    return <Box className="flex justify-center py-16"><CircularProgress /></Box>;
  }

  if (loadError || !audit) {
    return (
      <>
        <PageHeader title={t('tp.audit_detail_title')} />
        <Alert severity="error">{loadError || t('tp.audit_not_found')}</Alert>
      </>
    );
  }

  const canSubmit = audit.status === 'in_progress' && audit.auditor_id !== null;

  return (
    <>
      <PageHeader
        title={audit.company?.name ?? audit.company_id}
        action={<StatusBadge status={audit.status} />}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <SectionCard title={t('tp.audit_details')}>
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <DetailField icon={<BusinessOutlinedIcon fontSize="small" />} label={t('tp.company_name_col')} value={audit.company?.name ?? audit.company_id} />
            <DetailField icon={<HandshakeOutlinedIcon fontSize="small" />} label={t('tp.audit_firm_col')} value={audit.tp_partner?.name ?? '—'} />
            <DetailField icon={<PersonOutlineOutlinedIcon fontSize="small" />} label={t('tp.audit_auditor_col')} value={audit.auditor?.name ?? '—'} />
            <DetailField icon={<CategoryOutlinedIcon fontSize="small" />} label={t('tp.audit_level_col')} value={audit.journey_level} />
            <DetailField icon={<CalendarTodayOutlinedIcon fontSize="small" />} label={t('tp.audit_submitted_col')} value={audit.submitted_at ? formatDate(audit.submitted_at) : '—'} />
            <DetailField icon={<CalendarTodayOutlinedIcon fontSize="small" />} label={t('tp.audit_deadline_col')} value={audit.deadline ? formatDate(audit.deadline) : '—'} />
          </Box>
        </SectionCard>

        {canSubmit && (
          <SectionCard title={t('tp.audit_submit_title')}>
            <Box component="form" onSubmit={handleSubmit(() => setConfirmSubmit(true))} noValidate className="flex flex-col gap-5">
              <Box>
                <FieldLabel>{t('tp.audit_score_label')}</FieldLabel>
                <FormTextField
                  type="number"
                  slotProps={{ htmlInput: { min: 0, max: 100, step: 1 } }}
                  fullWidth
                  error={!!errors.score}
                  helperText={errors.score?.message}
                  {...register('score')}
                />
              </Box>
              <Box>
                <FieldLabel>{t('tp.audit_feedback_label')}</FieldLabel>
                <FormTextField
                  multiline
                  minRows={4}
                  fullWidth
                  error={!!errors.feedback}
                  helperText={errors.feedback?.message}
                  placeholder={t('tp.audit_feedback_placeholder')}
                  {...register('feedback')}
                />
              </Box>
              <Box>
                <Button type="submit" variant="contained" loading={isSubmitting}>
                  {t('tp.audit_submit')}
                </Button>
              </Box>
            </Box>
          </SectionCard>
        )}

        <SectionCard title={t('tp.audit_feedback')}>
          {audit.feedback ? (
            <Typography variant="body2">{audit.feedback}</Typography>
          ) : (
            <EmptyState
              title={t('tp.audit_no_feedback')}
              description={t('tp.audit_no_feedback_desc')}
              icon={<PersonOutlineOutlinedIcon fontSize="inherit" />}
            />
          )}
        </SectionCard>
      </Box>

      <ConfirmDialog
        open={confirmSubmit}
        title={t('tp.confirm_audit_submit_title')}
        description={t('tp.confirm_audit_submit')}
        confirmLabel={t('tp.audit_submit')}
        loading={isSubmitting}
        onCancel={() => setConfirmSubmit(false)}
        onConfirm={handleSubmit(onConfirmSubmit) as unknown as () => void}
      />
    </>
  );
}