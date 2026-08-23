'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';

import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';
import FormSelect from '@/components/forms/FormSelect';
import { useToast } from '@/components/feedback/ToastProvider';
import { addCompanyUser, type AddCompanyUserPayload } from '@/domains/company/api';
import type { User } from '@/domains/user/types';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface AddCompanyUserDialogProps {
  companyId: string;
  open: boolean;
  onClose: () => void;
  onSaved: (user: User) => void;
}

/**
 * Back-office "add user to this company" — creates a brand-new
 * company-side account (owner or member) directly into the team.
 * Distinct from CompanyUserEditDialog, which only edits existing users.
 */
export default function AddCompanyUserDialog({ companyId, open, onClose, onSaved }: AddCompanyUserDialogProps) {
  const toast = useToast();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [role, setRole] = useState<'company_owner' | 'company_member'>('company_member');
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPasswordConfirmation('');
    setRole('company_member');
    setServerError('');
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setSaving(true);
    try {
      const payload: AddCompanyUserPayload = { name, email, password, password_confirmation: passwordConfirmation, role };
      const user = await addCompanyUser(companyId, payload);
      toast.success(t('company_users.add_success'));
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
        <DialogTitle>{t('company_users.add_user')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {serverError && <Alert severity="error" sx={{ py: 0.5 }}>{serverError}</Alert>}
          <Box>
            <FieldLabel>{t('users.name_col')}</FieldLabel>
            <FormTextField fullWidth value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </Box>
          <Box>
            <FieldLabel>{t('users.email_col')}</FieldLabel>
            <FormTextField fullWidth type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Box>
          <Box>
            <FieldLabel>{t('users.password')}</FieldLabel>
            <FormTextField fullWidth type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Box>
          <Box>
            <FieldLabel>{t('users.confirm_password')}</FieldLabel>
            <FormTextField fullWidth type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required />
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
          <Button type="submit" variant="contained" loading={saving}>{t('common.save')}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
