/**
 * Theme Provider
 *
 * A minimal wrapper component that ensures theme system is initialized.
 * The actual theme state is managed by Zustand (useThemeStore).
 *
 * Why this exists:
 * - Provides a consistent API pattern for wrapping the app
 * - Re-exports useTheme for convenient imports
 * - Can be extended in the future for React Context if needed
 *
 * Usage:
 *   import { ThemeProvider, useTheme } from './theme/ThemeProvider';
 *
 *   function App() {
 *     return (
 *       <ThemeProvider>
 *         <YourApp />
 *       </ThemeProvider>
 *     );
 *   }
 *
 * IMPROVEMENT NOTE: This is intentionally minimal since Zustand handles
 * theme state. If you need React Context for theme, extend this component.
 */

import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';

// Re-export the useTheme hook for convenient imports
export { useTheme } from '../hooks/useTheme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme Provider Component
 *
 * Wraps the app and initializes theme system.
 * Listens to system color scheme changes when mode is 'system'.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const loadTheme = useThemeStore((state) => state.loadTheme);

  // Initialize theme on mount
  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  // The actual theme values are accessed via useTheme() hook in child components
  // This provider just ensures initialization happens at app startup

  return <>{children}</>;
};

export default ThemeProvider;
