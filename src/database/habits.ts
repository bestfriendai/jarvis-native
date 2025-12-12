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
}

export interface UpdateHabitData extends Partial<CreateHabitData> {
  currentStreak?: number;
  longestStreak?: number;
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
      current_streak, longest_streak, created_at, updated_at, synced
    ) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, 0)
  `;

  const params = [
    id,
    data.name,
    data.description || null,
    data.cadence || 'daily',
    data.targetCount || 1,
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
};
