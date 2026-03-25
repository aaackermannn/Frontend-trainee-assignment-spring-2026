import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  InputAdornment,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
import { generateDescription, generatePriceAdvice } from '../api/ai';
import { getAdById, updateAd } from '../api/items';
import { AiChat } from '../components/AiChat';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { CATEGORY_LABELS, PARAM_FIELDS_BY_CATEGORY } from '../constants/items';
import { CATEGORY_VALUES } from '../types/items';
import type { AdUpdatePayload, ItemCategory } from '../types/items';

// Типы

type FormState = {
  category: ItemCategory;
  title: string;
  description: string;
  price: string;
  params: Record<string, string>;
};

type AiPanel = {
  mode: 'description' | 'price';
  content: string;
} | null;

type DescriptionDiffState = {
  before: string;
  after: string;
} | null;

// Вспомогательные функции

function buildInitialFormState(payload: AdUpdatePayload): FormState {
  const stringParams = Object.entries(payload.params).reduce<Record<string, string>>(
    (acc, [key, value]) => ({ ...acc, [key]: value == null ? '' : String(value) }),
    {},
  );
  return {
    category: payload.category,
    title: payload.title,
    description: payload.description ?? '',
    price: String(payload.price),
    params: stringParams,
  };
}

function draftKey(adId: number): string {
  return `ad-edit-draft-${adId}`;
}

// Формирует читаемое описание объявления для системного промпта AI
function buildAdContext(state: FormState): string {
  const paramLines = Object.entries(state.params)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  return [
    `Категория: ${CATEGORY_LABELS[state.category]}`,
    `Название: ${state.title}`,
    `Цена: ${state.price} руб.`,
    paramLines ? `Характеристики: ${paramLines}` : '',
    state.description ? `Описание: ${state.description}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// Подкомпоненты

type CharacteristicsFieldsProps = {
  formState: FormState;
  onChange: (params: Record<string, string>) => void;
};

function CharacteristicsFields({ formState, onChange }: CharacteristicsFieldsProps) {
  const fields = PARAM_FIELDS_BY_CATEGORY[formState.category];

  function handleChange(key: string, value: string) {
    onChange({ ...formState.params, [key]: value });
  }

  function clearAdornment(value: string | undefined, onClear: () => void) {
    if (!value?.trim()) return undefined;
    return (
      <InputAdornment position="end">
        <Button
          onClick={onClear}
          size="small"
          sx={{
            minWidth: 0,
            px: 0.5,
            color: 'text.disabled',
            '&:hover': { color: 'text.secondary', bgcolor: 'transparent' },
          }}
        >
          <ClearIcon fontSize="small" />
        </Button>
      </InputAdornment>
    );
  }

  return (
    <Stack spacing={2}>
      {fields.map((field) => (
        <Box key={field.key}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {field.label}
          </Typography>
          {field.type === 'select' ? (
            <FormControl fullWidth size="small">
              {/* Скрытый label: заглушка реализована через displayEmpty + пустой MenuItem */}
              <InputLabel id={`param-${field.key}`} sx={{ display: 'none' }} />
              <Select
                labelId={`param-${field.key}`}
                displayEmpty
                value={formState.params[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              >
                <MenuItem value="">
                  <Typography color="text.disabled">Не выбрано</Typography>
                </MenuItem>
                {field.options?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              fullWidth
              size="small"
              type={field.type === 'number' ? 'number' : 'text'}
              value={formState.params[field.key] ?? ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              slotProps={{
                input: {
                  endAdornment: clearAdornment(formState.params[field.key], () =>
                    handleChange(field.key, ''),
                  ),
                },
              }}
            />
          )}
        </Box>
      ))}
    </Stack>
  );
}

type DiffChunk = { type: 'equal' | 'add' | 'del'; text: string };

function tokenizeWithSpaces(text: string): string[] {
  // Сохраняем пробелы отдельными токенами, чтобы итоговый вывод сохранял форматирование
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

function buildDiff(before: string, after: string): DiffChunk[] {
  const a = tokenizeWithSpaces(before);
  const b = tokenizeWithSpaces(after);
  const n = a.length;
  const m = b.length;

  // LCS (динамическое программирование) для стабильного diff на уровне слов без зависимостей
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const chunks: DiffChunk[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      chunks.push({ type: 'equal', text: a[i] });
      i++;
      j++;
      continue;
    }
    if (dp[i + 1][j] >= dp[i][j + 1]) {
      chunks.push({ type: 'del', text: a[i] });
      i++;
    } else {
      chunks.push({ type: 'add', text: b[j] });
      j++;
    }
  }
  while (i < n) chunks.push({ type: 'del', text: a[i++] });
  while (j < m) chunks.push({ type: 'add', text: b[j++] });

  // Склеиваем соседние фрагменты одного типа, чтобы уменьшить количество кусочков
  return chunks.reduce<DiffChunk[]>((acc, cur) => {
    const last = acc[acc.length - 1];
    if (last && last.type === cur.type) {
      last.text += cur.text;
      return acc;
    }
    acc.push({ ...cur });
    return acc;
  }, []);
}

function DiffText({
  chunks,
  showAdds,
  showDels,
}: {
  chunks: DiffChunk[];
  showAdds: boolean;
  showDels: boolean;
}) {
  return (
    <Typography
      variant="body2"
      component="div"
      sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}
    >
      {chunks.map((c, idx) => {
        if (c.type === 'equal') return <span key={idx}>{c.text}</span>;
        if (c.type === 'add') {
          return showAdds ? (
            <span key={idx} style={{ background: '#E6F4EA', borderRadius: 4, padding: '0 2px' }}>
              {c.text}
            </span>
          ) : null;
        }
        return showDels ? (
          <span
            key={idx}
            style={{
              background: '#FCE8E6',
              borderRadius: 4,
              padding: '0 2px',
              textDecoration: 'line-through',
            }}
          >
            {c.text}
          </span>
        ) : null;
      })}
    </Typography>
  );
}

function BeforeAfterDiff({ before, after }: { before: string; after: string }) {
  const chunks = useMemo(() => buildDiff(before, after), [before, after]);

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
        Было → Стало
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        <Box sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 1.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 1 }}>
            Было
          </Typography>
          <DiffText chunks={chunks} showAdds={false} showDels />
        </Box>
        <Box sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 1.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 1 }}>
            Стало
          </Typography>
          <DiffText chunks={chunks} showAdds showDels={false} />
        </Box>
      </Box>
    </Box>
  );
}

/** Пытается извлечь число из ответа AI по цене (первая крупная группа цифр). */
function extractPriceFromAdvice(text: string): number | null {
  const normalized = text.replace(/\u00a0/g, ' ').replace(/\s+/g, '');
  const matches = normalized.match(/\d{3,}/g);
  if (!matches?.length) return null;
  const nums = matches.map((m) => Number(m)).filter((n) => Number.isFinite(n));
  if (nums.length === 0) return null;
  if (nums.length === 1) return nums[0];
  return Math.round((nums[0] + nums[1]) / 2);
}

type AiFloatingResponseProps = {
  panel: NonNullable<AiPanel>;
  onApply: () => void;
  onClose: () => void;
};

/** Всплывающий блок ответа AI без внутренних разделителей — только текст и две кнопки (как в макете). */
function AiFloatingResponse({ panel, onApply, onClose }: AiFloatingResponseProps) {
  return (
    <Box
      sx={{
        mt: 1.5,
        mb: 1,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.200',
        bgcolor: 'background.paper',
        boxShadow: 2,
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 1 }}>
        Ответ AI:
      </Typography>
      <Typography variant="body2" whiteSpace="pre-wrap" sx={{ mb: 2 }}>
        {panel.content}
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button variant="contained" size="small" onClick={onApply}>
          Применить
        </Button>
        <Button variant="outlined" size="small" color="inherit" onClick={onClose}>
          Закрыть
        </Button>
      </Stack>
    </Box>
  );
}

// Основная форма

type AdEditFormProps = { adId: number; initialState: FormState };

function AdEditForm({ adId, initialState }: AdEditFormProps) {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<FormState>(initialState);
  const [aiPanel, setAiPanel] = useState<AiPanel>(null);
  const [descriptionDiff, setDescriptionDiff] = useState<DescriptionDiffState>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [toast, setToast] = useState('');

  // Запоминает последний отправленный AI payload, чтобы «Повторить запрос» мог его воспроизвести.
  const lastPayloadRef = useRef<AdUpdatePayload | null>(null);

  // Сохранение черновика с троттлингом: запись в localStorage через 400 мс после
  // последнего изменения, чтобы не перегружать хранилище при каждом нажатии клавиши.
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      localStorage.setItem(draftKey(adId), JSON.stringify(formState));
    }, 400);
    return () => window.clearTimeout(timerId);
  }, [adId, formState]);

  const updateMutation = useMutation({
    mutationFn: (payload: AdUpdatePayload) => updateAd(adId, payload),
    onSuccess: () => {
      localStorage.removeItem(draftKey(adId));
      navigate(`/ads/${adId}`);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Не удалось сохранить изменения';
      setToast(message);
    },
  });

  const generateDescriptionMutation = useMutation({
    mutationFn: (payload: AdUpdatePayload) => generateDescription(payload),
    onSuccess: (result) => {
      const before = lastPayloadRef.current?.description ?? '';
      setDescriptionDiff({ before: before.trim(), after: result.trim() });
      setAiPanel({ mode: 'description', content: result });
    },
    onError: () => setToast('Не удалось получить описание от AI'),
  });

  const generatePriceMutation = useMutation({
    mutationFn: (payload: AdUpdatePayload) => generatePriceAdvice(payload),
    onSuccess: (result) => setAiPanel({ mode: 'price', content: result }),
    onError: () => setToast('Не удалось получить рекомендацию по цене'),
  });

  // Производное значение: конвертирует строки формы в типизированный API-payload.
  // Возвращает null при невалидных обязательных полях, чтобы блокировать действия.
  const payload = useMemo<AdUpdatePayload | null>(() => {
    const parsedPrice = Number(formState.price);
    if (!Number.isFinite(parsedPrice)) return null;

    const categoryFields = PARAM_FIELDS_BY_CATEGORY[formState.category];
    const parsedParams = categoryFields.reduce<Record<string, string | number>>((acc, field) => {
      const rawValue = formState.params[field.key];
      if (!rawValue?.trim()) return acc;
      if (field.type === 'number') {
        const value = Number(rawValue);
        if (Number.isFinite(value)) acc[field.key] = value;
        return acc;
      }
      acc[field.key] = rawValue;
      return acc;
    }, {});

    return {
      category: formState.category,
      title: formState.title,
      description: formState.description.trim() || undefined,
      price: parsedPrice,
      params: parsedParams,
    };
  }, [formState]);

  function handleSave() {
    setShowErrors(true);
    if (!payload || !formState.title.trim()) return;
    updateMutation.mutate(payload);
  }

  function triggerAi(mode: 'description' | 'price') {
    if (!payload) return;
    lastPayloadRef.current = payload;
    if (mode === 'description') {
      setDescriptionDiff(null);
    }
    if (mode === 'description') generateDescriptionMutation.mutate(payload);
    else generatePriceMutation.mutate(payload);
  }

  function handleRetry() {
    if (!aiPanel || !lastPayloadRef.current) return;
    if (aiPanel.mode === 'description') {
      setDescriptionDiff(null);
      generateDescriptionMutation.mutate(lastPayloadRef.current);
    } else generatePriceMutation.mutate(lastPayloadRef.current);
  }

  function handleApplyAi() {
    if (!aiPanel) return;
    if (aiPanel.mode === 'description') {
      setFormState((prev) => ({ ...prev, description: aiPanel.content }));
      setDescriptionDiff(null);
      setAiPanel(null);
      return;
    }
    const parsed = extractPriceFromAdvice(aiPanel.content);
    if (parsed == null) {
      setToast('Не удалось извлечь цену из ответа');
      return;
    }
    setFormState((prev) => ({ ...prev, price: String(parsed) }));
    setAiPanel(null);
  }

  const isAiPending = generateDescriptionMutation.isPending || generatePriceMutation.isPending;
  const titleError = showErrors && !formState.title.trim();
  const priceError =
    showErrors && (!formState.price.trim() || !Number.isFinite(Number(formState.price)));

  const pricePanelOpen = aiPanel?.mode === 'price';
  const descriptionPanelOpen = aiPanel?.mode === 'description';

  return (
    <Stack spacing={4}>
      <Typography variant="h4" fontWeight={700}>
        Редактирование объявления
      </Typography>

      <Button
        component={RouterLink}
        to={`/ads/${adId}`}
        variant="text"
        size="small"
        color="inherit"
        sx={{ alignSelf: 'flex-start', px: 0 }}
      >
        ← Назад к объявлению
      </Button>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '480px 1fr' },
          columnGap: 4,
          rowGap: 0,
          alignItems: 'start',
        }}
      >
        {/* Категория (слева) */}
        <Box sx={{ pb: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Категория
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={formState.category}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  category: e.target.value as ItemCategory,
                  params: {},
                }))
              }
            >
              {CATEGORY_VALUES.map((category) => (
                <MenuItem key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Пусто справа на строке категории */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }} />

        <Divider sx={{ borderColor: 'grey.200', gridColumn: '1 / -1' }} />

        {/* Название (слева) */}
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            <Box component="span" sx={{ color: 'error.main', mr: 0.5 }}>
              *
            </Box>
            Название
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={formState.title}
            onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
            error={titleError}
            helperText={titleError ? 'Обязательное поле' : ''}
            slotProps={{
              input: {
                endAdornment: formState.title.trim() ? (
                  <InputAdornment position="end">
                    <Button
                      onClick={() => setFormState((prev) => ({ ...prev, title: '' }))}
                      size="small"
                      sx={{
                        minWidth: 0,
                        px: 0.5,
                        color: 'text.disabled',
                        '&:hover': { color: 'text.secondary', bgcolor: 'transparent' },
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </Button>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
        </Box>

        {/* Пусто справа на строке названия */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }} />

        <Divider sx={{ borderColor: 'grey.200', gridColumn: '1 / -1' }} />

        {/* Цена (слева) */}
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            <Box component="span" sx={{ color: 'error.main', mr: 0.5 }}>
              *
            </Box>
            Цена
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="number"
            value={formState.price}
            onChange={(e) => setFormState((prev) => ({ ...prev, price: e.target.value }))}
            error={priceError}
            helperText={priceError ? 'Введите корректную цену' : ''}
            slotProps={{
              input: {
                endAdornment: formState.price.trim() ? (
                  <InputAdornment position="end">
                    <Button
                      onClick={() => setFormState((prev) => ({ ...prev, price: '' }))}
                      size="small"
                      sx={{
                        minWidth: 0,
                        px: 0.5,
                        color: 'text.disabled',
                        '&:hover': { color: 'text.secondary', bgcolor: 'transparent' },
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </Button>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
        </Box>

        {/* Справа от цены: ответ + кнопка как на макете */}
        <Box sx={{ py: 2, display: { xs: 'none', md: 'block' } }}>
          {pricePanelOpen && aiPanel ? (
            <AiFloatingResponse
              panel={aiPanel}
              onApply={handleApplyAi}
              onClose={() => setAiPanel(null)}
            />
          ) : null}

          <Button
            size="small"
            startIcon={
              generatePriceMutation.isPending ? (
                <CircularProgress size={14} />
              ) : pricePanelOpen ? (
                <RefreshIcon fontSize="small" />
              ) : undefined
            }
            disabled={!payload || isAiPending}
            onClick={() => (pricePanelOpen ? handleRetry() : triggerAi('price'))}
            sx={{
              mt: pricePanelOpen && aiPanel ? 0.5 : 3.25,
              bgcolor: pricePanelOpen ? '#FFF3E0' : 'transparent',
              color: pricePanelOpen ? 'warning.dark' : 'warning.main',
              border: pricePanelOpen ? '1px solid' : 'none',
              borderColor: pricePanelOpen ? '#FFE0B2' : 'transparent',
              borderRadius: 2,
              px: pricePanelOpen ? 2 : 0,
              justifyContent: 'flex-start',
              '&:hover': pricePanelOpen ? { bgcolor: '#FFE0B2' } : undefined,
              '&:disabled': pricePanelOpen ? { bgcolor: '#FFF3E0', opacity: 0.6 } : undefined,
            }}
          >
            {generatePriceMutation.isPending
              ? 'Запрос...'
              : pricePanelOpen
                ? 'Повторить запрос'
                : 'Узнать рыночную цену'}
          </Button>
        </Box>

        {/* Разделитель между верхом формы и характеристиками (на всю ширину) */}
        <Divider sx={{ borderColor: 'grey.200', gridColumn: '1 / -1' }} />

        {/* Характеристики */}
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Характеристики
          </Typography>
          <CharacteristicsFields
            formState={formState}
            onChange={(params) => setFormState((prev) => ({ ...prev, params }))}
          />
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'block' } }} />

        <Divider sx={{ borderColor: 'grey.200', gridColumn: '1 / -1' }} />

        {/* Описание */}
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Описание
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            value={formState.description}
            inputProps={{ maxLength: 1000 }}
            onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
          />
          {descriptionDiff ? (
            <BeforeAfterDiff before={descriptionDiff.before} after={descriptionDiff.after} />
          ) : null}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 0.5,
            }}
          >
            <Button
              size="small"
              color="warning"
              startIcon={<LightbulbOutlinedIcon fontSize="small" />}
              disabled={!payload || isAiPending}
              onClick={() => triggerAi('description')}
              sx={{ px: 0 }}
            >
              {generateDescriptionMutation.isPending
                ? 'Генерация...'
                : formState.description.trim()
                  ? 'Улучшить описание'
                  : 'Придумать описание'}
            </Button>
            <Typography variant="caption" color="text.secondary">
              {formState.description.length} / 1000
            </Typography>
          </Box>
        </Box>

        {/* Правая колонка: ответ AI для описания */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, py: 2 }}>
          {descriptionPanelOpen && aiPanel ? (
            <>
              <AiFloatingResponse
                panel={aiPanel}
                onApply={handleApplyAi}
                onClose={() => setAiPanel(null)}
              />
              <Button
                size="small"
                startIcon={<RefreshIcon fontSize="small" />}
                disabled={isAiPending}
                onClick={handleRetry}
                sx={{
                  mt: 0.5,
                  bgcolor: '#FFF3E0',
                  color: 'warning.dark',
                  border: '1px solid',
                  borderColor: '#FFE0B2',
                  borderRadius: 2,
                  px: 2,
                  '&:hover': { bgcolor: '#FFE0B2' },
                  '&:disabled': { bgcolor: '#FFF3E0', opacity: 0.6 },
                }}
              >
                Повторить запрос
              </Button>
            </>
          ) : null}
        </Box>
      </Box>

      <Stack direction="row" spacing={1.5}>
        <Button
          variant="contained"
          disabled={updateMutation.isPending}
          onClick={handleSave}
          startIcon={updateMutation.isPending ? <CircularProgress size={16} /> : undefined}
        >
          Сохранить
        </Button>
        <Button component={RouterLink} to={`/ads/${adId}`} variant="outlined" color="inherit">
          Отменить
        </Button>
      </Stack>

      <AiChat systemContext={buildAdContext(formState)} />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        message={toast}
      />
    </Stack>
  );
}

// Оболочка страницы

export function AdEditPage() {
  const params = useParams();
  const adId = Number(params.id);

  const adQuery = useQuery({
    queryKey: ['ad-edit', adId],
    queryFn: ({ signal }) => getAdById(adId, signal),
    enabled: Number.isFinite(adId),
  });

  const initialState = useMemo<FormState | null>(() => {
    if (!adQuery.data) return null;

    const baseState = buildInitialFormState({
      category: adQuery.data.category,
      title: adQuery.data.title,
      description: adQuery.data.description ?? '',
      price: adQuery.data.price ?? 0,
      params: adQuery.data.params,
    });

    const fromDraft = localStorage.getItem(draftKey(adId));
    if (!fromDraft) return baseState;

    try {
      const draft = JSON.parse(fromDraft) as Partial<FormState>;
      if (!draft || typeof draft !== 'object') return baseState;

      return {
        ...baseState,
        ...draft,
        category: (draft.category ?? baseState.category) as ItemCategory,
        params: {
          ...baseState.params,
          ...(draft.params ?? {}),
        },
      };
    } catch {
      return baseState;
    }
  }, [adId, adQuery.data]);

  if (!Number.isFinite(adId)) {
    return <ErrorState message="Некорректный идентификатор объявления" />;
  }

  if (adQuery.isLoading || !initialState) {
    return <LoadingState />;
  }

  if (adQuery.isError || !adQuery.data) {
    return <ErrorState message="Не удалось загрузить объявление для редактирования" />;
  }

  // key={adId} принудительно перемонтирует компонент при переходе между разными
  // объявлениями, предотвращая «утечку» устаревшего состояния черновика.
  return <AdEditForm adId={adId} initialState={initialState} key={adId} />;
}
