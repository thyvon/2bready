import Box from '@mui/material/Box';
import { PortalNavbar } from './PortalNavbar';
import { PageTransition } from './PageTransition';
import { PortalFooter } from './PortalFooter';

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <Box className="flex min-h-screen flex-col">
      <PortalNavbar />
      {/* flex: 1 keeps the footer pinned to the viewport bottom on short
          pages instead of floating directly under a half-empty page. */}
      <Box component="main" sx={{ flex: 1, maxWidth: 1440, width: '100%', mx: 'auto', px: { xs: 2, md: 4 }, pt: { xs: 2, md: 3 }, pb: { xs: 4, md: 6 } }}>
        <PageTransition>{children}</PageTransition>
      </Box>
      <PortalFooter />
    </Box>
  );
}
