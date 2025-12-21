/**
 * Comprehensive Design System
 * Professional, polished theme tokens for a stunning UI
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

// Base color scheme type
type BaseColorScheme = {
  primary: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  accent: {
    cyan: string;
    purple: string;
    pink: string;
    orange: string;
    blue: string;
    yellow: string;
  };
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    placeholder: string;
    inverse: string;
  };
  success: string;
  warning: string;
  error: string;
  info: string;
  border: {
    default: string;
    subtle: string;
    focus: string;
    error: string;
  };
  gradient: {
    primary: string[];
    primaryGlow: string[];
    cyan: string[];
    cyanPurple: string[];
    purplePink: string[];
    pinkOrange: string[];
    rainbow: string[];
    hero: string[];
    heroReverse: string[];
    card: string[];
    cardElevated: string[];
    glass: string[];
    glassVibrant: string[];
    overlay: string[];
    shimmer: string[];
  };
};

// Dark Theme Colors
const darkColors: BaseColorScheme = {
  // Primary Brand Color - VIBRANT Emerald Green (MORE SATURATED!)
  primary: {
    main: '#10E87F',      // Brighter, more vibrant green
    light: '#3CFFAA',     // Neon green for highlights
    dark: '#06C270',      // Still vibrant dark
    contrast: '#FFFFFF',
  },

  // NEON Accent Colors - Make things POP!
  accent: {
    cyan: '#00E5FF',      // Electric cyan
    purple: '#B388FF',    // Vibrant purple
    pink: '#FF4081',      // Hot pink
    orange: '#FF9100',    // Bright orange
    blue: '#2196F3',      // Vivid blue
    yellow: '#FFD600',    // Gold yellow
  },

  // Dark Mode Backgrounds - DARKER for more contrast
  background: {
    primary: '#000000',    // Pure black - maximum contrast
    secondary: '#0D1117',  // Very dark blue-grey - cards
    tertiary: '#161B22',   // Slightly lighter - highlights
    elevated: '#1C2128',   // Modals, dropdowns
  },

  // Text Colors (HIGH CONTRAST for dark backgrounds)
  text: {
    primary: '#FFFFFF',    // Pure white - maximum readability
    secondary: '#F0F0F0',  // Bright grey
    tertiary: '#A0A0A0',   // Medium grey (still readable)
    disabled: '#6E7681',   // Disabled state
    placeholder: '#6E7681', // Input placeholders
    inverse: '#0F172A',    // Text on light backgrounds
  },

  // Semantic Colors - MORE VIBRANT!
  success: '#10E87F',      // Vibrant green - matches primary
  warning: '#FFB020',      // Bright amber/gold
  error: '#FF3860',        // Vivid red
  info: '#2196F3',         // Bright blue

  // Border Colors - MORE CONTRAST
  border: {
    default: '#30363D',
    subtle: '#21262D',
    focus: '#10E87F',
    error: '#FF3860',
  },

  // Gradient definitions - DRAMATIC GRADIENTS EVERYWHERE!
  gradient: {
    // Primary gradients - VIBRANT!
    primary: ['#10E87F', '#06C270'],           // Vibrant emerald
    primaryGlow: ['#10E87F', '#3CFFAA', '#10E87F'], // Neon green with glow

    // Neon accent gradients
    cyan: ['#00E5FF', '#00B8D4'],              // Electric cyan
    cyanPurple: ['#00E5FF', '#B388FF'],        // Cyan to purple
    purplePink: ['#B388FF', '#FF4081'],        // Purple to pink
    pinkOrange: ['#FF4081', '#FF9100'],        // Pink to orange
    rainbow: ['#10E87F', '#00E5FF', '#B388FF', '#FF4081'], // Multi-color rainbow

    // Hero gradients - FOR BIG MOMENTS
    hero: ['#10E87F', '#00E5FF', '#B388FF'],   // Green > Cyan > Purple
    heroReverse: ['#B388FF', '#00E5FF', '#10E87F'], // Purple > Cyan > Green

    // Card gradients - STRONGER
    card: ['#0D1117', '#161B22'],              // Dark gradient
    cardElevated: ['#161B22', '#1C2128'],      // Elevated gradient

    // Glass effects - MORE DRAMATIC
    glass: ['rgba(13, 17, 23, 0.8)', 'rgba(22, 27, 34, 0.4)'], // Stronger glass
    glassVibrant: ['rgba(16, 232, 127, 0.15)', 'rgba(0, 229, 255, 0.1)'], // Colored glass

    // Overlays
    overlay: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.95)'],
    shimmer: ['transparent', 'rgba(255, 255, 255, 0.1)', 'transparent'], // Shimmer effect
  },
};

// Light Theme Colors
const lightColors: BaseColorScheme = {
  // Primary Brand Color - Emerald Green (same across themes)
  primary: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    contrast: '#FFFFFF',
  },

  // Light Mode Backgrounds
  background: {
    primary: '#FFFFFF',    // White - main app background
    secondary: '#F8FAFC',  // Cards, elevated surfaces
    tertiary: '#F1F5F9',   // Subtle highlights, borders
    elevated: '#E2E8F0',   // Modals, dropdowns
  },

  // Text Colors (optimized for light backgrounds)
  text: {
    primary: '#0F172A',    // Primary text - dark slate
    secondary: '#475569',  // Secondary text - medium slate
    tertiary: '#64748B',   // Muted text - light slate
    disabled: '#94A3B8',   // Disabled state
    placeholder: '#94A3B8', // Input placeholders
    inverse: '#F8FAFC',    // Text on dark backgrounds
  },

  // Semantic Colors
  success: '#10B981',      // Green - matches primary
  warning: '#F59E0B',      // Amber
  error: '#EF4444',        // Red
  info: '#3B82F6',         // Blue

  // Border Colors
  border: {
    default: '#E2E8F0',
    subtle: '#F1F5F9',
    focus: '#10B981',
    error: '#EF4444',
  },

  // Gradient definitions - Light theme (simplified version of dark theme)
  gradient: {
    primary: ['#10E87F', '#06C270'],
    primaryGlow: ['#10E87F', '#3CFFAA', '#10E87F'],
    cyan: ['#00E5FF', '#00B8D4'],
    cyanPurple: ['#00E5FF', '#B388FF'],
    purplePink: ['#B388FF', '#FF4081'],
    pinkOrange: ['#FF4081', '#FF9100'],
    rainbow: ['#10E87F', '#00E5FF', '#B388FF', '#FF4081'],
    hero: ['#10E87F', '#00E5FF', '#B388FF'],
    heroReverse: ['#B388FF', '#00E5FF', '#10E87F'],
    card: ['#F8FAFC', '#F1F5F9'],
    cardElevated: ['#FFFFFF', '#F8FAFC'],
    glass: ['rgba(248, 250, 252, 0.8)', 'rgba(241, 245, 249, 0.4)'],
    glassVibrant: ['rgba(16, 232, 127, 0.1)', 'rgba(0, 229, 255, 0.05)'],
    overlay: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.9)'],
    shimmer: ['transparent', 'rgba(0, 0, 0, 0.05)', 'transparent'],
  },

  // Accent colors (same as dark theme)
  accent: {
    cyan: '#00E5FF',
    purple: '#B388FF',
    pink: '#FF4081',
    orange: '#FF9100',
    blue: '#2196F3',
    yellow: '#FFD600',
  },
};

// Export color getter function
export const getColors = (mode: 'dark' | 'light' = 'dark'): BaseColorScheme => {
  return mode === 'dark' ? darkColors : lightColors;
};

// Export default colors (dark mode for backwards compatibility)
export const colors = darkColors;

// Export type for colors - use the base type to ensure compatibility
export type ColorScheme = BaseColorScheme;

// ============================================================================
// TYPOGRAPHY
// ============================================================================
// Clean, readable type scale with proper hierarchy

export const typography = {
  // Font families (system fonts for optimal rendering)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Font weights - USE BOLDER BY DEFAULT
  weight: {
    regular: '400' as const,
    medium: '600' as const,    // Bumped from 500
    semibold: '700' as const,  // Bumped from 600
    bold: '800' as const,      // Bumped from 700
    black: '900' as const,     // NEW - for hero text
  },

  // Type scale - Balanced sizes for readability and hierarchy
  size: {
    xs: 12,      // Fine print, labels
    sm: 14,      // Captions, helper text
    base: 16,    // Body text
    md: 18,      // Slightly larger body
    lg: 20,      // Subheadings
    xl: 24,      // Section headers
    '2xl': 28,   // Screen titles
    '3xl': 32,   // Large titles
    '4xl': 36,   // Hero text
    '5xl': 40,   // Display (prominent but not overwhelming)
    '6xl': 48,   // Large display text
  },

  // Line heights for readability - MORE GENEROUS
  lineHeight: {
    none: 1,
    tight: 1.2,     // Tighter for big headlines
    snug: 1.4,      // Adjusted
    normal: 1.6,    // More breathing room
    relaxed: 1.75,  // More relaxed
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },
};

// ============================================================================
// SPACING
// ============================================================================
// Balanced spacing system for comfortable layouts

export const spacing = {
  none: 0,
  xs: 4,       // Tight spacing
  sm: 8,       // Small gaps
  md: 12,      // Medium gaps
  base: 16,    // Standard padding
  lg: 20,      // Large gaps
  xl: 24,      // Section spacing
  '2xl': 32,   // Large section spacing
  '3xl': 40,   // Page margins
  '4xl': 48,   // Large page margins
  '5xl': 64,   // Hero sections
  '6xl': 80,   // Massive sections
};

// ============================================================================
// BORDER RADIUS
// ============================================================================
// Modern, balanced border radius system

export const borderRadius = {
  none: 0,
  xs: 6,       // Subtle rounding
  sm: 10,      // Small rounded corners
  md: 14,      // Medium rounded corners
  lg: 18,      // Large rounded corners
  xl: 22,      // Extra large rounded corners
  '2xl': 28,   // Very large rounded corners
  '3xl': 36,   // Maximum rounded corners
  full: 9999,  // Full circle
};

// ============================================================================
// SHADOWS
// ============================================================================
// Subtle, professional shadow system

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  // DRAMATIC COLORED GLOW SHADOWS - Make everything POP!
  glow: {
    shadowColor: '#10E87F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,      // Stronger (was 0.35)
    shadowRadius: 20,        // Bigger (was 12)
    elevation: 8,
  },
  glowPrimary: {
    shadowColor: '#10E87F',  // Vibrant emerald glow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,      // Much stronger (was 0.5)
    shadowRadius: 24,        // Much bigger (was 16)
    elevation: 12,
  },
  glowCyan: {
    shadowColor: '#00E5FF',  // Electric cyan glow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,     // Stronger (was 0.45)
    shadowRadius: 24,        // Bigger (was 14)
    elevation: 12,
  },
  glowPurple: {
    shadowColor: '#B388FF',  // Vibrant purple glow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,      // Stronger (was 0.4)
    shadowRadius: 24,        // Bigger (was 14)
    elevation: 12,
  },
  glowPink: {
    shadowColor: '#FF4081',  // NEW - Hot pink glow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,
    shadowRadius: 24,
    elevation: 12,
  },
  glowOrange: {
    shadowColor: '#FF9100',  // NEW - Bright orange glow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,
    shadowRadius: 24,
    elevation: 12,
  },
  glowAccent: {
    shadowColor: '#2196F3',  // Blue glow for special elements
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,     // Stronger (was 0.45)
    shadowRadius: 24,        // Bigger (was 16)
    elevation: 12,
  },
  glowHero: {
    shadowColor: '#10E87F',  // NEW - MASSIVE hero glow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 32,
    elevation: 16,
  },
};

// ============================================================================
// ANIMATIONS
// ============================================================================

export const animation = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 400,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  // Scale for pressed states
  pressedScale: 0.97,
};

// ============================================================================
// COMPONENT PRESETS
// ============================================================================

// Pre-built text styles for consistency - Balanced hierarchy
export const textStyles = {
  // HERO text - Large display headers (for special occasions)
  hero: {
    fontSize: typography.size['6xl'],
    fontWeight: typography.weight.black,
    color: colors.text.primary,
    lineHeight: typography.size['6xl'] * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tighter,
  },
  // Display text - Prominent headers
  display: {
    fontSize: typography.size['5xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    lineHeight: typography.size['5xl'] * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  // H1 - Main screen titles
  h1: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    lineHeight: typography.size['3xl'] * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  // H2 - Section titles
  h2: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    lineHeight: typography.size['2xl'] * typography.lineHeight.snug,
  },
  // H3 - Subsection titles
  h3: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    lineHeight: typography.size.xl * typography.lineHeight.snug,
  },
  // H4 - Card titles
  h4: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    lineHeight: typography.size.lg * typography.lineHeight.normal,
  },
  // Body - Primary content
  body: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.regular,
    color: colors.text.primary,
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
  },
  // Body Secondary - Less emphasis
  bodySecondary: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.regular,
    color: colors.text.secondary,
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
  },
  // Body Small - Compact text
  bodySmall: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
    color: colors.text.secondary,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  // Caption - Helper text, timestamps
  caption: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
    color: colors.text.tertiary,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
  },
  // Label - Form labels, section headers
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase' as const,
  },
  // Button text
  button: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.letterSpacing.wide,
  },
  // Link text
  link: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.primary.main,
  },
};

// Card style preset
export const cardStyle = {
  backgroundColor: colors.background.secondary,
  borderRadius: borderRadius.lg,
  borderWidth: 1,
  borderColor: colors.border.subtle,
  ...shadows.sm,
};

// Elevated card style
export const elevatedCardStyle = {
  backgroundColor: colors.background.secondary,
  borderRadius: borderRadius.xl,
  ...shadows.md,
};

// Input style preset
export const inputStyle = {
  backgroundColor: colors.background.primary,
  borderRadius: borderRadius.md,
  borderWidth: 1.5,
  borderColor: colors.border.default,
  paddingHorizontal: spacing.base,
  paddingVertical: spacing.md,
  color: colors.text.primary,
  fontSize: typography.size.base,
  lineHeight: typography.size.base * typography.lineHeight.normal,
};

// Focus input style
export const inputFocusStyle = {
  borderColor: colors.primary.main,
  ...shadows.glow,
};

// Error input style
export const inputErrorStyle = {
  borderColor: colors.error,
};

// Primary button style
export const primaryButtonStyle = {
  backgroundColor: colors.primary.main,
  borderRadius: borderRadius.md,
  paddingHorizontal: spacing.xl,
  paddingVertical: spacing.md,
  ...shadows.sm,
};

// Secondary button style
export const secondaryButtonStyle = {
  backgroundColor: 'transparent',
  borderRadius: borderRadius.md,
  borderWidth: 1.5,
  borderColor: colors.border.default,
  paddingHorizontal: spacing.xl,
  paddingVertical: spacing.md,
};

// Screen container style
export const screenStyle = {
  flex: 1,
  backgroundColor: colors.background.primary,
};

// Header style
export const headerStyle = {
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.md,
  paddingBottom: spacing.base,
};

// Modal overlay style
export const modalOverlayStyle = {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  justifyContent: 'flex-end' as const,
};

// Modal content style
export const modalContentStyle = {
  backgroundColor: colors.background.secondary,
  borderTopLeftRadius: borderRadius['2xl'],
  borderTopRightRadius: borderRadius['2xl'],
  maxHeight: '90%',
};

// Chip/Tag style
export const chipStyle = {
  backgroundColor: colors.background.tertiary,
  borderRadius: borderRadius.sm,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
};

// List item style
export const listItemStyle = {
  backgroundColor: colors.background.secondary,
  borderRadius: borderRadius.lg,
  marginBottom: spacing.sm,
  padding: spacing.base,
  ...shadows.xs,
};

// Divider style
export const dividerStyle = {
  height: 1,
  backgroundColor: colors.border.subtle,
  marginVertical: spacing.md,
};

// Empty state style
export const emptyStateStyle = {
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  padding: spacing['4xl'],
};

// ============================================================================
// TOUCH TARGET SIZE
// ============================================================================

export const touchTarget = {
  min: 44, // Minimum touch target size
  icon: 48, // Icon button size
};

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
};
