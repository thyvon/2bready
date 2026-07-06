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
    <Box className="flex flex-col gap-16">
      <Box sx={{ position: 'relative', textAlign: 'center', py: { xs: 4, md: 8 } }}>
        <AuroraBackground />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h1"
            className="portal-gradient-text"
            sx={{ fontSize: { xs: '2.25rem', md: '3rem' }, mb: 2 }}
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
