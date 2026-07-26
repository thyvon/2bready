'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import { useAuthStore } from '@/store/auth.store';
import DashboardSidebar from '@/components/layouts/DashboardSidebar';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import PortalFooter from '@/components/layouts/PortalFooter';
import { fadeIn, pageTransition } from '@/lib/motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, user } = useAuthStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // The actual enforcement boundary is the backend (tpLogin rejects any
  // account without portal.tp.access before ever issuing a token — see
  // domains/auth/api.ts). This check is defense-in-depth against a token
  // minted before that existed, or any future regression — mirrors
  // admin-portal's own (dashboard)/layout.tsx gate exactly, reading the same
  // permission-backed flag the backend used to decide whether to issue the
  // token in the first place (User::canAccessTpPortal).
  const canAccessTpPortal = user?.can_access_tp_portal ?? false;

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!canAccessTpPortal) {
      useAuthStore.getState().clearAuth();
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, canAccessTpPortal, router]);

  if (!hasHydrated || !isAuthenticated || !canAccessTpPortal) return null;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <motion.div key="sidebar" initial="initial" animate="animate" variants={fadeIn}>
        <DashboardSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      </motion.div>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <DashboardHeader onMenuClick={() => setMobileNavOpen(true)} />
        <Box component="main" sx={{ flex: 1, p: { xs: 1.5, sm: 2, md: 2.5 } }}>
          <motion.div initial="initial" animate="animate" variants={pageTransition}>
            {children}
          </motion.div>
        </Box>
        <PortalFooter />
      </Box>
    </Box>
  );
}
