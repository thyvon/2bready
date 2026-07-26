'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface FieldLabelProps {
  children: React.ReactNode;
  // Optional trailing element (e.g. a "Forgot password?" link) rendered in the
  // same row, right-aligned — so a field needing one still goes through this
  // shared component instead of hand-duplicating its styling inline.
  action?: React.ReactNode;
}

export default function FieldLabel({ children, action }: FieldLabelProps) {
  const label = (
    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
      {children}
    </Typography>
  );

  if (!action) {
    return <Box sx={{ mb: 0.75 }}>{label}</Box>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
      {label}
      {action}
    </Box>
  );
}
