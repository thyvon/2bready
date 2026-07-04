import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SchoolIcon from '@mui/icons-material/School';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaidIcon from '@mui/icons-material/Paid';
import LockIcon from '@mui/icons-material/Lock';
import Reveal from './Reveal';
import SpotlightCard from './SpotlightCard';
import { ecosystemContent, ecosystemPartners } from './content';

const ECOSYSTEM_ICONS = {
  consulting: SchoolIcon,
  commerce: ShoppingCartIcon,
  logistics: LocalShippingIcon,
  investment: PaidIcon,
};


const LEVEL_META: Record<
  keyof typeof ECOSYSTEM_ICONS,
  { level: number; badge: string }
> = {
  consulting: { level: 0, badge: 'Included from day one' },
  commerce: { level: 2, badge: 'Unlocks at L2 · Product Excellence' },
  logistics: { level: 3, badge: 'Unlocks at L3 · Operational Excellence' },
  investment: { level: 4, badge: 'Unlocks at L4 · Global Readiness' },
};

export default function EcosystemSection() {
  return (
    <Box component="section" id="ecosystem" sx={{ px: { xs: 2, md: 4 }, py: { xs: 10, md: 14 }, maxWidth: 900, mx: 'auto' }}>
      <Reveal>
        <Typography variant="h2" component="h2" sx={{ textAlign: 'center', fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 1.5 }}>
          {ecosystemContent.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto', mb: 8 }}>
          {ecosystemContent.subtitle}
        </Typography>
      </Reveal>

      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {ecosystemPartners.map(({ icon, name, description }, i) => {
          const Icon = ECOSYSTEM_ICONS[icon];
          const meta = LEVEL_META[icon];
          const isFoundation = meta.level === 0;
          const isLast = i === ecosystemPartners.length - 1;
          const strength = isFoundation ? 1 : Math.max(0.55, 1 - meta.level * 0.13);

          return (
            <Reveal key={name} delay={i * 0.08}>
              <Box sx={{ display: 'flex', gap: { xs: 2.5, md: 3.5 } }}>
                {/* Node column: marker + connecting line */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: { xs: 48, md: 56 }, flexShrink: 0 }}>
                  <Box
                    sx={{
                      width: { xs: 48, md: 56 },
                      height: { xs: 48, md: 56 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      bgcolor: isFoundation ? 'primary.main' : 'background.paper',
                      border: isFoundation ? 'none' : '2px solid',
                      borderColor: 'primary.main',
                      opacity: isFoundation ? 1 : strength,
                      boxShadow: isFoundation ? 2 : 'none',
                    }}
                  >
                    <Icon
                      sx={{
                        fontSize: { xs: 20, md: 24 },
                        color: isFoundation ? 'primary.contrastText' : 'primary.main',
                      }}
                    />
                  </Box>
                  {!isLast && (
                    <Box
                      sx={{
                        width: '2px',
                        flexGrow: 1,
                        minHeight: { xs: 32, md: 40 },
                        my: 1,
                        background: 'linear-gradient(to bottom, var(--mui-palette-primary-main), var(--mui-palette-divider))',
                        opacity: strength,
                      }}
                    />
                  )}
                </Box>

                {/* Content column */}
                <Box sx={{ flex: 1, pb: isLast ? 0 : { xs: 4, md: 5 } }}>
                  <SpotlightCard tilt={false}>
                    <Box sx={{ opacity: isFoundation ? 1 : Math.max(0.75, strength) }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.75,
                          px: 1.25,
                          py: 0.5,
                          borderRadius: 5,
                          bgcolor: isFoundation ? 'success.main' : 'action.hover',
                          color: isFoundation ? 'success.contrastText' : 'text.secondary',
                          mb: 1.5,
                        }}
                      >
                        {!isFoundation && <LockIcon sx={{ fontSize: 14 }} />}
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {meta.badge}
                        </Typography>
                      </Box>

                      <Typography variant="h6" component="h3" sx={{ mb: 1, fontWeight: 700 }}>
                        {name}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        {description}
                      </Typography>
                    </Box>
                  </SpotlightCard>
                </Box>
              </Box>
            </Reveal>
          );
        })}
      </Box>
    </Box>
  );
}