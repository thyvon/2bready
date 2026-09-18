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
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

import FieldLabel from '@/components/forms/FieldLabel';
import FormSelect from '@/components/forms/FormSelect';
import { useToast } from '@/components/feedback/ToastProvider';
import { assignCompanyUser, listAssignableUsers, type AssignCompanyUserPayload } from '@/domains/company/api';
import type { User } from '@/domains/user/types';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface AssignCompanyUserDialogProps {
  companyId: string;
  open: boolean;
  onClose: () => void;
  onSaved: (user: User) => void;
}

/**
 * Back-office "assign existing user to this company" — picks from
 * pre-existing company-side accounts and attaches them to the team.
 * Distinct from AddCompanyUserDialog which creates a brand-new user.
 */
export default function AssignCompanyUserDialog({ companyId, open, onClose, onSaved }: AssignCompanyUserDialogProps) {
  const toast = useToast();
  const { t } = useTranslation();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [role, setRole] = useState<'company_owner' | 'company_member'>('company_member');
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    listAssignableUsers(companyId)
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      });

    return () => { cancelled = true; };
  }, [companyId, open]);

  const reset = () => {
    setSelectedUser(null);
    setRole('company_member');
    setServerError('');
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setServerError('');
    setSaving(true);
    try {
      const payload: AssignCompanyUserPayload = { user_id: selectedUser.id, role };
      const user = await assignCompanyUser(companyId, payload);
      toast.success(t('company_users.assign_success'));
      onSaved(user);
      handleClose();
    } catch (err) {
      setServerError(getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <Box component="form" onSubmit={handleSave} noValidate>
        <DialogTitle>{t('company_users.assign_user')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {serverError && <Alert severity="error" sx={{ py: 0.5 }}>{serverError}</Alert>}
          <Box>
            <FieldLabel>{t('company_users.select_user')}</FieldLabel>
            <Autocomplete
              options={users}
              value={selectedUser}
              onChange={(_, value) => setSelectedUser(value)}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t('company_users.search_users')}
                />
              )}
              fullWidth
            />
          </Box>
          <Box>
            <FieldLabel>{t('users.role_col')}</FieldLabel>
            <FormSelect fullWidth value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
              <MenuItem value="company_owner">{t('company_users.role_company_owner')}</MenuItem>
              <MenuItem value="company_member">{t('company_users.role_company_member')}</MenuItem>
            </FormSelect>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="text" onClick={handleClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" loading={saving} disabled={!selectedUser}>{t('common.save')}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
