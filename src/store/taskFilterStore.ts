/**
 * Task Filter Store (Zustand)
 * Manages task filtering and sorting preferences with AsyncStorage persistence
 *
 * IMPROVEMENT: Converted from custom event emitter to Zustand for consistency
 * with other stores (authStore, themeStore)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SortField = 'priority' | 'dueDate' | 'createdAt' | 'updatedAt' | 'title' | 'status' | 'sortOrder' | 'order';
export type SortDirection = 'asc' | 'desc';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskFilters {
  search?: string;
  priorities?: TaskPriority[];
  statuses?: TaskStatus[];
  projects?: string[];
  tags?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  sortField: SortField;
  sortDirection: SortDirection;
}

interface TaskFilterState {
  // State
  filters: TaskFilters;
  isLoaded: boolean;

  // Actions
  updateFilters: (updates: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  resetFilters: () => void;
  setSearch: (search: string) => void;
  setPriorities: (priorities: TaskPriority[]) => void;
  setStatuses: (statuses: TaskStatus[]) => void;
  setProjects: (projects: string[]) => void;
  setTags: (tags: string[]) => void;
  setDateRange: (from?: string, to?: string) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleSortDirection: () => void;
}

const defaultFilters: TaskFilters = {
  sortField: 'dueDate',
  sortDirection: 'asc',
};

export const useTaskFilterStore = create<TaskFilterState>()(
  persist(
    (set) => ({
      // Initial state
      filters: { ...defaultFilters },
      isLoaded: false,

      // Update multiple filter fields at once
      updateFilters: (updates) =>
        set((state) => ({
          filters: { ...state.filters, ...updates },
        })),

      // Clear all filters except sort settings
      clearFilters: () =>
        set((state) => ({
          filters: {
            sortField: state.filters.sortField,
            sortDirection: state.filters.sortDirection,
          },
        })),

      // Reset to default filters
      resetFilters: () =>
        set({
          filters: { ...defaultFilters },
        }),

      // Individual filter setters for convenience
      setSearch: (search) =>
        set((state) => ({
          filters: { ...state.filters, search: search || undefined },
        })),

      setPriorities: (priorities) =>
        set((state) => ({
          filters: { ...state.filters, priorities: priorities.length ? priorities : undefined },
        })),

      setStatuses: (statuses) =>
        set((state) => ({
          filters: { ...state.filters, statuses: statuses.length ? statuses : undefined },
        })),

      setProjects: (projects) =>
        set((state) => ({
          filters: { ...state.filters, projects: projects.length ? projects : undefined },
        })),

      setTags: (tags) =>
        set((state) => ({
          filters: { ...state.filters, tags: tags.length ? tags : undefined },
        })),

      setDateRange: (from, to) =>
        set((state) => ({
          filters: {
            ...state.filters,
            dueDateFrom: from || undefined,
            dueDateTo: to || undefined,
          },
        })),

      setSortField: (field) =>
        set((state) => ({
          filters: { ...state.filters, sortField: field },
        })),

      setSortDirection: (direction) =>
        set((state) => ({
          filters: { ...state.filters, sortDirection: direction },
        })),

      toggleSortDirection: () =>
        set((state) => ({
          filters: {
            ...state.filters,
            sortDirection: state.filters.sortDirection === 'asc' ? 'desc' : 'asc',
          },
        })),
    }),
    {
      name: '@jarvis:taskFilters',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoaded = true;
        }
      },
    }
  )
);

// ============================================================================
// Helper Functions (for backward compatibility and utility)
// ============================================================================

/**
 * Check if any filters are active (excluding sort)
 */
export function hasActiveFilters(filters: TaskFilters): boolean {
  return !!(
    filters.search ||
    filters.priorities?.length ||
    filters.statuses?.length ||
    filters.projects?.length ||
    filters.tags?.length ||
    filters.dueDateFrom ||
    filters.dueDateTo
  );
}

/**
 * Count active filters
 */
export function countActiveFilters(filters: TaskFilters): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.priorities?.length) count++;
  if (filters.statuses?.length) count++;
  if (filters.projects?.length) count++;
  if (filters.tags?.length) count++;
  if (filters.dueDateFrom || filters.dueDateTo) count++;
  return count;
}

// ============================================================================
// Backward Compatibility Layer
// These functions maintain the old API for gradual migration
// ============================================================================

/**
 * @deprecated Use useTaskFilterStore().filters instead
 */
export function getFilters(): TaskFilters {
  return useTaskFilterStore.getState().filters;
}

/**
 * @deprecated Use useTaskFilterStore().updateFilters() instead
 */
export async function updateFilters(updates: Partial<TaskFilters>): Promise<TaskFilters> {
  useTaskFilterStore.getState().updateFilters(updates);
  return useTaskFilterStore.getState().filters;
}

/**
 * @deprecated Use useTaskFilterStore().clearFilters() instead
 */
export async function clearFilters(): Promise<TaskFilters> {
  useTaskFilterStore.getState().clearFilters();
  return useTaskFilterStore.getState().filters;
}

/**
 * @deprecated Use useTaskFilterStore().resetFilters() instead
 */
export async function resetFilters(): Promise<TaskFilters> {
  useTaskFilterStore.getState().resetFilters();
  return useTaskFilterStore.getState().filters;
}

/**
 * @deprecated Zustand handles persistence automatically
 */
export async function loadFilters(): Promise<TaskFilters> {
  // With Zustand persist middleware, filters are loaded automatically
  // This function is kept for backward compatibility
  return useTaskFilterStore.getState().filters;
}

/**
 * @deprecated Use useTaskFilterStore.subscribe() instead
 */
export function subscribe(listener: (filters: TaskFilters) => void): () => void {
  return useTaskFilterStore.subscribe((state) => listener(state.filters));
}

export default {
  useTaskFilterStore,
  getFilters,
  updateFilters,
  clearFilters,
  resetFilters,
  loadFilters,
  subscribe,
  hasActiveFilters,
  countActiveFilters,
};
