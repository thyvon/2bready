'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from '@/lib/i18n';
import FieldLabel from '@/components/forms/FieldLabel';
import FormTextField from '@/components/forms/FormTextField';

export interface DocumentPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Real signed URL to render — null while still loading or on error. */
  url: string | null;
  mimeType: string | null;
  loading?: boolean;
  /** Set when the caller's own fetch (e.g. requesting the signed URL) failed. */
  error?: string | null;
  /** The document's current status — Verify/Reject only ever show for 'review'. */
  status?: string;
  onVerify?: () => void;
  onReject?: (reason: string) => void;
  acting?: boolean;
}

// One dialog for both looking at a document and acting on it — reviewing a
// document and deciding whether to verify/reject it is one motion for an
// admin, not "open a new tab to look, then come back and click a button
// blind." Presentation (iframe/img rendering) matches client-portal's own
// DocumentPreviewDialog; the Verify/Reject footer is admin-specific.
//
// The reject-reason sub-form (rejecting/reason state) is reset by giving
// this component a `key` tied to the document's id at the call site, not by
// an effect — a fresh document opening means a fresh mount, so there's never
// a half-typed reason left over from the previous one to clear.
export function DocumentPreviewDialog({
  open,
  onClose,
  title,
  url,
  mimeType,
  loading = false,
  error = null,
  status,
  onVerify,
  onReject,
  acting = false,
}: DocumentPreviewDialogProps) {
  const { t } = useTranslation();
  const isImage = mimeType?.startsWith('image/') ?? false;
  const isPdf = mimeType === 'application/pdf';
  const canAct = status === 'review' && (onVerify || onReject);

  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="flex items-center justify-between gap-2">
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, minWidth: 0 }} noWrap>
          {title}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 0,
          height: '75vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
        }}
      >
        {loading && <CircularProgress size={32} />}
        {!loading && error && (
          <Typography variant="body2" color="error.main" sx={{ p: 3, textAlign: 'center' }}>
            {error}
          </Typography>
        )}
        {!loading && !error && url && isImage && (
          <Box
            component="img"
            src={url}
            alt={title}
            sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        )}
        {!loading && !error && url && isPdf && (
          <Box component="iframe" src={url} title={title} sx={{ width: '100%', height: '100%', border: 'none' }} />
        )}
        {!loading && !error && url && !isImage && !isPdf && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            {t('admin.preview_unsupported')}
          </Typography>
        )}
      </DialogContent>

      {canAct && (
        <DialogActions sx={{ px: 3, py: 2, flexDirection: 'column', alignItems: 'stretch', gap: 1.5 }}>
          {rejecting ? (
            <>
              <Box>
                <FieldLabel>{t('admin.reject_document_reason_label')}</FieldLabel>
                <FormTextField
                  autoFocus
                  multiline
                  minRows={2}
                  fullWidth
                  placeholder={t('admin.reject_document_reason_placeholder')}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Box>
              <Box className="flex justify-end gap-2">
                <Button variant="text" onClick={() => setRejecting(false)}>{t('common.cancel')}</Button>
                <Button
                  variant="contained"
                  color="error"
                  disabled={!reason.trim()}
                  loading={acting}
                  onClick={() => onReject?.(reason.trim())}
                >
                  {t('admin.confirm_reject_document')}
                </Button>
              </Box>
            </>
          ) : (
            <Box className="flex justify-end gap-2">
              <Button variant="outlined" color="error" disabled={acting} onClick={() => setRejecting(true)}>
                {t('admin.reject')}
              </Button>
              <Button variant="contained" loading={acting} onClick={onVerify}>
                {t('admin.verify')}
              </Button>
            </Box>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
