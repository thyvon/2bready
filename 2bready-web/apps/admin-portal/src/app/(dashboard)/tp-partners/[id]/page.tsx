'use client';

import { use, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';
import FormSelect from '@/components/forms/FormSelect';
import { useToast } from '@/components/feedback/ToastProvider';
import { getTpPartner, listAuditors, registerAuditor } from '@/domains/tp-partner/api';
import type { TpPartner, User as AuditorUser } from '@/domains/tp-partner/types';
import { registerAuditorFormSchema, type RegisterAuditorFormInput } from '@/domains/tp-partner/schemas';
import { listTpHires, createTpHire, markTpHirePaidOut } from '@/domains/marketplace/api';
import type { TpHire } from '@/domains/marketplace/types';
import { listCompanies } from '@/domains/company/api';
import type { Company } from '@/domains/company/types';
import { getApiError, formatCents, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

const hireFormSchema = z.object({
  company_id: z.string().min(1, 'Company is required'),
  journey_level: z.enum(['L2', 'L3', 'L4']),
  method: z.enum(['manual_bank_transfer', 'stripe']),
});
type HireFormInput = z.infer<typeof hireFormSchema>;

export default function TpPartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tpPartnerId } = use(params);
  const { t } = useTranslation();
  const toast = useToast();

  const [tpPartner, setTpPartner] = useState<TpPartner | null>(null);
  const [auditors, setAuditors] = useState<AuditorUser[]>([]);
  const [hires, setHires] = useState<TpHire[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [serverError, setServerError] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [partner, staff, hireList, { companies: companyList }] = await Promise.all([
        getTpPartner(tpPartnerId),
        listAuditors(tpPartnerId),
        listTpHires(tpPartnerId),
        listCompanies(),
      ]);
      setTpPartner(partner);
      setAuditors(staff);
      setHires(hireList);
      setCompanies(companyList);
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const [partner, staff, hireList, { companies: companyList }] = await Promise.all([
          getTpPartner(tpPartnerId),
          listAuditors(tpPartnerId),
          listTpHires(tpPartnerId),
          listCompanies(),
        ]);
        if (!cancelled) {
          setTpPartner(partner);
          setAuditors(staff);
          setHires(hireList);
          setCompanies(companyList);
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
  }, [tpPartnerId]);

  const staffForm = useForm<RegisterAuditorFormInput>({ resolver: zodResolver(registerAuditorFormSchema) });
  const hireForm = useForm<HireFormInput>({
    resolver: zodResolver(hireFormSchema),
    defaultValues: { company_id: '', journey_level: 'L3', method: 'manual_bank_transfer' },
  });

  const onRegisterStaff = async (data: RegisterAuditorFormInput) => {
    setServerError('');
    try {
      await registerAuditor(tpPartnerId, data);
      toast.success(t('tp_partner.staff_create_success'));
      setStaffDialogOpen(false);
      staffForm.reset();
      load();
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const onCreateHire = async (data: HireFormInput) => {
    setServerError('');
    try {
      await createTpHire({ ...data, tp_partner_id: tpPartnerId });
      toast.success(t('tp_partner.hire_create_success'));
      setHireDialogOpen(false);
      hireForm.reset();
      load();
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const handleMarkPaidOut = async (hire: TpHire) => {
    setActingOn(hire.id);
    try {
      await markTpHirePaidOut(hire.id);
      toast.success(t('tp_partner.mark_paid_out_success'));
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActingOn(null);
    }
  };

  const staffColumns: Column<AuditorUser>[] = [
    { key: 'name', label: t('tp_partner.staff_name'), render: (u) => u.name },
    { key: 'email', label: t('tp_partner.staff_email'), render: (u) => u.email },
    { key: 'status', label: t('common.status'), render: (u) => <StatusBadge status={u.status} /> },
  ];

  const hireColumns: Column<TpHire>[] = [
    { key: 'company', label: t('tp_partner.hire_company'), render: (h) => h.company?.name ?? h.company_id },
    { key: 'journey_level', label: t('tp_partner.hire_level'), render: (h) => h.journey_level },
    { key: 'price_agreed_cents', label: t('tp_partner.hire_price_col'), render: (h) => formatCents(h.price_agreed_cents) },
    { key: 'status', label: t('common.status'), render: (h) => <StatusBadge status={h.status} /> },
    { key: 'payout_status', label: t('tp_partner.hire_payout_col'), render: (h) => <StatusBadge status={h.payout_status === 'paid_out' ? 'paid' : 'pending'} /> },
    { key: 'hired_at', label: t('admin.submitted_col'), render: (h) => (h.hired_at ? formatDate(h.hired_at) : '—') },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (h) =>
        h.status === 'completed' && h.payout_status === 'unpaid' ? (
          <Button size="small" variant="outlined" loading={actingOn === h.id} onClick={() => handleMarkPaidOut(h)}>
            {t('tp_partner.mark_paid_out')}
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader title={tpPartner?.name ?? t('common.loading')} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <SectionCard
          title={t('tp_partner.staff_title')}
          action={
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => { staffForm.reset(); setServerError(''); setStaffDialogOpen(true); }}>
              {t('tp_partner.new_staff')}
            </Button>
          }
          noPadding
        >
          <DataTable
            columns={staffColumns}
            rows={auditors}
            getRowId={(u) => u.id}
            loading={loading}
            emptyTitle={t('tp_partner.no_staff')}
            emptyDescription={t('tp_partner.no_staff_desc')}
          />
        </SectionCard>

        <SectionCard
          title={t('tp_partner.hires_title')}
          action={
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => { hireForm.reset(); setServerError(''); setHireDialogOpen(true); }}>
              {t('tp_partner.new_hire')}
            </Button>
          }
          noPadding
        >
          <DataTable
            columns={hireColumns}
            rows={hires}
            getRowId={(h) => h.id}
            loading={loading}
            emptyTitle={t('tp_partner.no_hires')}
            emptyDescription={t('tp_partner.no_hires_desc')}
          />
        </SectionCard>
      </Box>

      <Dialog open={staffDialogOpen} onClose={() => setStaffDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={staffForm.handleSubmit(onRegisterStaff)} noValidate>
          <DialogTitle>{t('tp_partner.new_staff')}</DialogTitle>
          <DialogContent className="flex flex-col gap-5" sx={{ pt: '8px !important' }}>
            {serverError && <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>{serverError}</Box>}
            <Box>
              <FieldLabel>{t('tp_partner.staff_name')}</FieldLabel>
              <FormTextField fullWidth autoFocus error={!!staffForm.formState.errors.name} helperText={staffForm.formState.errors.name?.message} {...staffForm.register('name')} />
            </Box>
            <Box>
              <FieldLabel>{t('tp_partner.staff_email')}</FieldLabel>
              <FormTextField type="email" fullWidth error={!!staffForm.formState.errors.email} helperText={staffForm.formState.errors.email?.message} {...staffForm.register('email')} />
            </Box>
            <Box>
              <FieldLabel>{t('tp_partner.staff_password')}</FieldLabel>
              <FormTextField type="password" fullWidth error={!!staffForm.formState.errors.password} helperText={staffForm.formState.errors.password?.message} {...staffForm.register('password')} />
            </Box>
            <Box>
              <FieldLabel>{t('tp_partner.staff_confirm_password')}</FieldLabel>
              <FormTextField type="password" fullWidth error={!!staffForm.formState.errors.password_confirmation} helperText={staffForm.formState.errors.password_confirmation?.message} {...staffForm.register('password_confirmation')} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="text" onClick={() => setStaffDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" loading={staffForm.formState.isSubmitting}>{t('common.save')}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={hireDialogOpen} onClose={() => setHireDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={hireForm.handleSubmit(onCreateHire)} noValidate>
          <DialogTitle>{t('tp_partner.new_hire')}</DialogTitle>
          <DialogContent className="flex flex-col gap-5" sx={{ pt: '8px !important' }}>
            {serverError && <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>{serverError}</Box>}
            <Box>
              <FieldLabel>{t('tp_partner.hire_company')}</FieldLabel>
              <Controller
                name="company_id"
                control={hireForm.control}
                render={({ field }) => (
                  <FormSelect {...field} fullWidth error={!!hireForm.formState.errors.company_id} helperText={hireForm.formState.errors.company_id?.message}>
                    {companies.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </FormSelect>
                )}
              />
            </Box>
            <Box>
              <FieldLabel>{t('tp_partner.hire_level')}</FieldLabel>
              <Controller
                name="journey_level"
                control={hireForm.control}
                render={({ field }) => (
                  <FormSelect {...field} fullWidth>
                    <MenuItem value="L2">L2 {tpPartner?.price_l2_cents != null ? `(${formatCents(tpPartner.price_l2_cents)})` : ''}</MenuItem>
                    <MenuItem value="L3">L3 {tpPartner?.price_l3_cents != null ? `(${formatCents(tpPartner.price_l3_cents)})` : ''}</MenuItem>
                    <MenuItem value="L4">L4 {tpPartner?.price_l4_cents != null ? `(${formatCents(tpPartner.price_l4_cents)})` : ''}</MenuItem>
                  </FormSelect>
                )}
              />
            </Box>
            <Box>
              <FieldLabel>{t('tp_partner.hire_method')}</FieldLabel>
              <Controller
                name="method"
                control={hireForm.control}
                render={({ field }) => (
                  <FormSelect {...field} fullWidth>
                    <MenuItem value="manual_bank_transfer">{t('tp_partner.hire_method_bank_transfer')}</MenuItem>
                    <MenuItem value="stripe">{t('tp_partner.hire_method_stripe')}</MenuItem>
                  </FormSelect>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="text" onClick={() => setHireDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" loading={hireForm.formState.isSubmitting}>{t('common.save')}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
