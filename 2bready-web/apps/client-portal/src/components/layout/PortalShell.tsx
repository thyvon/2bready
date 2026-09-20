'use client';

import Box from '@mui/material/Box';
import { TopProgressBar } from '@2bready/ui-core';
import { PortalNavbar } from './PortalNavbar';
import { DesktopSidebar } from './DashboardSidebar';
import { SettingsDrawer } from './SettingsDrawer';
import { PageTransition } from './PageTransition';
import { PortalFooter } from './PortalFooter';
import { useLayoutStore } from '@/store/layout.store';

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { navMode } = useLayoutStore();
  const isSidebar = navMode === 'sidebar';

  if (isSidebar) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <TopProgressBar />
        <DesktopSidebar />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <PortalNavbar mode="sidebar" />
          <Box
            component="main"
            sx={{
              flex: 1,
              px: { xs: 2, md: 4 },
              pt: { xs: 2.5, md: 3.5 },
              pb: { xs: 5, md: 7 },
            }}
          >
            <PageTransition>
              <Box className="flex flex-col gap-5">{children}</Box>
            </PageTransition>
          </Box>
          <PortalFooter />
        </Box>
        <SettingsDrawer />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopProgressBar />
      <PortalNavbar mode="topbar" />
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          width: '100%',
          px: { xs: 2, md: 4 },
          pt: { xs: 2.5, md: 3.5 },
          pb: { xs: 5, md: 7 },
        }}
      >
        <PageTransition>
          <Box className="flex flex-col gap-5">{children}</Box>
        </PageTransition>
      </Box>
      <PortalFooter />
      <SettingsDrawer />
    </Box>
  );
}
