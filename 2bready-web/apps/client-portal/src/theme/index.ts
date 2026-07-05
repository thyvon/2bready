import { createTheme } from '@mui/material/styles';

// Client-portal is deliberately distinct from admin-portal's sharp/monochrome
// Vercel-style theme: warmer accent, more generous radius/shadows, calmer
// density — Drata/Notion-inspired, since real companies (not internal staff)
// use this portal and first impression matters more here.
const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-mui-color-scheme',
  },
  colorSchemes: {
    light: {
      palette: {
        primary:    { main: '#6366f1', contrastText: '#ffffff' },
        secondary:  { main: '#0ea5a3', contrastText: '#ffffff' },
        error:      { main: '#dc2626' },
        warning:    { main: '#d97706' },
        success:    { main: '#16a34a' },
        info:       { main: '#6366f1' },
        background: { default: '#faf9f7', paper: '#ffffff' },
        text:       { primary: '#18181b', secondary: '#6b7280' },
        divider:    '#e7e5e4',
      },
    },
    dark: {
      palette: {
        primary:    { main: '#818cf8', contrastText: '#111111' },
        secondary:  { main: '#2dd4bf', contrastText: '#111111' },
        error:      { main: '#f87171' },
        warning:    { main: '#fbbf24' },
        success:    { main: '#4ade80' },
        info:       { main: '#818cf8' },
        background: { default: '#111113', paper: '#18181b' },
        text:       { primary: '#f4f4f5', secondary: '#a1a1aa' },
        divider:    '#2e2e32',
      },
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    h1:      { fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
    h2:      { fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.3 },
    h3:      { fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.4 },
    h4:      { fontSize: '1.125rem', fontWeight: 600 },
    h5:      { fontSize: '1rem', fontWeight: 600 },
    h6:      { fontSize: '0.9375rem', fontWeight: 600 },
    body1:   { fontSize: '0.9375rem', lineHeight: 1.65 },
    body2:   { fontSize: '0.8125rem', lineHeight: 1.55 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    button:  { fontSize: '0.875rem', fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, padding: '8px 18px', transition: 'transform 0.15s ease, box-shadow 0.15s ease' },
        contained: { boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', '&:hover': { boxShadow: '0 4px 10px -2px rgba(99,102,241,0.35)' } },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid var(--mui-palette-divider)',
          borderRadius: 16,
          backgroundImage: 'none',
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
          '& .MuiOutlinedInput-root': { borderRadius: 10 },
        },
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
