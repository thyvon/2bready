'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ScoreOutlinedIcon from '@mui/icons-material/ScoreOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import StatusBadge from '@/components/ui/StatusBadge';
import FieldLabel from '@/components/forms/FieldLabel';
import FormSelect from '@/components/forms/FormSelect';
import EmptyState from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@2bready/ui-core';
import { useToast } from '@/components/feedback/ToastProvider';
import { getAudit, assignAuditor, reviewAudit, cancelAudit } from '@/domains/audit/api';
import type { Audit } from '@/domains/audit/types';
import { listAuditors } from '@/domains/tp-partner/api';
import type { AuditorUser } from '@/domains/audit/types';
import { getApiError, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

const assignFormSchema = z.object({
  auditor_id: z.string().min(1, 'Auditor is required'),
});
type AssignFormInput = z.infer<typeof assignFormSchema>;

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
  const [auditors, setAuditors] = useState<AuditorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [serverError, setServerError] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<'approved' | 'rejected' | null>(null);
  const [pendingCancel, setPendingCancel] = useState(false);

  // Silent in-place refetch after assign/review/cancel — updates the audit
  // detail and auditor dropdown without flipping `loading`, so the page
  // never unmounts into a spinner or loses scroll. The mount effect below
  // is the only loader.
  const load = useCallback(async () => {
    try {
      const data = await getAudit(auditId);
      setAudit(data);
      if (data.tp_partner?.id) {
        try {
          setAuditors(await listAuditors(data.tp_partner.id));
        } catch {
          setAuditors([]);
        }
      } else {
        setAuditors([]);
      }
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  }, [auditId, toast]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const data = await getAudit(auditId);
        if (!cancelled) {
          setAudit(data);
          if (data.tp_partner?.id) {
            try {
              const staff = await listAuditors(data.tp_partner.id);
              if (!cancelled) setAuditors(staff);
            } catch {
              if (!cancelled) setAuditors([]);
            }
          } else if (!cancelled) {
            setAuditors([]);
          }
        }
      } catch (err) {
        if (!cancelled) toast.error(getApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditId]);

  const assignForm = useForm<AssignFormInput>({
    resolver: zodResolver(assignFormSchema),
    defaultValues: { auditor_id: '' },
  });

  const onAssign = async (data: AssignFormInput) => {
    setServerError('');
    try {
      await assignAuditor(auditId, data.auditor_id);
      toast.success(t('audit.assign_success'));
      setAssignOpen(false);
      assignForm.reset();
      load();
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const handleReview = async (decision: 'approved' | 'rejected') => {
    setActingOn(decision);
    try {
      await reviewAudit(auditId, { decision });
      toast.success(t(decision === 'approved' ? 'audit.approve_success' : 'audit.reject_success'));
      setPendingDecision(null);
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActingOn(null);
    }
  };

  const handleCancel = async () => {
    setActingOn('cancel');
    try {
      await cancelAudit(auditId);
      toast.success(t('audit.cancel_success'));
      setPendingCancel(false);
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActingOn(null);
    }
  };

  if (loading || !audit) {
    return <Box className="flex justify-center py-16"><CircularProgress /></Box>;
  }

  const status = audit.status;
  const canAssign = status === 'pending';
  const canCancel = status === 'pending' || status === 'in_progress';
  const canReview = status === 'submitted';

  return (
    <>
      <PageHeader
        title={audit.company?.name ?? audit.company_id}
        action={
          <Box className="flex items-center gap-2">
            <StatusBadge status={audit.status} />
            {canAssign && (
              <Button size="small" variant="contained" onClick={() => { assignForm.reset(); setServerError(''); setAssignOpen(true); }}>
                {t('audit.assign')}
              </Button>
            )}
            {canReview && (
              <>
                <Button size="small" variant="outlined" color="error" disabled={actingOn !== null} onClick={() => setPendingDecision('rejected')}>
                  {t('audit.reject')}
                </Button>
                <Button size="small" variant="contained" loading={actingOn === 'approved'} onClick={() => setPendingDecision('approved')}>
                  {t('audit.approve')}
                </Button>
              </>
            )}
            {canCancel && (
              <Button size="small" variant="outlined" color="error" disabled={actingOn !== null} onClick={() => setPendingCancel(true)}>
                {t('audit.cancel')}
              </Button>
            )}
          </Box>
        }
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <SectionCard title={t('audit.details')}>
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <DetailField icon={<BusinessOutlinedIcon fontSize="small" />} label={t('admin.company_col')} value={audit.company?.name ?? audit.company_id} />
            <DetailField icon={<HandshakeOutlinedIcon fontSize="small" />} label={t('audit.firm_col')} value={audit.tp_partner?.name ?? '—'} />
            <DetailField icon={<PersonOutlineOutlinedIcon fontSize="small" />} label={t('audit.auditor_col')} value={audit.auditor?.name ?? t('audit.unassigned')} />
            <DetailField icon={<CategoryOutlinedIcon fontSize="small" />} label={t('audit.level_col')} value={audit.journey_level} />
            <DetailField icon={<ScoreOutlinedIcon fontSize="small" />} label={t('audit.score_col')} value={audit.score != null ? `${audit.score}%` : '—'} />
            <DetailField icon={<CalendarTodayOutlinedIcon fontSize="small" />} label={t('audit.submitted_col')} value={audit.submitted_at ? formatDate(audit.submitted_at) : '—'} />
            <DetailField icon={<CalendarTodayOutlinedIcon fontSize="small" />} label={t('audit.reviewed_col')} value={audit.reviewed_at ? formatDate(audit.reviewed_at) : '—'} />
            <DetailField icon={<CalendarTodayOutlinedIcon fontSize="small" />} label={t('audit.deadline_col')} value={audit.deadline ? formatDate(audit.deadline) : '—'} />
          </Box>
        </SectionCard>

        <SectionCard title={t('audit.feedback')}>
          {audit.feedback ? (
            <Typography variant="body2">{audit.feedback}</Typography>
          ) : (
            <EmptyState
              title={t('audit.no_feedback')}
              description={t('audit.no_feedback_desc')}
              icon={<FeedbackOutlinedIcon fontSize="inherit" />}
            />
          )}
        </SectionCard>
      </Box>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={assignForm.handleSubmit(onAssign)} noValidate>
          <DialogTitle>{t('audit.assign_title')}</DialogTitle>
          <DialogContent className="flex flex-col gap-5" sx={{ pt: '8px !important' }}>
            {serverError && <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>{serverError}</Box>}
            <Box>
              <FieldLabel>{t('audit.auditor_col')}</FieldLabel>
              <Controller
                name="auditor_id"
                control={assignForm.control}
                render={({ field }) => (
                  <FormSelect {...field} fullWidth error={!!assignForm.formState.errors.auditor_id} helperText={assignForm.formState.errors.auditor_id?.message}>
                    <MenuItem value="">{t('audit.select_auditor')}</MenuItem>
                    {auditors.filter((u) => u.auditor_id != null).map((u) => (
                      <MenuItem key={u.id} value={u.auditor_id as string}>{u.name}</MenuItem>
                    ))}
                  </FormSelect>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="text" onClick={() => setAssignOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" startIcon={<AssignmentOutlinedIcon fontSize="small" />} loading={assignForm.formState.isSubmitting}>
              {t('audit.assign')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={pendingDecision !== null}
        title={t(pendingDecision === 'approved' ? 'audit.confirm_approve_title' : 'audit.confirm_reject_title')}
        description={t(pendingDecision === 'approved' ? 'audit.confirm_approve' : 'audit.confirm_reject')}
        confirmLabel={t(pendingDecision === 'approved' ? 'audit.approve' : 'audit.reject')}
        danger={pendingDecision === 'rejected'}
        loading={actingOn === pendingDecision}
        onCancel={() => setPendingDecision(null)}
        onConfirm={() => pendingDecision && handleReview(pendingDecision)}
      />

      <ConfirmDialog
        open={pendingCancel}
        title={t('audit.confirm_cancel_title')}
        description={t('audit.confirm_cancel')}
        confirmLabel={t('audit.cancel')}
        danger
        loading={actingOn === 'cancel'}
        onCancel={() => setPendingCancel(false)}
        onConfirm={handleCancel}
      />
    </>
  );
}