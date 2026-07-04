'use client';

import Box from '@mui/material/Box';
import HeaderActions from '@/components/layouts/HeaderActions';

export default function DashboardHeader() {
  return (
    <Box
      component="header"
      sx={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        px: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <HeaderActions />
    </Box>
  );
}
