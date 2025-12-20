/**
 * CelebrationOverlay Component
 * In-place celebration animation with confetti particles
 * Based on UX improvements plan - Phase 2
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { getColors, typography, spacing, borderRadius, shadows } from '../../theme';

interface ConfettiParticle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  color: string;
}

interface CelebrationOverlayProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 30;

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  visible,
  message,
  onDismiss,
}) => {
  const colors = getColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiParticles = useRef<ConfettiParticle[]>([]);

  // Initialize confetti particles
  useEffect(() => {
    if (confettiParticles.current.length === 0) {
      const confettiColors = [
        colors.primary.main,
        colors.primary.light,
        colors.info,
        colors.warning,
        '#8B5CF6', // Purple
        '#EC4899', // Pink
      ];

      confettiParticles.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: new Animated.Value(SCREEN_WIDTH / 2),
        y: new Animated.Value(SCREEN_HEIGHT / 2),
        rotate: new Animated.Value(0),
        opacity: new Animated.Value(1),
        color: confettiColors[i % confettiColors.length],
      }));
    }
  }, []);

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      confettiParticles.current.forEach((particle) => {
        particle.x.setValue(SCREEN_WIDTH / 2);
        particle.y.setValue(SCREEN_HEIGHT / 2);
        particle.rotate.setValue(0);
        particle.opacity.setValue(1);
      });

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

      // Animate confetti
      const confettiAnimations = confettiParticles.current.map((particle) => {
        // Random spread
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 150;
        const targetX = SCREEN_WIDTH / 2 + Math.cos(angle) * distance;
        const targetY = SCREEN_HEIGHT / 2 + Math.sin(angle) * distance;

        return Animated.parallel([
          Animated.timing(particle.x, {
            toValue: targetX,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: targetY,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.rotate, {
            toValue: Math.random() * 720 - 360,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 1200,
            delay: 500,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.parallel(confettiAnimations).start();

      // Auto-dismiss after 2 seconds
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
      }, 2000);

      return () => clearTimeout(dismissTimer);
    }
  }, [visible, fadeAnim, scaleAnim, onDismiss]);

  if (!visible) return null;

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
      {/* Confetti particles */}
      {confettiParticles.current.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.confettiParticle,
            {
              backgroundColor: particle.color,
              transform: [
                {
                  translateX: particle.x.interpolate({
                    inputRange: [0, SCREEN_WIDTH],
                    outputRange: [-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2],
                  }),
                },
                {
                  translateY: particle.y.interpolate({
                    inputRange: [0, SCREEN_HEIGHT],
                    outputRange: [-SCREEN_HEIGHT / 2, SCREEN_HEIGHT / 2],
                  }),
                },
                {
                  rotate: particle.rotate.interpolate({
                    inputRange: [-360, 360],
                    outputRange: ['-360deg', '360deg'],
                  }),
                },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}

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

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confettiParticle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  messageContainer: {
    backgroundColor: getColors().background.secondary,
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
    color: getColors().primary.main,
    textAlign: 'center',
  },
});
