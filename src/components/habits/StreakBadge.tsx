/**
 * StreakBadge Component
 * Animated streak indicator with color and size progression
 * Based on UX improvements plan - Phase 2
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { typography, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

interface StreakBadgeProps {
  streakDays: number;
  size?: 'compact' | 'default' | 'large';
  showLabel?: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  streakDays,
  size = 'default',
  showLabel = true,
}) => {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get streak color based on length
  const getStreakColor = (days: number) => {
    if (days >= 30) return colors.warning; // Gold
    if (days >= 7) return colors.info;     // Blue
    return colors.primary.main;            // Emerald
  };

  // Get streak icon size based on length
  const getStreakSize = (days: number) => {
    const baseSize = size === 'compact' ? 18 : size === 'large' ? 28 : 24;

    if (days >= 30) return baseSize + 8;
    if (days >= 7) return baseSize + 4;
    return baseSize;
  };

  const streakColor = getStreakColor(streakDays);
  const iconSize = getStreakSize(streakDays);

  // Pulse animation for streaks > 7 days
  useEffect(() => {
    if (streakDays > 7) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [streakDays, pulseAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Text
          style={[
            styles.flameIcon,
            {
              fontSize: iconSize,
              color: streakColor,
            },
          ]}
        >
          🔥
        </Text>
      </Animated.View>
      {showLabel && (
        <Text
          style={[
            styles.streakText,
            size === 'compact' && styles.streakTextCompact,
            size === 'large' && styles.streakTextLarge,
            { color: streakColor },
          ]}
        >
          {streakDays} day{streakDays !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameIcon: {
    lineHeight: undefined, // Let it be natural
  },
  streakText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  streakTextCompact: {
    fontSize: typography.size.xs,
  },
  streakTextLarge: {
    fontSize: typography.size.md,
  },
});
