'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export interface RadialMeterProps {
  /** 0-100. */
  percent: number;
  size?: number;
  strokeWidth?: number;
  /** Defaults suit a light card surface — override both when the meter sits on a dark/premium card. */
  trackColor?: string;
  fillColor?: string;
  labelColor?: string;
}

// A single-ratio-against-a-limit meter, drawn as a ring rather than a bar —
// same "fill vs. track" contract as a linear meter (accent fill, muted
// track), just wrapped into a circle. Not a pie chart: there's only ever one
// measured slice (verified vs. remaining), so a wedge-comparison chart would
// be the wrong form here.
export function RadialMeter({
  percent,
  size = 64,
  strokeWidth = 6,
  trackColor = 'var(--mui-palette-action-selected)',
  fillColor = 'var(--mui-palette-text-primary)',
  labelColor,
}: RadialMeterProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: size * 0.22, color: labelColor }}>
          {percent}%
        </Typography>
      </Box>
    </Box>
  );
}
