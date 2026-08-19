'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';

// Thin indeterminate progress bar pinned to the very top of the app shell.
// Client-side navigation in Next.js is instant (prefetched) but each page
// still loads its data asynchronously, so a brief sweep gives the user
// "something is happening" feedback without unmounting anything or resetting
// scroll — the same lightweight touch the rest of the SPA already relies on
// (silent in-place refreshes everywhere, never a full-page spinner).
//
// On every pathname change it sweeps in (~500ms) then fades out and unmounts,
// so the bar is only ever visible while a navigation is actually in flight.
// Route changes within the same page (e.g. tab clicks inside a company
// workspace) also re-trigger it, which reads as intended feedback.
export function TopProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  // Tracks how long the bar has been on screen. A slow page loads data via
  // silent client-side fetches that don't drive this component, so the sweep
  // alone would hide too early on genuinely slow routes — holding it for a
  // beat (~700ms) keeps the feedback meaningful without parking the bar.
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimer();
    setVisible(true);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      hideTimer.current = null;
    }, 700);
    return clearTimer;
  }, [pathname, clearTimer]);

  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 2000,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{
              scaleX: [0, 0.7, 1],
              transition: { duration: 0.45, ease: 'easeInOut' },
            }}
            exit={{ opacity: 0, transition: { duration: 0.25, ease: 'easeOut' } }}
            style={{
              height: '100%',
              transformOrigin: 'left',
              background:
                'linear-gradient(90deg, var(--mui-palette-primary-main), color-mix(in srgb, var(--mui-palette-primary-main) 60%, var(--mui-palette-secondary-main)))',
            }}
          />
        )}
      </AnimatePresence>
    </Box>
  );
}
