/**
 * Date Utility Functions
 * Helper functions for date formatting and calculations
 */

/**
 * Format a date string into a human-readable format
 * Returns relative dates for nearby dates, absolute dates for distant ones
 */
export function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Today
  if (diffDays === 0) {
    return 'Today';
  }

  // Tomorrow
  if (diffDays === 1) {
    return 'Tomorrow';
  }

  // Yesterday
  if (diffDays === -1) {
    return 'Yesterday';
  }

  // This week (next 6 days)
  if (diffDays > 1 && diffDays <= 7) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[date.getDay()];
  }

  // Last week (past 6 days)
  if (diffDays < -1 && diffDays >= -7) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `Last ${dayNames[date.getDay()]}`;
  }

  // Next week (7-14 days)
  if (diffDays > 7 && diffDays <= 14) {
    return `Next ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]}`;
  }

  // Otherwise, show the actual date
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  };

  return date.toLocaleDateString('en-US', options);
}

/**
 * Check if a date is in the past (overdue)
 */
export function isOverdue(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();

  // Set both to start of day for fair comparison
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return date < today;
}

/**
 * Get number of days until a date (negative if past)
 */
export function getDaysUntil(dateString: string): number {
  const date = new Date(dateString);
  const today = new Date();

  // Set both to start of day
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generate a date string for quick date options
 */
export function getQuickDate(type: 'today' | 'tomorrow' | 'next-week' | 'next-month' | 'this-weekend'): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  switch (type) {
    case 'today':
      // Already set to today
      break;

    case 'tomorrow':
      date.setDate(date.getDate() + 1);
      break;

    case 'next-week':
      date.setDate(date.getDate() + 7);
      break;

    case 'next-month':
      date.setMonth(date.getMonth() + 1);
      break;

    case 'this-weekend':
      // Set to next Saturday
      const dayOfWeek = date.getDay();
      const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
      date.setDate(date.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
      break;
  }

  // Return ISO date string (YYYY-MM-DD)
  return date.toISOString().split('T')[0];
}

/**
 * Check if a date is today
 */
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();

  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return date.getTime() === today.getTime();
}

/**
 * Check if a date is this week (within next 7 days)
 */
export function isThisWeek(dateString: string): boolean {
  const daysUntil = getDaysUntil(dateString);
  return daysUntil >= 0 && daysUntil <= 7;
}

/**
 * Get urgency level for a due date
 */
export function getDateUrgency(dateString: string): 'overdue' | 'today' | 'this-week' | 'future' {
  if (isOverdue(dateString)) {
    return 'overdue';
  }

  if (isToday(dateString)) {
    return 'today';
  }

  if (isThisWeek(dateString)) {
    return 'this-week';
  }

  return 'future';
}

/**
 * Format date for display with day of week
 * Example: "Tomorrow, Dec 15" or "Monday, Jan 20"
 */
export function formatDateWithDay(dateString: string): string {
  const date = new Date(dateString);
  const dayName = formatDueDate(dateString); // Get relative day name

  // If it's a relative date (Today, Tomorrow, etc.), add the actual date
  if (['Today', 'Tomorrow', 'Yesterday'].includes(dayName)) {
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${dayName}, ${monthDay}`;
  }

  // For other dates, show day name and date
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${dayName}, ${monthDay}`;
}

/**
 * Get relative time string from a date
 * Example: "Just now", "2 minutes ago", "1 hour ago", "3 days ago"
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Just now (less than 30 seconds)
  if (diffSeconds < 30) {
    return 'Just now';
  }

  // Seconds ago (30 seconds to 1 minute)
  if (diffMinutes < 1) {
    return `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`;
  }

  // Minutes ago (1 to 59 minutes)
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  }

  // Hours ago (1 to 23 hours)
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }

  // Days ago (1 to 6 days)
  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  // For older dates, show the actual date
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };

  return date.toLocaleDateString('en-US', options);
}
