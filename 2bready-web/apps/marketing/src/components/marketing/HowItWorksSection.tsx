'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Reveal from './Reveal';
import { howItWorksContent, howItWorksSteps } from './content';

const STEP_ICONS = {
  account: HowToRegIcon,
  journey: RocketLaunchIcon,
  upload: UploadFileIcon,
  audit: FactCheckIcon,
  badge: EmojiEventsIcon,
};

export default function HowItWorksSection() {
  return (
    <Box component="section" id="how-it-works" sx={{ px: { xs: 2, md: 4 }, py: { xs: 10, md: 14 }, maxWidth: 1160, mx: 'auto' }}>
      <Reveal>
        <Typography variant="h2" component="h2" sx={{ textAlign: 'center', fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 1.5 }}>
          {howItWorksContent.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto', mb: { xs: 6, md: 9 } }}>
          {howItWorksContent.subtitle}
        </Typography>
      </Reveal>

      <Box sx={{ position: 'relative' }}>
        {/* Center timeline — desktop/tablet */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'block' },
            position: 'absolute',
            top: 8,
            bottom: 8,
            left: '50%',
            width: '3px',
            transform: 'translateX(-50%)',
            borderRadius: '3px',
            background:
              'linear-gradient(180deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-primary-main) 85%, var(--mui-palette-success-main) 100%)',
            opacity: 0.18,
          }}
        />

        {/* Mobile left rail */}
        <Box
          sx={{
            display: { xs: 'block', sm: 'none' },
            position: 'absolute',
            top: 8,
            bottom: 8,
            left: 24,
            width: '3px',
            borderRadius: '3px',
            bgcolor: 'primary.main',
            opacity: 0.18,
          }}
        />

        {howItWorksSteps.map(({ icon, name, description }, i) => {
          const Icon = STEP_ICONS[icon];
          const stepNumber = i + 1;
          const isLast = i === howItWorksSteps.length - 1;
          const isEven = i % 2 === 0;

          const connector = (
            <Box
              className="step-connector"
              sx={{
                display: { xs: 'none', sm: 'block' },
                width: { sm: 28, md: 36 },
                height: '2px',
                bgcolor: isLast ? 'success.main' : 'primary.main',
                opacity: 0.35,
                flexShrink: 0,
                transition: 'opacity 0.35s ease',
              }}
            />
          );

          const iconNode = (
            <Box
              className="step-icon-node"
              sx={{
                width: { xs: 48, sm: 60 },
                height: { xs: 48, sm: 60 },
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                bgcolor: 'background.paper',
                border: '1.5px solid',
                borderColor: isLast ? 'success.main' : 'primary.main',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                transition: 'all 0.35s ease',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Icon
                className="step-icon"
                sx={{
                  fontSize: { xs: 22, sm: 26 },
                  color: isLast ? 'success.main' : 'primary.main',
                  transition: 'all 0.35s ease',
                }}
              />
            </Box>
          );

          const card = isLast ? (
            <Box
              sx={{
                width: '100%',
                maxWidth: { sm: 460 },
                p: { xs: 3.5, md: 4.5 },
                borderRadius: '22px',
                border: '1px solid',
                borderColor: 'success.main',
                background: 'linear-gradient(135deg, rgba(22,163,74,0.06), rgba(22,163,74,0.01))',
                boxShadow: '0 8px 28px rgba(22,163,74,0.12)',
              }}
            >
              <Typography sx={{ fontSize: 32, mb: 1 }}>🏆</Typography>
              <Typography variant="h5" component="h3" sx={{ fontWeight: 800, mb: 1 }}>
                Ready to Go
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, mb: 2.5 }}>
                {description}
              </Typography>
              <Button
                variant="contained"
                color="success"
                endIcon={<ArrowForwardIcon className="cta-arrow" sx={{ transition: 'transform 0.3s ease' }} />}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3,
                  '&:hover .cta-arrow': { transform: 'translateX(4px)' },
                }}
              >
                Explore Dashboard
              </Button>
            </Box>
          ) : (
            <Box
              className="step-card"
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: { sm: 460 },
                p: { xs: 3.5, md: 4.5 },
                borderRadius: '22px',
                border: '1px solid',
                borderColor: 'divider',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                transition: 'transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease',
                '&:hover': {
                  transform: 'translateY(-7px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  borderColor: 'primary.main',
                },
              }}
            >
              <Typography
                sx={{
                  position: 'absolute',
                  top: { xs: -6, md: -12 },
                  right: { xs: 12, md: 18 },
                  fontSize: { xs: '4rem', md: '5.5rem' },
                  fontWeight: 800,
                  lineHeight: 1,
                  color: 'primary.main',
                  opacity: 0.07,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              >
                {String(stepNumber).padStart(2, '0')}
              </Typography>

              <Typography
                variant="h6"
                component="h3"
                sx={{ position: 'relative', fontWeight: 800, fontSize: { xs: '1.05rem', md: '1.2rem' }, mb: 1.25 }}
              >
                {name}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  position: 'relative',
                  lineHeight: 1.75,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {description}
              </Typography>
            </Box>
          );

          return (
            <Reveal key={name} delay={i * 0.08} x={isEven ? -40 : 40}>
              <Box
                sx={{
                  position: 'relative',
                  display: 'grid',
                  gridTemplateColumns: { xs: '48px 1fr', sm: '1fr auto 1fr' },
                  alignItems: 'center',
                  columnGap: { xs: 2, sm: 0 },
                  pb: isLast ? 0 : { xs: 3.5, sm: 5 },
                  '&:hover .step-icon-node': {
                    bgcolor: isLast ? 'success.main' : 'primary.main',
                    transform: 'scale(1.08)',
                  },
                  '&:hover .step-icon': {
                    color: isLast ? 'success.contrastText' : 'primary.contrastText',
                  },
                  '&:hover .step-connector': { opacity: 0.7 },
                }}
              >
                {/* Mobile */}
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>{iconNode}</Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>{card}</Box>

                {/* Desktop: left column */}
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'flex-end', alignItems: 'center' }}>
                  {isEven ? (
                    <>
                      {card}
                      {connector}
                    </>
                  ) : null}
                </Box>

                {/* Center node */}
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'center' }}>{iconNode}</Box>

                {/* Desktop: right column */}
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'flex-start', alignItems: 'center' }}>
                  {!isEven ? (
                    <>
                      {connector}
                      {card}
                    </>
                  ) : null}
                </Box>
              </Box>
            </Reveal>
          );
        })}
      </Box>
    </Box>
  );
}