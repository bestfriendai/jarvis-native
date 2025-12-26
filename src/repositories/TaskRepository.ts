/**
 * Task Repository Implementation
 * SQLite implementation of ITaskRepository interface
 *
 * IMPROVEMENT: Implements Repository Pattern to decouple screens from database
 */

import type {
  ITaskRepository,
  Task,
  CreateTaskData,
  UpdateTaskData,
  TaskStats,
} from './interfaces';
import type { TaskFilters } from '../store/taskFilterStore';
import * as tasksDB from '../database/tasks';

/**
 * SQLite implementation of Task Repository
 */
export class SQLiteTaskRepository implements ITaskRepository {
  async getAll(filters?: TaskFilters): Promise<Task[]> {
    return tasksDB.getTasks(filters);
  }

  async getById(id: string): Promise<Task | null> {
    return tasksDB.getTask(id);
  }

  async getByProject(projectId: string): Promise<Task[]> {
    return tasksDB.getTasksByProject(projectId);
  }

  async create(data: CreateTaskData): Promise<Task> {
    return tasksDB.createTask(data);
  }

  async update(id: string, data: UpdateTaskData): Promise<Task> {
    return tasksDB.updateTask(id, data);
  }

  async delete(id: string): Promise<void> {
    return tasksDB.deleteTask(id);
  }

  async bulkUpdate(ids: string[], data: UpdateTaskData): Promise<void> {
    return tasksDB.bulkUpdateTasks(ids, data);
  }

  async bulkDelete(ids: string[]): Promise<void> {
    return tasksDB.bulkDeleteTasks(ids);
  }

  async bulkComplete(ids: string[]): Promise<void> {
    return tasksDB.bulkCompleteTasks(ids);
  }

  async reorder(ids: string[]): Promise<void> {
    return tasksDB.reorderTasks(ids);
  }

  async getStats(): Promise<TaskStats> {
    return tasksDB.getTaskStats();
  }

  async getActiveCount(): Promise<number> {
    return tasksDB.getActiveTasksCount();
  }

  async getStale(thresholdDays: number = 7): Promise<Task[]> {
    return tasksDB.getStaleTasks(thresholdDays);
  }

  async getUnsynced(): Promise<Task[]> {
    return tasksDB.getUnsyncedTasks();
  }

  async markSynced(id: string): Promise<void> {
    return tasksDB.markTaskSynced(id);
  }
}

/**
 * Mock implementation for testing
 */
export class MockTaskRepository implements ITaskRepository {
  private tasks: Task[] = [];
  private idCounter = 1;

  async getAll(filters?: TaskFilters): Promise<Task[]> {
    let result = [...this.tasks];

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search)
      );
    }

    if (filters?.statuses?.length) {
      result = result.filter((t) => filters.statuses!.includes(t.status));
    }

    if (filters?.priorities?.length) {
      result = result.filter((t) => filters.priorities!.includes(t.priority));
    }

    return result;
  }

  async getById(id: string): Promise<Task | null> {
    return this.tasks.find((t) => t.id === id) || null;
  }

  async getByProject(projectId: string): Promise<Task[]> {
    return this.tasks.filter((t) => t.projectId === projectId);
  }

  async create(data: CreateTaskData): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: `mock-${this.idCounter++}`,
      title: data.title,
      description: data.description,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      effort: data.effort,
      impact: data.impact,
      dueDate: data.dueDate,
      projectId: data.projectId,
      tags: data.tags || [],
      recurrence: data.recurrence,
      createdAt: now,
      updatedAt: now,
      synced: false,
    };
    this.tasks.push(task);
    return task;
  }

  async update(id: string, data: UpdateTaskData): Promise<Task> {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }

    this.tasks[index] = {
      ...this.tasks[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return this.tasks[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.tasks.splice(index, 1);
    }
  }

  async bulkUpdate(ids: string[], data: UpdateTaskData): Promise<void> {
    for (const id of ids) {
      await this.update(id, data);
    }
  }

  async bulkDelete(ids: string[]): Promise<void> {
    this.tasks = this.tasks.filter((t) => !ids.includes(t.id));
  }

  async bulkComplete(ids: string[]): Promise<void> {
    const now = new Date().toISOString();
    for (const id of ids) {
      await this.update(id, { status: 'completed', completedAt: now });
    }
  }

  async reorder(ids: string[]): Promise<void> {
    ids.forEach((id, index) => {
      const task = this.tasks.find((t) => t.id === id);
      if (task) {
        task.sortOrder = index;
      }
    });
  }

  async getStats(): Promise<TaskStats> {
    return {
      total: this.tasks.length,
      todo: this.tasks.filter((t) => t.status === 'todo').length,
      inProgress: this.tasks.filter((t) => t.status === 'in_progress').length,
      completed: this.tasks.filter((t) => t.status === 'completed').length,
      blocked: this.tasks.filter((t) => t.status === 'blocked').length,
    };
  }

  async getActiveCount(): Promise<number> {
    return this.tasks.filter(
      (t) => t.status !== 'completed' && t.status !== 'cancelled'
    ).length;
  }

  async getStale(thresholdDays: number = 7): Promise<Task[]> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - thresholdDays);
    return this.tasks.filter(
      (t) =>
        t.status !== 'completed' &&
        t.status !== 'cancelled' &&
        new Date(t.createdAt) < threshold
    );
  }

  async getUnsynced(): Promise<Task[]> {
    return this.tasks.filter((t) => !t.synced);
  }

  async markSynced(id: string): Promise<void> {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.synced = true;
    }
  }

  // Test helpers
  reset(): void {
    this.tasks = [];
    this.idCounter = 1;
  }

  seed(tasks: Task[]): void {
    this.tasks = [...tasks];
  }
}

// Default export - singleton instance
export const taskRepository = new SQLiteTaskRepository();
