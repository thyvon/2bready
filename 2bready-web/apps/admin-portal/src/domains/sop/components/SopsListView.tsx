'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddOutlined from '@mui/icons-material/AddOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';

import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/components/feedback/ToastProvider';
import { ConfirmDialog } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { getApiError, formatDate } from '@/lib/utils';
import { deleteSop, createSop, updateSop } from '../api';
import type { Sop } from '../types';
import { getSopStatus } from '../types';
import type { SopFormValues } from './SopFormDialog';
import { SopFormDialog } from './SopFormDialog';
import { SopAdoptDialog } from './SopAdoptDialog';
import { useSops } from '../hooks';

export function SopsListView() {
  const toast = useToast();
  const { t } = useTranslation();
  const router = useRouter();

  const { sops, loading, refetch } = useSops();

  const [createOpen, setCreateOpen] = useState(false);
  const [editSop, setEditSop] = useState<Sop | null>(null);
  const [adoptSop, setAdoptSop] = useState<Sop | null>(null);
  const [deleteSopCandidate, setDeleteSopCandidate] = useState<Sop | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  async function handleCreate(data: SopFormValues) {
    await createSop(data);
    setCreateOpen(false);
    toast.success(t('sop.created'));
    refresh();
  }

  async function handleUpdate(data: SopFormValues) {
    if (!data.id) return;
    await updateSop(data.id, data);
    setEditSop(null);
    toast.success(t('sop.updated'));
    refresh();
  }

  async function handleDelete() {
    if (!deleteSopCandidate) return;
    setDeleting(true);
    try {
      await deleteSop(deleteSopCandidate.id);
      toast.success(t('sop.deleted'));
      setDeleteSopCandidate(null);
      refresh();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Sop>[] = [
    { key: 'title', label: t('sop.title'), render: (s) => s.title },
    { key: 'version', label: t('sop.version'), render: (s) => s.version },
    {
      key: 'type',
      label: t('sop.type'),
      render: (s) => (
        <Chip
          label={s.is_global ? t('sop.type.global') : t('sop.type.company')}
          variant="outlined"
          size="small"
          color={s.is_global ? 'info' : 'primary'}
        />
      ),
    },
    {
      key: 'status',
      label: t('sop.status'),
      render: (s) => <StatusBadge status={getSopStatus(s)} />,
    },
    {
      key: 'effective_at',
      label: t('sop.effective_at'),
      render: (s) => (s.effective_at ? formatDate(s.effective_at) : t('sop.immediate')),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (s) => (
        <Box className="flex items-center justify-end gap-1">
          <Tooltip title={t('common.view')}>
            <IconButton size="small" onClick={() => router.push(`/sops/${s.id}`)}>
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          {!s.is_global && (
            <Tooltip title={t('common.edit')}>
              <IconButton size="small" onClick={() => setEditSop(s)}>
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {s.is_global && (
            <Tooltip title={t('sop.adopt')}>
              <IconButton size="small" onClick={() => setAdoptSop(s)}>
                <ContentCopyOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={s.is_global && (s.adoptions?.length ?? 0) > 0 ? t('sop.delete_locked') : t('common.delete')}>
            <span>
              <IconButton
                size="small"
                color="error"
                disabled={s.is_global && (s.adoptions?.length ?? 0) > 0}
                onClick={() => setDeleteSopCandidate(s)}
              >
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box className="flex flex-col gap-6">
      <Box className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography variant="h5" className="font-semibold">
            {t('sop.list_title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('sop.list_subtitle')}
          </Typography>
        </div>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setCreateOpen(true)}>
          {t('sop.create')}
        </Button>
      </Box>

      <SectionCard noPadding>
        <DataTable
          columns={columns}
          rows={sops}
          getRowId={(s) => s.id}
          loading={loading}
          emptyTitle={t('sop.empty')}
          emptyDescription={t('sop.empty_desc')}
        />
      </SectionCard>

      <SopFormDialog open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} title={t('sop.create')} />

      <SopFormDialog
        open={!!editSop}
        onClose={() => setEditSop(null)}
        onSubmit={handleUpdate}
        initialData={editSop || undefined}
        title={t('sop.edit_title')}
      />

      <SopAdoptDialog
        open={!!adoptSop}
        onClose={() => setAdoptSop(null)}
        sop={adoptSop}
        onAdopted={() => {
          setAdoptSop(null);
          toast.success(t('sop.adopted'));
          refresh();
        }}
      />

      <ConfirmDialog
        open={!!deleteSopCandidate}
        title={t('sop.delete_confirm_title')}
        description={t('sop.delete_confirm_desc', { title: deleteSopCandidate?.title ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteSopCandidate(null)}
      />
    </Box>
  );
}