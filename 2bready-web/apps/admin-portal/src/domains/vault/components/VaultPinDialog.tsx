'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';
import { setVaultPin, unlockVault } from '@/domains/vault/api';
import { vaultUnlockSchema, vaultSetPinSchema } from '@/domains/vault/schemas';
import { useToast } from '@/components/feedback/ToastProvider';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface VaultPinDialogProps {
  open: boolean;
  companyId: string;
  companyName: string;
  /** Whether the company already has a PIN (false → show the set-PIN form). */
  pinSet: boolean;
  pinLength: number;
  onClose: () => void;
  /** Called after the vault is unlocked (set-and-unlock or plain unlock). */
  onUnlocked: () => void;
}

// Back-office vault dialog (v3 §4.2): unlock a company's vault with its PIN
// so sensitive L3/L4 documents can be previewed, or set the PIN in the first
// place (admin-only per the route middleware — this dialog never reaches a
// non-admin's screen because the status endpoint already 403s for staff).
// The PIN is entered, sent once, never echoed back; server-side auto-lock
// (3 min) is what ends the session, never a frontend timer.
export function VaultPinDialog({
  open,
  companyId,
  companyName,
  pinSet,
  pinLength,
  onClose,
  onUnlocked,
}: VaultPinDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [serverError, setServerError] = useState('');

  const isSetMode = !pinSet;
  const schema = isSetMode
    ? vaultSetPinSchema(pinLength, t('vault.pin_digits', { length: String(pinLength) }), t('vault.pin_mismatch'))
    : vaultUnlockSchema(pinLength, t('vault.pin_digits', { length: String(pinLength) }));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ pin: string; confirm_pin?: string }>({
    resolver: zodResolver(schema),
  });

  const submit = async (data: { pin: string }) => {
    setServerError('');
    try {
      if (isSetMode) {
        await setVaultPin(companyId, data.pin);
      }
      await unlockVault(companyId, data.pin);
      toast.success(isSetMode ? t('vault.set_and_unlocked') : t('vault.unlocked'));
      onUnlocked();
    } catch (err) {
      setServerError(getApiError(err).message);
    }
  };

  const handleClose = () => {
    setServerError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
        <DialogTitle>{isSetMode ? t('vault.set_title') : t('vault.unlock_title')}</DialogTitle>
        <DialogContent className="flex flex-col gap-4" sx={{ pt: '8px !important' }}>
          <Typography variant="body2" color="text.secondary">
            {isSetMode
              ? t('vault.set_desc', { company: companyName })
              : t('vault.unlock_desc', { company: companyName })}
          </Typography>
          {serverError && <Alert severity="error" sx={{ py: 0.5 }}>{serverError}</Alert>}

          <Box>
            <FieldLabel>{t('vault.pin_label')}</FieldLabel>
            <FormTextField
              fullWidth
              autoFocus
              type="password"
              inputMode="numeric"
              autoComplete="off"
              error={!!errors.pin}
              helperText={errors.pin?.message}
              {...register('pin')}
            />
          </Box>

          {isSetMode && (
            <Box>
              <FieldLabel>{t('vault.confirm_pin_label')}</FieldLabel>
              <FormTextField
                fullWidth
                type="password"
                inputMode="numeric"
                autoComplete="off"
                error={!!errors.confirm_pin}
                helperText={errors.confirm_pin?.message}
                {...register('confirm_pin')}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="text" onClick={handleClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {isSetMode ? t('vault.set_button') : t('vault.unlock_button')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}