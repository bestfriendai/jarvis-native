/**
 * Focus Blocks Database Operations
 * CRUD operations for focus blocks with offline-first support
 */

import {
  generateId,
  getCurrentTimestamp,
  executeQuery,
  executeQuerySingle,
  executeWrite,
} from './index';

export type FocusBlockStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface FocusBlock {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  actualMinutes?: number;
  taskId?: string;
  status: FocusBlockStatus;
  startTime?: string;
  endTime?: string;
  phoneInMode: boolean;
  breakTaken: boolean;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  task?: {
    id: string;
    title: string;
    status: string;
  };
}

interface FocusBlockRow {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  actual_minutes?: number;
  task_id?: string;
  status: FocusBlockStatus;
  start_time?: string;
  end_time?: string;
  phone_in_mode: number;
  break_taken: number;
  created_at: string;
  updated_at: string;
  synced: number;
  task_title?: string;
  task_status?: string;
}

export interface CreateFocusBlockData {
  title: string;
  description?: string;
  durationMinutes: number;
  taskId?: string;
  phoneInMode?: boolean;
}

export interface UpdateFocusBlockData extends Partial<CreateFocusBlockData> {
  status?: FocusBlockStatus;
  startTime?: string;
  endTime?: string;
  actualMinutes?: number;
  breakTaken?: boolean;
}

export interface FocusBlockFilters {
  status?: FocusBlockStatus[];
  taskId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Convert database row to FocusBlock object
 */
function rowToFocusBlock(row: FocusBlockRow): FocusBlock {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    actualMinutes: row.actual_minutes,
    taskId: row.task_id,
    status: row.status,
    startTime: row.start_time,
    endTime: row.end_time,
    phoneInMode: row.phone_in_mode === 1,
    breakTaken: row.break_taken === 1,
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

/**
 * Get all focus blocks with optional filters
 */
export async function getFocusBlocks(filters?: FocusBlockFilters): Promise<FocusBlock[]> {
  let sql = `
    SELECT
      fb.*,
      t.title as task_title,
      t.status as task_status
    FROM focus_blocks fb
    LEFT JOIN tasks t ON fb.task_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Status filter
  if (filters?.status && filters.status.length > 0) {
    const placeholders = filters.status.map(() => '?').join(', ');
    sql += ` AND fb.status IN (${placeholders})`;
    params.push(...filters.status);
  }

  // Task filter
  if (filters?.taskId) {
    sql += ' AND fb.task_id = ?';
    params.push(filters.taskId);
  }

  // Date range filters (using start_time)
  if (filters?.dateFrom) {
    sql += ' AND fb.start_time >= ?';
    params.push(filters.dateFrom);
  }

  if (filters?.dateTo) {
    sql += ' AND fb.start_time <= ?';
    params.push(filters.dateTo);
  }

  // Sort by start_time descending (most recent first)
  sql += ' ORDER BY fb.start_time DESC, fb.created_at DESC';

  const rows = await executeQuery<FocusBlockRow>(sql, params);
  return rows.map(rowToFocusBlock);
}

/**
 * Get a single focus block by ID
 */
export async function getFocusBlock(id: string): Promise<FocusBlock | null> {
  const sql = `
    SELECT
      fb.*,
      t.title as task_title,
      t.status as task_status
    FROM focus_blocks fb
    LEFT JOIN tasks t ON fb.task_id = t.id
    WHERE fb.id = ?
  `;

  const row = await executeQuerySingle<FocusBlockRow>(sql, [id]);
  return row ? rowToFocusBlock(row) : null;
}

/**
 * Get all focus blocks for a specific task
 */
export async function getFocusBlocksByTask(taskId: string): Promise<FocusBlock[]> {
  const sql = `
    SELECT
      fb.*,
      t.title as task_title,
      t.status as task_status
    FROM focus_blocks fb
    LEFT JOIN tasks t ON fb.task_id = t.id
    WHERE fb.task_id = ?
    ORDER BY fb.start_time DESC, fb.created_at DESC
  `;

  const rows = await executeQuery<FocusBlockRow>(sql, [taskId]);
  return rows.map(rowToFocusBlock);
}

/**
 * Get currently active focus block (in_progress)
 */
export async function getActiveFocusBlock(): Promise<FocusBlock | null> {
  const sql = `
    SELECT
      fb.*,
      t.title as task_title,
      t.status as task_status
    FROM focus_blocks fb
    LEFT JOIN tasks t ON fb.task_id = t.id
    WHERE fb.status = 'in_progress'
    ORDER BY fb.start_time DESC
    LIMIT 1
  `;

  const row = await executeQuerySingle<FocusBlockRow>(sql);
  return row ? rowToFocusBlock(row) : null;
}

/**
 * Create a new focus block
 */
export async function createFocusBlock(data: CreateFocusBlockData): Promise<FocusBlock> {
  const id = generateId();
  const now = getCurrentTimestamp();

  const sql = `
    INSERT INTO focus_blocks (
      id, title, description, duration_minutes, task_id,
      status, phone_in_mode, break_taken,
      created_at, updated_at, synced
    ) VALUES (?, ?, ?, ?, ?, 'scheduled', ?, 0, ?, ?, 0)
  `;

  const params = [
    id,
    data.title,
    data.description || null,
    data.durationMinutes,
    data.taskId || null,
    data.phoneInMode ? 1 : 0,
    now,
    now,
  ];

  await executeWrite(sql, params);

  const block = await getFocusBlock(id);
  if (!block) {
    throw new Error('Failed to create focus block');
  }

  return block;
}

/**
 * Update a focus block
 */
export async function updateFocusBlock(
  id: string,
  data: UpdateFocusBlockData
): Promise<FocusBlock> {
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

  if (data.phoneInMode !== undefined) {
    updates.push('phone_in_mode = ?');
    params.push(data.phoneInMode ? 1 : 0);
  }

  if (data.breakTaken !== undefined) {
    updates.push('break_taken = ?');
    params.push(data.breakTaken ? 1 : 0);
  }

  updates.push('updated_at = ?');
  params.push(now);

  updates.push('synced = 0');

  params.push(id);

  const sql = `UPDATE focus_blocks SET ${updates.join(', ')} WHERE id = ?`;
  await executeWrite(sql, params);

  const block = await getFocusBlock(id);
  if (!block) {
    throw new Error('Focus block not found after update');
  }

  return block;
}

/**
 * Delete a focus block
 */
export async function deleteFocusBlock(id: string): Promise<void> {
  const sql = 'DELETE FROM focus_blocks WHERE id = ?';
  await executeWrite(sql, [id]);
}

/**
 * Start a focus block
 */
export async function startFocusBlock(id: string): Promise<FocusBlock> {
  const now = getCurrentTimestamp();
  return updateFocusBlock(id, {
    status: 'in_progress',
    startTime: now,
  });
}

/**
 * Complete a focus block
 */
export async function completeFocusBlock(
  id: string,
  actualMinutes: number
): Promise<FocusBlock> {
  const now = getCurrentTimestamp();
  return updateFocusBlock(id, {
    status: 'completed',
    endTime: now,
    actualMinutes,
  });
}

/**
 * Cancel a focus block
 */
export async function cancelFocusBlock(id: string): Promise<FocusBlock> {
  const now = getCurrentTimestamp();
  return updateFocusBlock(id, {
    status: 'cancelled',
    endTime: now,
  });
}

/**
 * Get focus block statistics
 */
export async function getFocusBlockStats(): Promise<{
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalFocusMinutes: number;
  avgSessionMinutes: number;
}> {
  const sql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
      SUM(CASE WHEN status = 'completed' THEN COALESCE(actual_minutes, duration_minutes) ELSE 0 END) as total_focus_minutes,
      AVG(CASE WHEN status = 'completed' THEN COALESCE(actual_minutes, duration_minutes) ELSE NULL END) as avg_session_minutes
    FROM focus_blocks
  `;

  const result = await executeQuerySingle<any>(sql);
  return {
    total: result?.total || 0,
    scheduled: result?.scheduled || 0,
    inProgress: result?.in_progress || 0,
    completed: result?.completed || 0,
    cancelled: result?.cancelled || 0,
    totalFocusMinutes: result?.total_focus_minutes || 0,
    avgSessionMinutes: Math.round(result?.avg_session_minutes || 0),
  };
}

/**
 * Get focus time by date (for charts)
 */
export async function getFocusTimeByDate(
  dateFrom: string,
  dateTo: string
): Promise<Array<{ date: string; minutes: number }>> {
  const sql = `
    SELECT
      DATE(start_time) as date,
      SUM(COALESCE(actual_minutes, duration_minutes)) as minutes
    FROM focus_blocks
    WHERE status = 'completed'
      AND start_time >= ?
      AND start_time <= ?
    GROUP BY DATE(start_time)
    ORDER BY date ASC
  `;

  const rows = await executeQuery<{ date: string; minutes: number }>(sql, [dateFrom, dateTo]);
  return rows;
}

/**
 * Get focus time by hour of day (for productivity analysis)
 */
export async function getFocusTimeByHour(): Promise<
  Array<{ hour: number; minutes: number; sessions: number }>
> {
  const sql = `
    SELECT
      CAST(strftime('%H', start_time) AS INTEGER) as hour,
      SUM(COALESCE(actual_minutes, duration_minutes)) as minutes,
      COUNT(*) as sessions
    FROM focus_blocks
    WHERE status = 'completed'
      AND start_time IS NOT NULL
    GROUP BY hour
    ORDER BY hour ASC
  `;

  const rows = await executeQuery<{ hour: number; minutes: number; sessions: number }>(sql);
  return rows;
}

/**
 * Get focus completion rate
 */
export async function getFocusCompletionRate(): Promise<{
  completed: number;
  total: number;
  rate: number;
}> {
  const sql = `
    SELECT
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      COUNT(*) as total
    FROM focus_blocks
    WHERE status IN ('completed', 'cancelled')
  `;

  const result = await executeQuerySingle<{ completed: number; total: number }>(sql);
  const completed = result?.completed || 0;
  const total = result?.total || 0;
  const rate = total > 0 ? (completed / total) * 100 : 0;

  return {
    completed,
    total,
    rate: Math.round(rate * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Get focus streak (consecutive days with completed focus blocks)
 */
export async function getFocusStreak(): Promise<{
  currentStreak: number;
  longestStreak: number;
}> {
  // Get all dates with completed focus blocks
  const sql = `
    SELECT DISTINCT DATE(start_time) as date
    FROM focus_blocks
    WHERE status = 'completed'
      AND start_time IS NOT NULL
    ORDER BY date DESC
  `;

  const rows = await executeQuery<{ date: string }>(sql);

  if (rows.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const dates = rows.map((r) => new Date(r.date));
  let currentStreak = 1;
  let longestStreak = 1;
  let tempStreak = 1;

  // Calculate current streak
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

  // Calculate longest streak
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

export default {
  getFocusBlocks,
  getFocusBlock,
  getFocusBlocksByTask,
  getActiveFocusBlock,
  createFocusBlock,
  updateFocusBlock,
  deleteFocusBlock,
  startFocusBlock,
  completeFocusBlock,
  cancelFocusBlock,
  getFocusBlockStats,
  getFocusTimeByDate,
  getFocusTimeByHour,
  getFocusCompletionRate,
  getFocusStreak,
};
