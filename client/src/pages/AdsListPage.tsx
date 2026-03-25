import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDebounce } from '../hooks/useDebounce';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Collapse,
  FormControlLabel,
  FormGroup,
  Grid,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Checkbox,
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LandscapeIcon from '@mui/icons-material/Landscape';
import { getAds } from '../api/items';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { CATEGORY_LABELS, SORT_OPTIONS } from '../constants/items';
import { useAdsFiltersStore } from '../store/adsFilters';
import type { ItemCategory } from '../types/items';
import { formatPrice } from '../utils/format';

const PAGE_SIZE = 10;

function AdImagePlaceholder({ small }: { small?: boolean }) {
  return (
    <Box
      sx={{
        width: '100%',
        aspectRatio: small ? '1/1' : '4/3',
        bgcolor: 'grey.100',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'grey.400',
        borderRadius: small ? 1 : '8px 8px 0 0',
      }}
    >
      <LandscapeIcon sx={{ fontSize: small ? 20 : 44 }} />
    </Box>
  );
}

export function AdsListPage() {
  const navigate = useNavigate();
  const {
    query,
    categories,
    needsRevisionOnly,
    sortValue,
    page,
    setPage,
    setQuery,
    toggleCategory,
    setNeedsRevisionOnly,
    setSortValue,
    resetFilters,
  } = useAdsFiltersStore();

  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [categoryExpanded, setCategoryExpanded] = useState(true);

  const debouncedQuery = useDebounce(query, 400);

  const [sortColumn, sortDirection] = useMemo(() => {
    const [column, direction] = sortValue.split(':');
    return [column as 'title' | 'createdAt', direction as 'asc' | 'desc'];
  }, [sortValue]);

  // keepPreviousData предотвращает мигание списка при смене фильтров:
  // старые данные остаются видимыми до получения нового ответа сервера.
  const adsQuery = useQuery({
    queryKey: ['ads', debouncedQuery, categories, needsRevisionOnly, sortValue, page],
    queryFn: ({ signal }) =>
      getAds(
        {
          q: debouncedQuery,
          page,
          categories,
          needsRevisionOnly,
          sortColumn,
          sortDirection,
        },
        signal,
      ),
    placeholderData: keepPreviousData,
  });

  if (adsQuery.isLoading) {
    return <LoadingState />;
  }

  if (adsQuery.isError) {
    return <ErrorState message="Не удалось загрузить объявления" />;
  }

  const data = adsQuery.data;
  if (!data) {
    return <ErrorState message="Ответ сервера пустой" />;
  }

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Мои объявления
        </Typography>
        <Typography color="text.secondary">{data.total} объявлений</Typography>
      </Box>

      {/* Строка поиска */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
        <TextField
          placeholder="Найти объявление..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <ToggleButtonGroup
          value={layout}
          exclusive
          onChange={(_, value) => value && setLayout(value)}
          size="small"
        >
          <ToggleButton value="grid" aria-label="сетка">
            <GridViewIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="list" aria-label="список">
            <ViewListIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
        <Select
          value={sortValue}
          onChange={(e) => setSortValue(e.target.value as typeof sortValue)}
          size="small"
          sx={{ minWidth: 230 }}
        >
          {SORT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Grid container spacing={2}>
        {/* Боковая панель фильтров */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={600}>
                Фильтры
              </Typography>

              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ cursor: 'pointer', mb: 0.5, userSelect: 'none' }}
                  onClick={() => setCategoryExpanded((prev) => !prev)}
                >
                  <Typography variant="subtitle2" fontWeight={600}>
                    Категория
                  </Typography>
                  {categoryExpanded ? (
                    <ExpandLessIcon fontSize="small" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" />
                  )}
                </Stack>
                <Collapse in={categoryExpanded}>
                  <FormGroup>
                    {(Object.keys(CATEGORY_LABELS) as ItemCategory[]).map((category) => (
                      <FormControlLabel
                        key={category}
                        control={
                          <Checkbox
                            checked={categories.includes(category)}
                            onChange={() => toggleCategory(category)}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2">{CATEGORY_LABELS[category]}</Typography>
                        }
                      />
                    ))}
                  </FormGroup>
                </Collapse>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={needsRevisionOnly}
                    onChange={(_, value) => setNeedsRevisionOnly(value)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={600}>
                    Только требующие доработок
                  </Typography>
                }
              />

              <Button
                variant="text"
                size="small"
                onClick={resetFilters}
                sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
              >
                Сбросить фильтры
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Область карточек */}
        <Grid size={{ xs: 12, md: 9 }}>
          {data.items.length === 0 ? (
            <Alert severity="info">По заданным фильтрам ничего не найдено</Alert>
          ) : layout === 'grid' ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 2,
              }}
            >
              {data.items.map((item) => (
                <Card
                  key={item.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'grey.200',
                    boxShadow: 'none',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/ads/${item.id}`)}
                    sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    <AdImagePlaceholder />
                    <CardContent sx={{ flex: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          {CATEGORY_LABELS[item.category]}
                        </Typography>
                        <Typography fontWeight={600} variant="body2" sx={{ lineHeight: 1.3 }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2">{formatPrice(item.price)}</Typography>
                        {item.needsRevision ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            label="Требует доработок"
                            sx={{
                              width: 'fit-content',
                              color: 'warning.dark',
                              borderColor: 'warning.main',
                              fontSize: '0.65rem',
                              height: 20,
                            }}
                          />
                        ) : null}
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          ) : (
            <Stack spacing={1}>
              {data.items.map((item) => (
                <Card
                  key={item.id}
                  sx={{ border: '1px solid', borderColor: 'grey.200', boxShadow: 'none' }}
                >
                  <CardActionArea onClick={() => navigate(`/ads/${item.id}`)}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 1.5 }}>
                      <Box sx={{ width: 64, flexShrink: 0, borderRadius: 1, overflow: 'hidden' }}>
                        <AdImagePlaceholder small />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary">
                          {CATEGORY_LABELS[item.category]}
                        </Typography>
                        <Typography fontWeight={600} noWrap>
                          {item.title}
                        </Typography>
                        <Typography variant="body2">{formatPrice(item.price)}</Typography>
                      </Box>
                      {item.needsRevision ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          label="Требует доработок"
                          sx={{
                            flexShrink: 0,
                            color: 'warning.dark',
                            borderColor: 'warning.main',
                            fontSize: '0.65rem',
                            height: 20,
                          }}
                        />
                      ) : null}
                    </Stack>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          )}
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, nextPage) => setPage(nextPage)}
          color="primary"
        />
      </Box>
    </Stack>
  );
}
