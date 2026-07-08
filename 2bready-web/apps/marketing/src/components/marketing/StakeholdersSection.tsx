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
            borderLeft: '3px solid',
            borderLeftColor: accent,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Icon sx={{ fontSize: 22, color: accent }} />
            <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
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
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        {stakeholders.map(({ icon, title, description }, i) => (
          <StakeholderCard key={title} icon={icon} title={title} description={description} delay={i * 0.08} />
        ))}
      </Box>
    </Box>
  );
}