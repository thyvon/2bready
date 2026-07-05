'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useAuthStore } from '@/store/auth.store';
import { useLayoutStore } from '@/store/layout.store';
import DashboardSidebar from '@/components/layouts/DashboardSidebar';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import DashboardNavHorizontal from '@/components/layouts/DashboardNavHorizontal';
import { fadeIn, pageTransition } from '@/lib/motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const { navOrientation } = useLayoutStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const theme = useTheme();
  // Below md, always use the sidebar (drawer) layout — the topbar's dropdown-menu
  // pattern is a poor fit for small screens, so the user's "Top bar" preference is
  // only honored at md and above.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Wait for the persisted store to rehydrate — otherwise this reads the
    // pre-hydration default (isAuthenticated: false) on every hard reload and
    // redirects a genuinely-authenticated session back to /login.
    if (!hasHydrated) return;
    if (!isAuthenticated) router.replace('/login');
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) return null;

  if (navOrientation === 'horizontal' && !isMobile) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <motion.div key="horizontal-nav" initial="initial" animate="animate" variants={fadeIn}>
          <DashboardNavHorizontal />
        </motion.div>
        <Box component="main" sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
          <motion.div key={pathname} initial="initial" animate="animate" variants={pageTransition}>
            {children}
          </motion.div>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <motion.div key="vertical-nav" initial="initial" animate="animate" variants={fadeIn}>
        <DashboardSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      </motion.div>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <DashboardHeader onMenuClick={() => setMobileNavOpen(true)} />
        <Box component="main" sx={{ flex: 1, p: { xs: 1.5, sm: 2, md: 2.5 } }}>
          <motion.div key={pathname} initial="initial" animate="animate" variants={pageTransition}>
            {children}
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}
