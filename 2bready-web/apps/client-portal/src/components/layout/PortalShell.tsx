import Box from '@mui/material/Box';
import { PortalSidebar } from './PortalSidebar';

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <Box className="flex">
      <PortalSidebar />
      <Box component="main" className="flex-1 p-8" sx={{ minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}
