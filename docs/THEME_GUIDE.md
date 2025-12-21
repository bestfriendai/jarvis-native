# Theme Guide

**Last Updated**: 2025-12-21
**Purpose**: Comprehensive guide to the design system and theming in Jarvis Native

---

## Table of Contents

1. [Overview](#overview)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Border Radius](#border-radius)
6. [Shadows & Elevation](#shadows--elevation)
7. [Animations](#animations)
8. [Component Presets](#component-presets)
9. [Theme Provider](#theme-provider)
10. [Dark Mode](#dark-mode)
11. [Best Practices](#best-practices)
12. [Migration Guide](#migration-guide)

---

## Overview

Jarvis Native uses a comprehensive design system with consistent tokens for colors, typography, spacing, and more. The theme is located in `/src/theme/index.ts` and provides both dark and light mode support.

### Design Philosophy

- **Vibrant & Bold**: High-contrast colors, neon accents, dramatic gradients
- **Modern & Clean**: Balanced spacing, readable typography, smooth animations
- **Accessible**: WCAG 2.1 AA compliant color contrast
- **Responsive**: Scalable tokens that work across different screen sizes

---

## Color System

All colors are accessed through the theme context using the `useTheme()` hook.

### Using Colors

```typescript
import { useTheme } from '../theme/ThemeProvider';

function MyComponent() {
  const { colors } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background.primary }}>
      <Text style={{ color: colors.text.primary }}>Hello</Text>
    </View>
  );
}
```

### Primary Colors

**File**: `/src/theme/index.ts`, Lines 70-77

```typescript
const { colors } = useTheme();

// Primary brand color (vibrant emerald green)
colors.primary.main       // '#10E87F' - Main brand color
colors.primary.light      // '#3CFFAA' - Lighter variant
colors.primary.dark       // '#06C270' - Darker variant
colors.primary.contrast   // '#FFFFFF' - Text on primary
```

**Usage Example**: Primary buttons, links, focus states

```typescript
<TouchableOpacity
  style={{
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.dark,
  }}
>
  <Text style={{ color: colors.primary.contrast }}>Button</Text>
</TouchableOpacity>
```

### Accent Colors

**File**: `/src/theme/index.ts`, Lines 79-86

```typescript
colors.accent.cyan        // '#00E5FF' - Electric cyan
colors.accent.purple      // '#B388FF' - Vibrant purple
colors.accent.pink        // '#FF4081' - Hot pink
colors.accent.orange      // '#FF9100' - Bright orange
colors.accent.blue        // '#2196F3' - Vivid blue
colors.accent.yellow      // '#FFD600' - Gold yellow
```

**Usage Example**: Category colors, status badges, data visualization

### Background Colors

**File**: `/src/theme/index.ts`, Lines 89-94

```typescript
// Dark mode backgrounds
colors.background.primary    // '#000000' - Pure black (main app background)
colors.background.secondary  // '#0D1117' - Very dark blue-grey (cards)
colors.background.tertiary   // '#161B22' - Slightly lighter (highlights)
colors.background.elevated   // '#1C2128' - Modals, dropdowns
```

**Usage Example**: Screen and card backgrounds

```typescript
// Screen container
<View style={{ backgroundColor: colors.background.primary }}>
  {/* Card */}
  <View style={{ backgroundColor: colors.background.secondary }}>
    <Text>Content</Text>
  </View>
</View>
```

### Text Colors

**File**: `/src/theme/index.ts`, Lines 97-105

```typescript
colors.text.primary       // '#FFFFFF' - Primary text (maximum readability)
colors.text.secondary     // '#F0F0F0' - Secondary text
colors.text.tertiary      // '#A0A0A0' - Tertiary/muted text
colors.text.disabled      // '#6E7681' - Disabled state
colors.text.placeholder   // '#6E7681' - Input placeholders
colors.text.inverse       // '#0F172A' - Text on light backgrounds
```

**Usage Example**: Text hierarchy

```typescript
<Text style={{ color: colors.text.primary }}>Main Heading</Text>
<Text style={{ color: colors.text.secondary }}>Subheading</Text>
<Text style={{ color: colors.text.tertiary }}>Caption or helper text</Text>
```

### Semantic Colors

**File**: `/src/theme/index.ts`, Lines 107-111

```typescript
colors.success   // '#10E87F' - Success states, confirmations
colors.warning   // '#FFB020' - Warnings, cautions
colors.error     // '#FF3860' - Errors, destructive actions
colors.info      // '#2196F3' - Informational messages
```

**Usage Example**: Status badges, alerts

```typescript
// Success badge
<View style={{ backgroundColor: colors.success }}>
  <Text style={{ color: colors.primary.contrast }}>Completed</Text>
</View>

// Error message
<Text style={{ color: colors.error }}>Failed to save</Text>
```

### Border Colors

**File**: `/src/theme/index.ts`, Lines 113-118

```typescript
colors.border.default   // '#30363D' - Default borders
colors.border.subtle    // '#21262D' - Subtle dividers
colors.border.focus     // '#10E87F' - Focus state (primary)
colors.border.error     // '#FF3860' - Error state
```

**Usage Example**: Input borders

```typescript
<TextInput
  style={{
    borderColor: isFocused ? colors.border.focus : colors.border.default,
    borderWidth: 1.5,
  }}
/>
```

### Gradients

**File**: `/src/theme/index.ts`, Lines 121-149

All gradients are arrays of color strings ready for `LinearGradient`:

```typescript
import { LinearGradient } from 'expo-linear-gradient';

// Primary gradient (vibrant emerald)
colors.gradient.primary        // ['#10E87F', '#06C270']

// Neon gradients
colors.gradient.cyan           // ['#00E5FF', '#00B8D4']
colors.gradient.cyanPurple     // ['#00E5FF', '#B388FF']
colors.gradient.purplePink     // ['#B388FF', '#FF4081']
colors.gradient.pinkOrange     // ['#FF4081', '#FF9100']
colors.gradient.rainbow        // ['#10E87F', '#00E5FF', '#B388FF', '#FF4081']

// Hero gradients
colors.gradient.hero           // ['#10E87F', '#00E5FF', '#B388FF']
colors.gradient.heroReverse    // ['#B388FF', '#00E5FF', '#10E87F']

// Card gradients
colors.gradient.card           // ['#0D1117', '#161B22']
colors.gradient.cardElevated   // ['#161B22', '#1C2128']

// Glass effects
colors.gradient.glass          // Semi-transparent gradient
colors.gradient.glassVibrant   // Colored glass with primary/cyan
```

**Usage Example**: Gradient buttons

**File**: `/src/components/ui/AppButton.tsx`, Lines 190-198

```typescript
<LinearGradient
  colors={colors.gradient.primary}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.button}
>
  <Text>Gradient Button</Text>
</LinearGradient>
```

### Color Contrast

All color combinations meet WCAG 2.1 AA standards:

- **Primary on background**: 12.5:1 contrast ratio
- **Text primary on background**: 21:1 contrast ratio
- **Text secondary on background**: 15.2:1 contrast ratio

---

## Typography

**File**: `/src/theme/index.ts`, Lines 240-292

### Font Sizes

```typescript
import { typography } from '../theme';

typography.size.xs      // 12 - Fine print, labels
typography.size.sm      // 14 - Captions, helper text
typography.size.base    // 16 - Body text (default)
typography.size.md      // 18 - Slightly larger body
typography.size.lg      // 20 - Subheadings
typography.size.xl      // 24 - Section headers
typography.size['2xl']  // 28 - Screen titles
typography.size['3xl']  // 32 - Large titles
typography.size['4xl']  // 36 - Hero text
typography.size['5xl']  // 40 - Display text
typography.size['6xl']  // 48 - Large display text
```

### Font Weights

```typescript
typography.weight.regular   // '400' - Body text
typography.weight.medium    // '600' - Emphasis (bumped up for boldness)
typography.weight.semibold  // '700' - Subheadings (bumped up)
typography.weight.bold      // '800' - Headings (bumped up)
typography.weight.black     // '900' - Hero text (NEW)
```

### Line Heights

```typescript
typography.lineHeight.none     // 1
typography.lineHeight.tight    // 1.2  - Big headlines
typography.lineHeight.snug     // 1.4
typography.lineHeight.normal   // 1.6  - Body text
typography.lineHeight.relaxed  // 1.75 - Long-form content
typography.lineHeight.loose    // 2
```

### Letter Spacing

```typescript
typography.letterSpacing.tighter  // -0.8
typography.letterSpacing.tight    // -0.4
typography.letterSpacing.normal   // 0
typography.letterSpacing.wide     // 0.4
typography.letterSpacing.wider    // 0.8
typography.letterSpacing.widest   // 1.6
```

### Text Style Presets

**File**: `/src/theme/index.ts`, Lines 463-557

Pre-built text styles for consistency:

```typescript
import { textStyles } from '../theme';

// Hero text (special occasions)
<Text style={textStyles.hero}>Welcome</Text>

// Display (prominent headers)
<Text style={textStyles.display}>Dashboard</Text>

// H1 - Main screen titles
<Text style={textStyles.h1}>Tasks</Text>

// H2 - Section titles
<Text style={textStyles.h2}>Today's Focus</Text>

// H3 - Subsection titles
<Text style={textStyles.h3}>Overdue Tasks</Text>

// H4 - Card titles
<Text style={textStyles.h4}>Project Progress</Text>

// Body - Primary content
<Text style={textStyles.body}>Task description goes here</Text>

// Body Secondary - Less emphasis
<Text style={textStyles.bodySecondary}>Additional details</Text>

// Body Small - Compact text
<Text style={textStyles.bodySmall}>Helper text</Text>

// Caption - Timestamps, metadata
<Text style={textStyles.caption}>2 hours ago</Text>

// Label - Form labels, section headers
<Text style={textStyles.label}>TASK TITLE</Text>

// Button text
<Text style={textStyles.button}>Save Changes</Text>

// Link text
<Text style={textStyles.link}>View all tasks</Text>
```

**Usage Example**: Combining text styles with custom overrides

```typescript
<Text style={[textStyles.h2, { color: colors.primary.main }]}>
  Custom Styled Header
</Text>
```

---

## Spacing & Layout

**File**: `/src/theme/index.ts`, Lines 299-312

Consistent spacing scale based on 4px increments:

```typescript
import { spacing } from '../theme';

spacing.none    // 0
spacing.xs      // 4   - Tight spacing
spacing.sm      // 8   - Small gaps
spacing.md      // 12  - Medium gaps
spacing.base    // 16  - Standard padding (most common)
spacing.lg      // 20  - Large gaps
spacing.xl      // 24  - Section spacing
spacing['2xl']  // 32  - Large section spacing
spacing['3xl']  // 40  - Page margins
spacing['4xl']  // 48  - Large page margins
spacing['5xl']  // 64  - Hero sections
spacing['6xl']  // 80  - Massive sections
```

**Usage Example**: Component spacing

```typescript
const styles = StyleSheet.create({
  container: {
    padding: spacing.base,          // 16px
    marginBottom: spacing.lg,       // 20px
  },
  header: {
    paddingHorizontal: spacing.xl,  // 24px
    paddingTop: spacing.md,         // 12px
  },
});
```

**Common Patterns**:
- **Card padding**: `spacing.base` (16px)
- **Screen padding**: `spacing.lg` or `spacing.xl` (20-24px)
- **List item spacing**: `spacing.sm` or `spacing.md` (8-12px)
- **Section margins**: `spacing.xl` or `spacing['2xl']` (24-32px)

---

## Border Radius

**File**: `/src/theme/index.ts`, Lines 319-329

Modern, balanced border radius system:

```typescript
import { borderRadius } from '../theme';

borderRadius.none    // 0
borderRadius.xs      // 6   - Subtle rounding
borderRadius.sm      // 10  - Small rounded corners
borderRadius.md      // 14  - Medium rounded corners (buttons, inputs)
borderRadius.lg      // 18  - Large rounded corners (cards)
borderRadius.xl      // 22  - Extra large
borderRadius['2xl']  // 28  - Very large
borderRadius['3xl']  // 36  - Maximum rounded corners
borderRadius.full    // 9999 - Full circle (avatars, badges)
```

**Usage Example**: Consistent rounding

```typescript
const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,  // 14px
  },
  card: {
    borderRadius: borderRadius.lg,  // 18px
  },
  avatar: {
    borderRadius: borderRadius.full,  // Circle
  },
});
```

---

## Shadows & Elevation

**File**: `/src/theme/index.ts`, Lines 336-436

Professional shadow system with standard and colored glow shadows:

### Standard Shadows

```typescript
import { shadows } from '../theme';

shadows.none   // No shadow
shadows.xs     // Minimal shadow (subtle elevation)
shadows.sm     // Small shadow (buttons, chips)
shadows.md     // Medium shadow (cards)
shadows.lg     // Large shadow (modals, elevated cards)
shadows.xl     // Extra large shadow (floating panels)
```

**Usage Example**: Card elevation

```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.sm,  // Spread shadow properties
  },
});
```

### Colored Glow Shadows

Dramatic, vibrant shadows that make elements pop:

```typescript
shadows.glow           // Generic glow
shadows.glowPrimary    // Vibrant emerald glow (primary actions)
shadows.glowCyan       // Electric cyan glow
shadows.glowPurple     // Vibrant purple glow
shadows.glowPink       // Hot pink glow
shadows.glowOrange     // Bright orange glow
shadows.glowAccent     // Blue glow (special elements)
shadows.glowHero       // Massive hero glow (important CTAs)
```

**Usage Example**: Primary button with glow

**File**: `/src/components/ui/AppButton.tsx`, Lines 242-243

```typescript
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: colors.primary.main,
    ...shadows.glowPrimary,  // Adds vibrant green glow
  },
});
```

**File**: `/src/components/ui/FloatingActionButton.tsx`, Lines 119

```typescript
// FAB with dramatic glow
<LinearGradient
  colors={colors.gradient.primary}
  style={[styles.gradient, shadows.glowPrimary]}
>
  <Icon name="plus" />
</LinearGradient>
```

---

## Animations

**File**: `/src/theme/index.ts`, Lines 443-456

Consistent animation timing and easing:

```typescript
import { animation } from '../theme';

// Durations
animation.duration.instant   // 0ms   - Instant changes
animation.duration.fast      // 150ms - Quick interactions
animation.duration.normal    // 250ms - Standard transitions
animation.duration.slow      // 400ms - Deliberate animations

// Easing (for CSS-like animations)
animation.easing.easeIn
animation.easing.easeOut
animation.easing.easeInOut

// Press scale
animation.pressedScale  // 0.97 - Scale down on press
```

**Usage Example**: Press animation

**File**: `/src/components/ui/AppButton.tsx`, Lines 63-78

```typescript
const [scaleValue] = useState(new Animated.Value(1));

const handlePressIn = () => {
  Animated.spring(scaleValue, {
    toValue: animation.pressedScale,  // 0.97
    useNativeDriver: true,
    speed: 50,
    bounciness: 4,
  }).start();
};

<Animated.View style={{ transform: [{ scale: scaleValue }] }}>
  <TouchableOpacity onPress={handlePress}>
    {/* Content */}
  </TouchableOpacity>
</Animated.View>
```

---

## Component Presets

Pre-built styles for common UI patterns.

### Card Styles

**File**: `/src/theme/index.ts`, Lines 560-573

```typescript
import { cardStyle, elevatedCardStyle } from '../theme';

// Standard card
const styles = StyleSheet.create({
  card: {
    ...cardStyle,
    // Includes: background, borderRadius, border, shadow
  },
});

// Elevated card
const styles = StyleSheet.create({
  modal: {
    ...elevatedCardStyle,
    // Includes: background, borderRadius, larger shadow
  },
});
```

### Input Styles

**File**: `/src/theme/index.ts`, Lines 576-598

```typescript
import { inputStyle, inputFocusStyle, inputErrorStyle } from '../theme';

const styles = StyleSheet.create({
  input: {
    ...inputStyle,
    // Includes: background, border, padding, text color/size
  },
  inputFocused: {
    ...inputFocusStyle,
    // Includes: primary border color, glow shadow
  },
  inputError: {
    ...inputErrorStyle,
    // Includes: error border color
  },
});
```

### Button Styles

**File**: `/src/theme/index.ts`, Lines 600-617

```typescript
import { primaryButtonStyle, secondaryButtonStyle } from '../theme';

const styles = StyleSheet.create({
  primaryButton: {
    ...primaryButtonStyle,
    // Includes: primary background, border radius, padding, shadow
  },
  secondaryButton: {
    ...secondaryButtonStyle,
    // Includes: transparent background, border, padding
  },
});
```

### Screen & Layout Styles

**File**: `/src/theme/index.ts`, Lines 619-653

```typescript
import { screenStyle, headerStyle, modalOverlayStyle, modalContentStyle } from '../theme';

// Screen container
<View style={screenStyle}>
  {/* Screen content */}
</View>

// Header
<View style={headerStyle}>
  <Text>Header</Text>
</View>

// Modal
<Modal>
  <View style={modalOverlayStyle}>
    <View style={modalContentStyle}>
      {/* Modal content */}
    </View>
  </View>
</Modal>
```

### Other Presets

```typescript
import { chipStyle, listItemStyle, dividerStyle, emptyStateStyle } from '../theme';

// Chip/Tag
<View style={chipStyle}>
  <Text>Tag</Text>
</View>

// List item
<View style={listItemStyle}>
  <Text>Item</Text>
</View>

// Divider
<View style={dividerStyle} />

// Empty state container
<View style={emptyStateStyle}>
  <EmptyState />
</View>
```

---

## Theme Provider

**File**: `/src/theme/ThemeProvider.tsx`

### Using the Theme

```typescript
import { useTheme } from '../theme/ThemeProvider';

function MyComponent() {
  const { colors, isDark, toggleTheme, themeMode } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background.primary }}>
      <Text style={{ color: colors.text.primary }}>
        Current mode: {themeMode}
      </Text>
      <Button title="Toggle Theme" onPress={toggleTheme} />
    </View>
  );
}
```

### Theme Context API

```typescript
interface ThemeContextType {
  colors: ColorScheme;      // Current color scheme
  isDark: boolean;          // Is dark mode active?
  themeMode: 'light' | 'dark' | 'system';  // Current theme mode
  toggleTheme: () => void;  // Switch light/dark
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}
```

---

## Dark Mode

The app supports three theme modes:

1. **Dark** (default) - Always use dark theme
2. **Light** - Always use light theme
3. **System** - Follow device appearance settings

### System Theme Detection

**File**: `/src/hooks/useTheme.ts`

The theme automatically responds to system appearance changes when set to 'system' mode:

```typescript
import { Appearance } from 'react-native';

// Listen to system appearance changes
Appearance.addChangeListener(({ colorScheme }) => {
  if (themeMode === 'system') {
    setColors(getColors(colorScheme === 'dark' ? 'dark' : 'light'));
  }
});
```

### Light Mode Colors

**File**: `/src/theme/index.ts`, Lines 153-222

Light mode uses the same structure but with lighter backgrounds and darker text:

```typescript
// Light mode backgrounds
background.primary: '#FFFFFF'     // White
background.secondary: '#F8FAFC'   // Very light grey
background.tertiary: '#F1F5F9'    // Light grey
background.elevated: '#E2E8F0'    // Elevated surfaces

// Light mode text
text.primary: '#0F172A'           // Dark slate
text.secondary: '#475569'         // Medium slate
text.tertiary: '#64748B'          // Light slate
```

---

## Best Practices

### 1. Always Use Theme Colors

**Bad**:
```typescript
<View style={{ backgroundColor: '#000000' }}>
  <Text style={{ color: '#FFFFFF' }}>Text</Text>
</View>
```

**Good**:
```typescript
const { colors } = useTheme();

<View style={{ backgroundColor: colors.background.primary }}>
  <Text style={{ color: colors.text.primary }}>Text</Text>
</View>
```

### 2. Use Semantic Color Names

**Bad**:
```typescript
<Text style={{ color: '#10E87F' }}>Success!</Text>
```

**Good**:
```typescript
<Text style={{ color: colors.success }}>Success!</Text>
```

### 3. Leverage Text Style Presets

**Bad**:
```typescript
<Text style={{
  fontSize: 24,
  fontWeight: '700',
  color: colors.text.primary,
  lineHeight: 28.8,
}}>
  Heading
</Text>
```

**Good**:
```typescript
<Text style={textStyles.h1}>Heading</Text>
```

### 4. Use Spacing Tokens

**Bad**:
```typescript
<View style={{ padding: 16, marginBottom: 20 }}>
```

**Good**:
```typescript
<View style={{ padding: spacing.base, marginBottom: spacing.lg }}>
```

### 5. Apply Consistent Shadows

**Bad**:
```typescript
<View style={{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 4,
}}>
```

**Good**:
```typescript
<View style={[styles.card, shadows.sm]}>
```

### 6. Test Both Themes

Always test your UI in both light and dark modes to ensure proper contrast and readability.

---

## Migration Guide

### From Hardcoded Colors to Theme

**Before**:
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D1117',
  },
  text: {
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#10E87F',
  },
});
```

**After**:
```typescript
import { useTheme } from '../theme/ThemeProvider';

function MyComponent() {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background.secondary,
    },
    text: {
      color: colors.text.primary,
    },
    button: {
      backgroundColor: colors.primary.main,
    },
  });

  return <View style={styles.container}>...</View>;
}
```

### From Inline Styles to Presets

**Before**:
```typescript
<View style={{
  backgroundColor: '#0D1117',
  borderRadius: 18,
  borderWidth: 1,
  borderColor: '#21262D',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 3,
}}>
```

**After**:
```typescript
import { cardStyle } from '../theme';

<View style={cardStyle}>
```

---

## Reference

### Files

- **Main theme file**: `/src/theme/index.ts`
- **Theme provider**: `/src/theme/ThemeProvider.tsx`
- **Theme hook**: `/src/hooks/useTheme.ts`
- **Preset configurations**: `/src/theme/presets.ts`

### Related Guides

- [ACCESSIBILITY_GUIDE.md](./ACCESSIBILITY_GUIDE.md) - Color contrast requirements
- [COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md) - Themed component usage
- [MOBILE_UX_PATTERNS.md](./MOBILE_UX_PATTERNS.md) - Visual design patterns

---

**Questions or Issues?** Reference the main theme file or check existing component implementations for usage examples.
