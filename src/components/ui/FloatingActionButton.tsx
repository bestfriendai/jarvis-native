/**
 * FloatingActionButton (FAB) Component
 * Prominent circular button following Fitts's Law - positioned in thumb zone for easy access
 * Features: gradient background, glow shadow, haptic feedback, press animation
 */

import React, { useState, useCallback } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, spacing, shadows, animation } from '../../theme';
import { HIT_SLOP } from '../../constants/ui';

interface FloatingActionButtonProps {
  icon: string;
  onPress: () => void;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  style?: ViewStyle;
  size?: number;
  iconSize?: number;
  variant?: 'primary' | 'secondary';
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onPress,
  position = 'bottom-right',
  style,
  size = 64,
  iconSize = 28,
  variant = 'primary',
  accessibilityLabel,
  accessibilityHint,
}) => {
  const [scaleValue] = useState(new Animated.Value(1));

  const handlePressIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  const getPositionStyles = (): ViewStyle => {
    switch (position) {
      case 'bottom-left':
        return { bottom: spacing.xl, left: spacing.xl };
      case 'bottom-center':
        return { bottom: spacing.xl, alignSelf: 'center' };
      case 'bottom-right':
      default:
        return { bottom: spacing.xl, right: spacing.xl };
    }
  };

  const gradientColors = (variant === 'primary'
      ? colors.gradient.primary
      : colors.gradient.cyan) as any;

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyles(),
        {
          width: size,
          height: size,
          transform: [{ scale: scaleValue }],
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={styles.touchable}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            variant === 'primary' && shadows.glowPrimary,
          ]}
        >
          <IconButton
            icon={icon}
            size={iconSize}
            iconColor={colors.text.primary}
            style={styles.iconButton}
          
                hitSlop={HIT_SLOP}/>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  touchable: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  iconButton: {
    margin: 0,
  },
});

export default FloatingActionButton;
