'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { useTranslation } from '@/lib/i18n';

export interface JourneyHeroProps {
  /** % verified across every level in this company's journey. */
  overallPct: number;
  /** The highest level currently unlocked (subscription + progress), e.g. "L1". */
  currentLevel: string;
  /** Total documents still not verified across every level. */
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

// Ported from client-portal's TrustJourneyHero (components/dashboard) so a
// company's workspace Overview opens the same way the company itself sees
// its own dashboard — same navy+gold "hero moment", same real numbers, just
// framed as staff looking at this company rather than "your" journey.
export function JourneyHero({ overallPct, currentLevel, pendingDocs }: JourneyHeroProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        p: { xs: 3, md: 4 },
        background: 'linear-gradient(135deg, #0b1a33 0%, #16305c 100%)',
        color: '#fff',
      }}
    >
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
            {t('journey.hero_eyebrow')}
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', md: '2rem' }, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            <Box component="span" sx={{ color: '#fff' }}>
              {t('journey.hero_word_comply')}
            </Box>{' '}
            <Box component="span" sx={{ color: '#f0b429' }}>
              {t('journey.hero_word_scale')}
            </Box>{' '}
            <Box component="span" sx={{ color: '#fff' }}>
              {t('journey.hero_word_lead')}
            </Box>
          </Typography>
          <Typography sx={{ mt: 0.5, maxWidth: 480, color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem' }}>
            {t('journey.hero_subtitle')}
          </Typography>
        </Box>

        <Box className="flex items-center gap-2.5" sx={{ flexShrink: 0 }}>
          <StatTile value={`${overallPct}%`} label={t('journey.audit_ready')} />
          <StatTile value={currentLevel} label={t('journey.trust_level')} />
          <StatTile value={String(pendingDocs)} label={t('journey.pending')} />
        </Box>
      </Box>
    </Box>
  );
}
