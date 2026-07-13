'use client';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

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
}

// Purely presentational, like UploadDropzone — this package has no API
// client of its own, so the caller fetches the signed preview URL and
// passes the resolved state in. Renders a PDF via <iframe> (the signed
// URL's real Content-Disposition: inline header lets the browser render it
// directly instead of downloading) or an image via <img>; anything else
// falls back to a plain "can't preview" message rather than guessing.
export function DocumentPreviewDialog({ open, onClose, title, url, mimeType, loading = false, error = null }: DocumentPreviewDialogProps) {
  const isImage = mimeType?.startsWith('image/') ?? false;
  const isPdf = mimeType === 'application/pdf';

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
            This file type can&apos;t be previewed here.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
