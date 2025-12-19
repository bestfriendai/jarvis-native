/**
 * Theme Provider
 * Provides theme context with light/dark mode support
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useThemeStore } from '../store/themeStore';
import { getColors } from './index';
import type { colors as darkColors } from './index';

type ColorScheme = typeof darkColors;

interface ThemeContextValue {
  colors: ColorScheme;
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mode = useThemeStore((state) => state.mode);
  const toggleMode = useThemeStore((state) => state.toggleMode);

  const value = useMemo(
    () => ({
      colors: getColors(mode),
      mode,
      toggleMode,
    }),
    [mode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
