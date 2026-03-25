import { create } from 'zustand';
import type { ItemCategory } from '../types/items';

type AdsFiltersState = {
  query: string;
  categories: ItemCategory[];
  needsRevisionOnly: boolean;
  sortValue: 'createdAt:desc' | 'createdAt:asc' | 'title:asc' | 'title:desc';
  page: number;
  setQuery: (value: string) => void;
  toggleCategory: (category: ItemCategory) => void;
  setNeedsRevisionOnly: (value: boolean) => void;
  setSortValue: (value: AdsFiltersState['sortValue']) => void;
  setPage: (value: number) => void;
  resetFilters: () => void;
};

const initialState = {
  query: '',
  categories: [] as ItemCategory[],
  needsRevisionOnly: false,
  sortValue: 'createdAt:desc' as const,
  page: 1,
};

export const useAdsFiltersStore = create<AdsFiltersState>((set) => ({
  ...initialState,
  setQuery: (value) => set({ query: value, page: 1 }),
  toggleCategory: (category) =>
    set((state) => ({
      categories: state.categories.includes(category)
        ? state.categories.filter((item) => item !== category)
        : [...state.categories, category],
      page: 1,
    })),
  setNeedsRevisionOnly: (value) => set({ needsRevisionOnly: value, page: 1 }),
  setSortValue: (value) => set({ sortValue: value, page: 1 }),
  setPage: (value) => set({ page: value }),
  resetFilters: () => set(initialState),
}));
