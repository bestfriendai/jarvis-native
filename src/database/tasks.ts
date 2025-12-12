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
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  completedAt?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  tag?: string;
}

/**
 * Convert database row to Task object
 */
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
    tags: row.tags ? JSON.parse(row.tags) : [],
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
 * Get all tasks with optional filters
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

  if (filters?.status) {
    sql += ' AND t.status = ?';
    params.push(filters.status);
  }

  if (filters?.priority) {
    sql += ' AND t.priority = ?';
    params.push(filters.priority);
  }

  if (filters?.projectId) {
    sql += ' AND t.project_id = ?';
    params.push(filters.projectId);
  }

  if (filters?.tag) {
    sql += ' AND t.tags LIKE ?';
    params.push(`%"${filters.tag}"%`);
  }

  sql += ' ORDER BY t.created_at DESC';

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
 * Create a new task
 */
export async function createTask(data: CreateTaskData): Promise<Task> {
  const id = generateId();
  const now = getCurrentTimestamp();

  const sql = `
    INSERT INTO tasks (
      id, title, description, status, priority, effort, impact,
      due_date, project_id, tags, created_at, updated_at, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
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

export default {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  markTaskSynced,
  getUnsyncedTasks,
  getTaskStats,
};
