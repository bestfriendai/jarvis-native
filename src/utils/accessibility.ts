import { AccessibilityInfo, findNodeHandle } from 'react-native';
import type { AccessibilityRole, AccessibilityState } from 'react-native';

/**
 * Common accessibility props builder
 */
export interface AccessibleProps {
  accessible: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  accessibilityValue?: {
    text?: string;
    now?: number;
    min?: number;
    max?: number;
  };
}

/**
 * Creates a standardized set of accessibility props for interactive elements
 */
export function makeAccessible(config: {
  role: AccessibilityRole;
  label: string;
  hint?: string;
  state?: AccessibilityState;
  value?: AccessibleProps['accessibilityValue'];
}): AccessibleProps {
  return {
    accessible: true,
    accessibilityRole: config.role,
    accessibilityLabel: config.label,
    accessibilityHint: config.hint,
    accessibilityState: config.state,
    accessibilityValue: config.value,
  };
}

/**
 * Announces a message to screen readers
 */
export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Sets accessibility focus to a specific component
 */
export function setAccessibilityFocus(reactTag: number | null): void {
  if (reactTag) {
    AccessibilityInfo.setAccessibilityFocus(reactTag);
  }
}

/**
 * Helper for button accessibility
 */
export function makeButton(label: string, hint?: string, disabled = false): AccessibleProps {
  return makeAccessible({
    role: 'button',
    label,
    hint,
    state: { disabled },
  });
}

/**
 * Helper for checkbox accessibility
 */
export function makeCheckbox(label: string, checked: boolean, hint?: string): AccessibleProps {
  return makeAccessible({
    role: 'checkbox',
    label,
    hint,
    state: { checked },
  });
}

/**
 * Helper for text input accessibility
 */
export function makeTextInput(
  label: string,
  value: string,
  hint?: string
): AccessibleProps {
  return makeAccessible({
    role: 'none', // TextInput has its own implicit role
    label,
    hint,
    value: { text: value },
  });
}

/**
 * Helper for image/icon accessibility
 */
export function makeImage(label: string): AccessibleProps {
  return makeAccessible({
    role: 'image',
    label,
  });
}

/**
 * Helper for radio button accessibility
 */
export function makeRadio(label: string, selected: boolean, hint?: string): AccessibleProps {
  return makeAccessible({
    role: 'radio',
    label,
    hint,
    state: { selected },
  });
}

/**
 * Helper for switch/toggle accessibility
 */
export function makeSwitch(label: string, checked: boolean, hint?: string): AccessibleProps {
  return makeAccessible({
    role: 'switch',
    label,
    hint,
    state: { checked },
  });
}

/**
 * Helper for link accessibility
 */
export function makeLink(label: string, hint?: string): AccessibleProps {
  return makeAccessible({
    role: 'link',
    label,
    hint,
  });
}

/**
 * Helper for header/heading accessibility
 */
export function makeHeader(label: string, level?: number): AccessibleProps {
  return makeAccessible({
    role: 'header',
    label,
    hint: level ? `Heading level ${level}` : undefined,
  });
}

/**
 * Format priority for screen readers
 */
export function formatPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    high: 'High priority',
    medium: 'Medium priority',
    low: 'Low priority',
  };
  return priorityMap[priority.toLowerCase()] || priority;
}

/**
 * Format status for screen readers
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In progress',
    completed: 'Completed',
    archived: 'Archived',
  };
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Format date for screen readers
 */
export function formatDateForA11y(date: Date | string | null | undefined): string {
  if (!date) return 'No date';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  if (diffDays > 1) return `In ${diffDays} days`;

  return dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format currency for screen readers
 */
export function formatCurrencyForA11y(amount: number, currency = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  });
  return formatter.format(amount);
}

/**
 * Create accessible label for task item
 */
export function makeTaskLabel(task: {
  title: string;
  priority?: string;
  dueDate?: Date | string | null;
  completed?: boolean;
  project?: { name: string } | null;
}): string {
  const parts: string[] = [task.title];

  if (task.completed) {
    parts.unshift('Completed:');
  }

  if (task.priority) {
    parts.push(formatPriority(task.priority));
  }

  if (task.dueDate) {
    parts.push(`Due ${formatDateForA11y(task.dueDate)}`);
  }

  if (task.project) {
    parts.push(`Project: ${task.project.name}`);
  }

  return parts.join(', ');
}

/**
 * Create accessible label for habit item
 */
export function makeHabitLabel(habit: {
  name: string;
  currentStreak?: number;
  completedToday?: boolean;
  frequency?: string;
}): string {
  const parts: string[] = [habit.name];

  if (habit.completedToday) {
    parts.push('Completed today');
  }

  if (habit.currentStreak && habit.currentStreak > 0) {
    parts.push(`${habit.currentStreak} day streak`);
  }

  if (habit.frequency) {
    parts.push(`${habit.frequency} frequency`);
  }

  return parts.join(', ');
}

/**
 * Create accessible label for transaction item
 */
export function makeTransactionLabel(transaction: {
  description: string;
  amount: number;
  type: string;
  category?: { name: string } | null;
  date?: Date | string;
}): string {
  const parts: string[] = [transaction.description];

  const amountLabel = formatCurrencyForA11y(Math.abs(transaction.amount));
  parts.push(transaction.type === 'income' ? `Income ${amountLabel}` : `Expense ${amountLabel}`);

  if (transaction.category) {
    parts.push(`Category: ${transaction.category.name}`);
  }

  if (transaction.date) {
    parts.push(formatDateForA11y(transaction.date));
  }

  return parts.join(', ');
}

/**
 * Create accessible label for project item
 */
export function makeProjectLabel(project: {
  name: string;
  taskCount?: number;
  completedCount?: number;
  status?: string;
}): string {
  const parts: string[] = [project.name];

  if (project.status) {
    parts.push(formatStatus(project.status));
  }

  if (project.taskCount !== undefined && project.completedCount !== undefined) {
    parts.push(`${project.completedCount} of ${project.taskCount} tasks completed`);
  }

  return parts.join(', ');
}
