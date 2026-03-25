import type { ErrorInfo, PropsWithChildren, ReactNode } from 'react';
import { Component } from 'react';
import { Alert, Box, Button } from '@mui/material';

type ErrorBoundaryState = {
  hasError: boolean;
};

type ErrorBoundaryProps = PropsWithChildren<{
  fallback?: ReactNode;
}>;

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    // Логирование здесь намеренное: componentDidCatch — правильное место
    // для перехвата неожиданных ошибок рендера с целью последующей отладки
    console.error('Ошибка интерфейса перехвачена ErrorBoundary', error, info);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <Box sx={{ p: 3 }}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" onClick={() => window.location.assign('/ads')}>
                  На главную
                </Button>
              }
            >
              Произошла непредвиденная ошибка интерфейса
            </Alert>
          </Box>
        )
      );
    }

    return this.props.children;
  }
}
