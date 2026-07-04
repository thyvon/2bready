'use client';

import Typography from '@mui/material/Typography';

interface FieldLabelProps {
  children: React.ReactNode;
}

export default function FieldLabel({ children }: FieldLabelProps) {
  return (
    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.75, color: 'text.primary' }}>
      {children}
    </Typography>
  );
}
