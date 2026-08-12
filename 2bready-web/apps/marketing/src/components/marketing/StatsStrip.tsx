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
    <Box component="section" id="stats" sx={{ bgcolor: 'background.default', py: 'clamp(4rem, 2.5rem + 5vw, 7rem)' }}>
      <Box sx={{ px: 'clamp(1rem, 0.5rem + 2vw, 2.5rem)', maxWidth: 1440, mx: 'auto' }}>
        <Reveal>
          <Typography
            variant="overline"
            sx={{ display: 'block', textAlign: 'center', color: 'success.main', fontWeight: 800, letterSpacing: '0.14em', mb: 1.5 }}
          >
            {statsContent.kicker}
          </Typography>
          <Typography variant="h2" component="h2" sx={{ textAlign: 'center', textWrap: 'balance', mb: 2 }}>
            {statsContent.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 680, mx: 'auto', mb: 'clamp(2.5rem, 1.5rem + 3vw, 4rem)' }}>
            {statsContent.subtitle}
          </Typography>
        </Reveal>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 'clamp(1rem, 0.5rem + 1.5vw, 2rem)',
          }}
        >
          {statsContent.stats.map((stat, i) => {
            const Icon = STAT_ICONS[stat.icon];
            return (
              <Reveal key={stat.label} delay={i * 0.08} scale>
                <Box
                  sx={{
                    height: '100%',
                    p: 'clamp(1.5rem, 1rem + 1.5vw, 2.25rem)',
                    borderRadius: '16px',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 4px 12px 0 rgba(0,0,0,0.06)',
                    textAlign: 'center',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: 'color-mix(in srgb, var(--mui-palette-success-main) 45%, transparent)',
                      boxShadow: '0 12px 28px -8px rgba(113,183,124,0.3)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      mx: 'auto',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '14px',
                      bgcolor: 'color-mix(in srgb, var(--mui-palette-success-main) 14%, transparent)',
                    }}
                  >
                    <Icon sx={{ fontSize: 28, color: 'success.main' }} />
                  </Box>

                  <Typography
                    component="p"
                    sx={{
                      fontWeight: 800,
                      color: 'primary.main',
                      fontSize: 'clamp(2rem, 1.5rem + 2.25vw, 2.875rem)',
                      lineHeight: 1,
                      mb: 1.5,
                      fontFamily: 'var(--font-plus-jakarta), var(--font-geist-sans), sans-serif',
                    }}
                  >
                    {stat.value}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1.5, minHeight: '2.6em' }}>
                    {stat.label}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                    <Box
                      component="span"
                      sx={{
                        px: 1.25,
                        py: 0.5,
                        borderRadius: 999,
                        bgcolor: 'color-mix(in srgb, var(--mui-palette-success-main) 15%, transparent)',
                        color: 'success.main',
                        fontWeight: 800,
                        fontSize: '0.8125rem',
                      }}
                    >
                      {stat.growth}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
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
