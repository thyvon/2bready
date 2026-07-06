'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Reveal from './Reveal';
import GlowButton from './GlowButton';
import { ctaContent } from './content';

export default function CtaSection() {
  return (
    <Box component="section" sx={{ px: { xs: 2, md: 4 }, py: { xs: 10, md: 14 } }}>
      <Reveal>
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            maxWidth: 1000,
            mx: 'auto',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
            px: { xs: 3, md: 8 },
            py: { xs: 6, md: 9 },
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--mui-palette-primary-main) 8%, transparent), color-mix(in srgb, var(--mui-palette-secondary-main) 8%, transparent))',
          }}
        >
          <Box className="marketing-grid-bg" sx={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h2" component="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 2 }}>
              {ctaContent.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 480, mx: 'auto' }}>
              {ctaContent.description}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <GlowButton href={ctaContent.primaryCta.href}>{ctaContent.primaryCta.label}</GlowButton>
              <Button component={Link} href={ctaContent.secondaryCta.href} variant="outlined" size="large" sx={{ px: 4, py: 1.5, fontSize: '1rem' }}>
                {ctaContent.secondaryCta.label}
              </Button>
            </Box>
          </Box>
        </Box>
      </Reveal>
    </Box>
  );
}
