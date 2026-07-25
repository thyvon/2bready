'use client';

import Box from '@mui/material/Box';
import { motion } from 'framer-motion';

export interface PillToggleOption<K extends string = string> {
  key: K;
  label: string;
}

export interface PillToggleProps<K extends string = string> {
  options: PillToggleOption<K>[];
  value: K;
  onChange: (key: K) => void;
  // Must be unique per rendered instance on the page — framer-motion
  // animates the sliding highlight between whichever elements currently
  // share this id.
  layoutId: string;
}

// Segmented pill filter with an animated sliding highlight (framer-motion
// `layoutId`) — extracted after the identical box-per-option pattern was
// hand-written twice (client-portal's journey and audits pages), one of
// them missing the animation entirely. One component now; both call sites
// get the same look and motion.
export function PillToggle<K extends string = string>({ options, value, onChange, layoutId }: PillToggleProps<K>) {
  return (
    <Box className="flex items-center gap-1.5" sx={{ flexWrap: 'wrap' }}>
      {options.map((option) => (
        <Box
          key={option.key}
          onClick={() => onChange(option.key)}
          sx={{
            position: 'relative',
            // Establishes its own stacking context so the pill's z-index:-1
            // below is scoped to this chip only — without this, -1 escapes
            // to the nearest ancestor stacking context and paints behind a
            // parent's own background, making the pill (and its text)
            // invisible.
            zIndex: 0,
            cursor: 'pointer',
            userSelect: 'none',
            px: 1.5,
            py: 0.5,
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            color: value === option.key ? 'background.paper' : 'text.secondary',
            '&:hover': value === option.key ? {} : { color: 'text.primary' },
          }}
        >
          {value === option.key ? (
            <Box
              component={motion.div}
              layoutId={layoutId}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              sx={{ position: 'absolute', inset: 0, borderRadius: '9999px', bgcolor: 'text.primary', zIndex: -1 }}
            />
          ) : (
            <Box sx={{ position: 'absolute', inset: 0, borderRadius: '9999px', bgcolor: 'action.selected', zIndex: -1 }} />
          )}
          {option.label}
        </Box>
      ))}
    </Box>
  );
}
