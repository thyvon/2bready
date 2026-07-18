'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import IconButton from '@mui/material/IconButton';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import RoleDetailsDialog from '@/domains/user/components/RoleDetailsDialog';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/feedback/ToastProvider';
import { listRoles } from '@/domains/user/api';
import type { Role } from '@/domains/user/types';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

// Read-only — the 6 roles are fixed, seeded server-side (RolePermissionSeeder),
// not editable here. This page exists purely so an admin can see what each
// role can actually do, not to manage it (see the "fixed roles" scope
// decision for Users/Roles).
export default function RolesPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Role | null>(null);

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff', 'finance'])) router.replace('/dashboard');
  }, [hasAnyRole, router]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const data = await listRoles();
        if (!cancelled) setRoles(data);
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

  const columns: Column<Role>[] = [
    { key: 'name', label: t('users.role_col') },
    { key: 'permissions', label: t('roles.permissions_label'), render: (r) => r.permissions.length },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <IconButton size="small" onClick={() => setSelected(r)} aria-label={t('common.view')}>
          <VisibilityOutlinedIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={t('roles.title')} />

      <SectionCard noPadding>
        <DataTable columns={columns} rows={roles} getRowId={(r) => r.name} loading={loading} onRowClick={(r) => setSelected(r)} />
      </SectionCard>

      <RoleDetailsDialog role={selected} onClose={() => setSelected(null)} />
    </>
  );
}
