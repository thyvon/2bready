'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import FilterListIcon from '@mui/icons-material/FilterListOutlined';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@2bready/ui-core';
import FieldLabel from '@/components/forms/FieldLabel';
import FormSelect from '@/components/forms/FormSelect';
import FormTextField from '@/components/forms/FormTextField';
import FormSwitch from '@/components/forms/FormSwitch';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/feedback/ToastProvider';
import { listUsers, createUser, updateUser } from '@/domains/user/api';
import { INTERNAL_ROLES, type User, type UserListFilters, type Pagination } from '@/domains/user/types';
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from '@/domains/user/schemas';
import { getApiError, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function UsersPage() {
  const router = useRouter();
  const { hasAnyRole, user: currentUser } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserListFilters>({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [serverError, setServerError] = useState('');
  // Set only when a submitted edit would newly grant the admin role (wasn't
  // already held) — holds the submission until the user explicitly confirms,
  // rather than letting a checkbox misclick silently grant full platform
  // access. Edits that don't touch admin membership skip this entirely.
  const [pendingAdminGrant, setPendingAdminGrant] = useState<UpdateUserInput | null>(null);
  // Same holding pattern, different danger: submitting two_factor_required=false
  // for an account that currently effectively requires 2FA (whether via the
  // role-derived default or a prior explicit override).
  const [pendingTwoFactorExempt, setPendingTwoFactorExempt] = useState<UpdateUserInput | null>(null);

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff', 'finance'])) router.replace('/dashboard');
  }, [hasAnyRole, router]);

  const updateFilters = (patch: Partial<UserListFilters>) => {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  };

  // Silent in-place refetch for after a create/edit — updates the table
  // without flipping `loading`, so no spinner flash or scroll jump.
  const refetch = useCallback(() => {
    void listUsers({ ...filters, page, per_page: perPage })
      .then(({ users: list, pagination: meta }) => {
        setUsers(list);
        setPagination(meta);
      })
      .catch((err) => toast.error(getApiError(err).message));
  }, [filters, page, perPage, toast]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const { users, pagination } = await listUsers({ ...filters, page, per_page: perPage });
        if (!cancelled) {
          setUsers(users);
          setPagination(pagination);
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
  }, [filters, page, perPage]);

  const createForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '', password_confirmation: '', roles: [] },
  });

  const editForm = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { name: '', status: 'active', roles: [], google_auth_enabled: false, two_factor_required: null },
  });

  const openCreate = () => {
    createForm.reset({ name: '', email: '', password: '', password_confirmation: '', roles: [] });
    setServerError('');
    setCreateOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    editForm.reset({
      name: u.name,
      status: (u.status ?? 'active') as UpdateUserInput['status'],
      roles: u.roles.filter((r): r is UpdateUserInput['roles'][number] => (INTERNAL_ROLES as readonly string[]).includes(r)),
      google_auth_enabled: u.google_auth_enabled,
      two_factor_required: u.two_factor_required,
    });
    setServerError('');
  };

  const onCreateSubmit = async (data: CreateUserInput) => {
    setServerError('');
    try {
      await createUser(data);
      toast.success(t('users.create_success'));
      setCreateOpen(false);
      refetch();
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const submitEdit = async (data: UpdateUserInput) => {
    if (!editing) return;
    setServerError('');
    try {
      await updateUser(editing.id, data);
      toast.success(t('users.update_success'));
      setEditing(null);
      setPendingAdminGrant(null);
      setPendingTwoFactorExempt(null);
      refetch();
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const onEditSubmit = async (data: UpdateUserInput) => {
    const grantingAdmin = !editing?.roles.includes('admin') && data.roles.includes('admin');
    if (grantingAdmin) {
      setPendingAdminGrant(data);
      return;
    }
    // editing.totp_required is the already-resolved effective value (role
    // default or a prior override) — this only needs to confirm the specific
    // transition into "explicitly exempt," not every save that happens to
    // touch the field.
    const exemptingFromTwoFactor = editing?.totp_required && data.two_factor_required === false;
    if (exemptingFromTwoFactor) {
      setPendingTwoFactorExempt(data);
      return;
    }
    await submitEdit(data);
  };

  const columns: Column<User>[] = [
    { key: 'name', label: t('users.name_col') },
    { key: 'email', label: t('users.email_col') },
    { key: 'roles', label: t('users.roles_col'), render: (u) => u.roles.join(', ') },
    { key: 'status', label: t('common.status'), render: (u) => <StatusBadge status={u.status ?? 'active'} /> },
    { key: 'created_at', label: t('users.created_col'), render: (u) => (u.created_at ? formatDate(u.created_at) : '—') },
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

  const roleCheckboxes = (control: typeof createForm.control | typeof editForm.control, name: 'roles') => (
    <Controller
      name={name}
      control={control as never}
      render={({ field }) => (
        <FormGroup row>
          {INTERNAL_ROLES.map((role) => (
            <FormControlLabel
              key={role}
              control={
                <Checkbox
                  checked={(field.value as string[]).includes(role)}
                  onChange={(e) => {
                    const current = field.value as string[];
                    field.onChange(e.target.checked ? [...current, role] : current.filter((r) => r !== role));
                  }}
                />
              }
              label={t(`users.role_${role}`)}
            />
          ))}
        </FormGroup>
      )}
    />
  );

  return (
    <>
      <PageHeader
        title={t('users.title')}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            {t('users.new_user')}
          </Button>
        }
      />

      <SectionCard noPadding>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, p: 2 }}>
          <FormTextField
            label={t('common.search')}
            size="small"
            value={filters.search ?? ''}
            onChange={(e) => updateFilters({ search: e.target.value || undefined })}
            sx={{ width: { xs: '100%', sm: 220 } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> } }}
          />
          <FormSelect
            label={t('users.role_col')}
            size="small"
            value={filters.role ?? ''}
            onChange={(e) => updateFilters({ role: e.target.value || undefined })}
            sx={{ width: { xs: '100%', sm: 160 } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><FilterListIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> } }}
          >
            <MenuItem value="">{t('common.all')}</MenuItem>
            {INTERNAL_ROLES.map((role) => (
              <MenuItem key={role} value={role}>{t(`users.role_${role}`)}</MenuItem>
            ))}
          </FormSelect>
          <FormSelect
            label={t('common.status')}
            size="small"
            value={filters.status ?? ''}
            onChange={(e) => updateFilters({ status: e.target.value || undefined })}
            sx={{ width: { xs: '100%', sm: 160 } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><FilterListIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> } }}
          >
            <MenuItem value="">{t('common.all')}</MenuItem>
            <MenuItem value="active">{t('common.active')}</MenuItem>
            <MenuItem value="suspended">{t('common.suspended')}</MenuItem>
            <MenuItem value="inactive">{t('common.inactive')}</MenuItem>
          </FormSelect>
        </Box>

        <DataTable
          columns={columns}
          rows={users}
          getRowId={(u) => u.id}
          loading={loading}
          emptyTitle={t('users.no_users')}
          emptyDescription={t('users.no_users_desc')}
          pagination={
            pagination
              ? {
                  page,
                  perPage,
                  total: pagination.total,
                  onPageChange: setPage,
                  onPerPageChange: (newPerPage) => {
                    setPage(1);
                    setPerPage(newPerPage);
                  },
                }
              : undefined
          }
        />
      </SectionCard>

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={createForm.handleSubmit(onCreateSubmit)} noValidate>
          <DialogTitle>{t('users.new_user')}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {serverError && <Alert severity="error" sx={{ py: 0.5 }}>{serverError}</Alert>}
            <Box>
              <FieldLabel>{t('users.name_col')}</FieldLabel>
              <FormTextField fullWidth {...createForm.register('name')} error={!!createForm.formState.errors.name} helperText={createForm.formState.errors.name?.message} />
            </Box>
            <Box>
              <FieldLabel>{t('users.email_col')}</FieldLabel>
              <FormTextField fullWidth type="email" {...createForm.register('email')} error={!!createForm.formState.errors.email} helperText={createForm.formState.errors.email?.message} />
            </Box>
            <Box>
              <FieldLabel>{t('users.password')}</FieldLabel>
              <FormTextField fullWidth type="password" {...createForm.register('password')} error={!!createForm.formState.errors.password} helperText={createForm.formState.errors.password?.message} />
            </Box>
            <Box>
              <FieldLabel>{t('users.confirm_password')}</FieldLabel>
              <FormTextField fullWidth type="password" {...createForm.register('password_confirmation')} error={!!createForm.formState.errors.password_confirmation} helperText={createForm.formState.errors.password_confirmation?.message} />
            </Box>
            <Box>
              <FieldLabel>{t('users.roles_col')}</FieldLabel>
              {roleCheckboxes(createForm.control, 'roles')}
              {createForm.formState.errors.roles && (
                <Alert severity="error" sx={{ py: 0.5, mt: 1 }}>{createForm.formState.errors.roles.message}</Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="text" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" loading={createForm.formState.isSubmitting}>{t('common.save')}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={editForm.handleSubmit(onEditSubmit)} noValidate>
          <DialogTitle>{t('common.edit')}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {serverError && <Alert severity="error" sx={{ py: 0.5 }}>{serverError}</Alert>}
            <Box>
              <FieldLabel>{t('users.name_col')}</FieldLabel>
              <FormTextField fullWidth {...editForm.register('name')} error={!!editForm.formState.errors.name} helperText={editForm.formState.errors.name?.message} />
            </Box>
            <Controller
              name="status"
              control={editForm.control}
              render={({ field }) => (
                <Box>
                  <FieldLabel>{t('common.status')}</FieldLabel>
                  <FormSelect
                    fullWidth
                    {...field}
                    disabled={editing?.id === currentUser?.id}
                    helperText={editing?.id === currentUser?.id ? t('users.cannot_change_own_status') : undefined}
                  >
                    <MenuItem value="active">{t('common.active')}</MenuItem>
                    <MenuItem value="suspended">{t('common.suspended')}</MenuItem>
                    <MenuItem value="inactive">{t('common.inactive')}</MenuItem>
                  </FormSelect>
                </Box>
              )}
            />
            <Box>
              <FieldLabel>{t('users.roles_col')}</FieldLabel>
              {roleCheckboxes(editForm.control, 'roles')}
              {editForm.formState.errors.roles && (
                <Alert severity="error" sx={{ py: 0.5, mt: 1 }}>{editForm.formState.errors.roles.message}</Alert>
              )}
            </Box>
            <Controller
              name="google_auth_enabled"
              control={editForm.control}
              render={({ field }) => (
                <FormSwitch checked={field.value} onChange={field.onChange} label={t('users.allow_google_auth')} />
              )}
            />
            <Controller
              name="two_factor_required"
              control={editForm.control}
              render={({ field }) => (
                <Box>
                  <FieldLabel>{t('users.two_factor_requirement')}</FieldLabel>
                  <FormSelect
                    fullWidth
                    value={field.value === null ? 'default' : String(field.value)}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === 'default' ? null : v === 'true');
                    }}
                    helperText={editing?.id === currentUser?.id ? t('users.cannot_exempt_own_two_factor') : undefined}
                  >
                    <MenuItem value="default">{t('users.two_factor_default')}</MenuItem>
                    <MenuItem value="true">{t('users.two_factor_forced_on')}</MenuItem>
                    <MenuItem value="false" disabled={editing?.id === currentUser?.id}>{t('users.two_factor_exempt')}</MenuItem>
                  </FormSelect>
                </Box>
              )}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="text" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" loading={editForm.formState.isSubmitting}>{t('common.save')}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={!!pendingAdminGrant}
        title={t('users.confirm_grant_admin_title')}
        description={t('users.confirm_grant_admin_desc')}
        confirmLabel={t('users.confirm_grant_admin_action')}
        danger
        loading={editForm.formState.isSubmitting}
        onCancel={() => setPendingAdminGrant(null)}
        onConfirm={() => {
          if (pendingAdminGrant) submitEdit(pendingAdminGrant);
        }}
      />

      <ConfirmDialog
        open={!!pendingTwoFactorExempt}
        title={t('users.confirm_two_factor_exempt_title')}
        description={t('users.confirm_two_factor_exempt_desc')}
        confirmLabel={t('users.confirm_two_factor_exempt_action')}
        danger
        loading={editForm.formState.isSubmitting}
        onCancel={() => setPendingTwoFactorExempt(null)}
        onConfirm={() => {
          if (pendingTwoFactorExempt) submitEdit(pendingTwoFactorExempt);
        }}
      />
    </>
  );
}
