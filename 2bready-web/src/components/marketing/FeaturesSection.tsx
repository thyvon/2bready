import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SpeedIcon from '@mui/icons-material/Speed';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import FolderCopyIcon from '@mui/icons-material/FolderCopy';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import GroupsIcon from '@mui/icons-material/Groups';
import ShareIcon from '@mui/icons-material/Share';
import DescriptionIcon from '@mui/icons-material/Description';
import Reveal from './Reveal';
import SpotlightCard from './SpotlightCard';
import { features, featuresContent } from './content';

const FEATURE_ICONS = {
  userManagement: ManageAccountsIcon,
  dashboard: SpeedIcon,
  journey: AltRouteIcon,
  dataCenter: FolderCopyIcon,
  audit: FactCheckIcon,
  auditors: GroupsIcon,
  dataRoom: ShareIcon,
  sop: DescriptionIcon,
};

export default function FeaturesSection() {
  return (
    <Box component="section" id="features" sx={{ px: { xs: 2, md: 4 }, py: { xs: 10, md: 14 }, maxWidth: 1200, mx: 'auto' }}>
      <Reveal>
        <Typography variant="h2" component="h2" sx={{ textAlign: 'center', fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 1.5 }}>
          {featuresContent.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 560, mx: 'auto', mb: 7 }}>
          {featuresContent.subtitle}
        </Typography>
      </Reveal>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
        {features.map(({ icon, title, description }, i) => {
          const Icon = FEATURE_ICONS[icon];
          return (
            <Reveal key={title} delay={(i % 4) * 0.08}>
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
        })}
      </Box>
    </Box>
  );
}
