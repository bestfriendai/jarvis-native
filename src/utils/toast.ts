/**
 * Toast Utilities
 * Simple helpers for showing toast notifications
 */

import Toast from 'react-native-toast-message';

/**
 * Show a success toast
 */
export function showSuccess(message: string, description?: string) {
  Toast.show({
    type: 'success',
    text1: message,
    text2: description,
    position: 'bottom',
    visibilityTime: 2000,
  });
}

/**
 * Show an error toast
 */
export function showError(message: string, description?: string) {
  Toast.show({
    type: 'error',
    text1: message,
    text2: description,
    position: 'bottom',
    visibilityTime: 3000,
  });
}

/**
 * Show an info toast
 */
export function showInfo(message: string, description?: string) {
  Toast.show({
    type: 'info',
    text1: message,
    text2: description,
    position: 'bottom',
    visibilityTime: 2000,
  });
}

/**
 * Show a warning toast
 */
export function showWarning(message: string, description?: string) {
  Toast.show({
    type: 'warning',
    text1: message,
    text2: description,
    position: 'bottom',
    visibilityTime: 2500,
  });
}

/**
 * Show an undo toast with action
 */
export function showUndo(message: string, onUndo: () => Promise<void>) {
  Toast.show({
    type: 'undo',
    text1: message,
    position: 'bottom',
    visibilityTime: 4000,
    props: { onUndo },
  });
}

/**
 * Hide the current toast
 */
export function hideToast() {
  Toast.hide();
}

/**
 * Semantic toast helpers for common actions
 */
export const toast = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  undo: showUndo,
  hide: hideToast,

  // Action-specific helpers
  taskCompleted: (taskName?: string) => showSuccess('Task completed', taskName),
  taskCreated: () => showSuccess('Task created'),
  taskDeleted: (onUndo?: () => Promise<void>) => {
    if (onUndo) {
      showUndo('Task deleted', onUndo);
    } else {
      showSuccess('Task deleted');
    }
  },

  habitCompleted: () => showSuccess('Habit completed', 'Keep up the great work!'),
  habitCreated: () => showSuccess('Habit created'),

  projectCreated: () => showSuccess('Project created'),
  projectUpdated: () => showSuccess('Project updated'),

  transactionAdded: () => showSuccess('Transaction added'),
  budgetCreated: () => showSuccess('Budget created'),

  eventCreated: () => showSuccess('Event created'),
  eventUpdated: () => showSuccess('Event updated'),

  saved: () => showSuccess('Saved'),
  deleted: (onUndo?: () => Promise<void>) => {
    if (onUndo) {
      showUndo('Deleted', onUndo);
    } else {
      showSuccess('Deleted');
    }
  },

  networkError: () => showError('Network error', 'Please check your connection'),
  genericError: () => showError('Something went wrong', 'Please try again'),
};

export default toast;
