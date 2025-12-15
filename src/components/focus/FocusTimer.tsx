/**
 * Focus Timer Component
 * Active timer display with controls for pause/stop
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton, ProgressBar } from 'react-native-paper';
// Note: Using React Native's Animated API instead of Reanimated for broader compatibility
import { Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { FocusBlock } from '../../database/focusBlocks';
import { typography, spacing, borderRadius, shadows } from '../../theme';

interface FocusTimerProps {
  focusBlock: FocusBlock;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onComplete?: () => void;
  compact?: boolean;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  focusBlock,
  onPause,
  onResume,
  onStop,
  onComplete,
  compact = false,
}) => {
  const { colors } = useTheme();
  const {
    elapsedSeconds,
    remainingSeconds,
    isRunning,
    isPaused,
    progress,
    pause,
    resume,
    stop,
  } = useFocusTimer(focusBlock);

  // Pulse animation for active timer
  const pulseScale = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRunning && !isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(pulseScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isRunning, isPaused, pulseScale]);

  // Auto-complete when time is up
  useEffect(() => {
    if (remainingSeconds === 0 && elapsedSeconds > 0) {
      onComplete?.();
    }
  }, [remainingSeconds, elapsedSeconds, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = async () => {
    if (isPaused) {
      await resume();
      onResume?.();
    } else {
      await pause();
      onPause?.();
    }
  };

  const handleStop = async () => {
    await stop();
    onStop?.();
  };

  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        <View style={styles.compactInfo}>
          <IconButton
            icon={isPaused ? 'pause-circle' : 'play-circle'}
            iconColor={colors.primary.main}
            size={24}
            style={styles.compactIcon}
          />
          <View style={styles.compactText}>
            <Text
              style={[styles.compactTitle, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {focusBlock.title}
            </Text>
            <Text style={[styles.compactTime, { color: colors.text.secondary }]}>
              {formatTime(remainingSeconds)} remaining
            </Text>
          </View>
        </View>
        <ProgressBar
          progress={progress}
          color={colors.primary.main}
          style={styles.compactProgress}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="timer"
            iconColor={colors.primary.main}
            size={20}
            style={styles.headerIcon}
          />
          <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
            {focusBlock.title}
          </Text>
        </View>
        {focusBlock.task && (
          <View style={styles.taskBadge}>
            <IconButton
              icon="checkbox-marked-circle-outline"
              size={14}
              iconColor={colors.text.tertiary}
              style={styles.taskIcon}
            />
            <Text style={[styles.taskText, { color: colors.text.tertiary }]} numberOfLines={1}>
              {focusBlock.task.title}
            </Text>
          </View>
        )}
      </View>

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Animated.View style={[styles.timerCircle, { transform: [{ scale: pulseScale }] }]}>
          <View
            style={[
              styles.timerCircleInner,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.primary.main,
              },
            ]}
          >
            <Text style={[styles.timerText, { color: colors.primary.main }]}>
              {formatTime(remainingSeconds)}
            </Text>
            <Text style={[styles.timerLabel, { color: colors.text.tertiary }]}>
              remaining
            </Text>
          </View>
        </Animated.View>

        {/* Progress Ring */}
        <View style={styles.progressRing}>
          <ProgressBar
            progress={progress}
            color={colors.primary.main}
            style={styles.progressBar}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
            Elapsed
          </Text>
          <Text style={[styles.statValue, { color: colors.text.secondary }]}>
            {formatTime(elapsedSeconds)}
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border.subtle }]} />
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
            Target
          </Text>
          <Text style={[styles.statValue, { color: colors.text.secondary }]}>
            {Math.floor(focusBlock.durationMinutes)}m
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border.subtle }]} />
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
            Progress
          </Text>
          <Text style={[styles.statValue, { color: colors.text.secondary }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.secondaryButton,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.border.default,
            },
          ]}
          onPress={handleStop}
        >
          <IconButton icon="stop" iconColor={colors.error} size={24} />
          <Text style={[styles.controlButtonText, { color: colors.error }]}>
            Stop
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.primaryButton,
            {
              backgroundColor: colors.primary.main,
            },
          ]}
          onPress={handlePauseResume}
        >
          <IconButton
            icon={isPaused ? 'play' : 'pause'}
            iconColor={colors.primary.contrast}
            size={24}
          />
          <Text style={[styles.controlButtonText, { color: colors.primary.contrast }]}>
            {isPaused ? 'Resume' : 'Pause'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Phone-in mode indicator */}
      {focusBlock.phoneInMode && (
        <View style={[styles.phoneInBadge, { backgroundColor: colors.warning }]}>
          <IconButton
            icon="cellphone-off"
            size={16}
            iconColor={colors.text.inverse}
            style={styles.phoneInIcon}
          />
          <Text style={[styles.phoneInText, { color: colors.text.inverse }]}>
            Phone-in mode active
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    marginBottom: spacing.base,
    ...shadows.md,
  },
  compactContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  compactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  compactIcon: {
    margin: 0,
    marginRight: spacing.sm,
  },
  compactText: {
    flex: 1,
  },
  compactTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: 2,
  },
  compactTime: {
    fontSize: typography.size.sm,
  },
  compactProgress: {
    height: 4,
    borderRadius: 2,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerIcon: {
    margin: 0,
    marginRight: spacing.xs,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    flex: 1,
  },
  taskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  taskIcon: {
    margin: 0,
    marginRight: spacing.xs,
  },
  taskText: {
    fontSize: typography.size.sm,
    flex: 1,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  timerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircleInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  timerText: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.bold,
    letterSpacing: typography.letterSpacing.tight,
  },
  timerLabel: {
    fontSize: typography.size.sm,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
  },
  progressRing: {
    position: 'absolute',
    bottom: -spacing.md,
    width: '80%',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.base,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  primaryButton: {
    // Background set inline
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  controlButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginLeft: spacing.xs,
  },
  phoneInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    marginTop: spacing.base,
  },
  phoneInIcon: {
    margin: 0,
    marginRight: spacing.xs,
  },
  phoneInText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});
