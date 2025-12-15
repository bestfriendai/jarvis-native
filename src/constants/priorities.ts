/**
 * Priority System Constants
 * Defines colors, labels, and configuration for task priorities
 */

export const PRIORITY_COLORS = {
  urgent: '#EF4444',    // Red - requires immediate attention
  high: '#F97316',      // Orange - important and time-sensitive
  medium: '#3B82F6',    // Blue - standard priority
  low: '#6B7280',       // Gray - low urgency
} as const;

export const PRIORITY_LABELS = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
} as const;

export const PRIORITY_ICONS = {
  urgent: 'alert-circle',
  high: 'flag',
  medium: 'flag',
  low: 'flag',
} as const;

export type Priority = keyof typeof PRIORITY_COLORS;

/**
 * Priority order for sorting (0 = highest priority)
 */
export const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Get priority color by priority level
 */
export function getPriorityColor(priority: Priority | undefined): string {
  if (!priority) return PRIORITY_COLORS.medium;
  return PRIORITY_COLORS[priority];
}

/**
 * Get priority label by priority level
 */
export function getPriorityLabel(priority: Priority | undefined): string {
  if (!priority) return PRIORITY_LABELS.medium;
  return PRIORITY_LABELS[priority];
}

/**
 * Get priority icon by priority level
 */
export function getPriorityIcon(priority: Priority | undefined): string {
  if (!priority) return PRIORITY_ICONS.medium;
  return PRIORITY_ICONS[priority];
}
