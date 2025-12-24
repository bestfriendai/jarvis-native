/**
 * CelebrationOverlay Component
 * In-place celebration animation with confetti particles
 * Based on UX improvements plan - Phase 2
 * Enhanced with react-native-confetti-cannon for improved visuals
 */

import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { typography, spacing, borderRadius, shadows, getColors } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

interface CelebrationOverlayProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  visible,
  message,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);

      // Start animations
      Animated.parallel([
        // Fade in overlay
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Scale in message
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Trigger confetti cannon
      if (confettiRef.current) {
        confettiRef.current.start();
      }

      // Auto-dismiss after 2.5 seconds
      const dismissTimer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onDismiss();
        });
      }, 2500);

      return () => clearTimeout(dismissTimer);
    }
  }, [visible, fadeAnim, scaleAnim, onDismiss]);

  if (!visible) return null;

  const confettiColors = [
    colors.primary.main,
    colors.primary.light,
    colors.info,
    colors.warning,
    '#8B5CF6', // Purple
    '#EC4899', // Pink
  ];

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
      pointerEvents="none"
    >
      {/* Confetti cannon */}
      <ConfettiCannon
        ref={confettiRef}
        count={150}
        origin={{ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 }}
        autoStart={false}
        fadeOut={true}
        fallSpeed={2500}
        colors={confettiColors}
      />

      {/* Celebration message */}
      <Animated.View
        style={[
          styles.messageContainer,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  messageContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    minWidth: 250,
    ...shadows.lg,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.base,
  },
  message: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.primary.main,
    textAlign: 'center',
  },
});
