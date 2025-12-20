# Jarvis Native - UI Implementation Guide

**Purpose**: Practical code examples for implementing the Premium UI Design Spec

---

## Quick Start: High-Impact Changes

### Step 1: Update Theme Colors (10 minutes)

Update `/src/theme/index.ts` with darker, more contrasted colors:

```typescript
// Replace existing darkColors with:
const darkColors = {
  primary: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    contrast: '#FFFFFF',
    // NEW: Gradient colors
    gradient: ['#10B981', '#059669'],
    glow: 'rgba(16, 185, 129, 0.4)',
  },

  // UPDATED: Darker backgrounds for more contrast
  background: {
    base: '#050A18',        // NEW: Near black base
    primary: '#0A1628',     // Darker (was #0F172A)
    secondary: '#0F1E32',   // Darker (was #1E293B)
    tertiary: '#182640',    // Darker (was #334155)
    elevated: '#1E3050',    // Darker (was #475569)
    glass: 'rgba(255, 255, 255, 0.06)', // NEW
  },

  text: {
    primary: '#FFFFFF',     // Brighter (was #F8FAFC)
    secondary: '#E2E8F0',
    tertiary: '#94A3B8',
    disabled: '#475569',
    placeholder: '#475569', // Darker (was #64748B)
    inverse: '#050A18',
  },

  // UPDATED: Softer borders
  border: {
    default: 'rgba(255, 255, 255, 0.1)',  // Glass-like
    subtle: 'rgba(255, 255, 255, 0.05)',
    focus: '#10B981',
    error: '#EF4444',
  },

  // ... rest unchanged
};
```

### Step 2: Update Border Radius (5 minutes)

```typescript
// Replace existing borderRadius with:
export const borderRadius = {
  none: 0,
  xs: 6,      // Was 4
  sm: 10,     // Was 8
  md: 14,     // Was 12
  lg: 18,     // Was 16
  xl: 22,     // Was 20
  '2xl': 28,  // Was 24
  '3xl': 36,  // Was 32
  full: 9999,
};
```

### Step 3: Update Shadows with Glows (10 minutes)

```typescript
// Add to shadows:
export const shadows = {
  // ... existing shadows ...

  // NEW: Colored glow shadows
  glowPrimary: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  glowCyan: {
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  glowWarm: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  glowDanger: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  // Enhanced card shadow
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
};
```

---

## Component Updates

### AppCard.tsx - Glass Effect Card

```typescript
// /src/components/ui/AppCard.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'expo-linear-gradient'; // or react-native-linear-gradient
import { colors, spacing, borderRadius, shadows, animation } from '../../theme';

type CardVariant = 'default' | 'elevated' | 'glass' | 'gradient' | 'active';

interface AppCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  glowColor?: string; // For active glow
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  contentStyle,
  header,
  footer,
  noPadding = false,
  glowColor,
}) => {
  const [scaleValue] = useState(new Animated.Value(1));

  const handlePressIn = useCallback(() => {
    if (onPress) {
      Animated.spring(scaleValue, {
        toValue: 0.98, // More subtle
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  }, [scaleValue, onPress]);

  const handlePressOut = useCallback(() => {
    if (onPress) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  }, [scaleValue, onPress]);

  const getCardStyles = (): ViewStyle[] => {
    const baseStyles: ViewStyle[] = [styles.card];

    switch (variant) {
      case 'default':
        baseStyles.push(styles.defaultCard);
        break;
      case 'elevated':
        baseStyles.push(styles.elevatedCard);
        break;
      case 'glass':
        baseStyles.push(styles.glassCard);
        break;
      case 'gradient':
        // Handled separately with LinearGradient wrapper
        baseStyles.push(styles.gradientCardInner);
        break;
      case 'active':
        baseStyles.push(styles.activeCard);
        if (glowColor) {
          baseStyles.push({
            shadowColor: glowColor,
          } as ViewStyle);
        }
        break;
    }

    return baseStyles;
  };

  const cardContent = (
    <>
      {header && <View style={styles.header}>{header}</View>}
      <View style={[styles.content, noPadding && styles.noPadding, contentStyle]}>
        {children}
      </View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </>
  );

  // Gradient border variant
  if (variant === 'gradient') {
    const innerCard = (
      <View style={getCardStyles()}>
        {cardContent}
      </View>
    );

    if (onPress) {
      return (
        <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
          <LinearGradient
            colors={['#10B981', '#06B6D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <TouchableOpacity
              onPress={onPress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.95}
            >
              {innerCard}
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      );
    }

    return (
      <LinearGradient
        colors={['#10B981', '#06B6D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientBorder, style]}
      >
        {innerCard}
      </LinearGradient>
    );
  }

  if (onPress) {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.95}
          style={getCardStyles()}
        >
          {cardContent}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={[...getCardStyles(), style]}>
      {cardContent}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl, // 22px - larger
    overflow: 'hidden',
  },
  defaultCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...shadows.card,
  },
  elevatedCard: {
    backgroundColor: colors.background.secondary,
    ...shadows.lg,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.md,
  },
  gradientBorder: {
    borderRadius: borderRadius.xl,
    padding: 1.5, // Border width
    ...shadows.md,
  },
  gradientCardInner: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl - 1.5, // Slightly smaller to fit inside gradient
  },
  activeCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1.5,
    borderColor: colors.primary.main,
    ...shadows.glowPrimary,
  },
  header: {
    paddingHorizontal: spacing.lg, // 20px
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  content: {
    padding: spacing.lg, // 20px - more generous
  },
  noPadding: {
    padding: 0,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
});

export default AppCard;
```

### AppButton.tsx - Gradient Button

```typescript
// /src/components/ui/AppButton.tsx
import React, { useCallback, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'expo-linear-gradient';
import { typography, spacing, borderRadius, shadows, animation, getColors } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'premium';
type ButtonSize = 'small' | 'medium' | 'large';

interface AppButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// Gradient configurations for each variant
const gradientConfigs = {
  primary: {
    colors: ['#10B981', '#059669'],
    shadow: 'glowPrimary',
  },
  danger: {
    colors: ['#EF4444', '#DC2626'],
    shadow: 'glowDanger',
  },
  premium: {
    colors: ['#10B981', '#06B6D4', '#3B82F6'],
    shadow: 'glowCyan',
  },
};

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();
  const buttonText = title || children;
  const [scaleValue] = useState(new Animated.Value(1));

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleValue]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleValue]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { height: 40, paddingHorizontal: spacing.base };
      case 'large':
        return { height: 56, paddingHorizontal: spacing.xl };
      default:
        return { height: 52, paddingHorizontal: spacing.lg }; // 52px - larger
    }
  };

  const isGradientVariant = ['primary', 'danger', 'premium'].includes(variant);

  // Content to render inside button
  const buttonContent = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text
            style={[
              styles.text,
              styles[`${size}Text`],
              variant === 'ghost' && { color: colors.primary.main },
              variant === 'outline' && { color: colors.text.primary },
              variant === 'secondary' && { color: colors.text.primary },
              textStyle,
            ]}
          >
            {buttonText}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </>
      )}
    </View>
  );

  // Gradient button (primary, danger, premium)
  if (isGradientVariant) {
    const config = gradientConfigs[variant as keyof typeof gradientConfigs];

    return (
      <Animated.View
        style={[
          { transform: [{ scale: scaleValue }] },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={config.colors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.button,
              getSizeStyles(),
              shadows[config.shadow as keyof typeof shadows],
              (disabled || loading) && styles.disabled,
            ]}
          >
            {buttonContent}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Non-gradient variants (secondary, outline, ghost)
  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleValue }] },
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.button,
          getSizeStyles(),
          variant === 'secondary' && styles.secondaryButton,
          variant === 'outline' && styles.outlineButton,
          variant === 'ghost' && styles.ghostButton,
          (disabled || loading) && styles.disabled,
        ]}
      >
        {buttonContent}
      </TouchableOpacity>
    </Animated.View>
  );
};

const colors = getColors();

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md, // 14px
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  text: {
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 17,
  },
});

export default AppButton;
```

### ShimmerSkeleton.tsx - Animated Loading Skeleton

```typescript
// /src/components/ui/ShimmerSkeleton.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import LinearGradient from 'expo-linear-gradient';
import { colors, borderRadius } from '../../theme';

interface ShimmerSkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({
  width = '100%',
  height = 20,
  radius = borderRadius.md,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.container,
        { width, height, borderRadius: radius },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0)',
            'rgba(255, 255, 255, 0.08)',
            'rgba(255, 255, 255, 0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

// Card skeleton with shimmer
export const CardSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <ShimmerSkeleton width={48} height={48} radius={24} />
        <View style={styles.cardText}>
          <ShimmerSkeleton width="70%" height={16} style={{ marginBottom: 8 }} />
          <ShimmerSkeleton width="50%" height={12} />
        </View>
      </View>
      <ShimmerSkeleton width="100%" height={14} style={{ marginTop: 16 }} />
      <ShimmerSkeleton width="85%" height={14} style={{ marginTop: 8 }} />
    </View>
  );
};

// Metric card skeleton
export const MetricSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.metric, style]}>
      <ShimmerSkeleton width="40%" height={12} />
      <ShimmerSkeleton width="60%" height={32} style={{ marginTop: 12 }} />
      <ShimmerSkeleton width="100%" height={40} style={{ marginTop: 16 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: 200,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    marginLeft: 16,
  },
  metric: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: 20,
  },
});

export default ShimmerSkeleton;
```

### GradientText.tsx - Gradient Text Component

```typescript
// /src/components/ui/GradientText.tsx
import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'expo-linear-gradient';

interface GradientTextProps {
  text: string;
  colors?: string[];
  style?: TextStyle;
}

export const GradientText: React.FC<GradientTextProps> = ({
  text,
  colors = ['#10B981', '#06B6D4'],
  style,
}) => {
  return (
    <MaskedView
      maskElement={
        <Text style={[styles.text, style]}>
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={colors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[styles.text, style, { opacity: 0 }]}>
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 32,
    fontWeight: '800',
  },
});

export default GradientText;
```

---

## Floating Tab Bar Implementation

```typescript
// /src/components/ui/FloatingTabBar.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'expo-linear-gradient';
import { IconButton } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows } from '../../theme';

interface TabItem {
  key: string;
  icon: string;
  label: string;
  badge?: number;
}

interface FloatingTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { bottom: Math.max(insets.bottom, 16) + 16 }]}>
      {/* Glass background */}
      <View style={styles.glass}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              {/* Active indicator */}
              {isActive && (
                <View style={styles.activeIndicator}>
                  <LinearGradient
                    colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                  />
                </View>
              )}

              <IconButton
                icon={tab.icon}
                iconColor={isActive ? '#10B981' : '#64748B'}
                size={24}
                style={styles.icon}
              />

              {/* Badge */}
              {tab.badge && tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  glass: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 30, 50, 0.9)',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
  },
  icon: {
    margin: 0,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default FloatingTabBar;
```

---

## Animation Utilities

```typescript
// /src/utils/animations.ts
import { Animated, Easing } from 'react-native';

// Staggered list item animation
export const animateListItems = (
  animValues: Animated.Value[],
  options: { delay?: number; stagger?: number } = {}
) => {
  const { delay = 0, stagger = 50 } = options;

  return Animated.stagger(
    stagger,
    animValues.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: delay + index * stagger,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      })
    )
  );
};

// Pulse animation (for achievements, notifications)
export const createPulseAnimation = (anim: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1.1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
    ])
  );
};

// Float animation (for empty states, illustrations)
export const createFloatAnimation = (anim: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 8,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
      Animated.timing(anim, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
    ])
  );
};

// Success celebration (checkmark + optional confetti)
export const animateSuccess = (
  scaleAnim: Animated.Value,
  opacityAnim: Animated.Value
) => {
  return Animated.parallel([
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 3,
      useNativeDriver: true,
    }),
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }),
  ]);
};
```

---

## Required Dependencies

Add these to `package.json`:

```json
{
  "dependencies": {
    "expo-linear-gradient": "~12.5.0",
    "@react-native-masked-view/masked-view": "^0.3.1",
    "react-native-reanimated": "~3.6.0"
  }
}
```

Or install via:

```bash
npx expo install expo-linear-gradient @react-native-masked-view/masked-view react-native-reanimated
```

---

## Migration Checklist

- [ ] Update `/src/theme/index.ts` with new colors
- [ ] Update `/src/theme/index.ts` with new shadows
- [ ] Update `/src/theme/index.ts` with new border radii
- [ ] Update `AppCard.tsx` with glass variants
- [ ] Update `AppButton.tsx` with gradient variants
- [ ] Create `ShimmerSkeleton.tsx`
- [ ] Create `GradientText.tsx`
- [ ] Update `EmptyState.tsx` with animations
- [ ] Update `LoadingState.tsx` with shimmer
- [ ] Update `MainNavigator.tsx` tab bar styling
- [ ] Update `DashboardScreen.tsx` with new components
- [ ] Test all screens for visual consistency

---

**Last Updated**: 2025-12-20
