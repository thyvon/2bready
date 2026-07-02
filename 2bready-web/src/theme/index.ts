import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1d4ed8' },
        secondary: { main: '#7c3aed' },
        error: { main: '#dc2626' },
        warning: { main: '#d97706' },
        success: { main: '#16a34a' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#3b82f6' },
        secondary: { main: '#a78bfa' },
      },
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans)',
  },
  shape: { borderRadius: 8 },
});

export default theme;
