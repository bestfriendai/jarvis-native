/**
 * AppButton - Professional button component with proper states
 * Supports: primary, secondary, outline, ghost, danger variants
 * Features: loading state, disabled state, pressed animation
 *
 * IMPROVEMENT: Fixed static theme colors - now uses dynamic theme via useTheme()
 */

import React, { useCallback, useState, useMemo } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { typography, spacing, borderRadius, shadows, animation } from '../../theme';
import { useTheme } from '../../hooks/useTheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
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
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

// Create dynamic styles based on current theme colors
const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    touchable: {
      // Wrapper for touch handling
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
    },
    gradientButton: {
      // Additional styles for gradient buttons - no backgroundColor needed
    },
    // Size variants
    small: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 36,
    },
    medium: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      minHeight: 48,
    },
    large: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.base,
      minHeight: 56,
    },
    // Variant styles - NOW DYNAMIC
    primaryButton: {
      // Gradient handles background - just add glow shadow
      ...shadows.glowPrimary,
    },
    secondaryButton: {
      backgroundColor: colors.background.tertiary,
    },
    outlineButton: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.border.default,
    },
    ghostButton: {
      backgroundColor: 'transparent',
    },
    dangerButton: {
      // Gradient handles background - standard shadow
      ...shadows.sm,
    },
    // Disabled state
    disabled: {
      opacity: 0.5,
    },
    fullWidth: {
      width: '100%',
    },
    // Content layout
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
    // Text styles
    text: {
      fontWeight: typography.weight.semibold,
      letterSpacing: typography.letterSpacing.wide,
    },
    smallText: {
      fontSize: typography.size.sm,
    },
    mediumText: {
      fontSize: typography.size.base,
    },
    largeText: {
      fontSize: typography.size.md,
    },
    // Text variant colors - NOW DYNAMIC
    primaryText: {
      color: colors.primary.contrast,
    },
    secondaryText: {
      color: colors.text.primary,
    },
    outlineText: {
      color: colors.text.primary,
    },
    ghostText: {
      color: colors.primary.main,
    },
    dangerText: {
      color: colors.primary.contrast,
    },
    disabledText: {
      color: colors.text.disabled,
    },
  });

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
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const { colors } = useTheme();

  // Memoize styles to prevent unnecessary recalculations
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Support both title prop and children
  const buttonText = title || children;
  const [scaleValue] = useState(new Animated.Value(1));

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: animation.pressedScale,
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

  const getButtonStyles = (): ViewStyle[] => {
    const baseStyles: ViewStyle[] = [styles.button, styles[size]];

    switch (variant) {
      case 'primary':
        baseStyles.push(styles.primaryButton);
        break;
      case 'secondary':
        baseStyles.push(styles.secondaryButton);
        break;
      case 'outline':
        baseStyles.push(styles.outlineButton);
        break;
      case 'ghost':
        baseStyles.push(styles.ghostButton);
        break;
      case 'danger':
        baseStyles.push(styles.dangerButton);
        break;
    }

    if (disabled || loading) {
      baseStyles.push(styles.disabled);
    }

    if (fullWidth) {
      baseStyles.push(styles.fullWidth);
    }

    return baseStyles;
  };

  const getTextStyles = (): TextStyle[] => {
    const baseStyles: TextStyle[] = [styles.text, styles[`${size}Text`]];

    switch (variant) {
      case 'primary':
        baseStyles.push(styles.primaryText);
        break;
      case 'secondary':
        baseStyles.push(styles.secondaryText);
        break;
      case 'outline':
        baseStyles.push(styles.outlineText);
        break;
      case 'ghost':
        baseStyles.push(styles.ghostText);
        break;
      case 'danger':
        baseStyles.push(styles.dangerText);
        break;
    }

    if (disabled || loading) {
      baseStyles.push(styles.disabledText);
    }

    return baseStyles;
  };

  const getLoaderColor = (): string => {
    if (variant === 'primary' || variant === 'danger') {
      return '#FFFFFF';
    }
    return colors.primary.main;
  };

  // Determine if this button should use a gradient
  const useGradient = variant === 'primary' || variant === 'danger';
  const gradientColors = (
    variant === 'primary'
      ? colors.gradient.primary
      : (['#EF4444', '#DC2626'] as const)
  ) as [string, string]; // Danger gradient

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getLoaderColor()}
          testID={testID ? `${testID}-loader` : undefined}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={[...getTextStyles(), textStyle]}>{buttonText}</Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </>
  );

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.touchable, fullWidth && styles.fullWidth, style]}
        accessible
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel || (typeof buttonText === 'string' ? buttonText : undefined)
        }
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          disabled: disabled || loading,
          busy: loading,
        }}
        testID={testID}
      >
        {useGradient ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[...getButtonStyles(), styles.gradientButton]}
          >
            {buttonContent}
          </LinearGradient>
        ) : (
          <View style={getButtonStyles()}>{buttonContent}</View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default AppButton;
