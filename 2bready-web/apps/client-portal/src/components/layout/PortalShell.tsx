import Box from '@mui/material/Box';
import { TopProgressBar } from '@2bready/ui-core';
import { PortalNavbar } from './PortalNavbar';
import { PageTransition } from './PageTransition';
import { PortalFooter } from './PortalFooter';

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <Box className="flex min-h-screen flex-col">
      <TopProgressBar />
      <PortalNavbar />
      {/* flex: 1 keeps the footer pinned to the viewport bottom on short
          pages instead of floating directly under a half-empty page.
          No max-width cap — fills the viewport like every admin-portal
          page does, rather than centering in a fixed 1440px column. */}
      <Box
        component="main"
        sx={{
          flex: 1,
          width: '100%',
          px: { xs: 2, md: 4 },
          pt: { xs: 2.5, md: 3.5 },
          pb: { xs: 5, md: 7 },
        }}
      >
        <PageTransition>
          {/* Card-stack rhythm: every top-level section (PageHeader, SectionCard,
              card grid…) gets the same gap, mirroring how admin-portal pages
              read as a column of contained cards rather than floating blocks. */}
          <Box className="flex flex-col gap-5">{children}</Box>
        </PageTransition>
      </Box>
      <PortalFooter />
    </Box>
  );
}
