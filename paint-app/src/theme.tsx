import { CssBaseline, createTheme, ThemeProvider } from '@mui/material';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

const THEME_MODE_LS_KEY = 'paint-app:themeMode';

const readStoredMode = (): ThemeMode => {
  const raw = localStorage.getItem(THEME_MODE_LS_KEY);
  if (raw === 'light' || raw === 'dark') return raw;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

type ThemeModeCtx = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeCtx | null>(null);

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem(THEME_MODE_LS_KEY, m);
  }, []);

  const value = useMemo<ThemeModeCtx>(
    () => ({
      mode,
      setMode,
      toggleMode: () => setMode(mode === 'dark' ? 'light' : 'dark'),
    }),
    [mode, setMode],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette:
          mode === 'dark'
            ? {
                mode: 'dark',
                background: { default: '#121212', paper: '#1e1e1e' },
              }
            : { mode: 'light' },
        shape: { borderRadius: 6 },
        components: {
          // Tells the browser to render native widgets (scrollbars, the
          // color/number inputs used in the layer + color pickers) to match.
          MuiCssBaseline: { styleOverrides: { ':root': { colorScheme: mode } } },
        },
      }),
    [mode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within AppThemeProvider');
  return ctx;
};
