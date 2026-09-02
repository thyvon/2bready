'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box className="flex items-start gap-3">
      <Box sx={{ color: 'text.secondary', mt: '2px' }}>{icon}</Box>
      <Box className="min-w-0">
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
      </Box>
    </Box>
  );
}
