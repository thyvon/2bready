'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedIcon from '@mui/icons-material/Verified';
import ShieldIcon from '@mui/icons-material/Shield';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import Reveal from './Reveal';
import { ctaContent } from './content';
import { clientPortalUrl } from '@/lib/client-portal-url';

const TRUST_MARKERS = [
  { icon: ShieldIcon, label: 'Bank-grade security' },
  { icon: VerifiedIcon, label: 'Master-auditor verified' },
  { icon: WorkspacePremiumIcon, label: 'Public trust badge' },
];

export default function CtaSection() {
  return (
    <Box component="section" id="cta" sx={{ px: 'clamp(1rem, 0.5rem + 2vw, 2.5rem)', py: 'clamp(4rem, 2.5rem + 4.5vw, 6.5rem)', maxWidth: 1440, mx: 'auto' }}>
      <Reveal>
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            textAlign: 'center',
            py: 'clamp(5rem, 3rem + 8vw, 9rem)',
            px: 'clamp(1.25rem, 0.75rem + 3vw, 3.5rem)',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, #183659, #10243C)',
            boxShadow: '0 24px 60px -20px rgba(24,54,89,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-40%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 640,
              height: 640,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(113,183,124,0.28) 0%, transparent 65%)',
              pointerEvents: 'none',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-50%',
              right: '-10%',
              width: 560,
              height: 560,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(49,134,126,0.3) 0%, transparent 65%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Chip
            icon={<WorkspacePremiumIcon sx={{ fontSize: 17 }} />}
            label="Start building your digital trust today"
            sx={{
              position: 'relative',
              mb: 3.5,
              fontWeight: 800,
              borderRadius: '999px',
              fontSize: '0.875rem',
              color: '#CDE6D1',
              bgcolor: 'rgba(113,183,124,0.14)',
              border: '1px solid rgba(113,183,124,0.3)',
            }}
          />

          <Typography
            variant="h2"
            component="h2"
            sx={{ position: 'relative', fontWeight: 800, textWrap: 'balance', fontSize: 'clamp(2rem, 1.375rem + 2.75vw, 3.125rem)', letterSpacing: '-0.02em', lineHeight: 1.15, mb: 2.5, color: '#ffffff' }}
          >
            {ctaContent.title}
          </Typography>
          <Typography
            variant="body1"
            sx={{ position: 'relative', maxWidth: 640, mx: 'auto', mb: 'clamp(2rem, 1.5rem + 2vw, 3rem)', fontSize: 'clamp(0.9375rem, 0.9rem + 0.3vw, 1.0625rem)', lineHeight: 1.6, color: 'rgba(226,234,241,0.92)' }}
          >
            {ctaContent.subtitle}
          </Typography>

          <Box sx={{ position: 'relative', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', gap: 2, mb: 6 }}>
            <Button
              component={Link}
              href={ctaContent.cta.href}
              variant="contained"
              color="success"
              endIcon={<ArrowForwardIcon />}
              sx={{
                px: 5.5,
                py: 1.5,
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 900,
                fontSize: '1rem',
                boxShadow: '0 12px 32px -8px rgba(87,158,99,0.6)',
                '&:hover': { backgroundColor: '#579E63', transform: 'translateY(-1px)' },
              }}
            >
              {ctaContent.cta.label}
            </Button>
            <Button
              component={Link}
              href={clientPortalUrl('/login')}
              variant="outlined"
              sx={{
                px: 5.5,
                py: 1.5,
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '1rem',
                color: '#ffffff',
                borderColor: 'rgba(226,234,241,0.35)',
                '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.06)' },
              }}
            >
              Client Portal
            </Button>
          </Box>

          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: { xs: 2.5, md: 5 }, flexWrap: 'wrap' }}>
            {TRUST_MARKERS.map(({ icon: Icon, label }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon sx={{ fontSize: 19, color: '#71B77C' }} />
                <Typography variant="body2" sx={{ color: 'rgba(226,234,241,0.85)', fontWeight: 700 }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Reveal>
    </Box>
  );
}
