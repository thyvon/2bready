'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import { useAuthStore } from '@/store/auth.store';
import { useLayoutStore } from '@/store/layout.store';
import DashboardSidebar from '@/components/layouts/DashboardSidebar';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import DashboardNavHorizontal from '@/components/layouts/DashboardNavHorizontal';
import { fadeIn, pageTransition } from '@/lib/motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const { navOrientation } = useLayoutStore();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  if (navOrientation === 'horizontal') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <motion.div key="horizontal-nav" initial="initial" animate="animate" variants={fadeIn}>
          <DashboardNavHorizontal />
        </motion.div>
        <Box component="main" sx={{ p: 4 }}>
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
        <DashboardSidebar />
      </motion.div>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <DashboardHeader />
        <Box component="main" sx={{ flex: 1, p: 4 }}>
          <motion.div key={pathname} initial="initial" animate="animate" variants={pageTransition}>
            {children}
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}
