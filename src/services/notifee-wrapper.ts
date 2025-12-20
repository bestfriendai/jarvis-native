/**
 * Notifee Wrapper for Expo Go Compatibility
 * Provides mock implementations when native module isn't available
 */

let notifee: any = null;
let isAvailable = false;

try {
  notifee = require('@notifee/react-native').default;
  isAvailable = true;
} catch (e) {
  console.log('[Notifee] Native module not available (Expo Go). Using mock.');
  isAvailable = false;
}

// Mock implementation for Expo Go
const mockNotifee = {
  createChannel: async () => ({ id: 'mock' }),
  requestPermission: async () => ({ authorizationStatus: 1 }),
  displayNotification: async () => 'mock-id',
  getTriggerNotifications: async () => [],
  createTriggerNotification: async () => 'mock-trigger-id',
  cancelNotification: async () => {},
  cancelAllNotifications: async () => {},
  onForegroundEvent: () => () => {},
  onBackgroundEvent: () => {},
};

export default isAvailable ? notifee : mockNotifee;
export { isAvailable as isNotifeeAvailable };

// Re-export types and enums
export const AndroidImportance = {
  NONE: 0,
  MIN: 1,
  LOW: 2,
  DEFAULT: 3,
  HIGH: 4,
};

export const AuthorizationStatus = {
  NOT_DETERMINED: 0,
  DENIED: 1,
  AUTHORIZED: 2,
  PROVISIONAL: 3,
};

export const TriggerType = {
  TIMESTAMP: 0,
  INTERVAL: 1,
};

export const RepeatFrequency = {
  NONE: 0,
  HOURLY: 1,
  DAILY: 2,
  WEEKLY: 3,
};

export type Notification = any;
export type TimestampTrigger = any;
