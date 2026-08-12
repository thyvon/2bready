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
    <Box component="section" id="pricing" sx={{ bgcolor: 'background.default', py: 'clamp(4.5rem, 3rem + 6vw, 8rem)' }}>
      <Box sx={{ px: 'clamp(1rem, 0.5rem + 2vw, 2.5rem)', maxWidth: 1440, mx: 'auto' }}>
      <Reveal>
        <Typography
          variant="overline"
          sx={{ display: 'block', textAlign: 'center', color: 'success.main', fontWeight: 800, letterSpacing: '0.14em', mb: 1.5 }}
        >
          {pricingContent.kicker}
        </Typography>
        <Typography variant="h2" component="h2" sx={{ textAlign: 'center', textWrap: 'balance', mb: 2 }}>
          {pricingContent.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 720, mx: 'auto', mb: 'clamp(3rem, 2rem + 3vw, 4.5rem)' }}>
          {pricingContent.subtitle}
        </Typography>
      </Reveal>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 'clamp(1rem, 0.5rem + 2vw, 1.75rem)',
          alignItems: 'stretch',
        }}
      >
        {pricingPlans.map((plan, i) => {
          const Icon = PLAN_ICONS[plan.icon];
          return (
            <Reveal key={plan.level} delay={i * 0.08} scale>
              <Box sx={{ height: '100%' }}>
                <SpotlightCard sx={{ height: '100%', p: 'clamp(1.25rem, 0.875rem + 1.5vw, 2rem)' }}>
                  <Chip
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Icon sx={{ fontSize: 18 }} />
                        {`${plan.level}: ${plan.name}`}
                      </Box>
                    }
                    size="small"
                    sx={{
                      alignSelf: 'flex-start',
                      mb: 3.5,
                      fontWeight: 700,
                      height: 'auto',
                      py: 0.75,
                      fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)',
                      bgcolor: 'color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent)',
                      color: 'primary.main',
                      '& .MuiChip-label': { display: 'flex', alignItems: 'center', px: 0.75 },
                    }}
                  />

                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                    <Typography variant="h3" component="span" sx={{ fontWeight: 900, fontSize: 'clamp(1.375rem, 1.25rem + 0.75vw, 1.75rem)' }}>
                      {plan.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {plan.period}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ color: plan.priceCents === 0 ? 'success.main' : 'text.secondary', fontWeight: 700, mb: 3, display: 'block' }}
                  >
                    {plan.fee}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1rem', mb: 3, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                    {plan.description}
                  </Typography>

                  <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mb: 4 }}>
                    {plan.features.map((feature) => (
                      <Box component="li" key={feature} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                        <CheckIcon sx={{ fontSize: 18, color: 'success.main', mt: 0.25 }} />
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