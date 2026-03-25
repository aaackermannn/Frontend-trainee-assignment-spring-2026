import { beforeEach, describe, expect, it } from 'vitest';
import { useAdsFiltersStore } from './adsFilters';

// Сбрасываем стор в чистое состояние между тестами, чтобы избежать взаимного влияния
beforeEach(() => {
  useAdsFiltersStore.getState().resetFilters();
});

describe('useAdsFiltersStore — initial state', () => {
  it('has correct defaults', () => {
    const state = useAdsFiltersStore.getState();
    expect(state.query).toBe('');
    expect(state.categories).toEqual([]);
    expect(state.needsRevisionOnly).toBe(false);
    expect(state.sortValue).toBe('createdAt:desc');
    expect(state.page).toBe(1);
  });
});

describe('useAdsFiltersStore — setQuery', () => {
  it('updates query and resets page to 1', () => {
    const { setPage, setQuery } = useAdsFiltersStore.getState();
    setPage(4);
    setQuery('iPhone');
    const { query, page } = useAdsFiltersStore.getState();
    expect(query).toBe('iPhone');
    expect(page).toBe(1);
  });
});

describe('useAdsFiltersStore — toggleCategory', () => {
  it('adds a category when it is not selected', () => {
    useAdsFiltersStore.getState().toggleCategory('electronics');
    expect(useAdsFiltersStore.getState().categories).toContain('electronics');
  });

  it('removes a category when it is already selected', () => {
    const { toggleCategory } = useAdsFiltersStore.getState();
    toggleCategory('auto');
    toggleCategory('auto');
    expect(useAdsFiltersStore.getState().categories).not.toContain('auto');
  });

  it('resets page to 1', () => {
    const { setPage, toggleCategory } = useAdsFiltersStore.getState();
    setPage(3);
    toggleCategory('real_estate');
    expect(useAdsFiltersStore.getState().page).toBe(1);
  });

  it('can have multiple categories selected simultaneously', () => {
    const { toggleCategory } = useAdsFiltersStore.getState();
    toggleCategory('auto');
    toggleCategory('electronics');
    expect(useAdsFiltersStore.getState().categories).toEqual(
      expect.arrayContaining(['auto', 'electronics']),
    );
  });
});

describe('useAdsFiltersStore — setNeedsRevisionOnly', () => {
  it('sets the flag and resets page', () => {
    const { setPage, setNeedsRevisionOnly } = useAdsFiltersStore.getState();
    setPage(2);
    setNeedsRevisionOnly(true);
    expect(useAdsFiltersStore.getState().needsRevisionOnly).toBe(true);
    expect(useAdsFiltersStore.getState().page).toBe(1);
  });
});

describe('useAdsFiltersStore — setSortValue', () => {
  it('updates sort and resets page', () => {
    const { setPage, setSortValue } = useAdsFiltersStore.getState();
    setPage(5);
    setSortValue('title:asc');
    expect(useAdsFiltersStore.getState().sortValue).toBe('title:asc');
    expect(useAdsFiltersStore.getState().page).toBe(1);
  });
});

describe('useAdsFiltersStore — resetFilters', () => {
  it('restores the full initial state regardless of how much was changed', () => {
    const { setQuery, toggleCategory, setNeedsRevisionOnly, setSortValue, setPage, resetFilters } =
      useAdsFiltersStore.getState();

    setQuery('test search');
    toggleCategory('auto');
    setNeedsRevisionOnly(true);
    setSortValue('title:desc');
    setPage(7);

    resetFilters();

    const state = useAdsFiltersStore.getState();
    expect(state.query).toBe('');
    expect(state.categories).toEqual([]);
    expect(state.needsRevisionOnly).toBe(false);
    expect(state.sortValue).toBe('createdAt:desc');
    expect(state.page).toBe(1);
  });
});
