'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import { GlowButton, cardGridContainer } from '@2bready/ui-core';
import { AuroraBackground } from '@/components/layout/AuroraBackground';
import { DomainTile } from '@/components/layout/DomainTile';
import { useNavItems } from '@/components/layout/nav-items';
import { useTranslation } from '@/lib/i18n';

export default function OverviewPage() {
  const { t } = useTranslation();
  const { all } = useNavItems();
  const domainTiles = all.filter((item) => item.href !== '/');

  return (
    <Box className="flex flex-col gap-8">
      {/* Cancels PortalShell's own top padding (pt: {xs:2,md:3}) so the aurora
          background sits flush against the navbar with zero gap, matching
          the marketing hero's seamless nav-to-content transition — every
          other (stub) page still gets PortalShell's normal top spacing. Must
          stay equal-and-opposite to PortalShell's pt or this either leaves a
          gap (too small) or pulls the hero up behind the navbar (too big). */}
      <Box sx={{ position: 'relative', textAlign: 'center', mt: { xs: -2, md: -3 }, pt: { xs: 4, md: 6 }, pb: { xs: 2, md: 3 } }}>
        <AuroraBackground />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h1"
            className="portal-gradient-text"
            // lineHeight 1.05 (nextjs.org's tight Latin display-type value)
            // clips Khmer glyphs — Khmer script's stacked subscript
            // consonants/vowel marks need noticeably more vertical room than
            // Latin, or the line box cuts off the bottom of the glyphs (see
            // kh locale). 1.3 is loose for Latin but the floor Khmer needs.
            sx={{ fontSize: { xs: '2.75rem', sm: '3.75rem', md: '4.5rem' }, lineHeight: 1.3, letterSpacing: '-0.03em', mb: 2 }}
          >
            {t('overview.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, mx: 'auto', mb: 4 }}>
            {t('overview.subtitle')}
          </Typography>
          <GlowButton href="/journey">{t('overview.cta')}</GlowButton>
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
