'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import VerifiedIcon from '@mui/icons-material/Verified';
import TimelineIcon from '@mui/icons-material/Timeline';
import GroupsIcon from '@mui/icons-material/Groups';
import AuroraBackground from './AuroraBackground';
import GlowButton from './GlowButton';
import TrustScorePreview from './TrustScorePreview';
import { heroContent, heroPills } from './content';

const PILL_ICONS = {
  shield: VerifiedIcon,
  timeline: TimelineIcon,
  groups: GroupsIcon,
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function HeroSection() {
  return (
    <Box component="section" sx={{ position: 'relative', overflow: 'hidden' }}>
      <AuroraBackground />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Box sx={{ px: 2, pt: { xs: 12, md: 18 }, pb: { xs: 8, md: 10 }, maxWidth: 880, mx: 'auto', textAlign: 'center' }}>
          <motion.div variants={item}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', mb: 4 }}>
              {heroPills.map(({ icon, label }) => {
                const Icon = PILL_ICONS[icon];
                return (
                  <Chip
                    key={label}
                    icon={<Icon sx={{ fontSize: 16 }} />}
                    label={label}
                    variant="outlined"
                    sx={{ height: 32, px: 1, borderRadius: '9999px', fontSize: '0.8125rem' }}
                  />
                );
              })}
            </Box>
          </motion.div>

          <motion.div variants={item}>
            <Typography
              sx={{
                fontSize: { xs: '0.85rem', md: '0.95rem' },
                fontWeight: 800,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'text.secondary',
                mb: 2,
              }}
            >
              {heroContent.tagline}
            </Typography>
          </motion.div>

          <motion.div variants={item}>
            <Typography
              component="h1"
              className="marketing-gradient-text"
              sx={{
                fontSize: { xs: '2.25rem', sm: '3rem', md: '3.75rem' },
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                mb: 3,
              }}
            >
              {heroContent.headline}
            </Typography>
          </motion.div>

          <motion.div variants={item}>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.15rem' }, mb: 5, maxWidth: 640, mx: 'auto' }}>
              {heroContent.subheadline}
            </Typography>
          </motion.div>

          <motion.div variants={item}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <GlowButton href={heroContent.primaryCta.href}>{heroContent.primaryCta.label}</GlowButton>
              <Button component={Link} href={heroContent.secondaryCta.href} variant="outlined" size="large" sx={{ px: 4, py: 1.5, fontSize: '1rem' }}>
                {heroContent.secondaryCta.label}
              </Button>
            </Box>
          </motion.div>
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <TrustScorePreview />
      </motion.div>
    </Box>
  );
}
