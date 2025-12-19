/**
 * Habits Database Operations
 * CRUD operations for habits with offline-first support
 */

import {
  generateId,
  getCurrentTimestamp,
  executeQuery,
  executeQuerySingle,
  executeWrite,
} from './index';

export type HabitCadence = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  cadence: HabitCadence;
  targetCount: number;
  currentStreak: number;
  longestStreak: number;
  reminderTime?: string;
  notificationId?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

interface HabitRow {
  id: string;
  name: string;
  description?: string;
  cadence: HabitCadence;
  target_count: number;
  current_streak: number;
  longest_streak: number;
  reminder_time?: string;
  notification_id?: string;
  created_at: string;
  updated_at: string;
  synced: number;
}

interface HabitLogRow {
  id: string;
  habit_id: string;
  date: string;
  completed: number;
  notes?: string;
  created_at: string;
}

export interface CreateHabitData {
  name: string;
  description?: string;
  cadence?: HabitCadence;
  targetCount?: number;
  reminderTime?: string;
}

export interface UpdateHabitData extends Partial<CreateHabitData> {
  currentStreak?: number;
  longestStreak?: number;
  notificationId?: string;
}

/**
 * Convert database row to Habit object
 */
function rowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    cadence: row.cadence,
    targetCount: row.target_count,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    reminderTime: row.reminder_time,
    notificationId: row.notification_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    synced: row.synced === 1,
  };
}

/**
 * Convert database row to HabitLog object
 */
function rowToHabitLog(row: HabitLogRow): HabitLog {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completed: row.completed === 1,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/**
 * Get all habits
 */
export async function getHabits(): Promise<Habit[]> {
  const sql = 'SELECT * FROM habits ORDER BY created_at DESC';
  const rows = await executeQuery<HabitRow>(sql);
  return rows.map(rowToHabit);
}

/**
 * Get a single habit by ID
 */
export async function getHabit(id: string): Promise<Habit | null> {
  const sql = 'SELECT * FROM habits WHERE id = ?';
  const row = await executeQuerySingle<HabitRow>(sql, [id]);
  return row ? rowToHabit(row) : null;
}

/**
 * Create a new habit
 */
export async function createHabit(data: CreateHabitData): Promise<Habit> {
  const id = generateId();
  const now = getCurrentTimestamp();

  const sql = `
    INSERT INTO habits (
      id, name, description, cadence, target_count,
      current_streak, longest_streak, reminder_time, notification_id,
      created_at, updated_at, synced
    ) VALUES (?, ?, ?, ?, ?, 0, 0, ?, NULL, ?, ?, 0)
  `;

  const params = [
    id,
    data.name,
    data.description || null,
    data.cadence || 'daily',
    data.targetCount || 1,
    data.reminderTime || null,
    now,
    now,
  ];

  await executeWrite(sql, params);

  const habit = await getHabit(id);
  if (!habit) {
    throw new Error('Failed to create habit');
  }

  return habit;
}

/**
 * Update a habit
 */
export async function updateHabit(id: string, data: UpdateHabitData): Promise<Habit> {
  const now = getCurrentTimestamp();

  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }

  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description || null);
  }

  if (data.cadence !== undefined) {
    updates.push('cadence = ?');
    params.push(data.cadence);
  }

  if (data.targetCount !== undefined) {
    updates.push('target_count = ?');
    params.push(data.targetCount);
  }

  if (data.currentStreak !== undefined) {
    updates.push('current_streak = ?');
    params.push(data.currentStreak);
  }

  if (data.longestStreak !== undefined) {
    updates.push('longest_streak = ?');
    params.push(data.longestStreak);
  }

  if (data.reminderTime !== undefined) {
    updates.push('reminder_time = ?');
    params.push(data.reminderTime || null);
  }

  if (data.notificationId !== undefined) {
    updates.push('notification_id = ?');
    params.push(data.notificationId || null);
  }

  updates.push('updated_at = ?');
  params.push(now);

  updates.push('synced = 0');

  params.push(id);

  const sql = `UPDATE habits SET ${updates.join(', ')} WHERE id = ?`;
  await executeWrite(sql, params);

  const habit = await getHabit(id);
  if (!habit) {
    throw new Error('Habit not found after update');
  }

  return habit;
}

/**
 * Delete a habit
 */
export async function deleteHabit(id: string): Promise<void> {
  const sql = 'DELETE FROM habits WHERE id = ?';
  await executeWrite(sql, [id]);
}

/**
 * Log habit completion
 */
export async function logHabitCompletion(
  habitId: string,
  date: string,
  completed: boolean,
  notes?: string
): Promise<HabitLog> {
  const id = generateId();
  const now = getCurrentTimestamp();

  // Use INSERT OR REPLACE to handle existing entries
  const sql = `
    INSERT OR REPLACE INTO habit_logs (
      id, habit_id, date, completed, notes, created_at
    ) VALUES (
      COALESCE((SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?), ?),
      ?, ?, ?, ?, ?
    )
  `;

  const params = [habitId, date, id, habitId, date, completed ? 1 : 0, notes || null, now];

  await executeWrite(sql, params);

  // Update streak after logging
  await updateHabitStreak(habitId);

  const log = await getHabitLog(habitId, date);
  if (!log) {
    throw new Error('Failed to create habit log');
  }

  return log;
}

/**
 * Get habit log for a specific date
 */
export async function getHabitLog(habitId: string, date: string): Promise<HabitLog | null> {
  const sql = 'SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?';
  const row = await executeQuerySingle<HabitLogRow>(sql, [habitId, date]);
  return row ? rowToHabitLog(row) : null;
}

/**
 * Get habit logs for a date range
 */
export async function getHabitLogs(
  habitId: string,
  startDate: string,
  endDate: string
): Promise<HabitLog[]> {
  const sql = `
    SELECT * FROM habit_logs
    WHERE habit_id = ? AND date >= ? AND date <= ?
    ORDER BY date DESC
  `;
  const rows = await executeQuery<HabitLogRow>(sql, [habitId, startDate, endDate]);
  return rows.map(rowToHabitLog);
}

/**
 * Update habit streak based on completion history
 */
async function updateHabitStreak(habitId: string): Promise<void> {
  const habit = await getHabit(habitId);
  if (!habit) return;

  // Get last 30 days of logs
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const logs = await getHabitLogs(habitId, startDate, endDate);

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date();

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const log = logs.find((l) => l.date === dateStr);

    if (log && log.completed) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateStr === endDate) {
      // If today is not completed yet, it's okay, check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak from all logs
  let longestStreak = 0;
  let tempStreak = 0;

  const sortedLogs = logs.sort((a, b) => b.date.localeCompare(a.date));

  for (let i = 0; i < sortedLogs.length; i++) {
    if (sortedLogs[i].completed) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Update habit with new streak values
  await updateHabit(habitId, {
    currentStreak,
    longestStreak: Math.max(longestStreak, habit.longestStreak),
  });
}

/**
 * Get habit completion stats
 */
export async function getHabitStats(habitId: string): Promise<{
  totalDays: number;
  completedDays: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
}> {
  const habit = await getHabit(habitId);
  if (!habit) {
    throw new Error('Habit not found');
  }

  const sql = `
    SELECT
      COUNT(*) as total_days,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_days
    FROM habit_logs
    WHERE habit_id = ?
  `;

  const result = await executeQuerySingle<any>(sql, [habitId]);

  const totalDays = result?.total_days || 0;
  const completedDays = result?.completed_days || 0;
  const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  return {
    totalDays,
    completedDays,
    completionRate,
    currentStreak: habit.currentStreak,
    longestStreak: habit.longestStreak,
  };
}

/**
 * Check if habit is completed today
 */
export async function isHabitCompletedToday(habitId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const log = await getHabitLog(habitId, today);
  return log ? log.completed : false;
}

/**
 * Update notes for an existing habit log
 */
export async function updateHabitLogNotes(
  habitId: string,
  date: string,
  notes: string | null
): Promise<HabitLog> {
  const sql = `
    UPDATE habit_logs
    SET notes = ?
    WHERE habit_id = ? AND date = ?
  `;

  await executeWrite(sql, [notes, habitId, date]);

  const log = await getHabitLog(habitId, date);
  if (!log) {
    throw new Error('Habit log not found after update');
  }

  return log;
}

/**
 * Delete a habit log
 */
export async function deleteHabitLog(habitId: string, date: string): Promise<void> {
  const sql = 'DELETE FROM habit_logs WHERE habit_id = ? AND date = ?';
  await executeWrite(sql, [habitId, date]);

  // Update streak after deleting log
  await updateHabitStreak(habitId);
}

// ============================================================================
// HABIT INSIGHTS & ANALYTICS
// ============================================================================

export interface TimeDistribution {
  morning: number;
  afternoon: number;
  evening: number;
}

export interface WeekdayPattern {
  Sunday: number;
  Monday: number;
  Tuesday: number;
  Wednesday: number;
  Thursday: number;
  Friday: number;
  Saturday: number;
}

export interface HabitInsights {
  habitId: string;
  completionRate30Days: number;
  completionRate7Days: number;
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening' | null;
  longestStreak: number;
  currentStreak: number;
  totalCompletions: number;
  weekdayPattern: WeekdayPattern;
  timeDistribution: TimeDistribution;
}

/**
 * Analyze time-of-day completion patterns
 */
function analyzeTimeOfDay(logs: HabitLogRow[]): TimeDistribution {
  const distribution: TimeDistribution = {
    morning: 0,
    afternoon: 0,
    evening: 0,
  };

  logs.forEach(log => {
    if (log.completed !== 1 || !log.created_at) return;

    const hour = new Date(log.created_at).getHours();

    if (hour >= 5 && hour < 12) {
      distribution.morning++;
    } else if (hour >= 12 && hour < 18) {
      distribution.afternoon++;
    } else {
      distribution.evening++;
    }
  });

  return distribution;
}

/**
 * Determine best time of day based on completion distribution
 */
function getBestTimeOfDay(
  distribution: TimeDistribution
): 'morning' | 'afternoon' | 'evening' | null {
  const total = distribution.morning + distribution.afternoon + distribution.evening;

  if (total === 0) return null;

  const max = Math.max(
    distribution.morning,
    distribution.afternoon,
    distribution.evening
  );

  if (distribution.morning === max) return 'morning';
  if (distribution.afternoon === max) return 'afternoon';
  return 'evening';
}

/**
 * Analyze completion rates by weekday
 */
function analyzeWeekdayPattern(logs: HabitLogRow[]): WeekdayPattern {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

  const counts: Record<string, { completed: number; total: number }> = {};

  weekdays.forEach(day => {
    counts[day] = { completed: 0, total: 0 };
  });

  logs.forEach(log => {
    const dayName = weekdays[new Date(log.date).getDay()];
    counts[dayName].total++;
    if (log.completed === 1) {
      counts[dayName].completed++;
    }
  });

  const pattern: WeekdayPattern = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };

  weekdays.forEach(day => {
    pattern[day] = counts[day].total > 0
      ? Math.round((counts[day].completed / counts[day].total) * 100)
      : 0;
  });

  return pattern;
}

/**
 * Get comprehensive habit insights and analytics
 */
export async function getHabitInsights(habitId: string): Promise<HabitInsights> {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get completion logs for last 30 days
    const sql = `
      SELECT * FROM habit_logs
      WHERE habit_id = ?
      AND date >= ?
      ORDER BY date DESC
    `;
    const logs = await executeQuery<HabitLogRow>(
      sql,
      [habitId, thirtyDaysAgo.toISOString().split('T')[0]]
    );

    // Calculate 30-day completion rate
    const completedLast30 = logs.filter(l => l.completed === 1).length;
    const completionRate30Days = (completedLast30 / 30) * 100;

    // Calculate 7-day completion rate
    const sevenDaysAgoDate = sevenDaysAgo.toISOString().split('T')[0];
    const completedLast7 = logs.filter(
      l => l.date >= sevenDaysAgoDate && l.completed === 1
    ).length;
    const completionRate7Days = (completedLast7 / 7) * 100;

    // Analyze patterns
    const timeDistribution = analyzeTimeOfDay(logs);
    const bestTimeOfDay = getBestTimeOfDay(timeDistribution);
    const weekdayPattern = analyzeWeekdayPattern(logs);

    // Get streak data from habit record
    const habit = await getHabit(habitId);
    if (!habit) {
      throw new Error(`Habit ${habitId} not found`);
    }

    return {
      habitId,
      completionRate30Days: Math.round(completionRate30Days),
      completionRate7Days: Math.round(completionRate7Days),
      bestTimeOfDay,
      longestStreak: habit.longestStreak,
      currentStreak: habit.currentStreak,
      totalCompletions: completedLast30,
      weekdayPattern,
      timeDistribution,
    };
  } catch (error) {
    console.error('[Habits] Error getting insights:', error);
    throw error;
  }
}

/**
 * Get count of incomplete daily habits for today (for badge display)
 */
export async function getTodayIncompleteHabitsCount(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  const sql = `
    SELECT COUNT(*) as count
    FROM habits h
    WHERE h.cadence = 'daily'
    AND NOT EXISTS (
      SELECT 1 FROM habit_logs hl
      WHERE hl.habit_id = h.id
      AND hl.date = ?
      AND hl.completed = 1
    )
  `;

  const result = await executeQuerySingle<{ count: number }>(sql, [today]);
  return result?.count || 0;
}

/**
 * Get habit completion times for time-of-day analysis
 * Returns timestamps of when habit was completed (from created_at)
 */
export async function getHabitCompletionTimes(
  habitId: string,
  days: number = 90
): Promise<Date[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sql = `
      SELECT created_at
      FROM habit_logs
      WHERE habit_id = ?
      AND completed = 1
      AND date >= ?
      ORDER BY created_at DESC
    `;

    const result = await executeQuery<{ created_at: string }>(sql, [
      habitId,
      startDate.toISOString().split('T')[0],
    ]);

    return result.map((row) => new Date(row.created_at));
  } catch (error) {
    console.error('[Habits] Error getting completion times:', error);
    return [];
  }
}

/**
 * Get habit completion dates as strings for trend analysis
 * Returns array of date strings (YYYY-MM-DD) for completed days
 */
export async function getHabitCompletionDates(
  habitId: string,
  days: number = 30
): Promise<string[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sql = `
      SELECT date
      FROM habit_logs
      WHERE habit_id = ?
      AND completed = 1
      AND date >= ?
      ORDER BY date DESC
    `;

    const result = await executeQuery<{ date: string }>(sql, [
      habitId,
      startDate.toISOString().split('T')[0],
    ]);

    return result.map((row) => row.date);
  } catch (error) {
    console.error('[Habits] Error getting completion dates:', error);
    return [];
  }
}

/**
 * OPTIMIZED: Get all habits with stats in a single optimized query
 * This replaces the N+1 query pattern where stats were fetched separately for each habit
 * Performance: 60+ queries reduced to 1 query for 20 habits
 */
export interface HabitWithStats extends Habit {
  completionsToday: number;
  completionRate30Days: number;
  stats: {
    totalDays: number;
    completedDays: number;
    completionRate: number;
  };
}

export async function getHabitsWithStats(): Promise<HabitWithStats[]> {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];

  // Single optimized query with subqueries for all stats
  const sql = `
    SELECT
      h.*,

      -- Today's completion count
      COALESCE(
        (SELECT COUNT(*) FROM habit_logs
         WHERE habit_id = h.id AND date = ? AND completed = 1),
        0
      ) as completionsToday,

      -- 30-day completion count
      COALESCE(
        (SELECT COUNT(*) FROM habit_logs
         WHERE habit_id = h.id AND date >= ? AND date <= ? AND completed = 1),
        0
      ) as completedLast30Days,

      -- All-time total days tracked
      COALESCE(
        (SELECT COUNT(DISTINCT date) FROM habit_logs
         WHERE habit_id = h.id),
        0
      ) as totalDays,

      -- All-time completed days
      COALESCE(
        (SELECT COUNT(*) FROM habit_logs
         WHERE habit_id = h.id AND completed = 1),
        0
      ) as completedDays

    FROM habits h
    ORDER BY h.created_at DESC
  `;

  const rows = await executeQuery<any>(sql, [today, startDate, today]);

  // Map to HabitWithStats
  return rows.map(row => {
    const habit = rowToHabit({
      id: row.id,
      name: row.name,
      description: row.description,
      cadence: row.cadence,
      target_count: row.target_count,
      current_streak: row.current_streak,
      longest_streak: row.longest_streak,
      reminder_time: row.reminder_time,
      notification_id: row.notification_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      synced: row.synced,
    });

    const completedLast30Days = row.completedLast30Days || 0;
    const totalDays = row.totalDays || 0;
    const completedDays = row.completedDays || 0;

    return {
      ...habit,
      completionsToday: row.completionsToday || 0,
      completionRate30Days: Math.round((completedLast30Days / 30) * 100),
      stats: {
        totalDays,
        completedDays,
        completionRate: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
      },
    };
  });
}

export default {
  getHabits,
  getHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  logHabitCompletion,
  getHabitLog,
  getHabitLogs,
  getHabitStats,
  isHabitCompletedToday,
  updateHabitLogNotes,
  deleteHabitLog,
  getHabitInsights,
  getTodayIncompleteHabitsCount,
  getHabitCompletionTimes,
  getHabitCompletionDates,
  getHabitsWithStats,
};
