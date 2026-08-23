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
import FormSelect from '@/components/forms/FormSelect';
import FormSwitch from '@/components/forms/FormSwitch';
import { useToast } from '@/components/feedback/ToastProvider';
import { updateCompanyUser } from '@/domains/company/api';
import { companyRoleOf, type CompanyRole } from '@/domains/company/constants';
import type { User } from '@/domains/user/types';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

const COMPANY_ROLES: CompanyRole[] = ['company_owner', 'company_member'];

interface CompanyUserEditDialogProps {
  companyId: string;
  /** The user being edited — null closes the dialog. */
  user: User | null;
  onClose: () => void;
  /** Called with the updated user after a successful save. */
  onSaved: (updated: User) => void;
}

/**
 * The one company-user edit dialog (role / status / Google auth / 2FA
 * requirement), shared by the Users tab's list and the Overview team card —
 * previously duplicated inline in CompanyUsersListView.
 */
export default function CompanyUserEditDialog(props: CompanyUserEditDialogProps) {
  // Keyed remount per user: form state initializes from props at mount
  // instead of a setState-in-effect sync.
  if (!props.user) return null;
  return <CompanyUserEditDialogInner key={props.user.id} {...props} user={props.user} />;
}

function CompanyUserEditDialogInner({ companyId, user, onClose, onSaved }: CompanyUserEditDialogProps & { user: User }) {
  const toast = useToast();
  const { t } = useTranslation();

  const [status, setStatus] = useState<'active' | 'suspended' | 'inactive'>((user.status ?? 'active') as 'active' | 'suspended' | 'inactive');
  const [role, setRole] = useState<CompanyRole>(companyRoleOf(user));
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(user.google_auth_enabled);
  const [twoFactorRequired, setTwoFactorRequired] = useState<boolean | null>(user.two_factor_required);
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setServerError('');
    try {
      const updated = await updateCompanyUser(companyId, user.id, {
        status,
        role,
        google_auth_enabled: googleAuthEnabled,
        two_factor_required: twoFactorRequired,
      });
      toast.success(t('company_users.update_success'));
      onSaved(updated);
    } catch (err) {
      setServerError(getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!user} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{user?.name}</DialogTitle>
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
        <Button variant="text" onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" loading={saving} onClick={handleSave}>{t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
}
