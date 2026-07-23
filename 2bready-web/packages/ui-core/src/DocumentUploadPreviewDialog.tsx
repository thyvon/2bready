'use client';

import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import UploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';

export interface DocumentUploadPreviewDialogProps {
  open: boolean;
  title: string;
  /** The currently staged file — from a fresh pick or a resumed draft. */
  file: File | null;
  /** Already-resolved copy (e.g. "Filing for 2023 — a past period"), shown as a banner only for a backfill upload. Ui-core has no i18n of its own — pass the resolved text, not a period_key or translation key. */
  backfillNotice?: string;
  /** Uploads the staged file for real. */
  onConfirm: () => void;
  /** Stashes the file locally (nothing sent to the server) so the user can confirm or replace it later without re-picking from the OS file dialog. Omit to hide the action entirely — a backfill upload has no per-period draft slot to resume it from, so the caller doesn't offer one. */
  onSaveDraft?: () => void;
  /** Swaps the staged file for a different one, without closing the dialog. */
  onReplace: (file: File) => void;
  /** Closes without acting — an existing draft (if any) is left exactly as it was. */
  onCancel: () => void;
  confirming?: boolean;
}

// Companion to DocumentPreviewDialog (which views an already-uploaded,
// server-hosted document) — this one previews a locally-picked File before
// it's ever sent anywhere, via a browser object URL. Nothing here touches
// the network; the caller decides what "confirm" and "save as draft"
// actually do.
export function DocumentUploadPreviewDialog({
  open,
  title,
  file,
  backfillNotice,
  onConfirm,
  onSaveDraft,
  onReplace,
  onCancel,
  confirming = false,
}: DocumentUploadPreviewDialogProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const isImage = file?.type.startsWith('image/') ?? false;
  const isPdf = file?.type === 'application/pdf';

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle className="flex items-center justify-between gap-2">
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, minWidth: 0 }} noWrap>
          {title}
        </Typography>
        <IconButton size="small" onClick={onCancel}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {backfillNotice && (
        <Box
          className="flex items-center gap-1.5"
          sx={{
            mx: 3,
            mb: 2,
            px: 1.5,
            py: 1,
            borderRadius: '8px',
            bgcolor: 'color-mix(in srgb, var(--mui-palette-primary-main) 8%, transparent)',
            border: '1px solid',
            borderColor: 'color-mix(in srgb, var(--mui-palette-primary-main) 25%, transparent)',
          }}
        >
          <UploadOutlinedIcon fontSize="small" sx={{ color: 'primary.main' }} />
          <Typography variant="body2">{backfillNotice}</Typography>
        </Box>
      )}

      <DialogContent
        sx={{
          p: 0,
          height: '65vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
        }}
      >
        {objectUrl && isImage && (
          <Box component="img" src={objectUrl} alt={file?.name} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        )}
        {objectUrl && isPdf && (
          <Box component="iframe" src={objectUrl} title={file?.name} sx={{ width: '100%', height: '100%', border: 'none' }} />
        )}
        {objectUrl && !isImage && !isPdf && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            {file?.name} — preview isn&apos;t available for this file type, but you can still confirm the upload.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Button size="small" component="label" color="inherit" startIcon={<UploadOutlinedIcon fontSize="small" />}>
          Choose Different File
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) onReplace(f);
            }}
          />
        </Button>

        <Box className="flex items-center gap-2">
          <Button size="small" color="inherit" onClick={onCancel}>
            Cancel
          </Button>
          {onSaveDraft && (
            <Button size="small" variant="outlined" onClick={onSaveDraft} disabled={confirming}>
              Save as Draft
            </Button>
          )}
          <Button size="small" variant="contained" loading={confirming} onClick={onConfirm}>
            Confirm Upload
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
