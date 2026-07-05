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
  return (
    <Reveal delay={delay}>
      <SpotlightCard>
        <Icon sx={{ fontSize: 28, mb: 2, color: 'primary.main' }} />
        <Typography variant="h6" component="h3" sx={{ mb: 1, fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </SpotlightCard>
    </Reveal>
  );
}

export default function StakeholdersSection() {
  // Split into a top pair and a bottom pair, sandwiching the heading in the middle.
  const [topPair, bottomPair] = [stakeholders.slice(0, 2), stakeholders.slice(2, 4)];

  return (
    <Box component="section" id="stakeholders" sx={{ px: { xs: 2, md: 4 }, py: { xs: 10, md: 14 }, maxWidth: 1100, mx: 'auto' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: 3,
          mb: { xs: 5, sm: 6 },
        }}
      >
        {topPair.map(({ icon, title, description }, i) => (
          <StakeholderCard key={title} icon={icon} title={title} description={description} delay={i * 0.08} />
        ))}
      </Box>

      <Reveal>
        <Box sx={{ maxWidth: 640, mx: 'auto', textAlign: 'center', my: { xs: 4, sm: 5 } }}>
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
          gap: 3,
          mt: { xs: 5, sm: 6 },
        }}
      >
        {bottomPair.map(({ icon, title, description }, i) => (
          <StakeholderCard key={title} icon={icon} title={title} description={description} delay={i * 0.08} />
        ))}
      </Box>
    </Box>
  );
}