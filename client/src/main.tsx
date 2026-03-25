import { useMemo } from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { useThemeStore } from './store/theme';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    // Повторяем запрос один раз вместо трёх, чтобы ошибки отображались быстрее
    queries: { retry: 1 },
  },
});

// Вынесено в компонент, чтобы хук Zustand мог прочитать сохранённую тему
// до рендера ThemeProvider
function Root() {
  const { mode } = useThemeStore();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#1976d2' },
        },
        shape: { borderRadius: 8 },
        components: {
          MuiButton: {
            styleOverrides: { root: { textTransform: 'none' } },
          },
          MuiChip: {
            styleOverrides: { root: { borderRadius: 6 } },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
