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
          left: '10%',
          width: 480,
          height: 480,
          background: 'radial-gradient(circle, var(--mui-palette-primary-main) 0%, transparent 70%)',
          opacity: { xs: 0.2, md: 0.3 },
        }}
      />
      <Box
        className="marketing-aurora"
        sx={{
          top: '-5%',
          right: '5%',
          width: 420,
          height: 420,
          background: 'radial-gradient(circle, var(--mui-palette-secondary-main) 0%, transparent 70%)',
          opacity: { xs: 0.15, md: 0.25 },
          animationDelay: '-6s',
        }}
      />
      <Box
        className="marketing-aurora"
        sx={{
          top: '15%',
          left: '40%',
          width: 360,
          height: 360,
          background: 'radial-gradient(circle, var(--mui-palette-success-main) 0%, transparent 70%)',
          opacity: { xs: 0.1, md: 0.15 },
          animationDelay: '-12s',
        }}
      />
      <Box className="marketing-grid-bg" sx={{ position: 'absolute', inset: 0 }} />
    </Box>
  );
}
