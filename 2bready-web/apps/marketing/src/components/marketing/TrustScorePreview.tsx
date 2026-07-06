import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { trustScorePreviewContent } from './content';

export default function TrustScorePreview() {
  const { score, levels, activeLevels, caption } = trustScorePreviewContent;

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', px: 2, pb: { xs: 8, md: 12 } }}>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '20px',
          bgcolor: 'background.paper',
          boxShadow: '0 24px 60px -20px rgba(0,0,0,0.15)',
          p: { xs: 3, md: 4 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 120,
            height: 120,
            borderRadius: '50%',
            flexShrink: 0,
            background: `conic-gradient(var(--mui-palette-primary-main) 0deg ${(score / 100) * 360}deg, var(--mui-palette-divider) ${(score / 100) * 360}deg 360deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ width: 96, height: 96, borderRadius: '50%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{score}%</Typography>
            <Typography variant="caption" color="text.secondary">Audit-ready</Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, width: '100%' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Compliance journey
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {levels.map((level, i) => (
              <Box key={level} sx={{ flex: 1 }}>
                <Box
                  sx={{
                    height: 6,
                    borderRadius: 4,
                    bgcolor: i < activeLevels ? 'primary.main' : 'divider',
                    opacity: i < activeLevels ? 1 - i * 0.15 : 1,
                    mb: 0.75,
                  }}
                />
                <Typography variant="caption" color="text.secondary">{level}</Typography>
              </Box>
            ))}
          </Box>
          <Typography variant="body2" sx={{ mt: 2, fontWeight: 500 }}>
            {caption}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
