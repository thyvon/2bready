'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CheckIcon from '@mui/icons-material/Check';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsIcon from '@mui/icons-material/Settings';
import PublicIcon from '@mui/icons-material/Public';
import Reveal from './Reveal';
import SpotlightCard from './SpotlightCard';
import GlowButton from './GlowButton';
import { pricingContent } from './content';
import { usePublicPricing } from './usePublicPricing';

const PLAN_ICONS = {
  compliance: DescriptionIcon,
  product: AutoAwesomeIcon,
  operational: SettingsIcon,
  global: PublicIcon,
};

export default function PricingSection() {
  const pricingPlans = usePublicPricing();

  return (
    <Box component="section" id="pricing" sx={{ bgcolor: 'background.default', py: { xs: 10, md: 14 } }}>
      <Box sx={{ px: { xs: 2, md: 4 }, maxWidth: 1440, mx: 'auto' }}>
      <Reveal>
        <Typography variant="h2" component="h2" sx={{ textAlign: 'center', fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 1.5 }}>
          {pricingContent.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto', mb: 7 }}>
          {pricingContent.subtitle}
        </Typography>
      </Reveal>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        {pricingPlans.map((plan, i) => {
          const Icon = PLAN_ICONS[plan.icon];
          return (
            <Reveal key={plan.level} delay={i * 0.08} scale>
              <Box sx={{ height: '100%' }}>
                <SpotlightCard sx={{ height: '100%' }}>
                  <Chip
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Icon sx={{ fontSize: 16 }} />
                        {`${plan.level}: ${plan.name}`}
                      </Box>
                    }
                    size="small"
                    sx={{
                      alignSelf: 'flex-start',
                      mb: 3,
                      fontWeight: 600,
                      height: 'auto',
                      py: 0.5,
                      bgcolor: 'color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent)',
                      color: 'primary.main',
                      '& .MuiChip-label': { display: 'flex', alignItems: 'center', px: 0.5 },
                    }}
                  />

                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                    <Typography variant="h3" component="span" sx={{ fontWeight: 800 }}>
                      {plan.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {plan.period}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: plan.price === '$0' ? 'success.main' : 'text.secondary', fontWeight: 600, mb: 3, display: 'block' }}
                  >
                    {plan.fee}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                    {plan.description}
                  </Typography>

                  <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mb: 4 }}>
                    {plan.features.map((feature) => (
                      <Box component="li" key={feature} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.25 }}>
                        <CheckIcon sx={{ fontSize: 16, color: 'success.main', mt: 0.25 }} />
                        <Typography variant="body2" color="text.secondary">
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ mt: 'auto' }}>
                    <GlowButton href={plan.cta.href} size="medium">
                      {plan.cta.label}
                    </GlowButton>
                  </Box>
                </SpotlightCard>
              </Box>
            </Reveal>
          );
        })}
      </Box>
      </Box>
    </Box>
  );
}