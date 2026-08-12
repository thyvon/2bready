'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import BrandMark from '@/components/marketing/BrandMark';
import BrandLogo from '@/components/marketing/BrandLogo';
import AuroraBackground from '@/components/marketing/AuroraBackground';
import { useThemeBrandLogo } from '@/lib/branding';
import { footerContent, footerColumns } from '@/components/marketing/content';

// The footer logo uses the dedicated footer slot (a different design from
// the main logo), themed like the rest of the page.
export default function MarketingFooter() {
  const logoUrl = useThemeBrandLogo('footer', 'footerDark');

  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        color: 'text.secondary',
        px: 'clamp(1rem, 0.5rem + 2vw, 2.5rem)',
        py: 'clamp(4rem, 2.5rem + 5vw, 6.5rem)',
      }}
    >
      {/* Animated brand aurora + grid — the same platform background as the hero */}
      <Box sx={{ position: 'absolute', inset: 0, opacity: { xs: 0.35, md: 0.5 }, pointerEvents: 'none' }}>
        <AuroraBackground />
      </Box>

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.6fr 1fr 1fr 1fr' },
          gap: 'clamp(2rem, 1rem + 3vw, 4rem)',
          width: '100%',
          maxWidth: 1440,
          mx: 'auto',
        }}
      >
        <Box sx={{ maxWidth: 300 }}>
          <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, letterSpacing: '-0.02em', mb: 1.5, color: 'text.primary' }}>
            <BrandLogo
              logoUrl={logoUrl}
              height={24}
              maxWidth={110}
              fallback={<BrandMark size={20} />}
            />
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
            {footerContent.tagline}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {footerContent.poweredBy}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Business Development Center (BDC), 11th Floor,
            OCIC Boulevard, Phnom Penh, Cambodia
          </Typography>
        </Box>

        {footerColumns.map((col) => (
          <Box key={col.title}>
            <Typography variant="overline" sx={{ display: 'block', mb: 2, color: 'success.main', fontWeight: 800, letterSpacing: '0.14em' }}>
              {col.title}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {col.items.map((item) =>
                'href' in item ? (
                  <Typography
                    key={item.label}
                    component={Link}
                    href={item.href}
                    variant="body2"
                    sx={{ color: 'text.primary', textDecoration: 'none', width: 'fit-content', '&:hover': { color: 'success.main' } }}
                  >
                    {item.label}
                  </Typography>
                ) : (
                  <Typography key={item.label} variant="body2" sx={{ color: 'text.primary' }}>
                    {item.label}
                  </Typography>
                )
              )}
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 6, borderTop: '1px solid', borderColor: 'divider', pt: 3 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center' }}>
          {footerContent.copyright}
        </Typography>
      </Box>
    </Box>
  );
}
