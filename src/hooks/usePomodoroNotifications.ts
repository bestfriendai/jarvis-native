/**
 * Pomodoro Notifications Hook
 * Handles notifications for pomodoro phase transitions using Notifee
 */

import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  Notification,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
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
  const channelCreatedRef = useRef(false);

  const ensureChannel = useCallback(async () => {
    if (channelCreatedRef.current || Platform.OS !== 'android') return;
    await notifee.createChannel({
      id: 'pomodoro',
      name: 'Pomodoro',
      importance: AndroidImportance.HIGH,
      sound: options.soundEnabled ? 'default' : undefined,
    });
    channelCreatedRef.current = true;
  }, [options.soundEnabled]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const settings = await notifee.requestPermission();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  }, []);

  const displayNotification = useCallback(
    async (title: string, body: string) => {
      if (!options.enabled) return;
      await ensureChannel();
      const notification: Notification = {
        title,
        body,
        android: {
          channelId: 'pomodoro',
          pressAction: { id: 'default' },
          sound: options.soundEnabled ? 'default' : undefined,
        },
      };

      // Immediate notification (timestamp trigger ensures compatibility)
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: Date.now() + 500,
      };

      await notifee.createTriggerNotification(notification, trigger);
    },
    [ensureChannel, options.enabled, options.soundEnabled]
  );

  const schedulePhaseNotification = useCallback(
    async (phase: PomodoroPhase) => {
      const title =
        phase === 'work'
          ? 'Focus session started'
          : phase === 'short_break'
          ? 'Short break started'
          : 'Long break started';
      const body =
        phase === 'work'
          ? 'Stay focused—next break is coming up.'
          : 'Stretch, hydrate, and reset.';
      await displayNotification(title, body);
    },
    [displayNotification]
  );

  const scheduleBreakNotification = useCallback(
    async (isLongBreak: boolean) => {
      const title = isLongBreak ? 'Long break started' : 'Short break started';
      const body = isLongBreak
        ? 'Take a longer reset before the next focus block.'
        : 'Quick reset—back to focus soon.';
      await displayNotification(title, body);
    },
    [displayNotification]
  );

  const scheduleWorkNotification = useCallback(async () => {
    await displayNotification('Focus session started', 'Deep work time—stay on task.');
  }, [displayNotification]);

  const cancelAllNotifications = useCallback(async () => {
    await notifee.cancelAllNotifications();
  }, []);

  const playHapticFeedback = useCallback(
    async (_type: 'success' | 'warning' | 'error') => {
      // Haptics intentionally omitted to avoid import-time issues; use sound/visual cues instead.
      return;
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
