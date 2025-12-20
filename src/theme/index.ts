/**
 * Comprehensive Design System
 * Professional, polished theme tokens for a stunning UI
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

// Dark Theme Colors
const darkColors = {
  // Primary Brand Color - Emerald Green
  primary: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    contrast: '#FFFFFF',
  },

  // Dark Mode Backgrounds - Elevated Dark theme with near-black backgrounds
  background: {
    primary: '#050A18',    // Near black - main app background for maximum contrast
    secondary: '#0A1628',  // Cards, elevated surfaces - rich dark blue
    tertiary: '#141E30',   // Subtle highlights, borders
    elevated: '#1A2538',   // Modals, dropdowns
  },

  // Text Colors (optimized for dark backgrounds)
  text: {
    primary: '#F8FAFC',    // Primary text - bright white
    secondary: '#E2E8F0',  // Secondary text - soft white
    tertiary: '#94A3B8',   // Muted text - slate
    disabled: '#64748B',   // Disabled state
    placeholder: '#64748B', // Input placeholders
    inverse: '#0F172A',    // Text on light backgrounds
  },

  // Semantic Colors
  success: '#10B981',      // Green - matches primary
  warning: '#F59E0B',      // Amber
  error: '#EF4444',        // Red
  info: '#3B82F6',         // Blue

  // Border Colors
  border: {
    default: '#334155',
    subtle: '#1E293B',
    focus: '#10B981',
    error: '#EF4444',
  },

  // Gradient definitions - Elevated Dark gradients
  gradient: {
    primary: ['#10B981', '#059669'],       // Emerald gradient for primary actions
    cyan: ['#06B6D4', '#0891B2'],          // Cyan gradient for accents
    accent: ['#8B5CF6', '#3B82F6'],        // Purple-to-blue gradient for special elements
    card: ['#0A1628', '#141E30'],          // Subtle card background gradient
    overlay: ['rgba(5, 10, 24, 0)', 'rgba(5, 10, 24, 0.95)'], // Updated for new darker background
    glass: ['rgba(10, 22, 40, 0.6)', 'rgba(20, 30, 48, 0.3)'], // Glass effect overlay
  },
};

// Light Theme Colors
const lightColors = {
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

  // Gradient definitions
  gradient: {
    primary: ['#10B981', '#059669'],
    card: ['#F8FAFC', '#F1F5F9'],
    overlay: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.9)'],
  },
};

// Export color getter function
export const getColors = (mode: 'dark' | 'light' = 'dark') => {
  return mode === 'dark' ? darkColors : lightColors;
};

// Export default colors (dark mode for backwards compatibility)
export const colors = darkColors;

// Export type for colors
export type ColorScheme = typeof darkColors;

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

  // Font weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Type scale (harmonious progression)
  size: {
    xs: 11,      // Fine print
    sm: 13,      // Captions, labels
    base: 15,    // Body text
    md: 16,      // Slightly larger body
    lg: 18,      // Subheadings
    xl: 20,      // Section headers
    '2xl': 24,   // Screen titles
    '3xl': 28,   // Large titles
    '4xl': 32,   // Hero text
    '5xl': 40,   // Display
  },

  // Line heights for readability
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
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
// 4-point grid system for consistent spacing

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
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: 0,
  xs: 6,       // Slightly increased for modern feel
  sm: 10,      // Increased
  md: 14,      // Increased
  lg: 22,      // Elevated Dark default - more rounded for modern cards
  xl: 26,      // Increased
  '2xl': 32,   // Kept for large modals
  '3xl': 40,   // Increased for hero elements
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
  // Colored glow shadows for modern UI effects
  glow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  glowPrimary: {
    shadowColor: '#10B981',  // Emerald glow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  glowCyan: {
    shadowColor: '#06B6D4',  // Cyan glow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  glowPurple: {
    shadowColor: '#8B5CF6',  // Purple glow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  glowAccent: {
    shadowColor: '#3B82F6',  // Blue glow for special elements
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
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

// Pre-built text styles for consistency
export const textStyles = {
  // Display text - large hero headers
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
