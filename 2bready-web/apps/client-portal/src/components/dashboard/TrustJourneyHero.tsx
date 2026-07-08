'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';

export interface TrustJourneyHeroProps {
  /** Overall % verified across every level — honestly 0 until real verification exists. */
  overallPct: number;
  /** The current active level code, e.g. "L1". */
  currentLevel: string;
  /** Total documents still pending across every level. */
  pendingDocs: number;
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.25,
        borderRadius: '8px',
        bgcolor: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
        minWidth: 76,
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: '1.375rem', color: '#f0b429', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
        {label}
      </Typography>
    </Box>
  );
}

// A deliberate departure from the rest of the app's monochrome+blue
// chrome — this is the one "hero moment" on the dashboard, matching the
// navy+gold reference the owner shared, not a template for other pages.
// Real numbers throughout (0% / L1 / pendingDocs computed from the actual
// taxonomy), not the reference mockup's own placeholder figures.
export function TrustJourneyHero({ overallPct, currentLevel, pendingDocs }: TrustJourneyHeroProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        // Matches the theme's own MuiCard override (SectionCard etc.) — one
        // radius token across every card-shaped surface, not a one-off value.
        borderRadius: '8px',
        p: { xs: 3, md: 4 },
        background: 'linear-gradient(135deg, #0b1a33 0%, #16305c 100%)',
        color: '#fff',
      }}
    >
      {/* Two quiet radial glows, echoing the reference's subtle depth —
          decorative only, clipped by the card's own overflow:hidden. */}
      <Box sx={{ position: 'absolute', top: -80, right: 40, width: 260, height: 260, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: -100, right: 200, width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

      <Box className="flex flex-col md:flex-row md:items-start md:justify-between gap-4" sx={{ position: 'relative' }}>
        <Box sx={{ minWidth: 0 }}>
          <Box
            className="flex items-center gap-1 w-fit"
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#f0b429',
              bgcolor: 'rgba(255,255,255,0.08)',
              px: 1.25,
              py: 0.5,
              borderRadius: '9999px',
              mb: 1.5,
            }}
          >
            <FlagOutlinedIcon sx={{ fontSize: '0.8125rem' }} />
            Your Trust Journey
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', md: '2rem' }, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            <Box component="span" sx={{ color: '#fff' }}>
              Comply.
            </Box>{' '}
            <Box component="span" sx={{ color: '#f0b429' }}>
              Scale.
            </Box>{' '}
            <Box component="span" sx={{ color: '#fff' }}>
              Lead.
            </Box>
          </Typography>
          <Typography sx={{ mt: 0.5, maxWidth: 480, color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem' }}>
            Build a resilient, audit-ready foundation. Automate operations. Become a legacy brand.
          </Typography>
        </Box>

        <Box className="flex items-center gap-2.5" sx={{ flexShrink: 0 }}>
          <StatTile value={`${overallPct}%`} label="Audit Ready" />
          <StatTile value={currentLevel} label="Trust Level" />
          <StatTile value={String(pendingDocs)} label="Pending" />
        </Box>
      </Box>
    </Box>
  );
}
