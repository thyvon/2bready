'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import VerifiedIcon from '@mui/icons-material/Verified';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ShieldIcon from '@mui/icons-material/Shield';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

// A mock "verified trust certificate" card for the hero — the product's payoff.
// Pure presentational; the real certificates ship in the audit domain.
export default function HeroVisual() {
  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 420, mx: 'auto' }}>
      {/* Certificate card */}
      <Box
        sx={{
          position: 'relative',
          borderRadius: '24px',
          bgcolor: 'background.paper',
          boxShadow:
            '0 2px 4px rgba(16,24,40,0.05), 0 8px 24px rgba(16,24,40,0.07), 0 28px 60px -16px rgba(113,183,124,0.2), 0 0 28px -8px rgba(113,183,124,0.12)',
          p: 3,
        }}
      >
        {/* Top bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2.5, borderBottom: '1px dashed', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 34,
                height: 34,
                borderRadius: '10px',
                bgcolor: 'primary.main',
              }}
            >
              <ShieldIcon sx={{ fontSize: 20, color: 'primary.contrastText' }} />
            </Box>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 800, lineHeight: 1.1, color: 'text.primary' }}>
                2bReady
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Trust Certificate
              </Typography>
            </Box>
          </Box>
          <QrCode2Icon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.85 }} />
        </Box>

        {/* Body */}
        <Box sx={{ py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: 'color-mix(in srgb, var(--mui-palette-success-main) 18%, transparent)',
              }}
            >
              <VerifiedIcon sx={{ fontSize: 26, color: 'success.main' }} />
            </Box>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 800, lineHeight: 1.15, color: 'text.primary' }}>
                Verified Trust Badge
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Level 4 · Global Readiness
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This company has passed independent master-auditor verification and is certified investment & export ready.
          </Typography>

          {/* Meta row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              Verified by ADMIT Global
            </Typography>
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.25,
                py: 0.4,
                borderRadius: 999,
                bgcolor: 'color-mix(in srgb, var(--mui-palette-success-main) 15%, transparent)',
                color: 'success.main',
                fontWeight: 800,
                fontSize: '0.7rem',
              }}
            >
              <WorkspacePremiumIcon sx={{ fontSize: 14 }} />
              PUBLICLY VERIFIABLE
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Floating verified chip */}
      <Box
        sx={{
          position: 'absolute',
          top: -16,
          right: -14,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 0.75,
          borderRadius: 999,
          bgcolor: 'success.main',
          color: '#10243C',
          fontWeight: 800,
          fontSize: '0.8rem',
          boxShadow: '0 10px 24px -8px rgba(87,158,99,0.6)',
        }}
      >
        <VerifiedIcon sx={{ fontSize: 18 }} />
        Verified
      </Box>
    </Box>
  );
}
