'use client';

import { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/EditOutlined';

import SectionCard from '@/components/ui/SectionCard';
import { DataTable, type Column } from '@2bready/ui-core';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/components/feedback/ToastProvider';
import CompanyUserEditDialog from '@/domains/company/components/CompanyUserEditDialog';
import { listCompanyUsers } from '@/domains/company/api';
import { companyRoleOf } from '@/domains/company/constants';
import type { User } from '@/domains/user/types';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface CompanyUsersListViewProps {
  companyId: string;
}

export default function CompanyUsersListView({ companyId }: CompanyUsersListViewProps) {
  const toast = useToast();
  const { t } = useTranslation();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const data = await listCompanyUsers(companyId);
        if (!cancelled) setUsers(data);
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
  }, [companyId]);

  const columns: Column<User>[] = [
    { key: 'name', label: t('users.name_col') },
    { key: 'email', label: t('users.email_col') },
    { key: 'role', label: t('users.role_col'), render: (u) => t(`company_users.role_${companyRoleOf(u)}`) },
    { key: 'status', label: t('common.status'), render: (u) => <StatusBadge status={u.status ?? 'active'} /> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (u) => (
        <IconButton size="small" onClick={() => setEditing(u)} aria-label={t('common.edit')}>
          <EditIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <>
      <SectionCard noPadding>
        <DataTable
          columns={columns}
          rows={users}
          getRowId={(u) => u.id}
          loading={loading}
          emptyTitle={t('company_users.no_users')}
          emptyDescription={t('company_users.no_users_desc')}
        />
      </SectionCard>

      <CompanyUserEditDialog
        companyId={companyId}
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={(updated) => {
          setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
          setEditing(null);
        }}
      />
    </>
  );
}
