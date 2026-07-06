import { createTheme } from '@mui/material/styles';

// Monochrome black/white base matching Vercel/nextjs.org exactly — same
// palette values as admin-portal's Vercel-style theme (colors.ts palette
// intentionally identical; client-portal's own identity now comes from
// layout/motion choices, not a different accent color).
const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-mui-color-scheme',
  },
  colorSchemes: {
    light: {
      palette: {
        primary:    { main: '#0070f3', contrastText: '#ffffff' },
        secondary:  { main: '#7c3aed', contrastText: '#ffffff' },
        error:      { main: '#ee0000' },
        warning:    { main: '#f5a623' },
        success:    { main: '#16a34a' },
        info:       { main: '#0070f3' },
        background: { default: '#fafafa', paper: '#ffffff' },
        text:       { primary: '#111111', secondary: '#666666' },
        divider:    '#eaeaea',
      },
    },
    dark: {
      palette: {
        primary:    { main: '#0070f3', contrastText: '#ffffff' },
        secondary:  { main: '#a78bfa', contrastText: '#000000' },
        error:      { main: '#ff4444' },
        warning:    { main: '#f5a623' },
        success:    { main: '#4ade80' },
        info:       { main: '#0070f3' },
        background: { default: '#000000', paper: '#111111' },
        text:       { primary: '#ededed', secondary: '#888888' },
        divider:    '#333333',
      },
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), var(--font-kantumruy), system-ui, sans-serif',
    h1:      { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 },
    h2:      { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.3 },
    h3:      { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.4 },
    h4:      { fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em' },
    h5:      { fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.005em' },
    h6:      { fontSize: '0.875rem', fontWeight: 600 },
    body1:   { fontSize: '0.875rem', lineHeight: 1.6 },
    body2:   { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    button:  { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
    overline:{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' },
  },
  // Radius scale — tighter than Vercel's published Geist base values (6/12/16),
  // per explicit request for a smaller/sharper corner feel: base/small = 4px
  // (buttons, inputs, tooltips), medium/large = 8px (cards, menus), fullscreen
  // = 10px (dialogs). Every override below uses an explicit px string — not a
  // unitless number — so it can't silently drift if shape.borderRadius changes
  // (MUI's sx/styleOverrides multiply unitless numbers by theme.shape.borderRadius).
  shape: { borderRadius: 4 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          borderRadius: '4px',
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '8px 18px',
          transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',

          // Contained primary: black on light, white on dark — Vercel's
          // signature monochrome CTA button, not a colored fill.
          ...(ownerState.variant === 'contained' && ownerState.color === 'primary' && {
            backgroundColor: '#111111',
            color: '#ffffff',
            '&:hover': { backgroundColor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.25)' },
            '&:active': { transform: 'translateY(0)' },
            '&:disabled': { backgroundColor: '#eaeaea', color: '#999999' },
            ...theme.applyStyles('dark', {
              backgroundColor: '#ffffff',
              color: '#000000',
              '&:hover': { backgroundColor: '#ededed', transform: 'translateY(-1px)', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.5)' },
              '&:disabled': { backgroundColor: '#333333', color: '#666666' },
            }),
          }),

          // Any other contained color (secondary, error, success, ...) keeps
          // its real palette color — only primary gets the monochrome
          // treatment — but still needs shadow/hover feedback since
          // disableElevation removed MUI's default one.
          ...(ownerState.variant === 'contained' && ownerState.color !== 'primary' && {
            boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
            '&:hover': { filter: 'brightness(0.9)', boxShadow: '0 4px 10px -2px rgba(0,0,0,0.25)' },
          }),

          ...(ownerState.variant === 'outlined' && {
            borderColor: 'var(--mui-palette-divider)',
            color: 'var(--mui-palette-text-primary)',
            '&:hover': { backgroundColor: 'action.hover' },
          }),

          ...(ownerState.variant === 'text' && {
            color: 'var(--mui-palette-text-secondary)',
            '&:hover': { backgroundColor: 'action.hover', color: 'var(--mui-palette-text-primary)' },
          }),
        }),
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid var(--mui-palette-divider)',
          borderRadius: '8px',
          backgroundImage: 'none',
          // Without this, toggling light/dark (ThemeToggle) snaps every
          // Card's background/border instantly instead of fading.
          transition: 'background-color 0.15s ease, border-color 0.15s ease',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 9999, fontWeight: 500 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' as const },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': { borderRadius: '4px' },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: '8px',
          border: '1px solid var(--mui-palette-divider)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '10px',
          border: '1px solid var(--mui-palette-divider)',
          backgroundImage: 'none',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { borderRadius: '4px', fontSize: '0.75rem' },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': { boxSizing: 'border-box' },
        '::-webkit-scrollbar': { width: 6, height: 6 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': { background: '#d4d4d8', borderRadius: 3 },
        '[data-mui-color-scheme="dark"] ::-webkit-scrollbar-thumb': { background: '#3f3f46' },
      },
    },
  },
});

export default theme;
