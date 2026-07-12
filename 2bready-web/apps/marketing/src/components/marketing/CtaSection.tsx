'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Reveal from './Reveal';
import { ctaContent } from './content';

export default function CtaSection() {
  return (
    <Box component="section" id="cta" sx={{ px: { xs: 2, md: 4 }, py: { xs: 8, md: 10 } }}>
      <Reveal>
        <Box
  sx={{
    position: 'relative',
    overflow: 'hidden',
    maxWidth: 900,
    mx: 'auto',
    textAlign: 'center',
    py: { xs: 6, md: 8 },
    px: { xs: 3, md: 6 },
    borderRadius: '24px',
    border: '1px solid',
    borderColor: 'rgba(255,255,255,0.14)',
    background: 'linear-gradient(135deg, rgba(37,99,235,0.10), rgba(255,255,255,0.03))',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-150%',
      width: '60%',
      height: '100%',
      background:
        'linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
      transform: 'skewX(-20deg)',
      animation: 'ctaShine 2.2s ease-in-out infinite',
      pointerEvents: 'none',
    },
    '@keyframes ctaShine': {
      '0%': { left: '-150%' },
      '100%': { left: '150%' },
    },
  }}
>
          <Typography
            variant="h3"
            component="h2"
            sx={{ position: 'relative', fontWeight: 800, fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 1.5 }}
          >
            {ctaContent.title}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ position: 'relative', maxWidth: 560, mx: 'auto', mb: 4 }}
          >
            {ctaContent.subtitle}
          </Typography>
          <Button
            component={Link}
            href={ctaContent.cta.href}
            fullWidth
            variant="contained"
            color="primary"
            endIcon={<ArrowForwardIcon />}
            sx={{
              position: 'relative',
              maxWidth: 360,
              mx: 'auto',
              py: 1.5,
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'flex',
            }}
          >
            {ctaContent.cta.label}
          </Button>
        </Box>
      </Reveal>
    </Box>
  );
}