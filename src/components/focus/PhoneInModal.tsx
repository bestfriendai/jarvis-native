/**
 * Phone-In Modal Component
 * Full-screen focus mode that blocks interactions
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  StatusBar,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { IconButton } from 'react-native-paper';
// Note: Using semi-transparent overlay instead of BlurView for broader compatibility
import { useTheme } from '../../hooks/useTheme';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { usePhoneInMode } from '../../hooks/usePhoneInMode';
import { FocusBlock } from '../../database/focusBlocks';
import { typography, spacing, borderRadius } from '../../theme';
import { HIT_SLOP } from '../../constants/ui';

interface PhoneInModalProps {
  visible: boolean;
  focusBlock: FocusBlock;
  onComplete: () => void;
  onEmergencyExit: () => void;
}

export const PhoneInModal: React.FC<PhoneInModalProps> = ({
  visible,
  focusBlock,
  onComplete,
  onEmergencyExit,
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
  const { triggerBreakNotification, triggerCompletionHaptic } = usePhoneInMode();

  // Block back button on Android
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Return true to block back button
      return true;
    });

    return () => backHandler.remove();
  }, [visible]);

  // Auto-complete when time is up
  useEffect(() => {
    if (remainingSeconds === 0 && elapsedSeconds > 0) {
      triggerCompletionHaptic();
      onComplete();
    }
  }, [remainingSeconds, elapsedSeconds]);

  // Break notification after 25 minutes
  useEffect(() => {
    if (elapsedSeconds === 25 * 60) {
      triggerBreakNotification();
    }
  }, [elapsedSeconds]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = async () => {
    if (isPaused) {
      await resume();
    } else {
      await pause();
    }
  };

  const handleEmergencyExit = async () => {
    await stop();
    onEmergencyExit();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.overlay}>
          {/* Header with emergency exit */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.emergencyExit}
              onPress={handleEmergencyExit}
              onLongPress={handleEmergencyExit}
            >
              <IconButton
                icon="close-circle"
                iconColor={colors.error}
                size={20}
              
                hitSlop={HIT_SLOP}/>
              <Text style={[styles.emergencyText, { color: colors.error }]}>
                Emergency Exit
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main timer display */}
          <View style={styles.content}>
            {/* Focus icon */}
            <View style={[styles.iconContainer, { backgroundColor: colors.primary.main }]}>
              <IconButton
                icon="bullseye-arrow"
                iconColor={colors.primary.contrast}
                size={60}
              
                hitSlop={HIT_SLOP}/>
            </View>

            {/* Timer */}
            <Text style={[styles.timer, { color: colors.text.primary }]}>
              {formatTime(remainingSeconds)}
            </Text>

            {/* Label */}
            <Text style={[styles.label, { color: colors.text.tertiary }]}>
              Time Remaining
            </Text>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text.secondary }]} numberOfLines={2}>
              {focusBlock.title}
            </Text>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View
                style={[styles.progressTrack, { backgroundColor: colors.background.tertiary }]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary.main,
                      width: `${progress * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.text.tertiary }]}>
                {Math.round(progress * 100)}% complete
              </Text>
            </View>

            {/* Elapsed time */}
            <View style={styles.stats}>
              <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
                Elapsed
              </Text>
              <Text style={[styles.statValue, { color: colors.text.secondary }]}>
                {formatTime(elapsedSeconds)}
              </Text>
            </View>
          </View>

          {/* Bottom controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                {
                  backgroundColor: isPaused ? colors.primary.main : colors.background.tertiary,
                },
              ]}
              onPress={handlePauseResume}
            >
              <IconButton
                icon={isPaused ? 'play' : 'pause'}
                iconColor={isPaused ? colors.primary.contrast : colors.text.primary}
                size={32}
              
                hitSlop={HIT_SLOP}/>
              <Text
                style={[
                  styles.controlText,
                  {
                    color: isPaused ? colors.primary.contrast : colors.text.primary,
                  },
                ]}
              >
                {isPaused ? 'Resume Focus' : 'Pause'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Phone-in mode message */}
          <View style={styles.footer}>
            <IconButton
              icon="cellphone-off"
              iconColor={colors.text.tertiary}
              size={20}
            
                hitSlop={HIT_SLOP}/>
            <Text style={[styles.footerText, { color: colors.text.tertiary }]}>
              Phone-in mode active - Stay focused
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: spacing.xl,
  },
  emergencyExit: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  emergencyText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginLeft: spacing.xs,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3xl'],
  },
  timer: {
    fontSize: 72,
    fontWeight: typography.weight.bold,
    letterSpacing: -2,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.size.base,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: typography.size.sm,
  },
  stats: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.semibold,
  },
  controls: {
    marginBottom: spacing.xl,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  controlText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginLeft: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: typography.size.sm,
    marginLeft: spacing.xs,
  },
});
