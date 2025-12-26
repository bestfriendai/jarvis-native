/**
 * Repositories Index
 * Central export point for all repository implementations
 *
 * Usage in screens:
 *   import { useTaskRepository } from '../repositories';
 *   const taskRepo = useTaskRepository();
 *   const tasks = await taskRepo.getAll();
 */

import React, { createContext, useContext, useMemo } from 'react';
import type { ITaskRepository, IHabitRepository, Repositories } from './interfaces';
import { SQLiteTaskRepository, taskRepository } from './TaskRepository';
import { SQLiteHabitRepository, habitRepository } from './HabitRepository';

// Re-export interfaces
export * from './interfaces';

// Re-export implementations
export { SQLiteTaskRepository, taskRepository } from './TaskRepository';
export { SQLiteHabitRepository, habitRepository } from './HabitRepository';

// ============================================================================
// Repository Context
// ============================================================================

const RepositoryContext = createContext<Repositories | null>(null);

interface RepositoryProviderProps {
  children: React.ReactNode;
  repositories?: Partial<Repositories>;
}

/**
 * Repository Provider
 * Wraps the app to provide repository instances via context
 * Allows dependency injection for testing
 */
export function RepositoryProvider({
  children,
  repositories: customRepositories,
}: RepositoryProviderProps): React.JSX.Element {
  const repositories = useMemo<Repositories>(
    () => ({
      tasks: customRepositories?.tasks || new SQLiteTaskRepository(),
      habits: customRepositories?.habits || new SQLiteHabitRepository(),
      // Future repositories will be added here
      finance: customRepositories?.finance || (null as any),
      calendar: customRepositories?.calendar || (null as any),
      projects: customRepositories?.projects || (null as any),
    }),
    [customRepositories]
  );

  return React.createElement(
    RepositoryContext.Provider,
    { value: repositories },
    children
  );
}

/**
 * Hook to access all repositories
 */
export function useRepositories(): Repositories {
  const context = useContext(RepositoryContext);
  if (!context) {
    // Fallback to default implementations if not in provider
    return {
      tasks: new SQLiteTaskRepository(),
      habits: new SQLiteHabitRepository(),
      finance: null as any,
      calendar: null as any,
      projects: null as any,
    };
  }
  return context;
}

/**
 * Hook to access task repository
 */
export function useTaskRepository(): ITaskRepository {
  const repos = useRepositories();
  return repos.tasks;
}

/**
 * Hook to access habit repository
 */
export function useHabitRepository(): IHabitRepository {
  const repos = useRepositories();
  return repos.habits;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create repositories with custom implementations
 * Useful for testing or swapping implementations
 */
export function createRepositories(
  overrides?: Partial<Repositories>
): Repositories {
  return {
    tasks: overrides?.tasks || new SQLiteTaskRepository(),
    habits: overrides?.habits || new SQLiteHabitRepository(),
    finance: overrides?.finance || (null as any),
    calendar: overrides?.calendar || (null as any),
    projects: overrides?.projects || (null as any),
  };
}

export default {
  RepositoryProvider,
  useRepositories,
  useTaskRepository,
  useHabitRepository,
  createRepositories,
};
