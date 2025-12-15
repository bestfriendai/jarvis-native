/**
 * Pomodoro Timer Component
 * Large circular timer display with progress ring
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { PomodoroTimerState } from '../../hooks/usePomodoroTimer';
import {
  formatTime,
  getPhaseDisplayName,
  calculateProgress,
  getPhaseColor,
} from '../../utils/pomodoroHelpers';
import { typography, spacing } from '../../theme';

interface PomodoroTimerProps {
  state: PomodoroTimerState;
}

const CIRCLE_SIZE = 280;
const CIRCLE_STROKE_WIDTH = 12;
const CIRCLE_RADIUS = (CIRCLE_SIZE - CIRCLE_STROKE_WIDTH) / 2;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

export function PomodoroTimer({ state }: PomodoroTimerProps) {
  const { colors } = useTheme();

  const progress = calculateProgress(state.timeRemaining, state.totalDuration);
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress / 100);
  const phaseColor = getPhaseColor(state.phase);

  return (
    <View style={styles.container}>
      {/* Circular Progress Ring */}
      <View style={styles.circleContainer}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
          {/* Background circle */}
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={CIRCLE_RADIUS}
            stroke={colors.background.tertiary}
            strokeWidth={CIRCLE_STROKE_WIDTH}
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={CIRCLE_RADIUS}
            stroke={phaseColor}
            strokeWidth={CIRCLE_STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCLE_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
          />
        </Svg>

        {/* Timer content */}
        <View style={styles.timerContent}>
          {/* Phase label */}
          <Text style={[styles.phaseLabel, { color: colors.text.tertiary }]}>
            {getPhaseDisplayName(state.phase)}
          </Text>

          {/* Time remaining */}
          <Text style={[styles.timeText, { color: colors.text.primary }]}>
            {formatTime(state.timeRemaining)}
          </Text>

          {/* Session counter (only show during work phase) */}
          {state.phase === 'work' && (
            <Text style={[styles.sessionCounter, { color: colors.text.secondary }]}>
              Session {state.sessionNumber}
            </Text>
          )}

          {/* Status indicator */}
          {state.isPaused && (
            <Text style={[styles.statusText, { color: colors.warning }]}>
              Paused
            </Text>
          )}
        </View>
      </View>

      {/* Progress percentage */}
      <Text style={[styles.progressText, { color: colors.text.tertiary }]}>
        {Math.round(progress)}% Complete
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  timerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing.xs,
  },
  timeText: {
    fontSize: 64,
    fontWeight: typography.weight.bold,
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.xs,
  },
  sessionCounter: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  statusText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.xs,
  },
  progressText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
});
