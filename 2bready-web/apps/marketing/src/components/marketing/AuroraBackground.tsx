import Box from '@mui/material/Box';
import VerifiedIcon from '@mui/icons-material/Verified';
import ShieldIcon from '@mui/icons-material/Shield';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

const FLOATERS = [
  { icon: 'verified', top: '14%', left: '12%', right: 'auto', size: 42, delay: '0s', duration: '11s' },
  { icon: 'shield', top: '22%', left: 'auto', right: '10%', size: 36, delay: '-3s', duration: '13s' },
  { icon: 'premium', top: '46%', left: '6%', right: 'auto', size: 30, delay: '-6s', duration: '10s' },
  { icon: 'verified', top: '58%', left: 'auto', right: '16%', size: 34, delay: '-2s', duration: '12s' },
  { icon: 'shield', top: '72%', left: '16%', right: 'auto', size: 26, delay: '-8s', duration: '14s' },
  { icon: 'premium', top: '80%', left: 'auto', right: '26%', size: 32, delay: '-4s', duration: '11s' },
] as const;

const FLOAT_ICONS = {
  verified: VerifiedIcon,
  shield: ShieldIcon,
  premium: WorkspacePremiumIcon,
};

export default function AuroraBackground() {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        maskImage: 'linear-gradient(to bottom, black, transparent)',
      }}
    >
      <Box
        className="marketing-aurora"
        sx={{
          top: '-10%',
          left: '8%',
          width: 520,
          height: 520,
          background: 'radial-gradient(circle, var(--mui-palette-primary-main) 0%, transparent 70%)',
          opacity: { xs: 0.28, md: 0.42 },
        }}
      />
      <Box
        className="marketing-aurora"
        sx={{
          top: '-8%',
          right: '4%',
          width: 460,
          height: 460,
          background: 'radial-gradient(circle, var(--mui-palette-secondary-main) 0%, transparent 70%)',
          opacity: { xs: 0.3, md: 0.45 },
          animationDelay: '-6s',
        }}
      />
      <Box
        className="marketing-aurora"
        sx={{
          top: '18%',
          left: '38%',
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, var(--mui-palette-info-main) 0%, transparent 70%)',
          opacity: { xs: 0.18, md: 0.28 },
          animationDelay: '-12s',
        }}
      />
      {/* Floating brand-trust marks — the platform's own visual identity in motion */}
      {FLOATERS.map((f, i) => {
        const Icon = FLOAT_ICONS[f.icon];
        return (
          <Box
            key={i}
            className="marketing-floater"
            sx={{
              position: 'absolute',
              top: f.top,
              left: f.left,
              right: f.right,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: f.size,
              height: f.size,
              borderRadius: '50%',
              bgcolor: 'color-mix(in srgb, var(--mui-palette-background-paper) 55%, transparent)',
              border: '1px solid',
              borderColor: 'color-mix(in srgb, var(--mui-palette-success-main) 30%, transparent)',
              boxShadow: '0 8px 24px -8px rgba(24,54,89,0.35)',
              backdropFilter: 'blur(6px)',
              color: 'success.main',
              animationDuration: f.duration,
              animationDelay: f.delay,
            }}
          >
            <Icon sx={{ fontSize: f.size * 0.55 }} />
          </Box>
        );
      })}
    </Box>
  );
}
