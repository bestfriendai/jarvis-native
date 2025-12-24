/**
 * AppCard - Professional card component
 * Features: multiple variants, optional header, footer, press handling
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing, borderRadius, shadows, animation, getColors } from '../../theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'glass';

interface AppCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
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
}) => {
  const { colors } = useTheme();
  const [scaleValue] = useState(new Animated.Value(1));

  const handlePressIn = useCallback(() => {
    if (onPress) {
      Animated.spring(scaleValue, {
        toValue: animation.pressedScale,
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

  const styles = createStyles(colors);

  const getCardStyles = (): ViewStyle[] => {
    const baseStyles: ViewStyle[] = [styles.card];

    switch (variant) {
      case 'default':
        baseStyles.push(styles.defaultCard);
        break;
      case 'elevated':
        baseStyles.push(styles.elevatedCard);
        break;
      case 'outlined':
        baseStyles.push(styles.outlinedCard);
        break;
      case 'filled':
        baseStyles.push(styles.filledCard);
        break;
      case 'glass':
        baseStyles.push(styles.glassCard);
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

  // Wrap glass cards in LinearGradient
  const renderCardContent = () => {
    if (variant === 'glass') {
      return (
        <LinearGradient
          colors={colors.gradient.glass as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={getCardStyles()}
        >
          {cardContent}
        </LinearGradient>
      );
    }
    return cardContent;
  };

  if (onPress) {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          style={variant === 'glass' ? styles.card : getCardStyles()}
        >
          {renderCardContent()}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'glass') {
    return (
      <View style={[styles.card, style]}>
        {renderCardContent()}
      </View>
    );
  }

  return (
    <View style={[...getCardStyles(), style]}>
      {cardContent}
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  defaultCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1.5,       // Thicker border
    borderColor: colors.border.subtle,
    ...shadows.md,          // Stronger shadow
  },
  elevatedCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...shadows.lg,          // MUCH stronger shadow
  },
  outlinedCard: {
    backgroundColor: 'transparent',
    borderWidth: 2,         // Thicker border
    borderColor: colors.border.default,
  },
  filledCard: {
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...shadows.sm,
  },
  glassCard: {
    // PREMIUM glass effect - gradient background with gradient border and glow
    borderWidth: 2,         // Thicker border (was 1)
    borderColor: 'rgba(16, 232, 127, 0.2)', // Green tint border for glass effect
    ...shadows.lg,          // Stronger shadow (was md)
  },
  header: {
    paddingHorizontal: spacing.lg,     // More generous (was base)
    paddingTop: spacing.lg,            // More generous (was base)
    paddingBottom: spacing.md,         // More generous (was sm)
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  content: {
    padding: spacing.lg,               // More generous (was base)
  },
  noPadding: {
    padding: 0,
  },
  footer: {
    paddingHorizontal: spacing.lg,     // More generous (was base)
    paddingTop: spacing.md,            // More generous (was sm)
    paddingBottom: spacing.lg,         // More generous (was base)
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
});

export default AppCard;
