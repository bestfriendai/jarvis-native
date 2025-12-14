/**
 * Navigation Utilities
 * Helper functions for deep linking and cross-feature navigation
 */

import type { NavigationProp } from '@react-navigation/native';

export type ItemType = 'task' | 'habit' | 'event';

export interface DeepLinkParams {
  /**
   * ID of the item to highlight
   */
  highlightId?: string;
  /**
   * Whether to scroll to the item
   */
  scrollTo?: boolean;
}

/**
 * Navigate to a specific screen and highlight an item
 *
 * @param navigation - React Navigation navigation object
 * @param type - Type of item (task, habit, event)
 * @param itemId - ID of the item to highlight
 *
 * @example
 * ```tsx
 * navigateToItem(navigation, 'task', 'task-123');
 * ```
 */
export function navigateToItem(
  navigation: NavigationProp<any>,
  type: ItemType,
  itemId: string
): void {
  const params: DeepLinkParams = {
    highlightId: itemId,
    scrollTo: true,
  };

  switch (type) {
    case 'task':
      (navigation.navigate as any)('Tasks', params);
      break;
    case 'habit':
      (navigation.navigate as any)('Habits', params);
      break;
    case 'event':
      (navigation.navigate as any)('Calendar', params);
      break;
    default:
      console.warn(`[Navigation] Unknown item type: ${type}`);
  }
}

/**
 * Navigate to view all items of a specific type
 *
 * @param navigation - React Navigation navigation object
 * @param type - Type of items to view (tasks, habits, events)
 *
 * @example
 * ```tsx
 * navigateToViewAll(navigation, 'tasks');
 * ```
 */
export function navigateToViewAll(
  navigation: NavigationProp<any>,
  type: 'tasks' | 'habits' | 'events'
): void {
  switch (type) {
    case 'tasks':
      (navigation.navigate as any)('Tasks');
      break;
    case 'habits':
      (navigation.navigate as any)('Habits');
      break;
    case 'events':
      (navigation.navigate as any)('Calendar');
      break;
    default:
      console.warn(`[Navigation] Unknown view all type: ${type}`);
  }
}

/**
 * Clear highlight parameters from navigation state
 *
 * @param navigation - React Navigation navigation object
 *
 * @example
 * ```tsx
 * // Clear highlight after animation completes
 * useEffect(() => {
 *   if (highlightComplete) {
 *     clearHighlight(navigation);
 *   }
 * }, [highlightComplete]);
 * ```
 */
export function clearHighlight(navigation: NavigationProp<any>): void {
  (navigation.setParams as any)({ highlightId: undefined, scrollTo: undefined });
}

export default {
  navigateToItem,
  navigateToViewAll,
  clearHighlight,
};
