'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CLIENT_NAV, isNavItemActive } from './nav-items';

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <Box
      component="nav"
      sx={{
        width: 240,
        flexShrink: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
      className="flex flex-col p-4 gap-1"
    >
      <Typography variant="h6" className="px-2 mb-4" sx={{ fontWeight: 700 }}>
        2bReady
      </Typography>
      {CLIENT_NAV.map((item) => {
        const active = isNavItemActive(pathname, item);
        return (
          <Box
            key={item.href}
            component={Link}
            href={item.href}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1,
              borderRadius: 2,
              textDecoration: 'none',
              color: active ? 'primary.main' : 'text.secondary',
              bgcolor: active ? 'action.selected' : 'transparent',
              fontWeight: active ? 600 : 500,
              transition: 'background-color 0.15s ease, color 0.15s ease',
              '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
            }}
          >
            {item.icon}
            <Typography variant="body2" component="span" sx={{ fontWeight: 'inherit', color: 'inherit' }}>
              {item.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
