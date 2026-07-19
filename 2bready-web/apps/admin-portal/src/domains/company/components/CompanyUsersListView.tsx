'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/EditOutlined';

import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import FieldLabel from '@/components/forms/FieldLabel';
import FormSelect from '@/components/forms/FormSelect';
import FormSwitch from '@/components/forms/FormSwitch';
import { useToast } from '@/components/feedback/ToastProvider';
import { listCompanyUsers, updateCompanyUser } from '@/domains/company/api';
import { companyRoleOf, type CompanyRole } from '@/domains/company/constants';
import type { User } from '@/domains/user/types';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

const COMPANY_ROLES: CompanyRole[] = ['company_owner', 'company_member'];

interface CompanyUsersListViewProps {
  companyId: string;
}

export default function CompanyUsersListView({ companyId }: CompanyUsersListViewProps) {
  const toast = useToast();
  const { t } = useTranslation();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<User | null>(null);
  const [status, setStatus] = useState<'active' | 'suspended' | 'inactive'>('active');
  const [role, setRole] = useState<CompanyRole>('company_member');
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState<boolean | null>(null);
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

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

  const openEdit = (user: User) => {
    setEditing(user);
    setStatus((user.status ?? 'active') as typeof status);
    setRole(companyRoleOf(user));
    setGoogleAuthEnabled(user.google_auth_enabled);
    setTwoFactorRequired(user.two_factor_required);
    setServerError('');
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setServerError('');
    try {
      const updated = await updateCompanyUser(companyId, editing.id, {
        status,
        role,
        google_auth_enabled: googleAuthEnabled,
        two_factor_required: twoFactorRequired,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(t('company_users.update_success'));
      setEditing(null);
    } catch (err) {
      setServerError(getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

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
        <IconButton size="small" onClick={() => openEdit(u)} aria-label={t('common.edit')}>
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

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing?.name}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {serverError && <Alert severity="error" sx={{ py: 0.5 }}>{serverError}</Alert>}
          <Box>
            <FieldLabel>{t('users.role_col')}</FieldLabel>
            <FormSelect fullWidth value={role} onChange={(e) => setRole(e.target.value as CompanyRole)}>
              {COMPANY_ROLES.map((r) => (
                <MenuItem key={r} value={r}>{t(`company_users.role_${r}`)}</MenuItem>
              ))}
            </FormSelect>
          </Box>
          <Box>
            <FieldLabel>{t('common.status')}</FieldLabel>
            <FormSelect fullWidth value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <MenuItem value="active">{t('common.active')}</MenuItem>
              <MenuItem value="suspended">{t('common.suspended')}</MenuItem>
              <MenuItem value="inactive">{t('common.inactive')}</MenuItem>
            </FormSelect>
          </Box>
          <FormSwitch checked={googleAuthEnabled} onChange={setGoogleAuthEnabled} label={t('users.allow_google_auth')} />
          <Box>
            <FieldLabel>{t('users.two_factor_requirement')}</FieldLabel>
            <FormSelect
              fullWidth
              value={twoFactorRequired === null ? 'default' : String(twoFactorRequired)}
              onChange={(e) => {
                const v = e.target.value;
                setTwoFactorRequired(v === 'default' ? null : v === 'true');
              }}
            >
              <MenuItem value="default">{t('users.two_factor_default')}</MenuItem>
              <MenuItem value="true">{t('users.two_factor_forced_on')}</MenuItem>
              <MenuItem value="false">{t('users.two_factor_exempt')}</MenuItem>
            </FormSelect>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="text" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" loading={saving} onClick={handleSave}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
