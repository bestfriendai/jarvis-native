/**
 * Immersive Timer Component
 * Full-screen focus mode with breathing animation
 * Based on UX improvements plan - Phase 4
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { FocusBlock } from '../../database/focusBlocks';
import { typography, spacing } from '../../theme';
import { haptic } from '../../utils/haptics';
import { HIT_SLOP } from '../../constants/ui';

interface ImmersiveTimerProps {
  focusBlock: FocusBlock;
  onExit: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onComplete?: () => void;
  streak?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ImmersiveTimer: React.FC<ImmersiveTimerProps> = ({
  focusBlock,
  onExit,
  onPause,
  onResume,
  onStop,
  onComplete,
  streak = 0,
}) => {
  const { colors, isDark } = useTheme();
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

  const [showControls, setShowControls] = useState(true);

  // Breathing animation for the timer ring
  const breatheAnimation = useRef(new Animated.Value(1)).current;
  const fadeControls = useRef(new Animated.Value(1)).current;

  // Setup breathing animation
  useEffect(() => {
    if (isRunning && !isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnimation, {
            toValue: 1.08,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnimation, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(breatheAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isRunning, isPaused, breatheAnimation]);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => {
        Animated.timing(fadeControls, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showControls, fadeControls]);

  // Toggle controls visibility on tap
  const handleTap = () => {
    if (showControls) {
      Animated.timing(fadeControls, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowControls(false));
    } else {
      fadeControls.setValue(0);
      setShowControls(true);
      Animated.timing(fadeControls, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

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
      haptic.buttonPress();
      onResume?.();
    } else {
      await pause();
      haptic.buttonPress();
      onPause?.();
    }
  };

  const handleStop = async () => {
    await stop();
    haptic.warning();
    onStop?.();
  };

  const handleExit = () => {
    haptic.light();
    onExit();
  };

  // Pure black background for dark mode, white for light mode
  const backgroundColor = isDark ? '#000000' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subtleTextColor = isDark
    ? 'rgba(255, 255, 255, 0.6)'
    : 'rgba(0, 0, 0, 0.6)';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundColor}
      />

      {/* Top controls - Exit button */}
      <Animated.View
        style={[
          styles.topControls,
          {
            opacity: fadeControls,
          },
        ]}
      >
        <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
          <IconButton
            icon="close"
            iconColor={textColor}
            size={24}
            onPress={handleExit}
          
                hitSlop={HIT_SLOP}/>
        </TouchableOpacity>

        {/* Streak indicator */}
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={[styles.streakEmoji, { color: textColor }]}>🔥</Text>
            <Text style={[styles.streakText, { color: textColor }]}>
              Day {streak}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Main timer area - tap to toggle controls */}
      <TouchableOpacity
        style={styles.timerArea}
        onPress={handleTap}
        activeOpacity={1}
      >
        {/* Motivational message */}
        <Animated.View
          style={[
            styles.messageContainer,
            {
              opacity: fadeControls,
            },
          ]}
        >
          <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
            {focusBlock.title}
          </Text>
          {streak > 0 && (
            <Text style={[styles.motivationText, { color: subtleTextColor }]}>
              Day {streak} of focusing!
            </Text>
          )}
        </Animated.View>

        {/* Breathing timer ring */}
        <View style={styles.timerContainer}>
          <Animated.View
            style={[
              styles.breathingRing,
              {
                borderColor: colors.primary.main,
                transform: [{ scale: breatheAnimation }],
              },
            ]}
          >
            <View style={styles.timerContent}>
              <Text style={[styles.timerText, { color: colors.primary.main }]}>
                {formatTime(remainingSeconds)}
              </Text>
              <Text style={[styles.timerLabel, { color: subtleTextColor }]}>
                {isPaused ? 'PAUSED' : 'REMAINING'}
              </Text>
            </View>
          </Animated.View>

          {/* Progress ring */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBackground,
                { backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' },
              ]}
            />
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
        </View>

        {/* Session stats */}
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: fadeControls,
            },
          ]}
        >
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: textColor }]}>
              {formatTime(elapsedSeconds)}
            </Text>
            <Text style={[styles.statLabel, { color: subtleTextColor }]}>
              Elapsed
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: textColor }]}>
              {Math.round(progress * 100)}%
            </Text>
            <Text style={[styles.statLabel, { color: subtleTextColor }]}>
              Complete
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Bottom controls */}
      <Animated.View
        style={[
          styles.bottomControls,
          {
            opacity: fadeControls,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.stopButton,
            {
              borderColor: isDark ? '#ff4444' : '#ff0000',
            },
          ]}
          onPress={handleStop}
        >
          <IconButton
            icon="stop"
            iconColor={isDark ? '#ff4444' : '#ff0000'}
            size={28}
          
                hitSlop={HIT_SLOP}/>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.pauseButton,
            {
              backgroundColor: colors.primary.main,
            },
          ]}
          onPress={handlePauseResume}
        >
          <IconButton
            icon={isPaused ? 'play' : 'pause'}
            iconColor={colors.primary.contrast}
            size={32}
          
                hitSlop={HIT_SLOP}/>
        </TouchableOpacity>
      </Animated.View>

      {/* Tap hint */}
      {!showControls && (
        <Animated.View
          style={[
            styles.tapHint,
            {
              opacity: fadeControls.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0],
              }),
            },
          ]}
        >
          <Text style={[styles.tapHintText, { color: subtleTextColor }]}>
            Tap for controls
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.base,
  },
  exitButton: {
    padding: spacing.xs,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakEmoji: {
    fontSize: 20,
  },
  streakText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  timerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
    paddingHorizontal: spacing['2xl'],
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  motivationText: {
    fontSize: typography.size.base,
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingRing: {
    width: Math.min(SCREEN_WIDTH * 0.65, 300),
    height: Math.min(SCREEN_WIDTH * 0.65, 300),
    borderRadius: Math.min(SCREEN_WIDTH * 0.65, 300) / 2,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContent: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: typography.size['5xl'],
    fontWeight: typography.weight.bold,
    letterSpacing: -2,
  },
  timerLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
    marginTop: spacing.sm,
  },
  progressContainer: {
    position: 'absolute',
    bottom: -spacing['2xl'],
    width: '90%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing['3xl'],
    gap: spacing['3xl'],
  },
  stat: {
    alignItems: 'center',
    minWidth: 100,
  },
  statValue: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing['2xl'],
  },
  controlButton: {
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    borderWidth: 2,
    width: 56,
    height: 56,
  },
  pauseButton: {
    width: 80,
    height: 80,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  tapHint: {
    position: 'absolute',
    bottom: spacing['4xl'],
    alignSelf: 'center',
  },
  tapHintText: {
    fontSize: typography.size.sm,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
  },
});
