'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import GavelIcon from '@mui/icons-material/Gavel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Reveal from './Reveal';
import SpotlightCard from './SpotlightCard';
import { stakeholdersContent, stakeholders } from './content';

const STAKEHOLDER_ICONS = {
  sme: StorefrontIcon,
  banks: AccountBalanceIcon,
  government: GavelIcon,
  investors: TrendingUpIcon,
};

// Theme-aware accent roles so cards stay readable in both light & dark mode.
const STAKEHOLDER_ACCENTS = {
  sme: 'var(--mui-palette-primary-main)',
  banks: 'var(--mui-palette-info-main)',
  government: 'var(--mui-palette-primary-dark)',
  investors: 'var(--mui-palette-success-dark)',
};

function StakeholderCard({
  index,
  icon,
  title,
  description,
  cta,
  delay,
}: {
  index: number;
  icon: keyof typeof STAKEHOLDER_ICONS;
  title: string;
  description: string;
  cta: { label: string; href: string };
  delay: number;
}) {
  const Icon = STAKEHOLDER_ICONS[icon];
  const accent = STAKEHOLDER_ACCENTS[icon];
  const number = String(index + 1).padStart(2, '0');

  return (
    <Reveal delay={delay} y={0} x={40} scale>
      <Box sx={{ height: '100%' }}>
        <SpotlightCard
          tilt={false}
          sx={{
            height: '100%',
            p: 'clamp(1.25rem, 0.875rem + 1.5vw, 2rem)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 12px 24px -8px color-mix(in srgb, ${accent} 30%, transparent)`,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '16px',
                bgcolor: `color-mix(in srgb, ${accent} 14%, transparent)`,
                flexShrink: 0,
              }}
            >
              <Icon sx={{ fontSize: 28, color: accent }} />
            </Box>
            <Typography variant="h4" component="span" sx={{ fontWeight: 800, color: `color-mix(in srgb, ${accent} 40%, transparent)`, lineHeight: 1 }}>
              {number}
            </Typography>
          </Box>

          <Typography variant="h5" component="h3" sx={{ fontWeight: 800, mb: 1.5 }}>
            {title}
          </Typography>          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 3, flex: 1 }}>
            {description}
          </Typography>

          <Button
            component={Link}
            href={cta.href}
            endIcon={<ArrowForwardIcon sx={{ fontSize: 20 }} />}
            sx={{
              alignSelf: 'flex-start',
              px: 0,
              color: accent,
              fontWeight: 800,
              fontSize: '1rem',
              '&:hover': { bgcolor: 'transparent', opacity: 0.8 },
            }}
          >
            {cta.label}
          </Button>
        </SpotlightCard>
      </Box>
    </Reveal>
  );
}

export default function StakeholdersSection() {
  return (
    <Box component="section" id="stakeholders" sx={{ bgcolor: 'background.default', py: 'clamp(4.5rem, 3rem + 6vw, 8rem)' }}>
      <Box sx={{ px: 'clamp(1rem, 0.5rem + 2vw, 2.5rem)', maxWidth: 1440, mx: 'auto' }}>
      <Reveal>
        <Box sx={{ maxWidth: 760, mx: 'auto', textAlign: 'center', mb: 'clamp(3rem, 2rem + 3vw, 4.5rem)' }}>
          <Typography
            variant="overline"
            sx={{ display: 'block', color: 'success.main', fontWeight: 800, letterSpacing: '0.14em', mb: 1.5 }}
          >
            {stakeholdersContent.kicker}
          </Typography>
          <Typography variant="h2" component="h2" sx={{ textAlign: 'center', textWrap: 'balance', mb: 2 }}>
            {stakeholdersContent.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {stakeholdersContent.subtitle}
          </Typography>
        </Box>
      </Reveal>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 'clamp(1rem, 0.5rem + 2vw, 2rem)',
          alignItems: 'stretch',
          width: '100%',
        }}
      >
        {stakeholders.map(({ icon, title, description, cta }, i) => (
          <StakeholderCard key={title} index={i} icon={icon} title={title} description={description} cta={cta} delay={i * 0.08} />
        ))}
      </Box>
      </Box>
    </Box>
  );
}
