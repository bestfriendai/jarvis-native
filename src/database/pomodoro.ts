/**
 * Pomodoro Database Operations
 * CRUD operations for pomodoro sessions and settings
 */

import { getDatabase, generateId, getCurrentTimestamp } from './index';

// ============================================================================
// TYPES
// ============================================================================

export type PomodoroStatus = 'in_progress' | 'completed' | 'cancelled';

export interface PomodoroSession {
  id: string;
  taskId?: string;
  sessionNumber: number;
  durationMinutes: number;
  breakMinutes: number;
  status: PomodoroStatus;
  startedAt: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  synced: number;
}

export interface PomodoroSettings {
  id: string;
  workDuration: number;
  shortBreak: number;
  longBreak: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: number;
  autoStartPomodoros: number;
  notificationSound: number;
  updatedAt: string;
}

export interface CreatePomodoroSessionData {
  taskId?: string;
  sessionNumber: number;
  durationMinutes: number;
  breakMinutes: number;
  notes?: string;
}

export interface UpdatePomodoroSessionData {
  notes?: string;
  status?: PomodoroStatus;
  completedAt?: string;
}

export interface UpdatePomodoroSettingsData {
  workDuration?: number;
  shortBreak?: number;
  longBreak?: number;
  sessionsUntilLongBreak?: number;
  autoStartBreaks?: number;
  autoStartPomodoros?: number;
  notificationSound?: number;
}

export interface PomodoroStats {
  completedCount: number;
  totalMinutes: number;
  avgSessionMinutes: number;
}

export interface DayStats {
  date: string;
  count: number;
  minutes: number;
}

// ============================================================================
// SESSION CRUD OPERATIONS
// ============================================================================

/**
 * Create a new pomodoro session
 */
export async function createPomodoroSession(
  data: CreatePomodoroSessionData
): Promise<PomodoroSession> {
  const db = await getDatabase();
  const now = getCurrentTimestamp();

  const session: PomodoroSession = {
    id: generateId(),
    taskId: data.taskId,
    sessionNumber: data.sessionNumber,
    durationMinutes: data.durationMinutes,
    breakMinutes: data.breakMinutes,
    status: 'in_progress',
    startedAt: now,
    notes: data.notes,
    createdAt: now,
    synced: 0,
  };

  await db.runAsync(
    `INSERT INTO pomodoro_sessions (
      id, task_id, session_number, duration_minutes, break_minutes,
      status, started_at, notes, created_at, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.taskId || null,
      session.sessionNumber,
      session.durationMinutes,
      session.breakMinutes,
      session.status,
      session.startedAt,
      session.notes || null,
      session.createdAt,
      session.synced,
    ]
  );

  return session;
}

/**
 * Get pomodoro session by ID
 */
export async function getPomodoroSession(id: string): Promise<PomodoroSession | null> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<any>(
    'SELECT * FROM pomodoro_sessions WHERE id = ?',
    [id]
  );

  if (!result) return null;

  return mapRowToSession(result);
}

/**
 * Get all pomodoro sessions
 */
export async function getPomodoroSessions(options?: {
  status?: PomodoroStatus;
  taskId?: string;
  limit?: number;
  offset?: number;
}): Promise<PomodoroSession[]> {
  const db = await getDatabase();
  let query = 'SELECT * FROM pomodoro_sessions WHERE 1=1';
  const params: any[] = [];

  if (options?.status) {
    query += ' AND status = ?';
    params.push(options.status);
  }

  if (options?.taskId) {
    query += ' AND task_id = ?';
    params.push(options.taskId);
  }

  query += ' ORDER BY started_at DESC';

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);

    if (options?.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }
  }

  const results = await db.getAllAsync<any>(query, params);
  return results.map(mapRowToSession);
}

/**
 * Get active pomodoro session (in_progress)
 */
export async function getActivePomodoroSession(): Promise<PomodoroSession | null> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<any>(
    'SELECT * FROM pomodoro_sessions WHERE status = ? ORDER BY started_at DESC LIMIT 1',
    ['in_progress']
  );

  if (!result) return null;

  return mapRowToSession(result);
}

/**
 * Update pomodoro session
 */
export async function updatePomodoroSession(
  id: string,
  data: UpdatePomodoroSessionData
): Promise<void> {
  const db = await getDatabase();
  const updates: string[] = [];
  const params: any[] = [];

  if (data.notes !== undefined) {
    updates.push('notes = ?');
    params.push(data.notes || null);
  }

  if (data.status !== undefined) {
    updates.push('status = ?');
    params.push(data.status);
  }

  if (data.completedAt !== undefined) {
    updates.push('completed_at = ?');
    params.push(data.completedAt);
  }

  if (updates.length === 0) return;

  params.push(id);

  await db.runAsync(
    `UPDATE pomodoro_sessions SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
}

/**
 * Complete pomodoro session
 */
export async function completePomodoroSession(id: string): Promise<void> {
  await updatePomodoroSession(id, {
    status: 'completed',
    completedAt: getCurrentTimestamp(),
  });
}

/**
 * Cancel pomodoro session
 */
export async function cancelPomodoroSession(id: string): Promise<void> {
  await updatePomodoroSession(id, {
    status: 'cancelled',
    completedAt: getCurrentTimestamp(),
  });
}

/**
 * Delete pomodoro session
 */
export async function deletePomodoroSession(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM pomodoro_sessions WHERE id = ?', [id]);
}

// ============================================================================
// SETTINGS OPERATIONS
// ============================================================================

/**
 * Get pomodoro settings (creates default if not exists)
 */
export async function getPomodoroSettings(): Promise<PomodoroSettings> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<any>(
    'SELECT * FROM pomodoro_settings LIMIT 1'
  );

  if (result) {
    return mapRowToSettings(result);
  }

  // Create default settings
  const now = getCurrentTimestamp();
  const defaultSettings: PomodoroSettings = {
    id: generateId(),
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: 0,
    autoStartPomodoros: 0,
    notificationSound: 1,
    updatedAt: now,
  };

  await db.runAsync(
    `INSERT INTO pomodoro_settings (
      id, work_duration, short_break, long_break,
      sessions_until_long_break, auto_start_breaks,
      auto_start_pomodoros, notification_sound, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      defaultSettings.id,
      defaultSettings.workDuration,
      defaultSettings.shortBreak,
      defaultSettings.longBreak,
      defaultSettings.sessionsUntilLongBreak,
      defaultSettings.autoStartBreaks,
      defaultSettings.autoStartPomodoros,
      defaultSettings.notificationSound,
      defaultSettings.updatedAt,
    ]
  );

  return defaultSettings;
}

/**
 * Update pomodoro settings
 */
export async function updatePomodoroSettings(
  data: UpdatePomodoroSettingsData
): Promise<void> {
  const db = await getDatabase();
  const settings = await getPomodoroSettings();

  const updates: string[] = ['updated_at = ?'];
  const params: any[] = [getCurrentTimestamp()];

  if (data.workDuration !== undefined) {
    updates.push('work_duration = ?');
    params.push(data.workDuration);
  }

  if (data.shortBreak !== undefined) {
    updates.push('short_break = ?');
    params.push(data.shortBreak);
  }

  if (data.longBreak !== undefined) {
    updates.push('long_break = ?');
    params.push(data.longBreak);
  }

  if (data.sessionsUntilLongBreak !== undefined) {
    updates.push('sessions_until_long_break = ?');
    params.push(data.sessionsUntilLongBreak);
  }

  if (data.autoStartBreaks !== undefined) {
    updates.push('auto_start_breaks = ?');
    params.push(data.autoStartBreaks);
  }

  if (data.autoStartPomodoros !== undefined) {
    updates.push('auto_start_pomodoros = ?');
    params.push(data.autoStartPomodoros);
  }

  if (data.notificationSound !== undefined) {
    updates.push('notification_sound = ?');
    params.push(data.notificationSound);
  }

  params.push(settings.id);

  await db.runAsync(
    `UPDATE pomodoro_settings SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
}

// ============================================================================
// ANALYTICS & STATISTICS
// ============================================================================

/**
 * Get today's pomodoro stats
 */
export async function getTodayPomodoroStats(): Promise<PomodoroStats> {
  const db = await getDatabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db.getFirstAsync<any>(
    `SELECT
      COUNT(*) as count,
      SUM(duration_minutes) as totalMinutes,
      AVG(duration_minutes) as avgMinutes
    FROM pomodoro_sessions
    WHERE status = 'completed'
    AND started_at >= ?`,
    [today.toISOString()]
  );

  return {
    completedCount: result?.count || 0,
    totalMinutes: result?.totalMinutes || 0,
    avgSessionMinutes: result?.avgMinutes || 0,
  };
}

/**
 * Get weekly pomodoro stats
 */
export async function getWeeklyPomodoroStats(): Promise<PomodoroStats> {
  const db = await getDatabase();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const result = await db.getFirstAsync<any>(
    `SELECT
      COUNT(*) as count,
      SUM(duration_minutes) as totalMinutes,
      AVG(duration_minutes) as avgMinutes
    FROM pomodoro_sessions
    WHERE status = 'completed'
    AND started_at >= ?`,
    [weekAgo.toISOString()]
  );

  return {
    completedCount: result?.count || 0,
    totalMinutes: result?.totalMinutes || 0,
    avgSessionMinutes: result?.avgMinutes || 0,
  };
}

/**
 * Get pomodoro streak (consecutive days with at least 1 completed session)
 */
export async function getPomodoroStreak(): Promise<number> {
  const db = await getDatabase();

  // Get all dates with completed pomodoros
  const results = await db.getAllAsync<{ date: string }>(
    `SELECT DISTINCT DATE(started_at) as date
    FROM pomodoro_sessions
    WHERE status = 'completed'
    ORDER BY date DESC`
  );

  if (results.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const row of results) {
    const sessionDate = new Date(row.date);
    sessionDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - streak);

    if (sessionDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get 7-day pomodoro history
 */
export async function getSevenDayPomodoroHistory(): Promise<DayStats[]> {
  const db = await getDatabase();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const results = await db.getAllAsync<any>(
    `SELECT
      DATE(started_at) as date,
      COUNT(*) as count,
      SUM(duration_minutes) as minutes
    FROM pomodoro_sessions
    WHERE status = 'completed'
    AND started_at >= ?
    GROUP BY DATE(started_at)
    ORDER BY date ASC`,
    [sevenDaysAgo.toISOString()]
  );

  return results.map(row => ({
    date: row.date,
    count: row.count,
    minutes: row.minutes || 0,
  }));
}

/**
 * Get pomodoro sessions by hour of day (for productivity heatmap)
 */
export async function getPomodorosByHour(): Promise<{ hour: number; count: number }[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT
      CAST(strftime('%H', started_at) AS INTEGER) as hour,
      COUNT(*) as count
    FROM pomodoro_sessions
    WHERE status = 'completed'
    GROUP BY hour
    ORDER BY hour ASC`
  );

  // Fill in missing hours with 0
  const hourlyData: { hour: number; count: number }[] = [];
  for (let i = 0; i < 24; i++) {
    const result = results.find(r => r.hour === i);
    hourlyData.push({
      hour: i,
      count: result?.count || 0,
    });
  }

  return hourlyData;
}

/**
 * Get pomodoro sessions for a specific task
 */
export async function getPomodorosForTask(taskId: string): Promise<PomodoroSession[]> {
  return getPomodoroSessions({ taskId });
}

/**
 * Get total pomodoros count
 */
export async function getTotalPomodorosCount(): Promise<number> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM pomodoro_sessions WHERE status = ?',
    ['completed']
  );

  return result?.count || 0;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapRowToSession(row: any): PomodoroSession {
  return {
    id: row.id,
    taskId: row.task_id,
    sessionNumber: row.session_number,
    durationMinutes: row.duration_minutes,
    breakMinutes: row.break_minutes,
    status: row.status as PomodoroStatus,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    notes: row.notes,
    createdAt: row.created_at,
    synced: row.synced,
  };
}

function mapRowToSettings(row: any): PomodoroSettings {
  return {
    id: row.id,
    workDuration: row.work_duration,
    shortBreak: row.short_break,
    longBreak: row.long_break,
    sessionsUntilLongBreak: row.sessions_until_long_break,
    autoStartBreaks: row.auto_start_breaks,
    autoStartPomodoros: row.auto_start_pomodoros,
    notificationSound: row.notification_sound,
    updatedAt: row.updated_at,
  };
}
