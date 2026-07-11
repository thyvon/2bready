'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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

const STAKEHOLDER_ACCENTS = {
  sme: '#2563eb',
  banks: '#16a34a',
  government: '#0f172a',
  investors: '#ca8a04',
};

function StakeholderCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: keyof typeof STAKEHOLDER_ICONS;
  title: string;
  description: string;
  delay: number;
}) {
  const Icon = STAKEHOLDER_ICONS[icon];
  const accent = STAKEHOLDER_ACCENTS[icon];

  return (
    <Reveal delay={delay} y={0} x={40}>
      <Box sx={{ height: '100%' }}>
        <SpotlightCard
          tilt={false}
          sx={{
            height: '100%',
            p: { xs: 3, md: 4 },
            borderLeft: '3px solid',
            borderLeftColor: accent,
            transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-left-color 0.25s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 12px 24px -8px ${accent}33`,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: '10px',
                bgcolor: `${accent}1a`,
                flexShrink: 0,
              }}
            >
              <Icon sx={{ fontSize: 24, color: accent }} />
            </Box>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {description}
          </Typography>
        </SpotlightCard>
      </Box>
    </Reveal>
  );
}

export default function StakeholdersSection() {
  return (
    <Box component="section" id="stakeholders" sx={{ px: { xs: 2, md: 4 }, py: { xs: 10, md: 14 }, maxWidth: 1200, mx: 'auto' }}>
      <Reveal>
        <Box sx={{ maxWidth: 640, mx: 'auto', textAlign: 'center', mb: { xs: 5, sm: 6 } }}>
          <Typography variant="h2" component="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 1.5 }}>
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
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: { xs: 3, md: 4 },
          alignItems: 'stretch',
          maxWidth: 900,
          mx: 'auto',
        }}
      >
        {stakeholders.map(({ icon, title, description }, i) => (
          <StakeholderCard key={title} icon={icon} title={title} description={description} delay={i * 0.08} />
        ))}
      </Box>
    </Box>
  );
}