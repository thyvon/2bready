'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import BrandMark from '@/components/marketing/BrandMark';
import { footerContent, footerColumns } from '@/components/marketing/content';

export default function MarketingFooter() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        px: { xs: 2, md: 4 },
        py: 6,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 6,
          maxWidth: 1200,
          mx: 'auto',
        }}
      >
        <Box sx={{ maxWidth: 280 }}>
          <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, letterSpacing: '-0.02em', mb: 1 }}>
            <BrandMark size={20} />
            2bReady
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {footerContent.tagline}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {footerContent.poweredBy}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {footerColumns.map((col) => (
            <Box key={col.title}>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                {col.title}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {col.items.map((item) =>
                  'href' in item ? (
                    <Typography
                      key={item.label}
                      component={Link}
                      href={item.href}
                      variant="body2"
                      sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'text.primary' } }}
                    >
                      {item.label}
                    </Typography>
                  ) : (
                    <Typography key={item.label} variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                  )
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', textAlign: 'center', mt: 6 }}
      >
        {footerContent.copyright}
      </Typography>
    </Box>
  );
}