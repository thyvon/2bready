import type { ComponentType } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SpeedIcon from '@mui/icons-material/Speed';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import FolderCopyIcon from '@mui/icons-material/FolderCopy';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import GroupsIcon from '@mui/icons-material/Groups';
import ShareIcon from '@mui/icons-material/Share';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import FlagIcon from '@mui/icons-material/Flag';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BlockIcon from '@mui/icons-material/Block';
import Reveal from './Reveal';
import SpotlightCard from './SpotlightCard';
import { features, featuresContent } from './content';

type FeatureIconKey = (typeof features)[number]['icon'];

const FEATURE_ICONS: Record<FeatureIconKey, ComponentType<SvgIconProps>> = {
  userManagement: ManageAccountsIcon,
  dashboard: SpeedIcon,
  journey: AltRouteIcon,
  dataCenter: FolderCopyIcon,
  audit: FactCheckIcon,
  auditors: GroupsIcon,
  dataRoom: ShareIcon,
  sop: DescriptionIcon,
};

// ---- small inline mockups for a few cards ----

function MiniBarChart() {
  const heights = [30, 55, 40, 70, 50, 85, 60];
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, height: 80, mt: 2.5 }}>
      {heights.map((h, i) => (
        <Box
          key={i}
          sx={{
            flex: 1,
            height: `${h}%`,
            borderRadius: '4px 4px 0 0',
            bgcolor: i === 5 ? 'primary.main' : 'action.selected',
          }}
        />
      ))}
    </Box>
  );
}

function FileStack() {
  return (
    <Box sx={{ display: 'flex', gap: 1.25, mt: 2.5 }}>
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          sx={{
            width: 34,
            height: 42,
            borderRadius: '4px',
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            transform: `rotate(${(i - 1.5) * 6}deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <InsertDriveFileIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
        </Box>
      ))}
    </Box>
  );
}

function StepGrid() {
  const icons = [CheckIcon, ArrowForwardIcon, FlagIcon, BlockIcon];
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mt: 2.5, maxWidth: 220 }}>
      {icons.map((Icon, i) => (
        <Box
          key={i}
          sx={{
            aspectRatio: '1 / 1',
            borderRadius: 1.5,
            bgcolor: i === 0 ? 'primary.main' : 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ fontSize: 16, color: i === 0 ? 'primary.contrastText' : 'text.disabled' }} />
        </Box>
      ))}
    </Box>
  );
}

function SearchPreview() {
  return (
    <Box
      sx={{
        mt: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        p: 1.25,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.75, borderRadius: 1.5, bgcolor: 'background.paper' }}>
        <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
        <Typography variant="caption" color="text.secondary">
          Search compliance docs…
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.75, mt: 1, flexWrap: 'wrap' }}>
        {['Q4_Report.pdf', 'ESG_Audit.pdf'].map((f) => (
          <Box
            key={f}
            sx={{
              px: 1,
              py: 0.4,
              borderRadius: 1,
              bgcolor: 'action.hover',
              fontSize: '0.7rem',
              color: 'text.secondary',
            }}
          >
            {f}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

const MOCKUPS: Partial<Record<FeatureIconKey, ComponentType>> = {
  dashboard: MiniBarChart,
  dataCenter: FileStack,
  journey: StepGrid,
  dataRoom: SearchPreview,
};

// Explicit column layout — controls exactly which card sits under which,
// instead of relying on the browser's auto-balancing CSS multi-column flow.
// Each inner array is one column, listed top to bottom.
const COLUMN_LAYOUT: FeatureIconKey[][] = [
  ['userManagement', 'dashboard', 'audit'],
  ['journey', 'dataCenter'],
  ['auditors', 'dataRoom', 'sop'],
];

export default function FeaturesSection() {
  const featureByIcon = new Map(features.map((f) => [f.icon, f]));

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

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: '24px',
        }}
      >
        {COLUMN_LAYOUT.map((columnIconKeys, colIndex) => (
          <Box
            key={colIndex}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              flex: 1,
              minWidth: 0,
            }}
          >
            {columnIconKeys.map((iconKey, rowIndex) => {
              const feature = featureByIcon.get(iconKey);
              if (!feature) return null;

              const { icon, title, description } = feature;
              const Icon = FEATURE_ICONS[icon];
              const Mockup = MOCKUPS[icon];

              return (
                <Reveal key={title} delay={rowIndex * 0.08 + colIndex * 0.04}>
                  <SpotlightCard tilt={false}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'action.hover',
                        mb: 2,
                      }}
                    >
                      <Icon sx={{ fontSize: 22, color: 'primary.main' }} />
                    </Box>

                    <Typography variant="h6" component="h3" sx={{ mb: 1, fontWeight: 700 }}>
                      {title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {description}
                    </Typography>

                    {Mockup && <Mockup />}
                  </SpotlightCard>
                </Reveal>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}