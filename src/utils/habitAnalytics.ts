/**
 * Habit Analytics Utilities
 * Advanced analytics for habit completion patterns
 */

export interface TimeAnalysis {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  hourRange: string;
  percentage: number;
  mostCommonHour: number;
}

export interface WeeklyPattern {
  bestDay: string;
  worstDay: string;
  dayStats: Array<{
    day: string;
    count: number;
    rate: number;
  }>;
}

export interface CompletionTrendData {
  dates: string[];
  values: number[]; // 0 or 1 for each day
  completedDays: number;
  totalDays: number;
  completionRate: number;
}

/**
 * Analyze best time of day for habit completion
 * Returns the time period when user most frequently completes the habit
 */
export function analyzeBestTime(completionTimes: Date[]): TimeAnalysis {
  if (completionTimes.length === 0) {
    return {
      timeOfDay: 'morning',
      hourRange: '6-12am',
      percentage: 0,
      mostCommonHour: 6,
    };
  }

  // Count completions by hour
  const hourCounts = new Map<number, number>();

  completionTimes.forEach((date) => {
    const hour = date.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });

  // Find most common hour
  let maxHour = 0;
  let maxCount = 0;
  hourCounts.forEach((count, hour) => {
    if (count > maxCount) {
      maxCount = count;
      maxHour = hour;
    }
  });

  // Categorize time of day
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  let hourRange: string;

  if (maxHour >= 6 && maxHour < 12) {
    timeOfDay = 'morning';
    hourRange = '6-12am';
  } else if (maxHour >= 12 && maxHour < 17) {
    timeOfDay = 'afternoon';
    hourRange = '12-5pm';
  } else if (maxHour >= 17 && maxHour < 21) {
    timeOfDay = 'evening';
    hourRange = '5-9pm';
  } else {
    timeOfDay = 'night';
    hourRange = '9pm-6am';
  }

  const percentage = Math.round((maxCount / completionTimes.length) * 100);

  return {
    timeOfDay,
    hourRange,
    percentage,
    mostCommonHour: maxHour,
  };
}

/**
 * Analyze weekly completion pattern
 * Returns best/worst days and completion rate for each day of week
 */
export function analyzeWeeklyPattern(
  completionDates: Date[],
  totalDaysInPeriod: number = 30
): WeeklyPattern {
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  // Count completions by day of week
  const dayCounts = new Array(7).fill(0);
  const dayTotals = new Array(7).fill(0);

  completionDates.forEach((date) => {
    const dayOfWeek = date.getDay();
    dayCounts[dayOfWeek]++;
  });

  // Calculate total possible days for each day of week in the period
  const today = new Date();
  for (let i = 0; i < totalDaysInPeriod; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dayTotals[date.getDay()]++;
  }

  // Calculate rates and build stats
  const dayStats = dayNames.map((day, index) => ({
    day,
    count: dayCounts[index],
    rate: dayTotals[index] > 0 ? Math.round((dayCounts[index] / dayTotals[index]) * 100) : 0,
  }));

  // Find best and worst days
  const rates = dayStats.map((d) => d.rate);
  const maxRate = Math.max(...rates);
  const minRate = Math.min(...rates);

  const bestDay = dayStats.find((d) => d.rate === maxRate)?.day || 'N/A';
  const worstDay = dayStats.find((d) => d.rate === minRate)?.day || 'N/A';

  return {
    bestDay,
    worstDay,
    dayStats,
  };
}

/**
 * Generate 30-day completion trend data
 * Returns array of completion values (0 or 1) for sparkline visualization
 */
export function generateCompletionTrend(
  completionDates: string[],
  days: number = 30
): CompletionTrendData {
  const dates: string[] = [];
  const values: number[] = [];
  const completionSet = new Set(completionDates);

  let completedDays = 0;

  // Generate last N days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    dates.push(dateStr);
    const isCompleted = completionSet.has(dateStr);
    values.push(isCompleted ? 1 : 0);

    if (isCompleted) {
      completedDays++;
    }
  }

  const completionRate = Math.round((completedDays / days) * 100);

  return {
    dates,
    values,
    completedDays,
    totalDays: days,
    completionRate,
  };
}

/**
 * Calculate streak milestone progress
 * Returns current progress towards common milestones
 */
export function calculateStreakMilestones(currentStreak: number, longestStreak: number) {
  const milestones = [7, 30, 100, 365];

  const progress = milestones.map((milestone) => ({
    milestone,
    achieved: longestStreak >= milestone,
    currentProgress: currentStreak >= milestone ? 100 : (currentStreak / milestone) * 100,
    daysRemaining: Math.max(0, milestone - currentStreak),
  }));

  // Find next milestone
  const nextMilestone = milestones.find((m) => currentStreak < m);

  return {
    milestones: progress,
    nextMilestone: nextMilestone || null,
    nextMilestoneDaysRemaining: nextMilestone ? nextMilestone - currentStreak : 0,
  };
}

/**
 * Format time for display (e.g., "2:30 PM")
 */
export function formatTimeFromHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

/**
 * Get emoji for time of day
 */
export function getTimeOfDayEmoji(timeOfDay: string): string {
  switch (timeOfDay) {
    case 'morning':
      return '🌅';
    case 'afternoon':
      return '☀️';
    case 'evening':
      return '🌆';
    case 'night':
      return '🌙';
    default:
      return '⏰';
  }
}

/**
 * Get color for completion rate
 */
export function getCompletionRateColor(rate: number): string {
  if (rate >= 80) return '#4CAF50'; // Green
  if (rate >= 60) return '#8BC34A'; // Light green
  if (rate >= 40) return '#FFB74D'; // Orange
  if (rate >= 20) return '#FF9800'; // Dark orange
  return '#EF5350'; // Red
}

export default {
  analyzeBestTime,
  analyzeWeeklyPattern,
  generateCompletionTrend,
  calculateStreakMilestones,
  formatTimeFromHour,
  getTimeOfDayEmoji,
  getCompletionRateColor,
};
