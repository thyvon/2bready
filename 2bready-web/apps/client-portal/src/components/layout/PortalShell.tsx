import Box from '@mui/material/Box';
import { PortalNavbar } from './PortalNavbar';
import { PageTransition } from './PageTransition';

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <Box className="flex min-h-screen flex-col">
      <PortalNavbar />
      <Box component="main" sx={{ maxWidth: 1440, width: '100%', mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}>
        <PageTransition>{children}</PageTransition>
      </Box>
    </Box>
  );
}
