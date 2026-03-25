import { useMemo } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Divider,
  Grid,
  List,
  ListItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LandscapeIcon from '@mui/icons-material/Landscape';
import { getAdById } from '../api/items';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PARAM_LABEL_BY_KEY, VALUE_LABELS } from '../constants/items';
import { formatDate, formatPrice } from '../utils/format';
import { getMissingFields } from '../utils/revision';

function AdImagePlaceholder({ small }: { small?: boolean }) {
  return (
    <Box
      sx={{
        width: '100%',
        aspectRatio: small ? '1/1' : '4/3',
        bgcolor: 'grey.100',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'grey.400',
      }}
    >
      <LandscapeIcon sx={{ fontSize: small ? 18 : 52 }} />
    </Box>
  );
}

function RevisionWarning({ missingFields }: { missingFields: string[] }) {
  return (
    <Box
      sx={{
        bgcolor: '#FFF8F0',
        border: '1px solid #FFE0B2',
        borderRadius: 2,
        p: 2,
        color: 'grey.900',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            bgcolor: 'warning.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.2,
          }}
        >
          <Typography sx={{ color: 'white', fontSize: '0.6rem', fontWeight: 700, lineHeight: 1 }}>
            !
          </Typography>
        </Box>
        <Box sx={{ color: 'grey.900' }}>
          <Typography variant="body2" fontWeight={700} gutterBottom sx={{ color: 'grey.900' }}>
            Требуются доработки
          </Typography>
          {missingFields.length > 0 ? (
            <>
              <Typography variant="body2" gutterBottom sx={{ color: 'grey.800' }}>
                У объявления не заполнены поля:
              </Typography>
              <List dense disablePadding>
                {missingFields.map((field) => (
                  <ListItem key={field} disableGutters sx={{ py: 0 }}>
                    <Typography variant="body2" sx={{ color: 'grey.900' }}>
                      • {field}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}

export function AdDetailsPage() {
  const params = useParams();
  const adId = Number(params.id);

  const adQuery = useQuery({
    queryKey: ['ad', adId],
    queryFn: ({ signal }) => getAdById(adId, signal),
    enabled: Number.isFinite(adId),
  });

  const missingFields = useMemo(() => {
    if (!adQuery.data) return [];
    return getMissingFields(adQuery.data);
  }, [adQuery.data]);

  if (!Number.isFinite(adId)) {
    return <ErrorState message="Некорректный идентификатор объявления" />;
  }

  if (adQuery.isLoading) {
    return <LoadingState />;
  }

  if (adQuery.isError || !adQuery.data) {
    return <ErrorState message="Не удалось загрузить объявление" />;
  }

  const ad = adQuery.data;
  const paramEntries = Object.entries(ad.params).filter(([, value]) => value != null);

  return (
    <Stack spacing={3}>
      {/* Header row */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ md: 'flex-start' }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>
            {ad.title}
          </Typography>
          <Button
            component={RouterLink}
            to={`/ads/${ad.id}/edit`}
            variant="contained"
            startIcon={<EditIcon />}
            sx={{ mt: 1.5 }}
          >
            Редактировать
          </Button>
        </Box>

        <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={0.5} flexShrink={0}>
          <Typography variant="h4" fontWeight={700}>
            {formatPrice(ad.price)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Опубликовано: {formatDate(ad.createdAt)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Отредактировано: {formatDate(ad.updatedAt)}
          </Typography>
        </Stack>
      </Stack>

      
      <Divider sx={{ borderColor: 'grey.200' }} />

      <Grid container spacing={3}>
 
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={1}>
            <AdImagePlaceholder />
            <Grid container spacing={1}>
              {[0, 1, 2, 3].map((i) => (
                <Grid key={i} size={3}>
                  <AdImagePlaceholder small />
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2.5}>
            {ad.needsRevision ? (
              <Box sx={{ maxWidth: 520 }}>
                <RevisionWarning missingFields={missingFields} />
              </Box>
            ) : null}

            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Характеристики
              </Typography>
              {paramEntries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Характеристики не заполнены
                </Typography>
              ) : (
                <Table size="small">
                  <TableBody>
                    {paramEntries.map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell
                          sx={{
                            width: '34%',
                            color: 'text.secondary',
                            border: 'none',
                            pl: 0,
                            pr: 1,
                            py: 0.25,
                          }}
                        >
                          {PARAM_LABEL_BY_KEY[key] ?? key}
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 500, py: 0.25, pl: 0 }}>
                          {VALUE_LABELS[String(value)] ?? String(value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Stack>
        </Grid>
      </Grid>

      <Box>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Описание
        </Typography>
        <Typography color={ad.description?.trim() ? 'text.primary' : 'text.disabled'}>
          {ad.description?.trim() || 'Описание отсутствует'}
        </Typography>
      </Box>

      <Box>
        <Button component={RouterLink} to="/ads" variant="outlined" size="small">
          ← Мои объявления
        </Button>
      </Box>
    </Stack>
  );
}
