/**
 * Pomodoro Controls Component
 * Control buttons for starting, pausing, and stopping pomodoro timer
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { PomodoroTimerState } from '../../hooks/usePomodoroTimer';
import { typography, spacing, borderRadius, shadows } from '../../theme';
import { HIT_SLOP } from '../../constants/ui';

interface PomodoroControlsProps {
  state: PomodoroTimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSkip: () => void;
  onSelectTask?: () => void;
  linkedTaskTitle?: string;
}

export function PomodoroControls({
  state,
  onStart,
  onPause,
  onResume,
  onStop,
  onSkip,
  onSelectTask,
  linkedTaskTitle,
}: PomodoroControlsProps) {
  const { colors } = useTheme();

  if (!state.isActive && !state.isPaused) {
    // Show start button
    return (
      <View style={styles.container}>
        {linkedTaskTitle && (
          <View style={[styles.linkedTaskBadge, { backgroundColor: colors.background.tertiary, borderColor: colors.primary.main }]}>
            <IconButton icon="link-variant" iconColor={colors.primary.main} size={16} 
                hitSlop={HIT_SLOP}/>
            <Text style={[styles.linkedTaskText, { color: colors.text.primary }]} numberOfLines={1}>
              {linkedTaskTitle}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              backgroundColor: colors.primary.main,
            },
          ]}
          onPress={onStart}
        >
          <IconButton icon="play" iconColor={colors.primary.contrast} size={32} 
                hitSlop={HIT_SLOP}/>
          <Text style={[styles.primaryButtonText, { color: colors.primary.contrast }]}>
            Start Pomodoro
          </Text>
        </TouchableOpacity>

        {onSelectTask && (
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                borderColor: colors.border.default,
                backgroundColor: colors.background.secondary,
              },
            ]}
            onPress={onSelectTask}
          >
            <IconButton icon="link-variant" iconColor={colors.text.secondary} size={24} 
                hitSlop={HIT_SLOP}/>
            <Text style={[styles.secondaryButtonText, { color: colors.text.secondary }]}>
              Link to Task
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Show active controls
  return (
    <View style={styles.container}>
      <View style={styles.controlsRow}>
        {/* Pause/Resume button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: state.isPaused ? colors.primary.main : colors.background.tertiary,
            },
          ]}
          onPress={state.isPaused ? onResume : onPause}
        >
          <IconButton
            icon={state.isPaused ? 'play' : 'pause'}
            iconColor={state.isPaused ? colors.primary.contrast : colors.text.primary}
            size={28}
          
                hitSlop={HIT_SLOP}/>
          <Text
            style={[
              styles.actionButtonText,
              {
                color: state.isPaused ? colors.primary.contrast : colors.text.primary,
              },
            ]}
          >
            {state.isPaused ? 'Resume' : 'Pause'}
          </Text>
        </TouchableOpacity>

        {/* Stop button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.background.tertiary,
            },
          ]}
          onPress={onStop}
        >
          <IconButton icon="stop" iconColor={colors.error} size={28} 
                hitSlop={HIT_SLOP}/>
          <Text style={[styles.actionButtonText, { color: colors.error }]}>
            Stop
          </Text>
        </TouchableOpacity>
      </View>

      {/* Skip button (only show during breaks) */}
      {state.phase !== 'work' && (
        <TouchableOpacity
          style={[
            styles.skipButton,
            {
              borderColor: colors.border.default,
              backgroundColor: colors.background.secondary,
            },
          ]}
          onPress={onSkip}
        >
          <IconButton icon="skip-next" iconColor={colors.text.secondary} size={24} 
                hitSlop={HIT_SLOP}/>
          <Text style={[styles.skipButtonText, { color: colors.text.secondary }]}>
            Skip Break
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  primaryButtonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginLeft: spacing.xs,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    marginTop: spacing.md,
  },
  secondaryButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginLeft: spacing.xs,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  actionButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginTop: -spacing.xs,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    marginTop: spacing.md,
  },
  skipButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginLeft: spacing.xs,
  },
  linkedTaskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    marginBottom: spacing.md,
  },
  linkedTaskText: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginLeft: -spacing.xs,
  },
});
