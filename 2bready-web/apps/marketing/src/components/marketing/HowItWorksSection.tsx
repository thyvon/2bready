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
import SpotlightCard from './SpotlightCard';
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
    <Box component="section" id="how-it-works" sx={{ px: { xs: 2, md: 4 }, py: { xs: 10, md: 14 }, maxWidth: 900, mx: 'auto' }}>
      <Reveal>
        <Typography variant="h2" component="h2" sx={{ textAlign: 'center', fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 1.5 }}>
          {howItWorksContent.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto', mb: 8 }}>
          {howItWorksContent.subtitle}
        </Typography>
      </Reveal>

      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {howItWorksSteps.map(({ icon, name, description }, i) => {
          const Icon = STEP_ICONS[icon];
          const stepNumber = i + 1;
          const isFirst = i === 0;
          const isLast = i === howItWorksSteps.length - 1;

          return (
            <Reveal key={name} delay={i * 0.08}>
              <Box sx={{ display: 'flex', gap: { xs: 2.5, md: 3.5 } }}>
                {/* Node column: marker + connecting line */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: { xs: 48, md: 56 }, flexShrink: 0 }}>
                  <Box
                    sx={{
                      width: { xs: 48, md: 56 },
                      height: { xs: 48, md: 56 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      bgcolor: isFirst ? 'primary.main' : 'background.paper',
                      border: isFirst ? 'none' : '2px solid',
                      borderColor: isLast ? 'success.main' : 'primary.main',
                      boxShadow: isFirst ? 2 : 'none',
                    }}
                  >
                    <Icon
                      sx={{
                        fontSize: { xs: 20, md: 24 },
                        color: isFirst ? 'primary.contrastText' : isLast ? 'success.main' : 'primary.main',
                      }}
                    />
                  </Box>
                  {!isLast && (
                    <Box
                      sx={{
                        width: '2px',
                        flexGrow: 1,
                        minHeight: { xs: 32, md: 40 },
                        my: 1,
                        background: 'linear-gradient(to bottom, var(--mui-palette-primary-main), var(--mui-palette-divider))',
                        opacity: 0.5,
                      }}
                    />
                  )}
                </Box>

                {/* Content column */}
                <Box sx={{ flex: 1, pb: isLast ? 0 : { xs: 4, md: 5 } }}>
                  <SpotlightCard
                    tilt={false}
                    sx={isLast ? { borderColor: 'success.main' } : undefined}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        px: 1.25,
                        py: 0.5,
                        borderRadius: 5,
                        bgcolor: isLast ? 'success.main' : 'action.hover',
                        color: isLast ? 'success.contrastText' : 'text.secondary',
                        mb: 1.5,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {isLast ? 'Final Step' : `Step ${stepNumber}`}
                      </Typography>
                    </Box>

                    <Typography variant="h6" component="h3" sx={{ mb: 1, fontWeight: 700 }}>
                      {isLast ? 'Ready to Go' : name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {description}
                    </Typography>

                    {isLast && (
                      <Button
                        variant="contained"
                        color="success"
                        endIcon={<ArrowForwardIcon />}
                        sx={{ mt: 2.5, borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3 }}
                      >
                        Explore Dashboard
                      </Button>
                    )}
                  </SpotlightCard>
                </Box>
              </Box>
            </Reveal>
          );
        })}
      </Box>
    </Box>
  );
}