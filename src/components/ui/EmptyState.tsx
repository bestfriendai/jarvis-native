/**
 * EmptyState - Beautiful empty state component with animations
 * Features: icon/emoji, title, description, action button, bounce animation
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { typography, spacing, getColors } from '../../theme';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '',
  title,
  description,
  actionLabel,
  onAction,
  style,
  compact = false,
}) => {
  const { colors } = useTheme();
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(bounceAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [bounceAnim, fadeAnim]);

  const iconScale = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const styles = createStyles(colors);

  return (
    <Animated.View style={[styles.container, compact && styles.compact, style, { opacity: fadeAnim }]}>
      {icon && (
        <Animated.Text
          style={[
            styles.icon,
            compact && styles.compactIcon,
            { transform: [{ scale: iconScale }] }
          ]}
        >
          {icon}
        </Animated.Text>
      )}
      <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
      {description && (
        <Text style={[styles.description, compact && styles.compactDescription]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <AppButton
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size={compact ? 'small' : 'medium'}
          style={styles.button}
        />
      )}
    </Animated.View>
  );
};

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['4xl'],
  },
  compact: {
    padding: spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  compactIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  compactTitle: {
    fontSize: typography.size.lg,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.size.base,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  compactDescription: {
    fontSize: typography.size.sm,
    marginBottom: spacing.base,
  },
  button: {
    marginTop: spacing.sm,
  },
});

export default EmptyState;
