'use client';

import { useCallback, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CloseIcon from '@mui/icons-material/Close';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface UploadDropzoneProps {
  open: boolean;
  onClose: () => void;
  /** Called with the selected file when the user confirms — caller decides what "uploaded" means (no network call happens here). */
  onUpload: (file: File) => void;
  title: string;
  /** e.g. ".pdf,.jpg,.jpeg,.png" — passed straight through to the native file input. */
  accept?: string;
  maxSizeMB?: number;
}

// Drag-and-drop + click-to-browse file picker in a Dialog — generic enough
// to reuse for any document/file upload flow (journey checklist, SOP
// sign-off attachments, etc.), not tied to one domain's data shape. Purely a
// file-picker UI: it hands the caller a real File object and gets out of the
// way — no upload progress/network state, since that depends on each
// caller's own API.
export function UploadDropzone({ open, onClose, onUpload, title, accept = '.pdf,.jpg,.jpeg,.png', maxSizeMB = 10 }: UploadDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      if (f.size > maxSizeMB * 1024 * 1024) {
        setError(`File exceeds the ${maxSizeMB}MB limit.`);
        return;
      }
      setError(null);
      setFile(f);
    },
    [maxSizeMB],
  );

  const reset = () => {
    setFile(null);
    setError(null);
    setDragging(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!file) return;
    onUpload(file);
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle className="flex items-center justify-between gap-2">
        <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          sx={{
            border: '2px dashed',
            borderColor: dragging ? 'primary.main' : 'divider',
            borderRadius: '12px',
            bgcolor: dragging ? 'action.hover' : 'transparent',
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, background-color 0.15s ease',
          }}
        >
          <input ref={inputRef} type="file" accept={accept} hidden onChange={(e) => handleFiles(e.target.files)} />
          {file ? (
            <Box className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
              <InsertDriveFileOutlinedIcon color="primary" />
              <Box sx={{ textAlign: 'left', minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatBytes(file.size)}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setFile(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <>
              <CloudUploadOutlinedIcon sx={{ fontSize: '2.5rem', color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Drag & drop your file here
              </Typography>
              <Typography variant="caption" color="text.secondary">
                or click to browse — {accept.split(',').map((e) => e.replace('.', '').toUpperCase()).join(', ')} up to {maxSizeMB}MB
              </Typography>
            </>
          )}
        </Box>
        {error && (
          <Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!file}>
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
