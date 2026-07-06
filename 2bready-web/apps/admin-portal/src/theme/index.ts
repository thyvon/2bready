import { createTheme } from '@mui/material/styles';

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
    h1:      { fontSize: '2rem',      fontWeight: 700, letterSpacing: '-0.03em',  lineHeight: 1.2 },
    h2:      { fontSize: '1.5rem',    fontWeight: 600, letterSpacing: '-0.02em',  lineHeight: 1.3 },
    h3:      { fontSize: '1.25rem',   fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.4 },
    h4:      { fontSize: '1.125rem',  fontWeight: 600, letterSpacing: '-0.01em' },
    h5:      { fontSize: '1rem',      fontWeight: 600, letterSpacing: '-0.005em' },
    h6:      { fontSize: '0.875rem',  fontWeight: 600 },
    body1:   { fontSize: '0.875rem',  lineHeight: 1.6 },
    body2:   { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem',   lineHeight: 1.4 },
    button:  { fontSize: '0.875rem',  fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
    overline:{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' },
  },
  shape: { borderRadius: 6 },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0,0,0,0.05)',
    '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.05)',
    '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
    '0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -4px rgba(0,0,0,0.05)',
    '0 20px 25px -5px rgba(0,0,0,0.07), 0 8px 10px -6px rgba(0,0,0,0.05)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
    '0 25px 50px -12px rgba(0,0,0,0.15)',
  ],
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '6px 16px',
          transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',

          // Contained primary: black on light, white on dark (Vercel style). Hover gets
          // a subtle lift + shadow — the neutral-palette translation of the marketing
          // site's GlowButton (a colored glow would clash with this app's monochrome
          // button language, but the "button responds to hover" feel is the same idea).
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

          ...(ownerState.variant === 'outlined' && {
            borderColor: 'var(--mui-palette-divider)',
            color: 'var(--mui-palette-text-primary)',
            '&:hover': {
              backgroundColor: 'var(--2br-overlay-hover)',
              borderColor: 'var(--2br-border-hover)',
            },
          }),

          ...(ownerState.variant === 'text' && {
            color: 'var(--mui-palette-text-secondary)',
            '&:hover': {
              backgroundColor: 'var(--2br-overlay-hover)',
              color: 'var(--mui-palette-text-primary)',
            },
          }),
        }),
      },
    },

    MuiTextField: {
      defaultProps: { size: 'small' as const },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            fontSize: '0.875rem',
            backgroundColor: 'var(--mui-palette-background-paper)',
            '& fieldset': { borderColor: 'var(--mui-palette-divider)' },
            '&:hover fieldset': { borderColor: 'var(--2br-border-hover)' },
            '&.Mui-focused fieldset': { borderColor: '#0070f3', borderWidth: 1 },
          },
          '& .MuiInputLabel-root': { fontSize: '0.875rem' },
          '& .MuiInputLabel-root.Mui-focused': { color: '#0070f3' },
          '& input::placeholder': {
            color: 'var(--mui-palette-text-secondary)',
            opacity: 1,
          },
        },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid var(--mui-palette-divider)',
          borderRadius: 8,
          backgroundImage: 'none',
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          '&.MuiPaper-outlined': {
            border: '1px solid var(--mui-palette-divider)',
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 9999, fontSize: '0.75rem', fontWeight: 500, height: 20 },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          border: '1px solid var(--mui-palette-divider)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
          backgroundImage: 'none',
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          borderRadius: 4,
          mx: 0.5,
          transition: 'background-color 0.15s ease',
          '&:hover': { backgroundColor: 'var(--2br-overlay-hover)' },
          '&.Mui-selected': { backgroundColor: 'var(--2br-nav-active-bg)' },
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--mui-palette-text-secondary)',
            backgroundColor: 'var(--mui-palette-background-paper)',
            borderBottom: '1px solid var(--mui-palette-divider)',
            padding: '8px 16px',
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          borderBottom: '1px solid var(--mui-palette-divider)',
          padding: '12px 16px',
          color: 'var(--mui-palette-text-primary)',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': { backgroundColor: 'var(--2br-overlay-row-hover)' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'var(--mui-palette-divider)' },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 6, fontSize: '0.875rem' },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 12,
          border: '1px solid var(--mui-palette-divider)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          ...theme.applyStyles('dark', {
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
          }),
        }),
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: '0.75rem', borderRadius: 6 },
      },
    },

    MuiLink: {
      styleOverrides: {
        root: { textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
      },
    },

    MuiCssBaseline: {
      styleOverrides: {
        // Custom CSS variables — light defaults
        ':root, [data-mui-color-scheme="light"]': {
          '--2br-nav-active-bg':    'rgba(0,0,0,0.05)',
          '--2br-nav-hover-bg':     'rgba(0,0,0,0.03)',
          '--2br-overlay-hover':    'rgba(0,0,0,0.03)',
          '--2br-overlay-row-hover':'rgba(0,0,0,0.02)',
          '--2br-border-hover':     '#999999',
          '--2br-auth-bg':          'var(--mui-palette-background-default)',
        },
        // Custom CSS variables — dark overrides
        '[data-mui-color-scheme="dark"]': {
          '--2br-nav-active-bg':    'rgba(255,255,255,0.07)',
          '--2br-nav-hover-bg':     'rgba(255,255,255,0.05)',
          '--2br-overlay-hover':    'rgba(255,255,255,0.04)',
          '--2br-overlay-row-hover':'rgba(255,255,255,0.03)',
          '--2br-border-hover':     '#555555',
          '--2br-auth-bg':          'var(--mui-palette-background-default)',
        },

        '*, *::before, *::after': { boxSizing: 'border-box' },
        body: { fontFeatureSettings: '"cv02","cv03","cv04","cv11"' },
        '::-webkit-scrollbar': { width: 6, height: 6 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': { background: '#d4d4d4', borderRadius: 3 },
        '[data-mui-color-scheme="dark"] ::-webkit-scrollbar-thumb': { background: '#444444' },
      },
    },
  },
});

export default theme;
