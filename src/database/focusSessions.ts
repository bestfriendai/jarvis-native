/**
 * Unified Focus Sessions Database Operations
 * Handles both regular focus blocks and pomodoro sessions
 * Replaces focusBlocks.ts and pomodoro.ts
 */

import {
  generateId,
  getCurrentTimestamp,
  executeQuery,
  executeQuerySingle,
  executeWrite,
} from './index';

// ============================================================================
// TYPES
// ============================================================================

export type FocusSessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

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

export interface UpdatePomodoroSettingsData {
  workDuration?: number;
  shortBreak?: number;
  longBreak?: number;
  sessionsUntilLongBreak?: number;
  autoStartBreaks?: number;
  autoStartPomodoros?: number;
  notificationSound?: number;
}

export interface FocusSession {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  actualMinutes?: number;
  taskId?: string;
  isPomodoro: boolean;
  sessionNumber?: number;
  breakMinutes?: number;
  phoneInMode: boolean;
  status: FocusSessionStatus;
  startTime?: string;
  endTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  task?: {
    id: string;
    title: string;
    status: string;
  };
}

interface FocusSessionRow {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  actual_minutes?: number;
  task_id?: string;
  is_pomodoro: number;
  session_number?: number;
  break_minutes?: number;
  phone_in_mode: number;
  status: FocusSessionStatus;
  start_time?: string;
  end_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  synced: number;
  task_title?: string;
  task_status?: string;
}

export interface CreateFocusSessionData {
  title: string;
  description?: string;
  durationMinutes: number;
  taskId?: string;
  isPomodoro?: boolean;
  sessionNumber?: number;
  breakMinutes?: number;
  phoneInMode?: boolean;
  notes?: string;
}

export interface UpdateFocusSessionData extends Partial<CreateFocusSessionData> {
  status?: FocusSessionStatus;
  startTime?: string;
  endTime?: string;
  actualMinutes?: number;
}

export interface FocusSessionFilters {
  status?: FocusSessionStatus[];
  taskId?: string;
  isPomodoro?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function rowToFocusSession(row: FocusSessionRow): FocusSession {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    actualMinutes: row.actual_minutes,
    taskId: row.task_id,
    isPomodoro: row.is_pomodoro === 1,
    sessionNumber: row.session_number,
    breakMinutes: row.break_minutes,
    phoneInMode: row.phone_in_mode === 1,
    status: row.status,
    startTime: row.start_time,
    endTime: row.end_time,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    synced: row.synced === 1,
    task: row.task_title
      ? {
          id: row.task_id!,
          title: row.task_title,
          status: row.task_status!,
        }
      : undefined,
  };
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get all focus sessions with optional filters
 */
export async function getFocusSessions(filters?: FocusSessionFilters): Promise<FocusSession[]> {
  let sql = `
    SELECT
      fs.*,
      t.title as task_title,
      t.status as task_status
    FROM focus_sessions fs
    LEFT JOIN tasks t ON fs.task_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Status filter
  if (filters?.status && filters.status.length > 0) {
    const placeholders = filters.status.map(() => '?').join(', ');
    sql += ` AND fs.status IN (${placeholders})`;
    params.push(...filters.status);
  }

  // Task filter
  if (filters?.taskId) {
    sql += ' AND fs.task_id = ?';
    params.push(filters.taskId);
  }

  // Pomodoro filter
  if (filters?.isPomodoro !== undefined) {
    sql += ' AND fs.is_pomodoro = ?';
    params.push(filters.isPomodoro ? 1 : 0);
  }

  // Date range filters
  if (filters?.dateFrom) {
    sql += ' AND fs.start_time >= ?';
    params.push(filters.dateFrom);
  }

  if (filters?.dateTo) {
    sql += ' AND fs.start_time <= ?';
    params.push(filters.dateTo);
  }

  sql += ' ORDER BY fs.start_time DESC, fs.created_at DESC';

  // Limit results
  if (filters?.limit) {
    sql += ' LIMIT ?';
    params.push(filters.limit);
  }

  const rows = await executeQuery<FocusSessionRow>(sql, params);
  return rows.map(rowToFocusSession);
}

/**
 * Get a single focus session by ID
 */
export async function getFocusSession(id: string): Promise<FocusSession | null> {
  const sql = `
    SELECT
      fs.*,
      t.title as task_title,
      t.status as task_status
    FROM focus_sessions fs
    LEFT JOIN tasks t ON fs.task_id = t.id
    WHERE fs.id = ?
  `;

  const row = await executeQuerySingle<FocusSessionRow>(sql, [id]);
  return row ? rowToFocusSession(row) : null;
}

/**
 * Get all focus sessions for a specific task
 */
export async function getFocusSessionsByTask(taskId: string): Promise<FocusSession[]> {
  return getFocusSessions({ taskId });
}

/**
 * Get currently active focus session (in_progress)
 */
export async function getActiveFocusSession(): Promise<FocusSession | null> {
  const sql = `
    SELECT
      fs.*,
      t.title as task_title,
      t.status as task_status
    FROM focus_sessions fs
    LEFT JOIN tasks t ON fs.task_id = t.id
    WHERE fs.status = 'in_progress'
    ORDER BY fs.start_time DESC
    LIMIT 1
  `;

  const row = await executeQuerySingle<FocusSessionRow>(sql);
  return row ? rowToFocusSession(row) : null;
}

/**
 * Create a new focus session
 */
export async function createFocusSession(data: CreateFocusSessionData): Promise<FocusSession> {
  const id = generateId();
  const now = getCurrentTimestamp();

  const sql = `
    INSERT INTO focus_sessions (
      id, title, description, duration_minutes, task_id,
      is_pomodoro, session_number, break_minutes, phone_in_mode,
      status, notes, created_at, updated_at, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?, 0)
  `;

  const params = [
    id,
    data.title,
    data.description || null,
    data.durationMinutes,
    data.taskId || null,
    data.isPomodoro ? 1 : 0,
    data.sessionNumber || null,
    data.breakMinutes || null,
    data.phoneInMode ? 1 : 0,
    data.notes || null,
    now,
    now,
  ];

  await executeWrite(sql, params);

  const session = await getFocusSession(id);
  if (!session) {
    throw new Error('Failed to create focus session');
  }

  return session;
}

/**
 * Update a focus session
 */
export async function updateFocusSession(
  id: string,
  data: UpdateFocusSessionData
): Promise<FocusSession> {
  const now = getCurrentTimestamp();

  const updates: string[] = [];
  const params: any[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    params.push(data.title);
  }

  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description || null);
  }

  if (data.durationMinutes !== undefined) {
    updates.push('duration_minutes = ?');
    params.push(data.durationMinutes);
  }

  if (data.actualMinutes !== undefined) {
    updates.push('actual_minutes = ?');
    params.push(data.actualMinutes);
  }

  if (data.taskId !== undefined) {
    updates.push('task_id = ?');
    params.push(data.taskId || null);
  }

  if (data.isPomodoro !== undefined) {
    updates.push('is_pomodoro = ?');
    params.push(data.isPomodoro ? 1 : 0);
  }

  if (data.sessionNumber !== undefined) {
    updates.push('session_number = ?');
    params.push(data.sessionNumber || null);
  }

  if (data.breakMinutes !== undefined) {
    updates.push('break_minutes = ?');
    params.push(data.breakMinutes || null);
  }

  if (data.phoneInMode !== undefined) {
    updates.push('phone_in_mode = ?');
    params.push(data.phoneInMode ? 1 : 0);
  }

  if (data.status !== undefined) {
    updates.push('status = ?');
    params.push(data.status);
  }

  if (data.startTime !== undefined) {
    updates.push('start_time = ?');
    params.push(data.startTime || null);
  }

  if (data.endTime !== undefined) {
    updates.push('end_time = ?');
    params.push(data.endTime || null);
  }

  if (data.notes !== undefined) {
    updates.push('notes = ?');
    params.push(data.notes || null);
  }

  updates.push('updated_at = ?');
  params.push(now);

  updates.push('synced = 0');

  params.push(id);

  const sql = `UPDATE focus_sessions SET ${updates.join(', ')} WHERE id = ?`;
  await executeWrite(sql, params);

  const session = await getFocusSession(id);
  if (!session) {
    throw new Error('Focus session not found after update');
  }

  return session;
}

/**
 * Delete a focus session
 */
export async function deleteFocusSession(id: string): Promise<void> {
  const sql = 'DELETE FROM focus_sessions WHERE id = ?';
  await executeWrite(sql, [id]);
}

/**
 * Start a focus session
 */
export async function startFocusSession(id: string): Promise<FocusSession> {
  const now = getCurrentTimestamp();
  return updateFocusSession(id, {
    status: 'in_progress',
    startTime: now,
  });
}

/**
 * Complete a focus session
 */
export async function completeFocusSession(
  id: string,
  actualMinutes: number
): Promise<FocusSession> {
  const now = getCurrentTimestamp();
  return updateFocusSession(id, {
    status: 'completed',
    endTime: now,
    actualMinutes,
  });
}

/**
 * Cancel a focus session
 */
export async function cancelFocusSession(id: string): Promise<FocusSession> {
  const now = getCurrentTimestamp();
  return updateFocusSession(id, {
    status: 'cancelled',
    endTime: now,
  });
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

export interface FocusStats {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalFocusMinutes: number;
  avgSessionMinutes: number;
  pomodoroCount: number;
  focusBlockCount: number;
}

/**
 * Get focus session statistics
 */
export async function getFocusStats(includePomodoro: boolean = true): Promise<FocusStats> {
  let sql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
      SUM(CASE WHEN status = 'completed' THEN COALESCE(actual_minutes, duration_minutes) ELSE 0 END) as total_focus_minutes,
      AVG(CASE WHEN status = 'completed' THEN COALESCE(actual_minutes, duration_minutes) ELSE NULL END) as avg_session_minutes,
      SUM(CASE WHEN is_pomodoro = 1 AND status = 'completed' THEN 1 ELSE 0 END) as pomodoro_count,
      SUM(CASE WHEN is_pomodoro = 0 AND status = 'completed' THEN 1 ELSE 0 END) as focus_block_count
    FROM focus_sessions
  `;

  const params: any[] = [];
  if (!includePomodoro) {
    sql += ' WHERE is_pomodoro = 0';
  }

  const result = await executeQuerySingle<any>(sql, params);
  return {
    total: result?.total || 0,
    scheduled: result?.scheduled || 0,
    inProgress: result?.in_progress || 0,
    completed: result?.completed || 0,
    cancelled: result?.cancelled || 0,
    totalFocusMinutes: result?.total_focus_minutes || 0,
    avgSessionMinutes: Math.round(result?.avg_session_minutes || 0),
    pomodoroCount: result?.pomodoro_count || 0,
    focusBlockCount: result?.focus_block_count || 0,
  };
}

/**
 * Get focus time by date (for charts)
 */
export async function getFocusTimeByDate(
  dateFrom: string,
  dateTo: string,
  includePomodoro: boolean = true
): Promise<Array<{ date: string; minutes: number; pomodoroMinutes: number; focusMinutes: number }>> {
  let sql = `
    SELECT
      DATE(start_time) as date,
      SUM(COALESCE(actual_minutes, duration_minutes)) as minutes,
      SUM(CASE WHEN is_pomodoro = 1 THEN COALESCE(actual_minutes, duration_minutes) ELSE 0 END) as pomodoro_minutes,
      SUM(CASE WHEN is_pomodoro = 0 THEN COALESCE(actual_minutes, duration_minutes) ELSE 0 END) as focus_minutes
    FROM focus_sessions
    WHERE status = 'completed'
      AND start_time >= ?
      AND start_time <= ?
  `;

  const params: any[] = [dateFrom, dateTo];

  if (!includePomodoro) {
    sql += ' AND is_pomodoro = 0';
  }

  sql += ' GROUP BY DATE(start_time) ORDER BY date ASC';

  const rows = await executeQuery<any>(sql, params);
  return rows.map(row => ({
    date: row.date,
    minutes: row.minutes || 0,
    pomodoroMinutes: row.pomodoro_minutes || 0,
    focusMinutes: row.focus_minutes || 0,
  }));
}

/**
 * Get focus time by hour of day
 */
export async function getFocusTimeByHour(
  includePomodoro: boolean = true
): Promise<Array<{ hour: number; minutes: number; sessions: number }>> {
  let sql = `
    SELECT
      CAST(strftime('%H', start_time) AS INTEGER) as hour,
      SUM(COALESCE(actual_minutes, duration_minutes)) as minutes,
      COUNT(*) as sessions
    FROM focus_sessions
    WHERE status = 'completed'
      AND start_time IS NOT NULL
  `;

  if (!includePomodoro) {
    sql += ' AND is_pomodoro = 0';
  }

  sql += ' GROUP BY hour ORDER BY hour ASC';

  const rows = await executeQuery<{ hour: number; minutes: number; sessions: number }>(sql);
  return rows;
}

/**
 * Get focus completion rate
 */
export async function getFocusCompletionRate(
  includePomodoro: boolean = true
): Promise<{ completed: number; total: number; rate: number }> {
  let sql = `
    SELECT
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      COUNT(*) as total
    FROM focus_sessions
    WHERE status IN ('completed', 'cancelled')
  `;

  if (!includePomodoro) {
    sql += ' AND is_pomodoro = 0';
  }

  const result = await executeQuerySingle<{ completed: number; total: number }>(sql);
  const completed = result?.completed || 0;
  const total = result?.total || 0;
  const rate = total > 0 ? (completed / total) * 100 : 0;

  return {
    completed,
    total,
    rate: Math.round(rate * 10) / 10,
  };
}

/**
 * Get focus streak (consecutive days with completed sessions)
 */
export async function getFocusStreak(
  includePomodoro: boolean = true
): Promise<{ currentStreak: number; longestStreak: number }> {
  let sql = `
    SELECT DISTINCT DATE(start_time) as date
    FROM focus_sessions
    WHERE status = 'completed'
      AND start_time IS NOT NULL
  `;

  if (!includePomodoro) {
    sql += ' AND is_pomodoro = 0';
  }

  sql += ' ORDER BY date DESC';

  const rows = await executeQuery<{ date: string }>(sql);

  if (rows.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const dates = rows.map((r) => new Date(r.date));
  let currentStreak = 1;
  let longestStreak = 1;
  let tempStreak = 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mostRecentDate = new Date(dates[0]);
  mostRecentDate.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff > 1) {
    currentStreak = 0;
  } else {
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      prevDate.setHours(0, 0, 0, 0);
      currDate.setHours(0, 0, 0, 0);

      const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  tempStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    prevDate.setHours(0, 0, 0, 0);
    currDate.setHours(0, 0, 0, 0);

    const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { currentStreak, longestStreak };
}

/**
 * Get today's stats
 */
export async function getTodayStats(
  includePomodoro: boolean = true
): Promise<{ completedCount: number; totalMinutes: number; avgSessionMinutes: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let sql = `
    SELECT
      COUNT(*) as count,
      SUM(COALESCE(actual_minutes, duration_minutes)) as totalMinutes,
      AVG(COALESCE(actual_minutes, duration_minutes)) as avgMinutes
    FROM focus_sessions
    WHERE status = 'completed'
      AND start_time >= ?
  `;

  const params: any[] = [today.toISOString()];

  if (!includePomodoro) {
    sql += ' AND is_pomodoro = 0';
  }

  const result = await executeQuerySingle<any>(sql, params);

  return {
    completedCount: result?.count || 0,
    totalMinutes: result?.totalMinutes || 0,
    avgSessionMinutes: result?.avgMinutes || 0,
  };
}

/**
 * Get weekly stats
 */
export async function getWeeklyStats(
  includePomodoro: boolean = true
): Promise<{ completedCount: number; totalMinutes: number; avgSessionMinutes: number }> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  let sql = `
    SELECT
      COUNT(*) as count,
      SUM(COALESCE(actual_minutes, duration_minutes)) as totalMinutes,
      AVG(COALESCE(actual_minutes, duration_minutes)) as avgMinutes
    FROM focus_sessions
    WHERE status = 'completed'
      AND start_time >= ?
  `;

  const params: any[] = [weekAgo.toISOString()];

  if (!includePomodoro) {
    sql += ' AND is_pomodoro = 0';
  }

  const result = await executeQuerySingle<any>(sql, params);

  return {
    completedCount: result?.count || 0,
    totalMinutes: result?.totalMinutes || 0,
    avgSessionMinutes: result?.avgMinutes || 0,
  };
}

// ============================================================================
// POMODORO SETTINGS OPERATIONS
// ============================================================================

/**
 * Get pomodoro settings (creates default if not exists)
 */
export async function getPomodoroSettings(): Promise<PomodoroSettings> {
  const result = await executeQuerySingle<any>('SELECT * FROM pomodoro_settings LIMIT 1');

  if (result) {
    return {
      id: result.id,
      workDuration: result.work_duration,
      shortBreak: result.short_break,
      longBreak: result.long_break,
      sessionsUntilLongBreak: result.sessions_until_long_break,
      autoStartBreaks: result.auto_start_breaks,
      autoStartPomodoros: result.auto_start_pomodoros,
      notificationSound: result.notification_sound,
      updatedAt: result.updated_at,
    };
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

  await executeWrite(
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

  await executeWrite(
    `UPDATE pomodoro_settings SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
}

export default {
  getFocusSessions,
  getFocusSession,
  getFocusSessionsByTask,
  getActiveFocusSession,
  createFocusSession,
  updateFocusSession,
  deleteFocusSession,
  startFocusSession,
  completeFocusSession,
  cancelFocusSession,
  getFocusStats,
  getFocusTimeByDate,
  getFocusTimeByHour,
  getFocusCompletionRate,
  getFocusStreak,
  getTodayStats,
  getWeeklyStats,
  getPomodoroSettings,
  updatePomodoroSettings,
};
