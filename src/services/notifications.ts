/**
 * Notification Service
 * Handles scheduling and managing local notifications using Notifee
 */

import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  Notification,
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
} from './notifee-wrapper';
// For EventType, we'll use the numeric value directly (0 = DISMISSED, 1 = PRESS, etc.)
import { Platform } from 'react-native';
import * as storage from './storage';

/**
 * Track whether channels have been created
 */
let channelsCreated = false;

export interface ScheduleNotificationParams {
  title: string;
  body: string;
  data?: Record<string, any>;
  triggerDate: Date;
}

/**
 * Check if habit notifications are enabled
 */
export async function isHabitNotificationsEnabled(): Promise<boolean> {
  try {
    const pref = await storage.getItem('notifications_habits_enabled');
    return pref !== 'false'; // Default to true
  } catch {
    return true;
  }
}

/**
 * Check if calendar notifications are enabled
 */
export async function isCalendarNotificationsEnabled(): Promise<boolean> {
  try {
    const pref = await storage.getItem('notifications_calendar_enabled');
    return pref !== 'false'; // Default to true
  } catch {
    return true;
  }
}

/**
 * Ensure notification channels are created (Android only)
 */
async function ensureChannels(): Promise<void> {
  if (channelsCreated || Platform.OS !== 'android') return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await notifee.createChannel({
      id: 'events',
      name: 'Event Reminders',
      description: 'Notifications for upcoming calendar events',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    } as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await notifee.createChannel({
      id: 'habits',
      name: 'Habit Reminders',
      description: 'Daily reminders for your habits',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    } as any);

    channelsCreated = true;
    console.log('[Notifications] Channels created successfully');
  } catch (error) {
    console.error('[Notifications] Error creating channels:', error);
  }
}

/**
 * Request notification permissions from user
 * @returns true if granted, false otherwise
 */
export async function requestPermissions(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();

    const granted =
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

    if (!granted) {
      console.warn('[Notifications] Permission not granted');
      return false;
    }

    // Create channels for Android
    await ensureChannels();

    console.log('[Notifications] Permissions granted');
    return true;
  } catch (error) {
    console.error('[Notifications] Error requesting permissions:', error);
    return false;
  }
}

/**
 * Schedule a local notification for an event reminder
 * @param params - Notification details
 * @returns Notification ID from Notifee (for cancellation)
 */
export async function scheduleEventNotification(
  params: ScheduleNotificationParams
): Promise<string> {
  try {
    // Check if calendar notifications are enabled
    const calendarEnabled = await isCalendarNotificationsEnabled();
    if (!calendarEnabled) {
      console.log('[Notifications] Calendar notifications disabled by user');
      return '';
    }

    const hasPermission = await requestPermissions();

    if (!hasPermission) {
      throw new Error('Notification permission not granted');
    }

    // Don't schedule notifications for past times
    if (params.triggerDate <= new Date()) {
      throw new Error('Cannot schedule notification for past time');
    }

    await ensureChannels();

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: params.triggerDate.getTime(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notification: any = {
      title: params.title,
      body: params.body,
      data: params.data || {},
      android: {
        channelId: 'events',
        pressAction: {
          id: 'default',
        },
      },
    };

    const notificationId = await notifee.createTriggerNotification(
      notification,
      trigger
    );

    console.log('[Notifications] Scheduled event notification:', notificationId, 'for', params.triggerDate);
    return notificationId;
  } catch (error) {
    console.error('[Notifications] Error scheduling event notification:', error);
    throw error;
  }
}

/**
 * Cancel a scheduled notification
 * @param notificationId - ID returned from scheduleEventNotification or scheduleHabitReminder
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (notifee as any).cancelNotification(notificationId);
    console.log('[Notifications] Cancelled notification:', notificationId);
  } catch (error) {
    console.error('[Notifications] Error cancelling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications (useful for debugging)
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await notifee.cancelAllNotifications();
    console.log('[Notifications] Cancelled all notifications');
  } catch (error) {
    console.error('[Notifications] Error cancelling all notifications:', error);
  }
}

/**
 * Get all currently scheduled notifications (for debugging)
 */
export async function getAllScheduledNotifications(): Promise<any[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const triggerIds = await (notifee as any).getTriggerNotificationIds();
    console.log('[Notifications] Scheduled notifications:', triggerIds.length);
    return triggerIds;
  } catch (error) {
    console.error('[Notifications] Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Add listener for notification responses (when user taps notification)
 * @param callback - Function to call with notification data
 * @returns Unsubscribe function
 */
export function addNotificationResponseListener(
  callback: (data: any) => void
): () => void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = (notifee as any).onForegroundEvent((event: any) => {
      // Type 1 is PRESS event
      if (event.type === 1 && event.detail.notification?.data) {
        callback(event.detail.notification.data);
      }
    });

    console.log('[Notifications] Notification response listener added');
    return unsubscribe;
  } catch (error) {
    console.error('[Notifications] Error adding notification response listener:', error);
    return () => {};
  }
}

/**
 * Schedule a daily recurring notification for a habit reminder
 * @param habitId - ID of the habit
 * @param habitName - Name of the habit
 * @param reminderTime - Time in "HH:MM" format (24-hour)
 * @returns Notification ID from Notifee (for cancellation)
 */
export async function scheduleHabitReminder(
  habitId: string,
  habitName: string,
  reminderTime: string
): Promise<string> {
  try {
    // Check if habit notifications are enabled
    const habitsEnabled = await isHabitNotificationsEnabled();
    if (!habitsEnabled) {
      console.log('[Notifications] Habit notifications disabled by user');
      return '';
    }

    const hasPermission = await requestPermissions();

    if (!hasPermission) {
      throw new Error('Notification permission not granted');
    }

    // Parse reminder time (format: "HH:MM")
    const [hours, minutes] = reminderTime.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error('Invalid reminder time format. Expected HH:MM in 24-hour format');
    }

    await ensureChannels();

    // Calculate the next occurrence of this time
    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trigger: any = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notification: any = {
      title: 'Habit Reminder',
      body: `Time to complete: ${habitName}`,
      data: {
        type: 'habit',
        habitId,
        habitName,
      },
      android: {
        channelId: 'habits',
        pressAction: {
          id: 'default',
        },
      },
    };

    const notificationId = await notifee.createTriggerNotification(
      notification,
      trigger
    );

    console.log('[Notifications] Scheduled habit reminder:', notificationId, 'at', reminderTime);
    return notificationId;
  } catch (error) {
    console.error('[Notifications] Error scheduling habit reminder:', error);
    throw error;
  }
}

/**
 * Format reminder time for display
 * @param minutes - Minutes before event
 * @returns Human-readable string (e.g., "5 minutes before")
 */
export function formatReminderTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes before`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return hours === 1 ? '1 hour before' : `${hours} hours before`;
  } else {
    const days = Math.floor(minutes / 1440);
    return days === 1 ? '1 day before' : `${days} days before`;
  }
}

export default {
  requestPermissions,
  scheduleEventNotification,
  scheduleHabitReminder,
  cancelNotification,
  cancelAllNotifications,
  getAllScheduledNotifications,
  addNotificationResponseListener,
  formatReminderTime,
  isHabitNotificationsEnabled,
  isCalendarNotificationsEnabled,
};
