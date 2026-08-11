'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import VerifiedIcon from '@mui/icons-material/Verified';
import PublicIcon from '@mui/icons-material/Public';
import AuroraBackground from './AuroraBackground';
import GlowButton from './GlowButton';
import HeroVisual from './HeroVisual';
import Parallax from './Parallax';
import { heroContent, heroPills } from './content';

const PILL_ICONS = {
  shield: VerifiedIcon,
  globe: PublicIcon,
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
    <Box component="section" sx={{ position: 'relative', overflow: 'hidden', mt: { xs: '-56px', md: '-64px' } }}>
      <AuroraBackground />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 4 },
            pt: { xs: '104px', md: '128px' },
            pb: { xs: 8, md: 12 },
            maxWidth: 1200,
            mx: 'auto',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
            gap: { xs: 6, md: 8 },
            alignItems: 'center',
          }}
        >
          <Box>
            <motion.div variants={item}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 1.5, flexWrap: 'wrap', mb: 3.5 }}>
                {heroPills.map(({ icon, label }) => {
                  const Icon = PILL_ICONS[icon];
                  return (
                    <Chip
                      key={label}
                      icon={<Icon sx={{ fontSize: 16 }} />}
                      label={label}
                      variant="outlined"
                      sx={{
                        height: 32,
                        px: 1,
                        borderRadius: '9999px',
                        fontSize: '0.8125rem',
                        borderColor: 'color-mix(in srgb, var(--mui-palette-primary-main) 25%, transparent)',
                        color: 'text.primary',
                        bgcolor: 'color-mix(in srgb, var(--mui-palette-background-paper) 60%, transparent)',
                        backdropFilter: 'blur(8px)',
                      }}
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
                  color: 'success.main',
                  mb: 2,
                  textAlign: { xs: 'center', md: 'left' },
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
                  fontSize: { xs: '2.25rem', sm: '3rem', md: '3.5rem' },
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  mb: 3,
                  textAlign: { xs: 'center', md: 'left' },
                }}
              >
                {heroContent.headline}
              </Typography>
            </motion.div>

            <motion.div variants={item}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  mb: 4.5,
                  maxWidth: 560,
                  textAlign: { xs: 'center', md: 'left' },
                }}
              >
                {heroContent.subheadline}
              </Typography>
            </motion.div>

            <motion.div variants={item}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 2, flexWrap: 'wrap' }}>
                <GlowButton href={heroContent.primaryCta.href}>{heroContent.primaryCta.label}</GlowButton>
                <Button component={Link} href={heroContent.secondaryCta.href} variant="outlined" size="large" sx={{ px: 4, py: 1.5, fontSize: '1rem', borderRadius: '999px' }}>
                  {heroContent.secondaryCta.label}
                </Button>
              </Box>
            </motion.div>
          </Box>

          <motion.div variants={item} style={{ display: 'flex', justifyContent: 'center' }}>
            <Parallax speed={0.9}>
              <HeroVisual />
            </Parallax>
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
}
