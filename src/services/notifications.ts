/**
 * Notification Service
 * Handles scheduling and managing local notifications using expo-notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure how notifications are handled when app is foregrounded
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ScheduleNotificationParams {
  title: string;
  body: string;
  data?: Record<string, any>;
  triggerDate: Date;
}

/**
 * Request notification permissions from user
 * @returns true if granted, false otherwise
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted');
    return false;
  }

  // For Android, create notification channels
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('events', {
      name: 'Event Reminders',
      description: 'Notifications for upcoming calendar events',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A90E2',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('habits', {
      name: 'Habit Reminders',
      description: 'Daily reminders for your habits',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      sound: 'default',
    });
  }

  return true;
}

/**
 * Schedule a local notification for an event reminder
 * @param params - Notification details
 * @returns Notification ID from Expo (for cancellation)
 */
export async function scheduleEventNotification(
  params: ScheduleNotificationParams
): Promise<string> {
  const hasPermission = await requestPermissions();

  if (!hasPermission) {
    throw new Error('Notification permission not granted');
  }

  // Don't schedule notifications for past times
  if (params.triggerDate <= new Date()) {
    throw new Error('Cannot schedule notification for past time');
  }

  const trigger: any = Platform.OS === 'android'
    ? { date: params.triggerDate, channelId: 'events' }
    : { date: params.triggerDate };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: params.data || {},
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger,
  });

  console.log('[Notifications] Scheduled notification:', notificationId, 'for', params.triggerDate);
  return notificationId;
}

/**
 * Cancel a scheduled notification
 * @param notificationId - ID returned from scheduleEventNotification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[Notifications] Cancelled notification:', notificationId);
  } catch (error) {
    console.error('[Notifications] Error cancelling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications (useful for debugging)
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] Cancelled all notifications');
}

/**
 * Get all currently scheduled notifications (for debugging)
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Add listener for notification responses (when user taps notification)
 * @param callback - Function to call with notification data
 * @returns Subscription object (call .remove() to unsubscribe)
 */
export function addNotificationResponseListener(
  callback: (data: any) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    callback(data);
  });
}

/**
 * Schedule a daily recurring notification for a habit reminder
 * @param habitId - ID of the habit
 * @param habitName - Name of the habit
 * @param reminderTime - Time in "HH:MM" format (24-hour)
 * @returns Notification ID from Expo (for cancellation)
 */
export async function scheduleHabitReminder(
  habitId: string,
  habitName: string,
  reminderTime: string
): Promise<string> {
  const hasPermission = await requestPermissions();

  if (!hasPermission) {
    throw new Error('Notification permission not granted');
  }

  // Parse reminder time (format: "HH:MM")
  const [hours, minutes] = reminderTime.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid reminder time format. Expected HH:MM in 24-hour format');
  }

  // Create daily trigger
  const trigger: any = {
    hour: hours,
    minute: minutes,
    repeats: true,
  };

  // Add channel for Android
  if (Platform.OS === 'android') {
    trigger.channelId = 'habits';
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Habit Reminder',
      body: `Time to complete: ${habitName}`,
      data: {
        type: 'habit',
        habitId,
        habitName,
      },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger,
  });

  console.log('[Notifications] Scheduled habit reminder:', notificationId, 'at', reminderTime);
  return notificationId;
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
};
