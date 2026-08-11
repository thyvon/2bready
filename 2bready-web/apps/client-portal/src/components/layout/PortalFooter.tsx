'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BrandLogo } from '@2bready/ui-core';
import { BrandMark } from './BrandMark';
import { useThemeBrandLogo } from '@/lib/branding';

// Plain copyright line, not the marketing site's fuller footer (sitemap
// columns, social links, etc.) — this is an authenticated dashboard, not a
// landing page, so it only needs to close out the page, not sell anything.
// The footer logo uses the dedicated footer slot (a different design from
// the main logo) and, like the navbar logo, fills the strip's height with
// the smallest possible margin.
export function PortalFooter() {
  const logoUrl = useThemeBrandLogo('footer', 'footerDark');

  return (
    <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 'auto' }}>
      <Box
        className="flex items-center justify-between flex-wrap"
        sx={{ maxWidth: 1440, width: '100%', mx: 'auto', px: { xs: 2, md: 4 }, py: 1.5, gap: 2 }}
      >
        <Box className="flex items-center gap-1.5">
          <BrandLogo
            logoUrl={logoUrl}
            height={28}
            maxWidth={120}
            fallback={<BrandMark size={16} />}
          />
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} 2bReady — ADMIT Global Co., Ltd. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}