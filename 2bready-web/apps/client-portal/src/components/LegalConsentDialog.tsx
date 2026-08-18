'use client';

import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { getApiError } from '@2bready/api-client';
import { acceptLegalConsent } from '@/lib/legal-consent-api';
import { useTranslation } from '@/lib/i18n';

export interface LegalConsentDialogProps {
  open: boolean;
  levelCode: string;
  textEn: string;
  textKh: string;
  /** Called after the consent is accepted server-side. */
  onAccepted: () => void;
  onCancel: () => void;
}

// Client-side legal consent gate (v3 §4.2): shown before the user can
// preview or upload a restricted P3/P4 (L3/L4) document. The text is served
// by the backend (versioned in platform_settings — never hardcoded here), and
// accepting writes both a legal_consents row and an audit-log entry
// server-side. The modal only records consent; the caller runs the actual
// action it was gating via onAccepted.
export function LegalConsentDialog({ open, levelCode, textEn, textKh, onAccepted, onCancel }: LegalConsentDialogProps) {
  const { t, locale } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const consentText = locale === 'kh' ? textKh : textEn;

  const handleAccept = async () => {
    setSubmitting(true);
    setError('');
    try {
      await acceptLegalConsent(levelCode);
      onAccepted();
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{t('legal_consent.title')}</DialogTitle>
      <DialogContent sx={{ p: 3, pt: '8px !important' }}>
        <Box className="flex flex-col gap-3">
          {error && <Alert severity="error" sx={{ py: 0.5 }}>{error}</Alert>}
          <Typography variant="body2" color="text.secondary">
            {t('legal_consent.desc')}
          </Typography>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'action.hover',
              p: 2,
              maxHeight: 200,
              overflowY: 'auto',
            }}
          >
            <Typography variant="body2">{consentText}</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end', gap: 1, px: 3, pb: 3 }}>
        <Button variant="text" onClick={onCancel} disabled={submitting}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleAccept} loading={submitting}>
          {t('legal_consent.accept')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}