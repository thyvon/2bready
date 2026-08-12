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
import SecureSpinner from './SecureSpinner';
import GlowButton from './GlowButton';
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

      {/* Spinning gear (settings) — a subtle animated brand icon off to the side */}
      <Box
        aria-hidden
        className="marketing-spin"
        sx={{
          position: 'absolute',
          top: '16%',
          right: '12%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: { xs: 56, sm: 72, md: 88 },
          height: { xs: 56, sm: 72, md: 88 },
          borderRadius: '50%',
          bgcolor: 'color-mix(in srgb, var(--mui-palette-background-paper) 55%, transparent)',
          border: '1px solid',
          borderColor: 'color-mix(in srgb, var(--mui-palette-success-main) 30%, transparent)',
          boxShadow: '0 8px 24px -8px rgba(24,54,89,0.35)',
          backdropFilter: 'blur(6px)',
          color: 'success.main',
          opacity: 0.7,
          zIndex: 0,
          pointerEvents: 'none',
          animationDuration: '16s',
        }}
      >
        <SettingsIcon sx={{ fontSize: 'clamp(1.75rem, 1.5rem + 1vw, 2.5rem)' }} />
      </Box>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Box
          sx={{
            px: 'clamp(1rem, 0.5rem + 2vw, 2.5rem)',
            pt: 'clamp(120px, 100px + 6vw, 168px)',
            pb: 'clamp(4rem, 2.5rem + 5vw, 7rem)',
            maxWidth: 960,
            mx: 'auto',
            textAlign: 'center',
          }}
        >
          <motion.div variants={item}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', mb: 3.5 }}>
              {heroPills.map(({ icon, label }) => {
                const Icon = PILL_ICONS[icon];
                return (
                  <Chip
                    key={label}
                    icon={<Icon sx={{ fontSize: 18 }} />}
                    label={label}
                    variant="outlined"
                    sx={{
                      height: 'clamp(30px, 26px + 1vw, 38px)',
                      px: 1.5,
                      borderRadius: '9999px',
                      fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)',
                      fontWeight: 700,
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
                fontSize: 'clamp(0.8125rem, 0.75rem + 0.25vw, 0.9375rem)',
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'success.main',
                mb: 2.5,
              }}
            >
              {heroContent.tagline}
            </Typography>
          </motion.div>

          <motion.div variants={item}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: 'text.primary',
                textWrap: 'balance',
                mb: 3.5,
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
                fontSize: 'clamp(1.0625rem, 1rem + 0.4vw, 1.1875rem)',
                lineHeight: 1.6666,
                mb: 4.5,
                maxWidth: 640,
                mx: 'auto',
              }}
            >
              {heroContent.subheadline}
            </Typography>
          </motion.div>

          <motion.div variants={item}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mb: 5 }}>
              <GlowButton href={heroContent.primaryCta.href}>{heroContent.primaryCta.label}</GlowButton>
              <Button component={Link} href={heroContent.secondaryCta.href} variant="outlined" size="large" sx={{ px: 3.5, py: 1.5, fontSize: '0.9375rem', borderRadius: '999px', fontWeight: 700 }}>
                {heroContent.secondaryCta.label}
              </Button>
            </Box>
          </motion.div>

          {/* Hero digits — the reference site's hero stat blocks */}
          <motion.div variants={item}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: { xs: 3, sm: 5, md: 6 },
                flexWrap: 'wrap',
                pt: 3,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              {heroContent.digits.map((digit) => (
                <Box key={digit.label} sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 'clamp(2.25rem, 1.5rem + 3vw, 2.875rem)',
                      fontWeight: 800,
                      lineHeight: 1,
                      color: 'primary.main',
                      fontFamily: 'var(--font-plus-jakarta), var(--font-geist-sans), sans-serif',
                    }}
                  >
                    {digit.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 130, fontWeight: 600, textAlign: 'left' }}>
                    {digit.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
}
