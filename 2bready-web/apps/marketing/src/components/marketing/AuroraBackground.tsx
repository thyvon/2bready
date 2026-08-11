import Box from '@mui/material/Box';

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
      <Box className="marketing-grid-bg" sx={{ position: 'absolute', inset: 0 }} />
    </Box>
  );
}
