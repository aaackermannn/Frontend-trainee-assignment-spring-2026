import axios from 'axios';
import { apiClient } from './client';
import type { AdDetails, AdUpdatePayload, AdsListResponse, ItemCategory } from '../types/items';

export type AdsQueryParams = {
  q: string;
  page: number;
  categories: ItemCategory[];
  needsRevisionOnly: boolean;
  sortColumn: 'title' | 'createdAt';
  sortDirection: 'asc' | 'desc';
};

const PAGE_SIZE = 10;

/**
 * Запрашивает постраничный отфильтрованный список объявлений.
 * `signal` передаётся в Axios, чтобы TanStack Query мог автоматически
 * отменить запрос при размонтировании компонента или изменении queryKey
 * это предотвращает гонки запросов при быстрой навигации
 */
export async function getAds(
  params: AdsQueryParams,
  signal?: AbortSignal,
): Promise<AdsListResponse> {
  const skip = (params.page - 1) * PAGE_SIZE;
  const { data } = await apiClient.get<AdsListResponse>('/items', {
    signal,
    params: {
      q: params.q,
      limit: PAGE_SIZE,
      skip,
      categories: params.categories.length > 0 ? params.categories.join(',') : undefined,
      needsRevision: params.needsRevisionOnly ? 'true' : undefined,
      sortColumn: params.sortColumn,
      sortDirection: params.sortDirection,
    },
  });

  return data;
}

export async function getAdById(id: number, signal?: AbortSignal): Promise<AdDetails> {
  const { data } = await apiClient.get<AdDetails>(`/items/${id}`, { signal });
  return data;
}

export async function updateAd(id: number, payload: AdUpdatePayload): Promise<void> {
  try {
    await apiClient.put(`/items/${id}`, payload);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const statusText = err.response?.statusText;
      const details =
        typeof err.response?.data === 'string'
          ? err.response?.data
          : err.response?.data
            ? JSON.stringify(err.response.data)
            : '';

      // Частые кейсы: сервер не запущен, таймаут, ошибка валидации на backend.
      if (err.code === 'ECONNABORTED') {
        throw new Error('Таймаут запроса. Проверьте, что backend запущен (порт 8080).');
      }

      if (!err.response) {
        throw new Error('Не удалось подключиться к backend. Проверьте, что сервер запущен (порт 8080).');
      }

      const suffix = [statusText, details].filter(Boolean).join(': ');
      throw new Error(`Сервер вернул ошибку${status ? ` ${status}` : ''}${suffix ? ` — ${suffix}` : ''}`);
    }
    throw err;
  }
}
