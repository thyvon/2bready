'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import { GlowButton, cardGridContainer } from '@2bready/ui-core';
import { AuroraBackground } from '@/components/layout/AuroraBackground';
import { DomainTile } from '@/components/layout/DomainTile';
import { CLIENT_NAV } from '@/components/layout/nav-items';

const domainTiles = CLIENT_NAV.filter((item) => item.href !== '/');

export default function OverviewPage() {
  return (
    <Box className="flex flex-col gap-16">
      <Box sx={{ position: 'relative', textAlign: 'center', py: { xs: 4, md: 8 } }}>
        <AuroraBackground />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h1"
            className="portal-gradient-text"
            sx={{ fontSize: { xs: '2.25rem', md: '3rem' }, mb: 2 }}
          >
            Your compliance readiness, at a glance
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, mx: 'auto', mb: 4 }}>
            Track your journey, manage documents, and stay audit-ready — all in one place.
          </Typography>
          <GlowButton href="/journey">Continue your journey</GlowButton>
        </Box>
      </Box>

      <motion.div
        variants={cardGridContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
      >
        {domainTiles.map((item) => (
          <DomainTile key={item.href} item={item} />
        ))}
      </motion.div>
    </Box>
  );
}
