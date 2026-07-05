import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Reveal from './Reveal';
import { journeyContent, journeyLevels } from './content';

const GROUP_COLOR_VAR: Record<string, string> = {
  Comply: 'var(--mui-palette-primary-main)',
  Scale: 'var(--mui-palette-secondary-main)',
  Lead: 'var(--mui-palette-success-main)',
};

export default function JourneySection() {
  return (
    <Box component="section" sx={{ px: { xs: 2, md: 4 }, py: { xs: 10, md: 14 }, maxWidth: 1100, mx: 'auto' }}>
      <Reveal>
        <Typography variant="h2" component="h2" sx={{ textAlign: 'center', fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 1.5 }}>
          {journeyContent.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 620, mx: 'auto', mb: 8 }}>
          {journeyContent.subtitle}
        </Typography>
      </Reveal>

      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute',
            top: 28,
            left: '12.5%',
            right: '12.5%',
            height: 2,
            background: `linear-gradient(90deg, ${GROUP_COLOR_VAR.Comply}, ${GROUP_COLOR_VAR.Scale}, ${GROUP_COLOR_VAR.Lead})`,
            opacity: 0.25,
          }}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 4 }}>
          {journeyLevels.map((l, i) => (
            <Reveal key={l.level} delay={i * 0.1}>
              <Box sx={{ textAlign: { xs: 'left', md: 'center' } }}>
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: { xs: 0, md: 'auto' },
                    mb: 2,
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: '#fff',
                    bgcolor: GROUP_COLOR_VAR[l.group],
                    boxShadow: `0 8px 20px -6px color-mix(in srgb, ${GROUP_COLOR_VAR[l.group]} 50%, transparent)`,
                  }}
                >
                  {l.level}
                </Box>
                <Typography
                  variant="overline"
                  sx={{ color: GROUP_COLOR_VAR[l.group], fontWeight: 700, display: 'block', mb: 0.5 }}
                >
                  {l.group}
                </Typography>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {l.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {l.description}
                </Typography>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
