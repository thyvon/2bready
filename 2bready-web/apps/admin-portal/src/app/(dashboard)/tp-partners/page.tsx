'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@2bready/ui-core';
import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';
import { useToast } from '@/components/feedback/ToastProvider';
import { listTpPartners, createTpPartner, updateTpPartner, deleteTpPartner, approveTpPartner } from '@/domains/tp-partner/api';
import type { TpPartner } from '@/domains/tp-partner/types';
import { tpPartnerFormSchema, tpPartnerFormDefaults, type TpPartnerFormInput } from '@/domains/tp-partner/schemas';
import { getApiError, formatCents } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function TpPartnersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();

  const [tpPartners, setTpPartners] = useState<TpPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TpPartner | null>(null);
  const [serverError, setServerError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<TpPartner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

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
    setEditing(null);
    reset(tpPartnerFormDefaults);
    setServerError('');
    setDialogOpen(true);
  };

  const openEdit = (partner: TpPartner) => {
    setEditing(partner);
    reset({
      name: partner.name,
      name_kh: partner.name_kh ?? '',
      price_l1: partner.price_l1_cents != null ? String(partner.price_l1_cents / 100) : '',
      price_l2: partner.price_l2_cents != null ? String(partner.price_l2_cents / 100) : '',
      price_l3: partner.price_l3_cents != null ? String(partner.price_l3_cents / 100) : '',
      price_l4: partner.price_l4_cents != null ? String(partner.price_l4_cents / 100) : '',
    });
    setServerError('');
    setDialogOpen(true);
  };

  const onSubmit = async (data: TpPartnerFormInput) => {
    setServerError('');
    try {
      const payload = {
        name: data.name,
        name_kh: data.name_kh || undefined,
        price_l1_cents: data.price_l1 ? Math.round(Number(data.price_l1) * 100) : undefined,
        price_l2_cents: data.price_l2 ? Math.round(Number(data.price_l2) * 100) : undefined,
        price_l3_cents: data.price_l3 ? Math.round(Number(data.price_l3) * 100) : undefined,
        price_l4_cents: data.price_l4 ? Math.round(Number(data.price_l4) * 100) : undefined,
      };

      if (editing) {
        await updateTpPartner(editing.id, payload);
      } else {
        await createTpPartner(payload);
      }

      toast.success(editing ? t('tp_partner.update_success') : t('tp_partner.create_success'));
      setDialogOpen(false);
      load();
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteTpPartner(pendingDelete.id);
      toast.success(t('tp_partner.delete_success'));
      setPendingDelete(null);
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleApprove = async (partner: TpPartner) => {
    setStatusUpdatingId(partner.id);
    try {
      await approveTpPartner(partner.id);
      toast.success(t('tp_partner.approve_success'));
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const toggleStatus = async (partner: TpPartner) => {
    setStatusUpdatingId(partner.id);
    try {
      await updateTpPartner(partner.id, { status: partner.status === 'active' ? 'suspended' : 'active' });
      toast.success(t('tp_partner.status_change_success'));
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const columns: Column<TpPartner>[] = [
    { key: 'name', label: t('tp_partner.name_col'), render: (p) => p.name },
    { key: 'price_l1_cents', label: 'L1', render: (p) => (p.price_l1_cents != null ? formatCents(p.price_l1_cents) : '—') },
    { key: 'price_l2_cents', label: 'L2', render: (p) => (p.price_l2_cents != null ? formatCents(p.price_l2_cents) : '—') },
    { key: 'price_l3_cents', label: 'L3', render: (p) => (p.price_l3_cents != null ? formatCents(p.price_l3_cents) : '—') },
    { key: 'price_l4_cents', label: 'L4', render: (p) => (p.price_l4_cents != null ? formatCents(p.price_l4_cents) : '—') },
    { key: 'status', label: t('common.status'), render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      align: 'right',
      render: (p) => (
        <Box className="flex items-center justify-end gap-1">
          {p.status === 'pending_approval' && (
            <Button size="small" variant="contained" loading={statusUpdatingId === p.id} onClick={(e) => { e.stopPropagation(); void handleApprove(p); }}>
              {t('tp_partner.approve')}
            </Button>
          )}
          {(p.status === 'active' || p.status === 'suspended') && (
            <Button
              size="small"
              variant="outlined"
              color={p.status === 'active' ? 'error' : 'success'}
              disabled={statusUpdatingId === p.id}
              onClick={(e) => {
                e.stopPropagation();
                void toggleStatus(p);
              }}
            >
              {p.status === 'active' ? t('tp_partner.suspend') : t('tp_partner.activate')}
            </Button>
          )}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(p);
            }}
            aria-label={t('common.edit')}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setPendingDelete(p);
            }}
            aria-label={t('common.delete')}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
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
          onRowClick={(p) => router.push(`/tp-partners/${p.id}`)}
          emptyTitle={t('tp_partner.no_partners')}
          emptyDescription={t('tp_partner.get_started')}
        />
      </SectionCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogTitle>{editing ? t('tp_partner.edit_partner') : t('tp_partner.new_partner')}</DialogTitle>
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
                <FieldLabel>{t('tp_partner.price_l1')}</FieldLabel>
                <FormTextField type="number" fullWidth slotProps={{ htmlInput: { step: '0.01', min: 0 } }} {...register('price_l1')} />
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

      <ConfirmDialog
        open={!!pendingDelete}
        title={t('tp_partner.confirm_delete_title')}
        description={pendingDelete ? t('tp_partner.confirm_delete', { name: pendingDelete.name }) : ''}
        confirmLabel={t('common.delete')}
        danger
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
