import { Link as RouterLink } from 'react-router-dom';
import { Button, Stack, Typography } from '@mui/material';

export function NotFoundPage() {
  return (
    <Stack spacing={2} alignItems="flex-start">
      <Typography variant="h4">Страница не найдена</Typography>
      <Button component={RouterLink} to="/ads" variant="contained">
        Перейти к объявлениям
      </Button>
    </Stack>
  );
}
