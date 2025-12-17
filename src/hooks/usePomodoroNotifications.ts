/**
 * Pomodoro Notifications Hook
 * Handles notifications and haptic feedback for pomodoro phase transitions
 *
 * TEMPORARILY DISABLED: expo-notifications/expo-haptics break release builds
 * All functions are now no-ops until we can resolve the module-level execution issue
 */

import { useCallback } from 'react';
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

/**
 * No-op implementation of pomodoro notifications
 * Returns empty functions that do nothing
 */
export function usePomodoroNotifications(
  options: UsePomodoroNotificationsOptions = {
    enabled: true,
    soundEnabled: true,
  }
): UsePomodoroNotificationsReturn {

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    // No-op: return true to allow timer to work
    return true;
  }, []);

  const schedulePhaseNotification = useCallback(
    async (phase: PomodoroPhase) => {
      // No-op: notifications disabled
      console.log(`[Notifications disabled] Phase: ${phase}`);
    },
    []
  );

  const scheduleBreakNotification = useCallback(
    async (isLongBreak: boolean) => {
      // No-op: notifications disabled
      console.log(`[Notifications disabled] Break: ${isLongBreak ? 'long' : 'short'}`);
    },
    []
  );

  const scheduleWorkNotification = useCallback(async () => {
    // No-op: notifications disabled
    console.log('[Notifications disabled] Work session starting');
  }, []);

  const cancelAllNotifications = useCallback(async () => {
    // No-op: notifications disabled
  }, []);

  const playHapticFeedback = useCallback(
    async (type: 'success' | 'warning' | 'error') => {
      // No-op: haptics disabled
      console.log(`[Haptics disabled] Type: ${type}`);
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
