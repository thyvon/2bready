import Box from '@mui/material/Box';

// Reconstructed from nextjs.org's actual hero treatment (no live browser
// access in this environment to pull exact values — see chat for that
// caveat): a single static soft glow centered behind the headline, not the
// busy multi-orb drift + visible grid pattern this used to be. Next.js's
// real hero doesn't animate or tile a grid — it's closer to ambient,
// motionless light.
export function AuroraBackground() {
  return (
    // Fixed to the viewport (not absolute within the hero) so it doesn't
    // scroll away with the page, and zIndex: -1 guarantees it paints behind
    // every normal-flow content element regardless of DOM order or any
    // z-index those elements do/don't set — negative z-index always sits
    // below the unpositioned content layer.
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 900,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, var(--mui-palette-primary-main) 0%, transparent 70%)',
          opacity: { xs: 0.08, md: 0.14 },
          filter: 'blur(60px)',
        }}
      />
    </Box>
  );
}
