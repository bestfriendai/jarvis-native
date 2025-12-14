/**
 * Habit Chart Data Aggregation
 * Utilities for transforming habit data into chart-ready formats
 */

import * as habitsDB from '../../database/habits';
import { chartColors } from './chartConfig';

export interface WeeklyCompletionData {
  labels: string[];
  datasets: Array<{
    data: number[];
  }>;
}

export interface HabitComparisonData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
  }>;
  legend: string[];
}

export interface HabitHeatmapData {
  date: string;
  count: number;
}

/**
 * Get weekly completion data for a single habit
 * Returns bar chart data showing completion for last 7 days
 */
export async function getWeeklyCompletionData(
  habitId: string
): Promise<WeeklyCompletionData> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6); // Last 7 days including today

  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];

  const logs = await habitsDB.getHabitLogs(habitId, start, end);

  // Create map of date -> completion
  const logMap = new Map(logs.map((log) => [log.date, log.completed]));

  // Generate last 7 days
  const labels: string[] = [];
  const data: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

    labels.push(dayName);
    data.push(logMap.get(dateStr) ? 1 : 0);
  }

  return {
    labels,
    datasets: [{ data }],
  };
}

/**
 * Get comparison data for multiple habits
 * Returns data showing completion rates for selected habits over last 30 days
 */
export async function getHabitComparisonData(
  habitIds: string[]
): Promise<HabitComparisonData | null> {
  if (habitIds.length === 0) {
    return null;
  }

  const habits = await Promise.all(
    habitIds.map((id) => habitsDB.getHabit(id))
  );

  // Filter out null habits
  const validHabits = habits.filter((h) => h !== null) as habitsDB.Habit[];

  if (validHabits.length === 0) {
    return null;
  }

  // Get 30-day completion rates for each habit
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];

  const labels = validHabits.map((h) => h.name);
  const data = await Promise.all(
    validHabits.map(async (habit) => {
      const logs = await habitsDB.getHabitLogs(habit.id, start, end);
      const completedDays = logs.filter((l) => l.completed).length;
      return Math.round((completedDays / 30) * 100); // Percentage
    })
  );

  return {
    labels,
    datasets: [{ data }],
    legend: ['Completion Rate (30d)'],
  };
}

/**
 * Get heatmap data for a habit over the last year
 * Returns array of {date, count} for heatmap visualization
 */
export async function getHabitHeatmapData(
  habitId: string,
  days: number = 365
): Promise<HabitHeatmapData[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];

  const logs = await habitsDB.getHabitLogs(habitId, start, end);

  // Create map of date -> completion
  const logMap = new Map(logs.map((log) => [log.date, log.completed]));

  // Generate all dates in range
  const heatmapData: HabitHeatmapData[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    heatmapData.push({
      date: dateStr,
      count: logMap.get(dateStr) ? 1 : 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return heatmapData;
}

/**
 * Get streak data for visualization
 * Returns current streak, longest streak, and trend
 */
export async function getStreakData(habitId: string) {
  const habit = await habitsDB.getHabit(habitId);
  if (!habit) {
    return null;
  }

  const stats = await habitsDB.getHabitStats(habitId);

  return {
    currentStreak: habit.currentStreak,
    longestStreak: habit.longestStreak,
    totalDays: stats.totalDays,
    completedDays: stats.completedDays,
    completionRate: stats.completionRate,
  };
}

/**
 * Get overall habits summary statistics
 * Returns aggregate data for all habits
 */
export async function getHabitsSummary() {
  const habits = await habitsDB.getHabits();

  if (habits.length === 0) {
    return {
      totalHabits: 0,
      activeToday: 0,
      avgStreak: 0,
      totalCompletions: 0,
    };
  }

  // Get today's completions
  const today = new Date().toISOString().split('T')[0];
  const completedToday = await Promise.all(
    habits.map((h) => habitsDB.isHabitCompletedToday(h.id))
  );
  const activeToday = completedToday.filter(Boolean).length;

  // Calculate average streak
  const totalStreak = habits.reduce((sum, h) => sum + h.currentStreak, 0);
  const avgStreak = habits.length > 0 ? Math.round(totalStreak / habits.length) : 0;

  // Get total completions across all habits
  const allStats = await Promise.all(
    habits.map((h) => habitsDB.getHabitStats(h.id))
  );
  const totalCompletions = allStats.reduce((sum, s) => sum + s.completedDays, 0);

  return {
    totalHabits: habits.length,
    activeToday,
    avgStreak,
    totalCompletions,
  };
}
