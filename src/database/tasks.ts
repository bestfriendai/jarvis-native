/**
 * Tasks Database Operations
 * CRUD operations for tasks with offline-first support
 */

import {
  generateId,
  getCurrentTimestamp,
  executeQuery,
  executeQuerySingle,
  executeWrite,
} from './index';
import type { RecurrenceRule } from '../types';
import type { TaskFilters } from '../store/taskFilterStore';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  effort?: number;
  impact?: number;
  dueDate?: string;
  completedAt?: string;
  projectId?: string;
  tags: string[];
  recurrence?: RecurrenceRule;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  project?: {
    id: string;
    name: string;
    color?: string;
  };
}

interface TaskRow {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  effort?: number;
  impact?: number;
  due_date?: string;
  completed_at?: string;
  project_id?: string;
  tags: string;
  recurrence_rule?: string;
  created_at: string;
  updated_at: string;
  synced: number;
  project_name?: string;
  project_color?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  effort?: number;
  impact?: number;
  dueDate?: string;
  projectId?: string;
  tags?: string[];
  recurrence?: RecurrenceRule;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  completedAt?: string;
}

/**
 * Convert database row to Task object
 */
function safeParseJson<T>(value: string | undefined | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    effort: row.effort,
    impact: row.impact,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    projectId: row.project_id,
    tags: safeParseJson<string[]>(row.tags, []),
    recurrence: safeParseJson<RecurrenceRule | undefined>(row.recurrence_rule, undefined),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    synced: row.synced === 1,
    project: row.project_name
      ? {
          id: row.project_id!,
          name: row.project_name,
          color: row.project_color,
        }
      : undefined,
  };
}

/**
 * Get all tasks with optional advanced filters and sorting
 */
export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  let sql = `
    SELECT
      t.*,
      p.name as project_name,
      p.color as project_color
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Search filter (title or description)
  if (filters?.search) {
    sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  // Priority filter (array)
  if (filters?.priorities && filters.priorities.length > 0) {
    const placeholders = filters.priorities.map(() => '?').join(', ');
    sql += ` AND t.priority IN (${placeholders})`;
    params.push(...filters.priorities);
  }

  // Status filter (array)
  if (filters?.statuses && filters.statuses.length > 0) {
    const placeholders = filters.statuses.map(() => '?').join(', ');
    sql += ` AND t.status IN (${placeholders})`;
    params.push(...filters.statuses);
  }

  // Project filter (array)
  if (filters?.projects && filters.projects.length > 0) {
    const placeholders = filters.projects.map(() => '?').join(', ');
    sql += ` AND t.project_id IN (${placeholders})`;
    params.push(...filters.projects);
  }

  // Tag filter (array - check if ANY tag matches)
  if (filters?.tags && filters.tags.length > 0) {
    const tagConditions = filters.tags.map(() => 't.tags LIKE ?').join(' OR ');
    sql += ` AND (${tagConditions})`;
    filters.tags.forEach(tag => {
      params.push(`%"${tag}"%`);
    });
  }

  // Due date range filters
  if (filters?.dueDateFrom) {
    sql += ' AND t.due_date >= ?';
    params.push(filters.dueDateFrom);
  }

  if (filters?.dueDateTo) {
    sql += ' AND t.due_date <= ?';
    params.push(filters.dueDateTo);
  }

  // Sorting
  if (filters?.sortField) {
    const sortField = filters.sortField;
    const sortDirection = filters.sortDirection || 'asc';

    let orderBy = '';
    switch (sortField) {
      case 'priority':
        // Custom priority order: urgent > high > medium > low
        orderBy = `CASE t.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END`;
        break;
      case 'dueDate':
        orderBy = 't.due_date';
        break;
      case 'createdAt':
        orderBy = 't.created_at';
        break;
      case 'updatedAt':
        orderBy = 't.updated_at';
        break;
      case 'title':
        orderBy = 't.title';
        break;
      case 'status':
        // Custom status order: in_progress > todo > blocked > completed > cancelled
        orderBy = `CASE t.status
          WHEN 'in_progress' THEN 1
          WHEN 'todo' THEN 2
          WHEN 'blocked' THEN 3
          WHEN 'completed' THEN 4
          WHEN 'cancelled' THEN 5
          ELSE 6
        END`;
        break;
      default:
        orderBy = 't.created_at';
    }

    sql += ` ORDER BY ${orderBy} ${sortDirection.toUpperCase()}`;
  } else {
    // Default sorting
    sql += ' ORDER BY t.created_at DESC';
  }

  const rows = await executeQuery<TaskRow>(sql, params);
  return rows.map(rowToTask);
}

/**
 * Get a single task by ID
 */
export async function getTask(id: string): Promise<Task | null> {
  const sql = `
    SELECT
      t.*,
      p.name as project_name,
      p.color as project_color
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `;

  const row = await executeQuerySingle<TaskRow>(sql, [id]);
  return row ? rowToTask(row) : null;
}

/**
 * Get all tasks for a specific project
 */
export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const sql = `
    SELECT
      t.*,
      p.name as project_name,
      p.color as project_color
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.project_id = ?
    ORDER BY
      CASE t.status
        WHEN 'in_progress' THEN 1
        WHEN 'todo' THEN 2
        WHEN 'blocked' THEN 3
        WHEN 'completed' THEN 4
        WHEN 'cancelled' THEN 5
        ELSE 6
      END,
      t.created_at DESC
  `;

  const rows = await executeQuery<TaskRow>(sql, [projectId]);
  return rows.map(rowToTask);
}

/**
 * Create a new task
 */
export async function createTask(data: CreateTaskData): Promise<Task> {
  const id = generateId();
  const now = getCurrentTimestamp();

  const sql = `
    INSERT INTO tasks (
      id, title, description, status, priority, effort, impact,
      due_date, project_id, tags, recurrence_rule, created_at, updated_at, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `;

  const params = [
    id,
    data.title,
    data.description || null,
    data.status || 'todo',
    data.priority || 'medium',
    data.effort || null,
    data.impact || null,
    data.dueDate || null,
    data.projectId || null,
    JSON.stringify(data.tags || []),
    data.recurrence ? JSON.stringify(data.recurrence) : null,
    now,
    now,
  ];

  await executeWrite(sql, params);

  const task = await getTask(id);
  if (!task) {
    throw new Error('Failed to create task');
  }

  return task;
}

/**
 * Update a task
 */
export async function updateTask(id: string, data: UpdateTaskData): Promise<Task> {
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

  if (data.status !== undefined) {
    updates.push('status = ?');
    params.push(data.status);
  }

  if (data.priority !== undefined) {
    updates.push('priority = ?');
    params.push(data.priority);
  }

  if (data.effort !== undefined) {
    updates.push('effort = ?');
    params.push(data.effort || null);
  }

  if (data.impact !== undefined) {
    updates.push('impact = ?');
    params.push(data.impact || null);
  }

  if (data.dueDate !== undefined) {
    updates.push('due_date = ?');
    params.push(data.dueDate || null);
  }

  if (data.completedAt !== undefined) {
    updates.push('completed_at = ?');
    params.push(data.completedAt || null);
  }

  if (data.projectId !== undefined) {
    updates.push('project_id = ?');
    params.push(data.projectId || null);
  }

  if (data.tags !== undefined) {
    updates.push('tags = ?');
    params.push(JSON.stringify(data.tags));
  }

  if (data.recurrence !== undefined) {
    updates.push('recurrence_rule = ?');
    params.push(data.recurrence ? JSON.stringify(data.recurrence) : null);
  }

  updates.push('updated_at = ?');
  params.push(now);

  updates.push('synced = 0');

  params.push(id);

  const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
  await executeWrite(sql, params);

  const task = await getTask(id);
  if (!task) {
    throw new Error('Task not found after update');
  }

  return task;
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  const sql = 'DELETE FROM tasks WHERE id = ?';
  await executeWrite(sql, [id]);
}

/**
 * Mark task as synced
 */
export async function markTaskSynced(id: string): Promise<void> {
  const sql = 'UPDATE tasks SET synced = 1 WHERE id = ?';
  await executeWrite(sql, [id]);
}

/**
 * Get unsynced tasks
 */
export async function getUnsyncedTasks(): Promise<Task[]> {
  const sql = `
    SELECT
      t.*,
      p.name as project_name,
      p.color as project_color
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.synced = 0
    ORDER BY t.updated_at DESC
  `;

  const rows = await executeQuery<TaskRow>(sql);
  return rows.map(rowToTask);
}

/**
 * Get task statistics
 */
export async function getTaskStats(): Promise<{
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  blocked: number;
}> {
  const sql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
    FROM tasks
  `;

  const result = await executeQuerySingle<any>(sql);
  return {
    total: result?.total || 0,
    todo: result?.todo || 0,
    inProgress: result?.in_progress || 0,
    completed: result?.completed || 0,
    blocked: result?.blocked || 0,
  };
}

/**
 * Bulk update multiple tasks
 */
export async function bulkUpdateTasks(
  taskIds: string[],
  data: UpdateTaskData
): Promise<void> {
  if (taskIds.length === 0) {
    return;
  }

  const now = getCurrentTimestamp();
  const updates: string[] = [];
  const params: any[] = [];

  if (data.status !== undefined) {
    updates.push('status = ?');
    params.push(data.status);
  }

  if (data.priority !== undefined) {
    updates.push('priority = ?');
    params.push(data.priority);
  }

  if (data.projectId !== undefined) {
    updates.push('project_id = ?');
    params.push(data.projectId || null);
  }

  if (data.completedAt !== undefined) {
    updates.push('completed_at = ?');
    params.push(data.completedAt || null);
  }

  updates.push('updated_at = ?');
  params.push(now);

  updates.push('synced = 0');

  // Create placeholders for IN clause
  const placeholders = taskIds.map(() => '?').join(', ');
  params.push(...taskIds);

  const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id IN (${placeholders})`;
  await executeWrite(sql, params);
}

/**
 * Bulk delete multiple tasks
 */
export async function bulkDeleteTasks(taskIds: string[]): Promise<void> {
  if (taskIds.length === 0) {
    return;
  }

  const placeholders = taskIds.map(() => '?').join(', ');
  const sql = `DELETE FROM tasks WHERE id IN (${placeholders})`;
  await executeWrite(sql, taskIds);
}

/**
 * Bulk complete multiple tasks
 */
export async function bulkCompleteTasks(taskIds: string[]): Promise<void> {
  if (taskIds.length === 0) {
    return;
  }

  const now = getCurrentTimestamp();
  const placeholders = taskIds.map(() => '?').join(', ');
  const sql = `
    UPDATE tasks
    SET status = 'completed',
        completed_at = ?,
        updated_at = ?,
        synced = 0
    WHERE id IN (${placeholders})
  `;

  await executeWrite(sql, [now, now, ...taskIds]);
}

/**
 * Get count of active (non-completed) tasks for badge display
 */
export async function getActiveTasksCount(): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM tasks
    WHERE status != 'completed' AND status != 'cancelled'
  `;

  const result = await executeQuerySingle<{ count: number }>(sql);
  return result?.count || 0;
}

// ============================================================================
// TASK LATENCY ANALYTICS
// ============================================================================

/**
 * Get average task completion latency grouped by priority
 */
export async function getAverageLatencyByPriority(): Promise<{
  priority: TaskPriority;
  avgDays: number;
  count: number;
}[]> {
  const sql = `
    SELECT
      priority,
      AVG((julianday(completed_at) - julianday(created_at))) as avgDays,
      COUNT(*) as count
    FROM tasks
    WHERE status = 'completed'
      AND completed_at IS NOT NULL
      AND created_at IS NOT NULL
    GROUP BY priority
    ORDER BY avgDays DESC
  `;

  const rows = await executeQuery<{
    priority: TaskPriority;
    avgDays: number;
    count: number;
  }>(sql);

  return rows.map(row => ({
    priority: row.priority || 'medium',
    avgDays: Math.round(row.avgDays * 10) / 10,
    count: row.count,
  }));
}

/**
 * Get average task completion latency grouped by project
 */
export async function getAverageLatencyByProject(): Promise<{
  projectId: string;
  projectName: string;
  avgDays: number;
  count: number;
}[]> {
  const sql = `
    SELECT
      t.project_id as projectId,
      p.name as projectName,
      AVG((julianday(t.completed_at) - julianday(t.created_at))) as avgDays,
      COUNT(*) as count
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.status = 'completed'
      AND t.completed_at IS NOT NULL
      AND t.created_at IS NOT NULL
      AND t.project_id IS NOT NULL
    GROUP BY t.project_id, p.name
    ORDER BY avgDays DESC
  `;

  const rows = await executeQuery<{
    projectId: string;
    projectName: string;
    avgDays: number;
    count: number;
  }>(sql);

  return rows.map(row => ({
    projectId: row.projectId,
    projectName: row.projectName,
    avgDays: Math.round(row.avgDays * 10) / 10,
    count: row.count,
  }));
}

/**
 * Get all stale tasks (incomplete tasks older than threshold)
 */
export async function getStaleTasks(thresholdDays: number = 7): Promise<Task[]> {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

  const sql = `
    SELECT
      t.*,
      p.name as project_name,
      p.color as project_color
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.status != 'completed'
      AND t.status != 'cancelled'
      AND t.created_at < ?
    ORDER BY t.created_at ASC
  `;

  const rows = await executeQuery<TaskRow>(sql, [thresholdDate.toISOString()]);
  return rows.map(rowToTask);
}

/**
 * Get task completion latency trend over specified days
 */
export async function getLatencyTrend(days: number = 30): Promise<{
  date: string;
  avgDays: number;
  count: number;
}[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const sql = `
    SELECT
      DATE(completed_at) as date,
      AVG((julianday(completed_at) - julianday(created_at))) as avgDays,
      COUNT(*) as count
    FROM tasks
    WHERE status = 'completed'
      AND completed_at IS NOT NULL
      AND created_at IS NOT NULL
      AND completed_at >= ?
    GROUP BY DATE(completed_at)
    ORDER BY date ASC
  `;

  const rows = await executeQuery<{
    date: string;
    avgDays: number;
    count: number;
  }>(sql, [startDate.toISOString()]);

  return rows.map(row => ({
    date: row.date,
    avgDays: Math.round(row.avgDays * 10) / 10,
    count: row.count,
  }));
}

/**
 * Get comprehensive task latency statistics
 */
export async function getCompletionLatencyStats(): Promise<{
  overall: number;
  staleCount: number;
  byPriority: {
    priority: TaskPriority;
    avgDays: number;
    count: number;
  }[];
  byProject: {
    projectId: string;
    projectName: string;
    avgDays: number;
    count: number;
  }[];
}> {
  // Overall average latency
  const overallSql = `
    SELECT AVG((julianday(completed_at) - julianday(created_at))) as avgDays
    FROM tasks
    WHERE status = 'completed'
      AND completed_at IS NOT NULL
      AND created_at IS NOT NULL
  `;
  const overallResult = await executeQuerySingle<{ avgDays: number }>(overallSql);

  // Stale tasks count
  const staleTasks = await getStaleTasks(7);

  // Get stats by priority and project in parallel
  const [byPriority, byProject] = await Promise.all([
    getAverageLatencyByPriority(),
    getAverageLatencyByProject(),
  ]);

  return {
    overall: Math.round((overallResult?.avgDays || 0) * 10) / 10,
    staleCount: staleTasks.length,
    byPriority,
    byProject,
  };
}

/**
 * Get latency trend data for sparkline (last 7 days)
 */
export async function getLatencyTrendSparkline(): Promise<number[]> {
  const trend = await getLatencyTrend(7);

  // If no data, return empty array
  if (trend.length === 0) {
    return [];
  }

  // Fill in missing days with 0 and return avgDays values
  const last7Days: number[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayData = trend.find(t => t.date === dateStr);
    last7Days.push(dayData?.avgDays || 0);
  }

  return last7Days;
}

export default {
  getTasks,
  getTask,
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
  markTaskSynced,
  getUnsyncedTasks,
  getTaskStats,
  bulkUpdateTasks,
  bulkDeleteTasks,
  bulkCompleteTasks,
  getActiveTasksCount,
  getAverageLatencyByPriority,
  getAverageLatencyByProject,
  getStaleTasks,
  getLatencyTrend,
  getCompletionLatencyStats,
  getLatencyTrendSparkline,
};
