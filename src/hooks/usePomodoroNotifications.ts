/**
 * Pomodoro Notifications Hook
 * Handles notifications and haptic feedback for pomodoro phase transitions
 */

import { useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { PomodoroPhase } from '../utils/pomodoroHelpers';

export interface UsePomodoroNotificationsOptions {
  enabled: boolean;
  soundEnabled: boolean;
}

export interface UsePomodoroNotificationsReturn {
  schedulePhaseNotification: (phase: PomodoroPhase) => Promise<void>;
  scheduleBreakNotification: (isLongBreak: boolean) => Promise<void>;
  scheduleWorkNotification: () => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  playHapticFeedback: (type: 'success' | 'warning' | 'error') => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

export function usePomodoroNotifications(
  options: UsePomodoroNotificationsOptions = {
    enabled: true,
    soundEnabled: true,
  }
): UsePomodoroNotificationsReturn {
  // Configure notification handler and request permissions on mount
  useEffect(() => {
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (options.enabled) {
      requestPermissions();
    }
  }, [options.enabled]);

  /**
   * Request notification permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }, []);

  /**
   * Schedule a notification for phase transition
   */
  const schedulePhaseNotification = useCallback(
    async (phase: PomodoroPhase) => {
      if (!options.enabled) return;

      try {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        let title = '';
        let body = '';

        switch (phase) {
          case 'work':
            title = 'Work Session Started';
            body = 'Time to focus! Stay on task.';
            break;
          case 'short_break':
            title = 'Short Break Time';
            body = 'Take 5 minutes to relax and recharge.';
            break;
          case 'long_break':
            title = 'Long Break Time';
            body = 'Great work! Enjoy a well-deserved 15-minute break.';
            break;
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: options.soundEnabled,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null, // Fire immediately
        });

        // Play haptic feedback
        if (phase === 'work') {
          await playHapticFeedback('warning');
        } else {
          await playHapticFeedback('success');
        }
      } catch (error) {
        console.error('Error scheduling phase notification:', error);
      }
    },
    [options.enabled, options.soundEnabled]
  );

  /**
   * Schedule break notification
   */
  const scheduleBreakNotification = useCallback(
    async (isLongBreak: boolean) => {
      if (!options.enabled) return;

      try {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        const title = isLongBreak ? 'Long Break Time' : 'Short Break Time';
        const body = isLongBreak
          ? 'Excellent work! Take 15 minutes to rest.'
          : 'Good job! Take 5 minutes to stretch and refresh.';

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: options.soundEnabled,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null,
        });

        await playHapticFeedback('success');
      } catch (error) {
        console.error('Error scheduling break notification:', error);
      }
    },
    [options.enabled, options.soundEnabled]
  );

  /**
   * Schedule work notification
   */
  const scheduleWorkNotification = useCallback(async () => {
    if (!options.enabled) return;

    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Break Over',
          body: 'Ready for another focused work session?',
          sound: options.soundEnabled,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });

      await playHapticFeedback('warning');
    } catch (error) {
      console.error('Error scheduling work notification:', error);
    }
  }, [options.enabled, options.soundEnabled]);

  /**
   * Cancel all scheduled notifications
   */
  const cancelAllNotifications = useCallback(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }, []);

  /**
   * Play haptic feedback
   */
  const playHapticFeedback = useCallback(
    async (type: 'success' | 'warning' | 'error') => {
      try {
        switch (type) {
          case 'success':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'warning':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          case 'error':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
        }
      } catch (error) {
        console.error('Error playing haptic feedback:', error);
      }
    },
    []
  );

  return {
    schedulePhaseNotification,
    scheduleBreakNotification,
    scheduleWorkNotification,
    cancelAllNotifications,
    playHapticFeedback,
    requestPermissions,
  };
}
