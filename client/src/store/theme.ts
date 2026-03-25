import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark';

type ThemeStore = {
  mode: ThemeMode;
  toggleMode: () => void;
};

// Хранится отдельно от фильтров, чтобы тема сохранялась при перезагрузке страницы
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'light',
      toggleMode: () =>
        set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
    }),
    { name: 'theme-preference' },
  ),
);
