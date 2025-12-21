/**
 * Session Complete Overlay Component
 * Celebrates focus session completion with stats and quick actions
 * Based on UX improvements plan - Phase 4
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { typography, spacing, borderRadius, shadows } from '../../theme';
import { haptic } from '../../utils/haptics';
import { HIT_SLOP } from '../../constants/ui';

interface ConfettiParticle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  color: string;
}

interface SessionCompleteOverlayProps {
  visible: boolean;
  sessionMinutes: number;
  sessionTitle: string;
  streak?: number;
  onStartAnother?: () => void;
  onTakeBreak?: () => void;
  onDismiss: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 40;

export const SessionCompleteOverlay: React.FC<SessionCompleteOverlayProps> = ({
  visible,
  sessionMinutes,
  sessionTitle,
  streak = 0,
  onStartAnother,
  onTakeBreak,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
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
        '#10B981', // Green
        '#F59E0B', // Amber
      ];

      confettiParticles.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: new Animated.Value(SCREEN_WIDTH / 2),
        y: new Animated.Value(SCREEN_HEIGHT / 2 - 100),
        rotate: new Animated.Value(0),
        opacity: new Animated.Value(1),
        color: confettiColors[i % confettiColors.length],
      }));
    }
  }, [colors]);

  useEffect(() => {
    if (visible) {
      // Trigger success haptic
      haptic.success();

      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      checkmarkScale.setValue(0);
      confettiParticles.current.forEach((particle) => {
        particle.x.setValue(SCREEN_WIDTH / 2);
        particle.y.setValue(SCREEN_HEIGHT / 2 - 100);
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
        // Scale in card
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate checkmark with delay
      setTimeout(() => {
        Animated.spring(checkmarkScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }, 200);

      // Animate confetti
      const confettiAnimations = confettiParticles.current.map((particle) => {
        // Random spread in all directions
        const angle = Math.random() * Math.PI * 2;
        const distance = 150 + Math.random() * 200;
        const targetX = SCREEN_WIDTH / 2 + Math.cos(angle) * distance;
        const targetY = SCREEN_HEIGHT / 2 - 100 + Math.sin(angle) * distance;

        return Animated.parallel([
          Animated.timing(particle.x, {
            toValue: targetX,
            duration: 1200 + Math.random() * 600,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: targetY,
            duration: 1200 + Math.random() * 600,
            useNativeDriver: true,
          }),
          Animated.timing(particle.rotate, {
            toValue: Math.random() * 1080 - 540,
            duration: 1200 + Math.random() * 600,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 1400,
            delay: 400,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.parallel(confettiAnimations).start();
    }
  }, [visible, fadeAnim, scaleAnim, checkmarkScale]);

  if (!visible) return null;

  const handleStartAnother = () => {
    haptic.buttonPress();
    onStartAnother?.();
    onDismiss();
  };

  const handleTakeBreak = () => {
    haptic.buttonPress();
    onTakeBreak?.();
    onDismiss();
  };

  const handleClose = () => {
    haptic.light();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        },
      ]}
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
                    inputRange: [-540, 540],
                    outputRange: ['-540deg', '540deg'],
                  }),
                },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}

      {/* Main content card */}
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.secondary,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <IconButton icon="close" iconColor={colors.text.tertiary} size={20} 
                hitSlop={HIT_SLOP}/>
        </TouchableOpacity>

        {/* Animated checkmark */}
        <Animated.View
          style={[
            styles.checkmarkContainer,
            {
              transform: [{ scale: checkmarkScale }],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary.main, colors.primary.light]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkmarkCircle}
          >
            <Text style={styles.checkmarkIcon}>✓</Text>
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Session Complete!
        </Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Focused Time
            </Text>
            <Text style={[styles.statValue, { color: colors.primary.main }]}>
              {sessionMinutes} minutes
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Session
            </Text>
            <Text
              style={[styles.statValue, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {sessionTitle}
            </Text>
          </View>

          {streak > 0 && (
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Focus Streak
              </Text>
              <View style={styles.streakValue}>
                <Text style={styles.fireEmoji}>🔥</Text>
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {streak} {streak === 1 ? 'day' : 'days'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.actionsContainer}>
          {onTakeBreak && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.secondaryButton,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.default,
                },
              ]}
              onPress={handleTakeBreak}
            >
              <IconButton
                icon="coffee"
                iconColor={colors.text.secondary}
                size={20}
              
                hitSlop={HIT_SLOP}/>
              <Text style={[styles.actionButtonText, { color: colors.text.secondary }]}>
                Take a Break
              </Text>
            </TouchableOpacity>
          )}

          {onStartAnother && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.primaryButton,
                {
                  backgroundColor: colors.primary.main,
                },
              ]}
              onPress={handleStartAnother}
            >
              <IconButton
                icon="refresh"
                iconColor={colors.primary.contrast}
                size={20}
              
                hitSlop={HIT_SLOP}/>
              <Text
                style={[styles.actionButtonText, { color: colors.primary.contrast }]}
              >
                Start Another
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Motivational message */}
        <Text style={[styles.motivationText, { color: colors.text.tertiary }]}>
          Great work staying focused!
        </Text>
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
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  card: {
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    marginHorizontal: spacing['2xl'],
    maxWidth: 400,
    width: '90%',
    alignItems: 'center',
    ...shadows.xl,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
  },
  checkmarkContainer: {
    marginBottom: spacing.xl,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  checkmarkIcon: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: typography.weight.bold,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  statsContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  statLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  statValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    flex: 1,
    textAlign: 'right',
  },
  streakValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fireEmoji: {
    fontSize: 18,
  },
  actionsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  primaryButton: {
    ...shadows.md,
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  actionButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  motivationText: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
