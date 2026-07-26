import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// Plain copyright line, not a full marketing-site footer — this is an
// authenticated back-office dashboard, it only needs to close out the page.
// Mirrors client-portal's PortalFooter; the logo mark matches
// DashboardSidebar's own inline mark (this app has no separate BrandMark
// component to import — the two frontends are separate Next.js apps, not
// sharing UI components outside the @2bready/ui-core package).
export default function AdminFooter() {
  return (
    <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 'auto' }}>
      <Box className="flex items-center justify-between flex-wrap" sx={{ px: { xs: 2, md: 3 }, py: 2.5, gap: 2 }}>
        <Box className="flex items-center gap-1.5">
          <Box sx={{ width: 16, height: 16, borderRadius: '4px', bgcolor: 'text.primary', flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} 2bReady — ADMIT Global Co., Ltd. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
