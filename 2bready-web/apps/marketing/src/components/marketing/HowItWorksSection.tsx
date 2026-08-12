'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import VerifiedIcon from '@mui/icons-material/Verified';
import Reveal from './Reveal';
import { howItWorksContent, howItWorksSteps } from './content';

const STEP_ICONS = {
  account: HowToRegIcon,
  journey: RocketLaunchIcon,
  upload: UploadFileIcon,
  audit: FactCheckIcon,
  badge: VerifiedIcon,
};

export default function HowItWorksSection() {
  return (
    <Box component="section" id="how-it-works" sx={{ px: 'clamp(1rem, 0.5rem + 2vw, 2.5rem)', py: 'clamp(5rem, 3rem + 7vw, 9rem)', maxWidth: 1440, mx: 'auto' }}>
      <Reveal>
        <Typography
          variant="overline"
          sx={{ display: 'block', textAlign: 'center', color: 'success.main', fontWeight: 800, letterSpacing: '0.14em', mb: 1.5 }}
        >
          {howItWorksContent.kicker}
        </Typography>
        <Typography variant="h2" component="h2" sx={{ textAlign: 'center', textWrap: 'balance', mb: 2 }}>
          {howItWorksContent.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 720, mx: 'auto', mb: 'clamp(3rem, 2rem + 4vw, 5rem)' }}>
          {howItWorksContent.subtitle}
        </Typography>
      </Reveal>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 'clamp(1rem, 0.5rem + 1.5vw, 2rem)',
          alignItems: 'stretch',
        }}
      >
        {howItWorksSteps.map(({ icon, name, description }, i) => {
          const Icon = STEP_ICONS[icon];
          const number = String(i + 1).padStart(2, '0');

          return (
            <Box
              key={name}
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 1rem)', lg: '1 1 calc(33.333% - 1.4rem)' },
                maxWidth: { lg: 'calc(33.333% - 1.4rem)' },
                minWidth: { xs: '100%', sm: 0 },
              }}
            >
              <Reveal delay={i * 0.08} scale className="h-full">
                <Box
                  sx={{
                    position: 'relative',
                    height: '100%',
                    minHeight: { xs: '310px', sm: '400px', lg: '340px' },
                    p: 'clamp(1.5rem, 1rem + 1.5vw, 2.25rem)',
                    borderRadius: '16px',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 4px 12px 0 rgba(0,0,0,0.06)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: 'color-mix(in srgb, var(--mui-palette-success-main) 45%, transparent)',
                      boxShadow: '0 16px 36px -10px rgba(113,183,124,0.3)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: '16px',
                        bgcolor: 'color-mix(in srgb, var(--mui-palette-success-main) 14%, transparent)',
                        flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ fontSize: 28, color: 'success.main' }} />
                    </Box>
                    <Typography variant="h3" component="span" sx={{ fontWeight: 800, lineHeight: 1, color: 'color-mix(in srgb, var(--mui-palette-primary-main) 30%, transparent)' }}>
                      {number}
                    </Typography>
                  </Box>

                  <Typography variant="h5" component="h3" sx={{ fontWeight: 800, mb: 1.5 }}>
                    {name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6666 }}>
                    {description}
                  </Typography>
                </Box>
              </Reveal>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
