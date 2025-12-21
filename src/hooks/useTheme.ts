/**
 * useTheme Hook
 * Provides reactive access to theme colors based on current theme preset
 * Supports system theme detection
 */

import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../theme';
import { getPresetColors } from '../theme/presets';

export const useTheme = () => {
  const themeMode = useThemeStore((state) => state.mode);
  const presetId = useThemeStore((state) => state.presetId);
  const getResolvedMode = useThemeStore((state) => state.getResolvedMode);

  const [colors, setColors] = useState(() => {
    const resolvedMode = getResolvedMode();
    // Use preset colors if available, otherwise fall back to default mode colors
    return presetId ? getPresetColors(presetId) : getColors(resolvedMode);
  });

  useEffect(() => {
    // Update colors when preset or mode changes
    const resolvedMode = getResolvedMode();
    setColors(presetId ? getPresetColors(presetId) : getColors(resolvedMode));
  }, [themeMode, presetId, getResolvedMode]);

  // Listen for system theme changes when mode is 'system'
  useEffect(() => {
    if (themeMode !== 'system') return;

    const subscription = Appearance.addChangeListener(() => {
      const resolvedMode = getResolvedMode();
      setColors(presetId ? getPresetColors(presetId) : getColors(resolvedMode));
    });

    return () => subscription.remove();
  }, [themeMode, presetId, getResolvedMode]);

  const resolvedMode = getResolvedMode();

  return {
    colors,
    mode: themeMode,
    resolvedMode,
    presetId,
    isDark: resolvedMode === 'dark',
    isLight: resolvedMode === 'light',
  };
};
