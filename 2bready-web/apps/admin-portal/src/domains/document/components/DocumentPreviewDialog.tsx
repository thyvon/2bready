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
  /** Comment is required when rejecting (it is the reason); optional on verify. */
  onVerify?: (comment: string | undefined) => void;
  onReject?: (comment: string) => void;
  acting?: boolean;
}

// One dialog for both looking at a document and acting on it — reviewing a
// document and deciding whether to verify/reject it is one motion for an
// admin, not "open a new tab to look, then come back and click a button
// blind." Presentation (iframe/img rendering) matches client-portal's own
// DocumentPreviewDialog; the Verify/Reject footer is admin-specific.
//
// The comment sub-form (commenting state) is reset by giving this component
// a `key` tied to the document's id at the call site, not by an effect — a
// fresh document opening means a fresh mount, so there's never a half-typed
// comment left over from the previous one to clear.
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

  const [commenting, setCommenting] = useState(false);
  const [comment, setComment] = useState('');

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
          {commenting ? (
            <>
              <Box>
                <FieldLabel>{t('admin.document_comment_label')}</FieldLabel>
                <FormTextField
                  autoFocus
                  multiline
                  minRows={2}
                  fullWidth
                  placeholder={t('admin.document_comment_placeholder')}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </Box>
              <Box className="flex justify-end gap-2">
                <Button variant="text" onClick={() => setCommenting(false)}>{t('common.cancel')}</Button>
                <Button
                  variant="contained"
                  color="error"
                  disabled={!comment.trim()}
                  loading={acting}
                  onClick={() => onReject?.(comment.trim())}
                >
                  {t('admin.confirm_reject_document')}
                </Button>
                <Button
                  variant="contained"
                  loading={acting}
                  onClick={() => onVerify?.(comment.trim() || undefined)}
                >
                  {t('admin.verify')}
                </Button>
              </Box>
            </>
          ) : (
            <Box className="flex justify-end gap-2">
              <Button variant="outlined" color="error" disabled={acting} onClick={() => { setComment(''); setCommenting(true); }}>
                {t('admin.reject')}
              </Button>
              <Button variant="outlined" disabled={acting} onClick={() => { setComment(''); setCommenting(true); }}>
                {t('admin.verify')}
              </Button>
            </Box>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
