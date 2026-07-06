'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { motion } from 'framer-motion';
import { NavHoverLink, ThemeToggle } from '@2bready/ui-core';
import { BrandMark } from './BrandMark';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useNavItems, isNavItemActive } from './nav-items';
import { useTranslation } from '@/lib/i18n';

// Delay before closing on mouse-leave — long enough that moving the cursor
// from the trigger down into the panel (crossing the small gap between them)
// doesn't flicker-close it, short enough that it doesn't feel sticky.
const CLOSE_DELAY_MS = 150;

interface NavPillItemProps {
  label: string;
  active: boolean;
  href?: string;
  endIcon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  ariaHasPopup?: boolean;
  ariaExpanded?: boolean;
}

// Vercel-app-style nav item: a sliding pill background (framer-motion layoutId)
// tracks whichever item is active, plus an immediate CSS hover pill on any
// item — this is the dashboard/product-nav pattern (tabs with a highlight),
// distinct from the marketing site's underline/roll-up nav. Shared by both
// plain nav links (href) and the "More" dropdown trigger (onClick) so the
// pill/hover/active styling lives in one place, not copy-pasted per usage.
//
// A plain-link item (href set) is natively focusable/keyboard-operable. A
// trigger item (onClick, no href — only "More" today) is NOT, since it's a
// bare div — give it button semantics (tabIndex/role/Enter+Space) so it's
// reachable without a mouse; forwardRef lets the parent focus it back after
// closing the dropdown with Escape.
const NavPillItem = forwardRef<HTMLDivElement, NavPillItemProps>(function NavPillItem(
  { label, active, href, endIcon, onClick, ariaHasPopup, ariaExpanded },
  ref
) {
  const isTrigger = !href && !!onClick;
  return (
    <Box
      ref={ref}
      component={href ? Link : 'div'}
      href={href}
      onClick={onClick}
      tabIndex={isTrigger ? 0 : undefined}
      role={isTrigger ? 'button' : undefined}
      aria-haspopup={ariaHasPopup}
      aria-expanded={isTrigger ? ariaExpanded : undefined}
      onKeyDown={
        isTrigger
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e as unknown as React.MouseEvent<HTMLElement>);
              }
            }
          : undefined
      }
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        px: 1.5,
        py: 0.75,
        borderRadius: '4px',
        fontSize: '0.875rem',
        fontWeight: active ? 600 : 500,
        color: active ? 'text.primary' : 'text.secondary',
        textDecoration: 'none',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'color 0.15s ease',
        '&:hover': { color: 'text.primary', bgcolor: active ? 'transparent' : 'action.hover' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      {active && (
        <motion.div
          layoutId="nav-active-pill"
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 4,
            background: 'var(--mui-palette-action-selected)',
            zIndex: -1,
          }}
        />
      )}
      {label}
      {endIcon}
    </Box>
  );
});

export function PortalNavbar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { primary, secondary, all } = useNavItems();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreAnchorRef = useRef<HTMLDivElement>(null);
  const moreTriggerRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const openMore = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMoreOpen(true);
  };
  const scheduleCloseMore = () => {
    closeTimer.current = setTimeout(() => setMoreOpen(false), CLOSE_DELAY_MS);
  };
  const closeMoreAndRefocusTrigger = () => {
    setMoreOpen(false);
    moreTriggerRef.current?.focus();
  };
  // Keyboard activation (Enter/Space on the trigger) also moves focus into
  // the panel — mouse-hover/click open doesn't, so hovering never hijacks a
  // keyboard user's focus elsewhere on the page.
  const openMoreViaKeyboard = () => {
    openMore();
    requestAnimationFrame(() => firstItemRef.current?.focus());
  };

  const secondaryActive = secondary.some((item) => isNavItemActive(pathname, item));

  return (
    <Box
      component="header"
      sx={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        px: { xs: 2, md: 4 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'color-mix(in srgb, var(--mui-palette-background-paper) 80%, transparent)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Typography
        component={Link}
        href="/"
        variant="body1"
        sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary', textDecoration: 'none', flexShrink: 0 }}
      >
        <BrandMark size={22} />
        2bReady
      </Typography>

      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
        {primary.map((item) => (
          <NavPillItem key={item.href} href={item.href} label={item.label} active={isNavItemActive(pathname, item)} />
        ))}

        <Box
          ref={moreAnchorRef}
          onMouseEnter={openMore}
          onMouseLeave={scheduleCloseMore}
          sx={{ position: 'relative' }}
        >
          <NavPillItem
            ref={moreTriggerRef}
            label={t('nav.more')}
            active={secondaryActive}
            onClick={openMoreViaKeyboard}
            endIcon={<KeyboardArrowDownIcon fontSize="small" />}
            ariaHasPopup
            ariaExpanded={moreOpen}
          />

          <Popper open={moreOpen} anchorEl={moreAnchorRef.current} placement="bottom-start" sx={{ zIndex: 20 }}>
            <ClickAwayListener onClickAway={() => setMoreOpen(false)}>
              <Paper
                onMouseEnter={openMore}
                onMouseLeave={scheduleCloseMore}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    closeMoreAndRefocusTrigger();
                  }
                }}
                sx={{
                  mt: 1,
                  width: 280,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                }}
              >
                {secondary.map((item, index) => (
                  <Box
                    key={item.href}
                    ref={index === 0 ? firstItemRef : undefined}
                    component={Link}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    sx={{
                      display: 'block',
                      textDecoration: 'none',
                      px: 2,
                      py: 1.25,
                      bgcolor: isNavItemActive(pathname, item) ? 'action.selected' : 'transparent',
                      transition: 'background-color 0.1s ease',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.description}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </ClickAwayListener>
          </Popper>
        </Box>
      </Box>

      <Box sx={{ flex: 1 }} />

      <LanguageSwitcher />
      <ThemeToggle
        labels={{ light: t('theme.light'), dark: t('theme.dark'), system: t('theme.system') }}
        ariaLabel={t('theme.toggle')}
      />

      <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
        <IconButton size="small" onClick={() => setMobileOpen(true)} aria-label={t('nav.open_menu')}>
          <MenuIcon />
        </IconButton>
      </Box>

      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 260, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {all.map((item) => (
            <NavHoverLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isNavItemActive(pathname, item)}
              onClick={() => setMobileOpen(false)}
              sx={{ fontSize: '1rem', fontWeight: 500 }}
            />
          ))}
        </Box>
      </Drawer>
    </Box>
  );
}
