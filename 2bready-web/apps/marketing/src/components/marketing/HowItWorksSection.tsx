'use client';

import { useRef, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import VerifiedIcon from '@mui/icons-material/Verified';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import type { Easing } from 'framer-motion';
import Reveal from './Reveal';
import SpotlightCard from './SpotlightCard';
import { howItWorksContent, howItWorksSteps } from './content';

const STEP_ICONS = {
  account: HowToRegIcon,
  journey: RocketLaunchIcon,
  upload: UploadFileIcon,
  audit: FactCheckIcon,
  badge: VerifiedIcon,
};

const EASE: Easing = [0.22, 1, 0.36, 1];

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [dotTop, setDotTop] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start center', 'end center'],
  });

  const count = howItWorksSteps.length;

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const p = Math.min(1, Math.max(0, latest));
    const idx = Math.floor(p * count);
    setActive(Math.min(count - 1, idx));
  });

  useEffect(() => {
    const updateDot = () => {
      const stack = stackRef.current;
      const card = cardRefs.current[active];
      if (!stack || !card) return;
      setDotTop(card.offsetTop - stack.offsetTop + card.offsetHeight / 2 - 36);
    };

    updateDot();
    const ro = new ResizeObserver(updateDot);
    if (stackRef.current) ro.observe(stackRef.current);
    window.addEventListener('resize', updateDot);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateDot);
    };
  }, [active]);

  return (
    <Box ref={sectionRef} component="section" id="how-it-works" sx={{ px: { xs: 2, md: 4 }, py: { xs: 10, md: 16 }, maxWidth: 1200, mx: 'auto' }}>
      <Reveal>
        <Typography
          variant="overline"
          sx={{ display: 'block', textAlign: 'center', color: 'success.main', fontWeight: 800, letterSpacing: '0.16em', mb: 1 }}
        >
          The journey
        </Typography>
        <Typography variant="h2" component="h2" sx={{ textAlign: 'center', fontSize: { xs: '1.5rem', md: '1.9rem' }, mb: 1.5 }}>
          {howItWorksContent.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto', mb: 8, fontSize: { xs: '0.9rem', md: '1rem' } }}>
          {howItWorksContent.subtitle}
        </Typography>
      </Reveal>

      <Box sx={{ position: 'relative' }}>
        {/* Static cards stacked vertically */}
        <Box
          ref={stackRef}
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: { xs: 2.5, md: 3 },
            pt: { xs: 3, md: 4 },
            pr: { xs: 6, md: 9 },
          }}
        >
          {/* Vertical progress line on the right side */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: { xs: 20, md: 32 },
              width: { xs: 3, md: 4 },
              borderRadius: 999,
              bgcolor: 'divider',
              opacity: 0.5,
              zIndex: 0,
            }}
          >
            <motion.div
              animate={{ top: dotTop }}
              transition={{ type: 'spring', stiffness: 120, damping: 24 }}
              style={{
                position: 'absolute',
                right: -3,
                top: 0,
                width: 10,
                height: 72,
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(180deg, #71B77C, #31867E)',
                  boxShadow:
                    '0 0 8px 2px rgba(113,183,124,0.55), 0 0 18px 4px rgba(49,134,126,0.4), 0 0 32px 8px rgba(49,134,126,0.25)',
                }}
              />
            </motion.div>
          </Box>

          {howItWorksSteps.map(({ icon, name, description }, i) => {
            const Icon = STEP_ICONS[icon];
            const isActive = i === active;

            return (
              <Box
                key={i}
                ref={(el: HTMLDivElement | null) => {
                  cardRefs.current[i] = el;
                }}
                sx={{
                  width: '100%',
                  maxWidth: { xs: '100%', md: 850 },
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 2.5, md: 3.5 },
                }}
              >                {/* Icon tile outside the card, on the left */}
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    width: { xs: 48, md: 60 },
                    height: { xs: 48, md: 60 },
                    borderRadius: '16px',
                    bgcolor: isActive
                      ? 'success.main'
                      : 'color-mix(in srgb, var(--mui-palette-success-main) 12%, transparent)',
                    boxShadow: isActive
                      ? '0 10px 24px -8px rgba(87,158,99,0.6), 0 0 0 5px color-mix(in srgb, var(--mui-palette-success-main) 16%, transparent)'
                      : '0 2px 8px rgba(16,24,40,0.08)',
                    transition: 'background-color 0.4s ease, box-shadow 0.4s ease',
                  }}
                >
                  <Icon
                    sx={{
                      fontSize: { xs: 22, md: 28 },
                      color: isActive ? '#FFFFFF' : 'success.main',
                      transition: 'color 0.4s ease',
                    }}
                  />
                </Box>

                <SpotlightCard
                  tilt
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    p: { xs: 3, md: 4 },
                    boxShadow: isActive
                      ? '0 2px 4px rgba(16,24,40,0.06), 0 8px 24px rgba(16,24,40,0.08), 0 24px 56px -12px rgba(113,183,124,0.3), 0 0 24px -6px rgba(113,183,124,0.18)'
                      : '0 1px 2px rgba(16,24,40,0.05), 0 4px 12px rgba(16,24,40,0.06), 0 16px 40px -12px rgba(16,24,40,0.14)',
                    transition: 'box-shadow 0.4s ease, background-color 0.4s ease',
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="h3" component="h3" sx={{ fontSize: { xs: '1rem', md: '1.1rem' }, fontWeight: 800, mb: 1 }}>
                      {name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: { xs: '0.85rem', md: '0.95rem' }, textAlign: 'left' }}>
                      {description}
                    </Typography>
                  </Box>
                </SpotlightCard>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
