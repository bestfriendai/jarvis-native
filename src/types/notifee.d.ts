declare module '@notifee/react-native' {
  export enum AndroidImportance {
    DEFAULT = 3,
    HIGH = 4,
  }

  export enum AuthorizationStatus {
    NOT_DETERMINED = -1,
    DENIED = 0,
    AUTHORIZED = 1,
    PROVISIONAL = 2,
  }

  export enum TriggerType {
    TIMESTAMP = 0,
  }

  export type TimestampTrigger = {
    type: TriggerType.TIMESTAMP;
    timestamp: number;
  };

  export type AndroidPressAction = {
    id: string;
  };

  export type AndroidNotification = {
    channelId: string;
    pressAction?: AndroidPressAction;
    sound?: string;
  };

  export type Notification = {
    title?: string;
    body?: string;
    android?: AndroidNotification;
  };

  export type AuthorizationSettings = {
    authorizationStatus: AuthorizationStatus;
  };

  export function requestPermission(): Promise<AuthorizationSettings>;
  export function createChannel(channel: {
    id: string;
    name: string;
    importance?: AndroidImportance;
    sound?: string;
  }): Promise<string>;
  export function createTriggerNotification(
    notification: Notification,
    trigger: TimestampTrigger
  ): Promise<string>;
  export function cancelAllNotifications(): Promise<void>;

  const _default: {
    requestPermission: typeof requestPermission;
    createChannel: typeof createChannel;
    createTriggerNotification: typeof createTriggerNotification;
    cancelAllNotifications: typeof cancelAllNotifications;
  };

  export default _default;
}
