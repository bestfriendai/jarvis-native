/**
 * AppChip - Styled chip/tag component
 * Features: multiple variants, selected state, press handling
 */

import React, { useState, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { typography, spacing, borderRadius, animation, getColors } from '../../theme';

type ChipVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface AppChipProps {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
  style?: ViewStyle;
}

export const AppChip: React.FC<AppChipProps> = ({
  label,
  variant = 'default',
  selected = false,
  onPress,
  compact = false,
  style,
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

  const getBackgroundColor = () => {
    if (selected) {
      return colors.primary.main;
    }
    switch (variant) {
      case 'success':
        return `${colors.success}20`;
      case 'warning':
        return `${colors.warning}20`;
      case 'error':
        return `${colors.error}20`;
      case 'info':
        return `${colors.info}20`;
      default:
        return colors.background.tertiary;
    }
  };

  const getTextColor = () => {
    if (selected) {
      return '#FFFFFF';
    }
    switch (variant) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'info':
        return colors.info;
      default:
        return colors.text.secondary;
    }
  };

  const styles = createStyles(colors);

  const content = (
    <Animated.View
      style={[
        styles.chip,
        compact && styles.compact,
        { backgroundColor: getBackgroundColor() },
        selected && styles.selected,
        style,
        { transform: [{ scale: scaleValue }] },
      ]}
    >
      <Text
        style={[
          styles.text,
          compact && styles.compactText,
          { color: getTextColor() },
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  compact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  selected: {
    borderWidth: 0,
  },
  text: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  compactText: {
    fontSize: typography.size.xs,
  },
});

export default AppChip;
