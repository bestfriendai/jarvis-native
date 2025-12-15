/**
 * Task Filtering Utilities
 * Client-side filtering logic for tasks
 */

import type { TaskPriority, TaskStatus } from '../store/taskFilterStore';

export interface FilterableTask {
  id: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  status: TaskStatus;
  projectId?: string;
  tags: string[];
  dueDate?: string;
}

export interface TaskFilterOptions {
  searchQuery?: string;
  priority?: TaskPriority | 'all';
  priorities?: TaskPriority[];
  statuses?: TaskStatus[];
  projectId?: string | null;
  projects?: string[];
  tags?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
}

/**
 * Apply filters to a list of tasks
 * This is for client-side filtering when needed (complementary to DB filtering)
 */
export function applyFilters<T extends FilterableTask>(
  tasks: T[],
  filters: TaskFilterOptions
): T[] {
  let filtered = tasks;

  // Search filter (title or description)
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
    );
  }

  // Single priority filter (legacy support)
  if (filters.priority && filters.priority !== 'all') {
    filtered = filtered.filter((task) => task.priority === filters.priority);
  }

  // Multiple priorities filter
  if (filters.priorities && filters.priorities.length > 0) {
    filtered = filtered.filter(
      (task) => task.priority && filters.priorities!.includes(task.priority)
    );
  }

  // Multiple statuses filter
  if (filters.statuses && filters.statuses.length > 0) {
    filtered = filtered.filter((task) => filters.statuses!.includes(task.status));
  }

  // Single project filter (legacy support)
  if (filters.projectId !== undefined) {
    if (filters.projectId === null) {
      // "No Project" filter
      filtered = filtered.filter((task) => !task.projectId);
    } else {
      filtered = filtered.filter((task) => task.projectId === filters.projectId);
    }
  }

  // Multiple projects filter
  if (filters.projects && filters.projects.length > 0) {
    filtered = filtered.filter(
      (task) => task.projectId && filters.projects!.includes(task.projectId)
    );
  }

  // Tags filter (OR logic - task must have at least one of the selected tags)
  // Note: This uses OR logic for better UX, as AND logic can be too restrictive
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((task) => {
      const taskTags = task.tags || [];
      return filters.tags!.some((tag) => taskTags.includes(tag));
    });
  }

  // Due date range filters
  if (filters.dueDateFrom) {
    const fromDate = new Date(filters.dueDateFrom);
    fromDate.setHours(0, 0, 0, 0);
    filtered = filtered.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate >= fromDate;
    });
  }

  if (filters.dueDateTo) {
    const toDate = new Date(filters.dueDateTo);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate <= toDate;
    });
  }

  return filtered;
}

/**
 * Check if a task matches search query
 */
export function matchesSearch(
  task: FilterableTask,
  searchQuery: string
): boolean {
  if (!searchQuery.trim()) return true;

  const query = searchQuery.toLowerCase().trim();
  return (
    task.title.toLowerCase().includes(query) ||
    task.description?.toLowerCase().includes(query) ||
    false
  );
}

/**
 * Check if a task has a specific tag
 */
export function hasTag(task: FilterableTask, tag: string): boolean {
  return task.tags.includes(tag);
}

/**
 * Check if a task has any of the specified tags
 */
export function hasAnyTag(task: FilterableTask, tags: string[]): boolean {
  if (tags.length === 0) return true;
  return tags.some((tag) => task.tags.includes(tag));
}

/**
 * Check if a task has all of the specified tags
 */
export function hasAllTags(task: FilterableTask, tags: string[]): boolean {
  if (tags.length === 0) return true;
  return tags.every((tag) => task.tags.includes(tag));
}

/**
 * Get unique tags from a list of tasks
 */
export function getUniqueTags<T extends FilterableTask>(tasks: T[]): string[] {
  const tagsSet = new Set<string>();
  tasks.forEach((task) => {
    task.tags.forEach((tag) => tagsSet.add(tag));
  });
  return Array.from(tagsSet).sort();
}

/**
 * Get unique projects from a list of tasks
 */
export function getUniqueProjects<
  T extends FilterableTask & { project?: { id: string; name: string; color?: string } }
>(tasks: T[]): Array<{ id: string; name: string; color?: string }> {
  const projectsMap = new Map<string, { id: string; name: string; color?: string }>();
  tasks.forEach((task) => {
    if (task.project && !projectsMap.has(task.project.id)) {
      projectsMap.set(task.project.id, task.project);
    }
  });
  return Array.from(projectsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export default {
  applyFilters,
  matchesSearch,
  hasTag,
  hasAnyTag,
  hasAllTags,
  getUniqueTags,
  getUniqueProjects,
};
