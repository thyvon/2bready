'use client';

import Box from '@mui/material/Box';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';

// L1-L4 map to Bronze/Silver/Gold/Platinum in the real taxonomy — used as a
// fallback for levels that don't have an uploaded medal image yet.
const LEVEL_MEDAL_COLOR: Record<string, string> = { L1: '#CD7F32', L2: '#9CA3AF', L3: '#D4AF37', L4: '#60A5FA' };

export interface LevelMedalProps {
  code: string;
  /** Signed URL from the API — absent/null falls back to the colored-circle + icon. */
  imageUrl?: string | null;
  size?: number;
}

export function LevelMedal({ code, imageUrl, size = 32 }: LevelMedalProps) {
  if (imageUrl) {
    return (
      <Box
        component="img"
        src={imageUrl}
        alt={code}
        sx={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }

  const color = LEVEL_MEDAL_COLOR[code] ?? '#9CA3AF';
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <MilitaryTechIcon sx={{ color: 'white', fontSize: size * 0.625 }} />
    </Box>
  );
}
