'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import CheckIcon from '@mui/icons-material/Check';

export interface CopySecretFieldProps {
  label?: string;
  value: string;
}

// A monospace value + copy-to-clipboard button, for the "here's your secret,
// copy it now" moment (a data-room link/PIN, a TOTP secret, an API key) —
// nothing like this existed anywhere in the monorepo before the Data Room
// feature needed it; purely presentational, like DocumentPreviewDialog.
export function CopySecretField({ label, value }: CopySecretFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box>
      {label && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          {label}
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          px: 1.5,
          py: 1,
          bgcolor: 'action.hover',
        }}
      >
        <Typography
          variant="body2"
          sx={{ fontFamily: 'monospace', flex: 1, minWidth: 0, wordBreak: 'break-all' }}
        >
          {value}
        </Typography>
        <Tooltip title={copied ? 'Copied' : 'Copy'}>
          <IconButton size="small" onClick={handleCopy} aria-label="Copy to clipboard">
            {copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyOutlinedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
