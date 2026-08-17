'use client';

import { useCallback, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CloseIcon from '@mui/icons-material/Close';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface InlineDropzoneProps {
  /** Called with the selected file immediately on pick — the caller runs the upload. */
  onUpload: (file: File) => void;
  /** e.g. ".png,.jpg,.jpeg,.svg,.webp" — passed straight through to the native file input. */
  accept?: string;
  maxSizeMB?: number;
  /** While an upload is in flight — disables the zone and shows a spinner. */
  disabled?: boolean;
  /** Overrides the default "or click to browse — …" caption, e.g. with translated copy. */
  hint?: string;
}

// Drag-and-drop + click-to-browse file picker rendered inline on the page (no
// Dialog wrapper) — uploads fire the moment a file is picked, so there is no
// extra confirm step. A sibling of UploadDropzone (the dialog version) for
// flows that want the file picked in place, e.g. the admin branding settings.
export function InlineDropzone({ onUpload, accept = '.pdf,.jpg,.jpeg,.png', maxSizeMB = 10, disabled = false, hint }: InlineDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setError(null);
    setDragging(false);
    if (inputRef.current) inputRef.current.value = '';
  };

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
      onUpload(f);
    },
    [maxSizeMB, onUpload],
  );

  return (
    <Box>
      <Box
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        sx={{
          border: '2px dashed',
          borderColor: dragging ? 'primary.main' : 'divider',
          borderRadius: '12px',
          bgcolor: dragging ? 'action.hover' : 'transparent',
          p: 2.5,
          textAlign: 'center',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'border-color 0.15s ease, background-color 0.15s ease',
        }}
      >
        <input ref={inputRef} type="file" accept={accept} hidden disabled={disabled} onChange={(e) => handleFiles(e.target.files)} />
        {disabled ? (
          <Box className="flex items-center justify-center gap-2">
            <CircularProgress size={20} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Uploading…
            </Typography>
          </Box>
        ) : file ? (
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
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); reset(); }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <>
            <CloudUploadOutlinedIcon sx={{ fontSize: '2rem', color: 'text.disabled', mb: 0.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Drag & drop your file here
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {hint ?? `or click to browse — ${accept.split(',').map((e) => e.replace('.', '').toUpperCase()).join(', ')} up to ${maxSizeMB}MB`}
            </Typography>
          </>
        )}
      </Box>
      {error && (
        <Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}