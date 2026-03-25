import type { PropsWithChildren } from 'react';
import { Box, Container, IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useThemeStore } from '../store/theme';

export function AppFrame({ children }: PropsWithChildren) {
  const { mode, toggleMode } = useThemeStore();

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Tooltip title={mode === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
          <IconButton onClick={toggleMode} size="small" aria-label="переключить тему">
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      {children}
    </Container>
  );
}
