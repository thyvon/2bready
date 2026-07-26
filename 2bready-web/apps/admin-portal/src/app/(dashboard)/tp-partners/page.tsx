'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AddIcon from '@mui/icons-material/Add';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';
import { useToast } from '@/components/feedback/ToastProvider';
import { listTpPartners, createTpPartner } from '@/domains/tp-partner/api';
import type { TpPartner } from '@/domains/tp-partner/types';
import { tpPartnerFormSchema, tpPartnerFormDefaults, type TpPartnerFormInput } from '@/domains/tp-partner/schemas';
import { getApiError, formatCents } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function TpPartnersPage() {
  const { t } = useTranslation();
  const toast = useToast();

  const [tpPartners, setTpPartners] = useState<TpPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [serverError, setServerError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setTpPartners(await listTpPartners());
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
        const data = await listTpPartners();
        if (!cancelled) setTpPartners(data);
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
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TpPartnerFormInput>({ resolver: zodResolver(tpPartnerFormSchema), defaultValues: tpPartnerFormDefaults });

  const openCreate = () => {
    reset(tpPartnerFormDefaults);
    setServerError('');
    setDialogOpen(true);
  };

  const onSubmit = async (data: TpPartnerFormInput) => {
    setServerError('');
    try {
      await createTpPartner({
        name: data.name,
        name_kh: data.name_kh || undefined,
        price_l2_cents: data.price_l2 ? Math.round(Number(data.price_l2) * 100) : undefined,
        price_l3_cents: data.price_l3 ? Math.round(Number(data.price_l3) * 100) : undefined,
        price_l4_cents: data.price_l4 ? Math.round(Number(data.price_l4) * 100) : undefined,
      });
      toast.success(t('tp_partner.create_success'));
      setDialogOpen(false);
      load();
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const columns: Column<TpPartner>[] = [
    { key: 'name', label: t('tp_partner.name_col'), render: (p) => <Link href={`/tp-partners/${p.id}`}>{p.name}</Link> },
    { key: 'price_l2_cents', label: 'L2', render: (p) => (p.price_l2_cents != null ? formatCents(p.price_l2_cents) : '—') },
    { key: 'price_l3_cents', label: 'L3', render: (p) => (p.price_l3_cents != null ? formatCents(p.price_l3_cents) : '—') },
    { key: 'price_l4_cents', label: 'L4', render: (p) => (p.price_l4_cents != null ? formatCents(p.price_l4_cents) : '—') },
    { key: 'status', label: t('common.status'), render: (p) => <StatusBadge status={p.status} /> },
  ];

  return (
    <>
      <PageHeader
        title={t('tp_partner.title')}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            {t('tp_partner.new_partner')}
          </Button>
        }
      />

      <SectionCard noPadding>
        <DataTable
          columns={columns}
          rows={tpPartners}
          getRowId={(p) => p.id}
          loading={loading}
          emptyTitle={t('tp_partner.no_partners')}
          emptyDescription={t('tp_partner.get_started')}
        />
      </SectionCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogTitle>{t('tp_partner.new_partner')}</DialogTitle>
          <DialogContent className="flex flex-col gap-5" sx={{ pt: '8px !important' }}>
            {serverError && <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>{serverError}</Box>}

            <Box>
              <FieldLabel>{t('tp_partner.name')}</FieldLabel>
              <FormTextField fullWidth autoFocus error={!!errors.name} helperText={errors.name?.message} {...register('name')} />
            </Box>

            <Box>
              <FieldLabel>{t('tp_partner.name_kh')}</FieldLabel>
              <FormTextField fullWidth error={!!errors.name_kh} helperText={errors.name_kh?.message} {...register('name_kh')} />
            </Box>

            <Box className="flex gap-4">
              <Box className="flex-1">
                <FieldLabel>{t('tp_partner.price_l2')}</FieldLabel>
                <FormTextField type="number" fullWidth slotProps={{ htmlInput: { step: '0.01', min: 0 } }} {...register('price_l2')} />
              </Box>
              <Box className="flex-1">
                <FieldLabel>{t('tp_partner.price_l3')}</FieldLabel>
                <FormTextField type="number" fullWidth slotProps={{ htmlInput: { step: '0.01', min: 0 } }} {...register('price_l3')} />
              </Box>
              <Box className="flex-1">
                <FieldLabel>{t('tp_partner.price_l4')}</FieldLabel>
                <FormTextField type="number" fullWidth slotProps={{ htmlInput: { step: '0.01', min: 0 } }} {...register('price_l4')} />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="text" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" loading={isSubmitting}>{t('common.save')}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
