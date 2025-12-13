/**
 * Theme Store
 * Manages app theme (dark/light mode) with persistence
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'dark' | 'light';

interface ThemeStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  loadTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@jarvis_theme_mode';

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: 'dark', // Default to dark

  setMode: async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      set({ mode });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  },

  loadTheme: async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode === 'dark' || savedMode === 'light') {
        set({ mode: savedMode });
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  },
}));
