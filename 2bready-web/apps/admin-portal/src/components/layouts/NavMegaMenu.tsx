'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { isNavItemActive, type NavGroupEntry } from '@/components/layouts/nav-items';

// Long enough that moving the cursor from the trigger down into the panel
// (crossing the small gap between them) doesn't flicker-close it, short
// enough that it doesn't feel sticky.
const CLOSE_DELAY_MS = 150;

interface NavMegaMenuProps {
  group: NavGroupEntry;
}

export default function NavMegaMenu({ group }: NavMegaMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // State, not a ref — Popper's anchorEl needs to trigger a re-render once
  // it's set, which a ref wouldn't do anyway; reading ref.current directly
  // during render is also unsafe on its own terms (React's rules of refs).
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groupActive = group.items.some((item) => isNavItemActive(pathname, item));

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  return (
    <Box onMouseEnter={() => { cancelClose(); setOpen(true); }} onMouseLeave={scheduleClose}>
      <Button
        ref={setAnchorEl}
        onClick={() => setOpen((v) => !v)}
        endIcon={<KeyboardArrowDownIcon fontSize="small" sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />}
        sx={{
          color: groupActive ? 'text.primary' : 'text.secondary',
          fontWeight: groupActive ? 600 : 500,
          fontSize: '0.875rem',
          textTransform: 'none',
          px: 1.5,
          py: 0.75,
          borderRadius: 999,
          bgcolor: groupActive ? 'var(--2br-nav-active-bg)' : 'transparent',
          '&:hover': { bgcolor: 'var(--2br-overlay-hover)', color: 'text.primary' },
        }}
      >
        {group.label}
      </Button>

      <Popper open={open} anchorEl={anchorEl} placement="bottom-start" sx={{ zIndex: 20 }} modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}>
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            elevation={0}
            sx={{
              minWidth: 320,
              p: 1,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 16px 40px -12px rgba(0,0,0,0.18)',
              bgcolor: 'background.paper',
            }}
          >
            {group.items.map((item) => {
              const active = isNavItemActive(pathname, item);

              return (
                <Box
                  key={item.href}
                  component={Link}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    p: 1.25,
                    borderRadius: 2,
                    textDecoration: 'none',
                    bgcolor: active ? 'var(--2br-nav-active-bg)' : 'transparent',
                    '&:hover': { bgcolor: 'var(--2br-overlay-hover)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      color: active ? 'text.primary' : 'text.secondary',
                      bgcolor: 'background.default',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {item.description}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
