import { createTheme } from '@mui/material/styles';

// Brand system (2bready-brand-color-guidelines.html): navy leads the
// interface, green = the ACCENT for CTAs/success, teal = info.
// Kept in sync with the marketing landing page palette for cross-app
// branding consistency.
const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-mui-color-scheme',
  },
  colorSchemes: {
    light: {
      palette: {
        primary:    { main: '#183659', contrastText: '#ffffff' },
        secondary:  { main: '#71B77C', contrastText: '#10243C' },
        error:      { main: '#D9534F' },
        warning:    { main: '#E5A93D' },
        success:    { main: '#71B77C' },
        info:       { main: '#31867E' },
        background: { default: '#F7FAF8', paper: '#ffffff' },
        text:       { primary: '#10243C', secondary: '#4E637B' },
        divider:    '#DDE5E1',
      },
    },
    dark: {
      palette: {
        primary:    { main: '#4D6D8E', contrastText: '#ffffff' },
        secondary:  { main: '#71B77C', contrastText: '#10243C' },
        error:      { main: '#ff6b67' },
        warning:    { main: '#f0b25a' },
        success:    { main: '#71B77C' },
        info:       { main: '#4A9690' },
        background: { default: '#000000', paper: '#16161a' },
        text:       { primary: '#ffffff', secondary: '#E8EEF4' },
        divider:    '#26262b',
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
  shape: { borderRadius: 4 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: '4px',
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '8px 18px',
          transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',

          // Contained primary: brand green CTA — green bg, dark navy text.
          ...(ownerState.variant === 'contained' && ownerState.color === 'primary' && {
            backgroundColor: '#183659',
            color: '#ffffff',
            '&:hover': { backgroundColor: '#142D4A', transform: 'translateY(-1px)', boxShadow: '0 4px 12px -2px rgba(24,54,89,0.3)' },
            '&:active': { transform: 'translateY(0)' },
            '&:disabled': { backgroundColor: '#eaeaea', color: '#999999' },
          }),

          // Contained secondary: green accent CTA — green bg, dark text.
          ...(ownerState.variant === 'contained' && ownerState.color === 'secondary' && {
            backgroundColor: '#71B77C',
            color: '#10243C',
            '&:hover': { backgroundColor: '#5FA56A', transform: 'translateY(-1px)', boxShadow: '0 4px 12px -2px rgba(113,183,124,0.3)' },
            '&:active': { transform: 'translateY(0)' },
            '&:disabled': { backgroundColor: '#eaeaea', color: '#999999' },
          }),

          // Any other contained color keeps its real palette color
          // but still needs shadow/hover feedback since disableElevation
          // removed MUI's default one.
          ...(ownerState.variant === 'contained' && ownerState.color !== 'primary' && ownerState.color !== 'secondary' && {
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
          '& .MuiOutlinedInput-root': {
            borderRadius: '4px',
            '&.Mui-focused fieldset': { borderColor: '#183659' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#183659' },
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
        // Brand CSS variables — navy-tinted nav states matching the landing page.
        ':root': {
          '--2br-nav-active-bg': 'rgba(24,54,89,0.08)',
          '--2br-nav-hover-bg': 'rgba(24,54,89,0.05)',
          '--2br-overlay-hover': 'rgba(24,54,89,0.05)',
          '--2br-overlay-row-hover': 'rgba(24,54,89,0.03)',
          '--2br-border-hover': '#718CA7',
        },
        '[data-mui-color-scheme="dark"]': {
          '--2br-nav-active-bg': 'rgba(113,183,124,0.16)',
          '--2br-nav-hover-bg': 'rgba(113,183,124,0.10)',
          '--2br-overlay-hover': 'rgba(226,234,241,0.08)',
          '--2br-overlay-row-hover': 'rgba(226,234,241,0.05)',
          '--2br-border-hover': '#C5D2DF',
        },
      },
    },
  },
});

export default theme;
