'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import Reveal from './Reveal';
import { statsContent } from './content';

const STAT_ICONS = {
  companies: StorefrontIcon,
  badges: WorkspacePremiumIcon,
  auditors: ManageAccountsIcon,
  audits: FactCheckIcon,
};

export default function StatsStrip() {
  return (
    <Box component="section" id="stats" sx={{ bgcolor: 'background.default', py: { xs: 8, md: 12 } }}>
      <Box sx={{ px: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Reveal>
        <Typography
          variant="overline"
          sx={{ display: 'block', textAlign: 'center', color: 'success.main', fontWeight: 800, letterSpacing: '0.16em', mb: 1 }}
        >
          {statsContent.kicker}
        </Typography>
        <Typography variant="h2" component="h2" sx={{ textAlign: 'center', fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 1.5 }}>
          {statsContent.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto', mb: 6 }}>
          {statsContent.subtitle}
        </Typography>
      </Reveal>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: { xs: 2, md: 3 },
        }}
      >
        {statsContent.stats.map((stat, i) => {
          const Icon = STAT_ICONS[stat.icon];
          return (
            <Reveal key={stat.label} delay={i * 0.08} scale>
              <Box
                sx={{
                  position: 'relative',
                  height: '100%',
                  p: { xs: 2.5, md: 3.5 },
                  borderRadius: '20px',
                  bgcolor: 'background.paper',
                  boxShadow:
                    '0 1px 2px rgba(16,24,40,0.05), 0 4px 12px rgba(16,24,40,0.06), 0 16px 40px -12px rgba(16,24,40,0.14)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow:
                      '0 2px 4px rgba(16,24,40,0.06), 0 8px 24px rgba(16,24,40,0.08), 0 24px 56px -12px rgba(113,183,124,0.3), 0 0 24px -6px rgba(113,183,124,0.18)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      bgcolor: 'color-mix(in srgb, var(--mui-palette-success-main) 15%, transparent)',
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ fontSize: 22, color: 'success.main' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
                    {stat.label}
                  </Typography>
                </Box>

                <Typography variant="h3" component="p" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 0.5 }}>
                  {stat.value}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    component="span"
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 999,
                      bgcolor: 'color-mix(in srgb, var(--mui-palette-success-main) 15%, transparent)',
                      color: 'success.main',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                    }}
                  >
                    {stat.growth}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    vs last year
                  </Typography>
                </Box>
              </Box>
            </Reveal>
          );
        })}
      </Box>
      </Box>
    </Box>
  );
}
