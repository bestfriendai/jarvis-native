# Theme System Implementation Guide

## Overview

This document outlines how to implement a theme switcher in Jarvis Native, allowing users to choose between different visual styles (Default, Whoop-inspired, Light mode, etc.) from Settings.

---

## Architecture

### 1. Theme Structure

Each theme contains:
- **Colors:** Primary, background, surface, text, semantic colors
- **Typography:** Font sizes, weights, line heights
- **Spacing:** Consistent spacing scale
- **Borders:** Radius values
- **Shadows:** Elevation system

### 2. File Structure

```
src/
├── theme/
│   ├── index.ts              # Theme provider & hook
│   ├── tokens/
│   │   ├── default.ts        # Default dark theme
│   │   ├── whoop.ts          # Whoop-inspired theme
│   │   ├── light.ts          # Light mode theme
│   │   └── types.ts          # TypeScript types
│   └── components/
│       └── ThemeProvider.tsx # Context provider
```

---

## Implementation Steps

### Step 1: Define Theme Types

**File:** `src/theme/tokens/types.ts`

```typescript
export interface Theme {
  name: string;
  colors: {
    // Brand
    primary: string;
    primaryDark: string;
    primaryLight: string;
    
    // Backgrounds
    background: string;
    surface: string;
    surfaceHover: string;
    
    // Text
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    
    // Semantic
    error: string;
    warning: string;
    success: string;
    info: string;
    
    // UI
    border: string;
    divider: string;
  };
  
  typography: {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    body: TextStyle;
    bodySmall: TextStyle;
    caption: TextStyle;
  };
  
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  
  shadows: {
    sm: ViewStyle;
    md: ViewStyle;
    lg: ViewStyle;
  };
}

interface TextStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: string;
  letterSpacing?: number;
}
```

### Step 2: Create Theme Tokens

**File:** `src/theme/tokens/default.ts`

```typescript
import { Theme } from './types';

export const defaultTheme: Theme = {
  name: 'Default',
  colors: {
    primary: '#10B981',
    primaryDark: '#059669',
    primaryLight: '#34D399',
    
    background: '#0F172A',
    surface: '#1E293B',
    surfaceHover: '#334155',
    
    textPrimary: '#FFFFFF',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
    
    border: '#334155',
    divider: '#1E293B',
  },
  
  typography: {
    h1: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
    h2: { fontSize: 24, lineHeight: 32, fontWeight: '600' },
    h3: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
    body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
    bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 5,
      elevation: 4,
    },
  },
};
```

**File:** `src/theme/tokens/whoop.ts`

```typescript
import { Theme } from './types';

export const whoopTheme: Theme = {
  name: 'Whoop',
  colors: {
    primary: '#00D26A',      // Whoop green
    primaryDark: '#00B359',
    primaryLight: '#33DC88',
    
    background: '#000000',   // Pure black
    surface: '#1A1A1A',      // Dark gray
    surfaceHover: '#2A2A2A',
    
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textTertiary: '#808080',
    
    error: '#FF3B30',
    warning: '#FFB800',      // Whoop yellow
    success: '#00D26A',
    info: '#4A90E2',         // Whoop blue
    
    border: '#2A2A2A',
    divider: '#1A1A1A',
  },
  
  // Same typography/spacing/radius as default
  // (copy from default.ts)
  typography: { /* ... */ },
  spacing: { /* ... */ },
  radius: { /* ... */ },
  shadows: { /* ... */ },
};
```

**File:** `src/theme/tokens/light.ts`

```typescript
import { Theme } from './types';

export const lightTheme: Theme = {
  name: 'Light',
  colors: {
    primary: '#10B981',
    primaryDark: '#059669',
    primaryLight: '#34D399',
    
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceHover: '#F1F5F9',
    
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#64748B',
    
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
    
    border: '#E2E8F0',
    divider: '#F1F5F9',
  },
  
  // Same typography/spacing/radius
  typography: { /* ... */ },
  spacing: { /* ... */ },
  radius: { /* ... */ },
  shadows: { /* ... */ },
};
```

### Step 3: Create Theme Context

**File:** `src/theme/components/ThemeProvider.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultTheme } from '../tokens/default';
import { whoopTheme } from '../tokens/whoop';
import { lightTheme } from '../tokens/light';
import { Theme } from '../tokens/types';

const THEME_STORAGE_KEY = '@jarvis_theme';

const themes = {
  default: defaultTheme,
  whoop: whoopTheme,
  light: lightTheme,
};

type ThemeKey = keyof typeof themes;

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeKey;
  setTheme: (name: ThemeKey) => void;
  availableThemes: ThemeKey[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeKey>('default');
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  // Load saved theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && savedTheme in themes) {
        setThemeName(savedTheme as ThemeKey);
        setTheme(themes[savedTheme as ThemeKey]);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const changeTheme = async (name: ThemeKey) => {
    try {
      setThemeName(name);
      setTheme(themes[name]);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, name);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeName,
        setTheme: changeTheme,
        availableThemes: Object.keys(themes) as ThemeKey[],
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

**File:** `src/theme/index.ts`

```typescript
export { ThemeProvider, useTheme } from './components/ThemeProvider';
export { defaultTheme } from './tokens/default';
export { whoopTheme } from './tokens/whoop';
export { lightTheme } from './tokens/light';
export type { Theme } from './tokens/types';
```

### Step 4: Wrap App with ThemeProvider

**File:** `App.tsx`

```typescript
import { ThemeProvider } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </PaperProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

### Step 5: Use Theme in Components

**Example:** `src/screens/main/TasksScreen.tsx`

```typescript
import { useTheme } from '../../theme';

export default function TasksScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        Tasks
      </Text>
      
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={{ color: theme.colors.textSecondary }}>
          Task content
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Don't hardcode colors here
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    // Don't hardcode colors here
  },
  card: {
    padding: 16,
    borderRadius: 12,
    // Don't hardcode colors here
  },
});
```

### Step 6: Create Theme Selector in Settings

**File:** `src/screens/main/SettingsScreen.tsx`

```typescript
import { useTheme } from '../../theme';

export default function SettingsScreen() {
  const { theme, themeName, setTheme, availableThemes } = useTheme();

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Appearance
        </Text>
        
        {availableThemes.map((name) => (
          <TouchableOpacity
            key={name}
            style={[
              styles.themeOption,
              { backgroundColor: theme.colors.surface },
              themeName === name && { borderColor: theme.colors.primary, borderWidth: 2 },
            ]}
            onPress={() => setTheme(name)}
          >
            <Text style={{ color: theme.colors.textPrimary }}>
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </Text>
            {themeName === name && (
              <Text style={{ color: theme.colors.primary }}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  themeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
});
```

---

## Migration Guide

### Converting Existing Components

**Before:**
```typescript
<View style={{ backgroundColor: '#1E293B' }}>
  <Text style={{ color: '#FFFFFF', fontSize: 24 }}>
    Title
  </Text>
</View>
```

**After:**
```typescript
const { theme } = useTheme();

<View style={{ backgroundColor: theme.colors.surface }}>
  <Text style={[theme.typography.h2, { color: theme.colors.textPrimary }]}>
    Title
  </Text>
</View>
```

### Creating Theme-Aware Styles

```typescript
const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
});

// Usage in component
const { theme } = useTheme();
const styles = createStyles(theme);
```

---

## Testing Checklist

- [ ] Theme persists after app restart
- [ ] All screens respect selected theme
- [ ] No hardcoded colors remain
- [ ] Theme switch is smooth (no flicker)
- [ ] AsyncStorage errors handled gracefully
- [ ] All three themes look good
- [ ] Text is readable in all themes
- [ ] Buttons/cards have proper contrast

---

## Future Enhancements

1. **Custom Themes**
   - Let users create custom color schemes
   - Color picker UI
   - Save multiple custom themes

2. **Auto Dark/Light**
   - Detect system theme preference
   - Auto-switch based on time of day
   - Follow system appearance setting

3. **Theme Preview**
   - Show preview before applying
   - Side-by-side comparison
   - Sample screens in each theme

4. **Animations**
   - Smooth color transitions when switching
   - Fade between themes
   - Animated theme selector

---

## Estimated Effort

- **Setup (Steps 1-4):** 4-6 hours
- **Settings UI (Step 6):** 2-3 hours
- **Migration (Step 5):** 8-12 hours (depends on number of screens)
- **Testing & Polish:** 3-4 hours

**Total:** ~20-25 hours

---

## Benefits

✅ Users can choose their preferred visual style  
✅ Easy to add new themes in the future  
✅ Consistent design across all screens  
✅ No hardcoded colors (easier maintenance)  
✅ Professional, polished feel  
✅ Whoop-inspired option for fitness-focused users
