/**
 * Repository Interfaces
 * Defines contracts for data access abstraction
 *
 * IMPROVEMENT: Implements Repository Pattern for:
 * - Decoupling screens from database implementation
 * - Easier unit testing with mock implementations
 * - Future flexibility to swap data sources (API, different DB, etc.)
 */

import type { TaskFilters } from '../store/taskFilterStore';
import type { RecurrenceRule } from '../types';

// ============================================================================
// Task Repository
// ============================================================================

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
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  project?: {
    id: string;
    name: string;
    color?: string;
  };
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

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  blocked: number;
}

export interface ITaskRepository {
  // CRUD
  getAll(filters?: TaskFilters): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  getByProject(projectId: string): Promise<Task[]>;
  create(data: CreateTaskData): Promise<Task>;
  update(id: string, data: UpdateTaskData): Promise<Task>;
  delete(id: string): Promise<void>;

  // Bulk operations
  bulkUpdate(ids: string[], data: UpdateTaskData): Promise<void>;
  bulkDelete(ids: string[]): Promise<void>;
  bulkComplete(ids: string[]): Promise<void>;
  reorder(ids: string[]): Promise<void>;

  // Stats & queries
  getStats(): Promise<TaskStats>;
  getActiveCount(): Promise<number>;
  getStale(thresholdDays?: number): Promise<Task[]>;

  // Sync
  getUnsynced(): Promise<Task[]>;
  markSynced(id: string): Promise<void>;
}

// ============================================================================
// Habit Repository
// ============================================================================

export type HabitCadence = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  cadence: HabitCadence;
  targetCount: number;
  color?: string;
  icon?: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  reminderTime?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  count: number;
  notes?: string;
  createdAt: string;
}

export interface CreateHabitData {
  title: string;
  description?: string;
  cadence?: HabitCadence;
  targetCount?: number;
  color?: string;
  icon?: string;
  reminderTime?: string;
}

export interface UpdateHabitData extends Partial<CreateHabitData> {
  isArchived?: boolean;
}

export interface IHabitRepository {
  // CRUD
  getAll(includeArchived?: boolean): Promise<Habit[]>;
  getById(id: string): Promise<Habit | null>;
  create(data: CreateHabitData): Promise<Habit>;
  update(id: string, data: UpdateHabitData): Promise<Habit>;
  delete(id: string): Promise<void>;

  // Logging
  logCompletion(habitId: string, date: string, count?: number, notes?: string): Promise<HabitLog>;
  removeLog(habitId: string, date: string): Promise<void>;
  getLogsForDate(date: string): Promise<HabitLog[]>;
  getLogsForHabit(habitId: string, startDate: string, endDate: string): Promise<HabitLog[]>;

  // Stats
  getDueToday(): Promise<Habit[]>;
  getCompletedToday(): Promise<string[]>;
  getStreakData(habitId: string): Promise<{ current: number; longest: number }>;
}

// ============================================================================
// Finance Repository
// ============================================================================

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
  notes?: string;
  isRecurring: boolean;
  recurringFrequency?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface FinanceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isCustom: boolean;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  alertThreshold: number;
  currency: string;
}

export interface CreateTransactionData {
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
  notes?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
}

export interface IFinanceRepository {
  // Transactions
  getTransactions(startDate?: string, endDate?: string): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | null>;
  createTransaction(data: CreateTransactionData): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<CreateTransactionData>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  // Categories
  getCategories(type?: TransactionType): Promise<FinanceCategory[]>;
  createCategory(data: Omit<FinanceCategory, 'id'>): Promise<FinanceCategory>;
  deleteCategory(id: string): Promise<void>;

  // Budgets
  getBudgets(): Promise<Budget[]>;
  getBudgetByCategory(category: string): Promise<Budget | null>;
  createBudget(data: Omit<Budget, 'id' | 'spent'>): Promise<Budget>;
  updateBudget(id: string, data: Partial<Budget>): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;

  // Analytics
  getSummary(startDate: string, endDate: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    byCategory: Record<string, number>;
  }>;
}

// ============================================================================
// Calendar Repository
// ============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  location?: string;
  color?: string;
  reminderMinutes?: number;
  notificationId?: string;
  recurrence?: RecurrenceRule;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface CreateEventData {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isAllDay?: boolean;
  location?: string;
  color?: string;
  reminderMinutes?: number;
  recurrence?: RecurrenceRule;
}

export interface ICalendarRepository {
  // CRUD
  getEvents(startDate: string, endDate: string): Promise<CalendarEvent[]>;
  getEventById(id: string): Promise<CalendarEvent | null>;
  getEventsForDay(date: string): Promise<CalendarEvent[]>;
  create(data: CreateEventData): Promise<CalendarEvent>;
  update(id: string, data: Partial<CreateEventData>): Promise<CalendarEvent>;
  delete(id: string): Promise<void>;

  // Upcoming
  getUpcoming(limit?: number): Promise<CalendarEvent[]>;
  getWithReminders(): Promise<CalendarEvent[]>;
}

// ============================================================================
// Project Repository
// ============================================================================

export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived';

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  status: ProjectStatus;
  dueDate?: string;
  taskCount: number;
  completedTaskCount: number;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  status?: ProjectStatus;
  dueDate?: string;
}

export interface IProjectRepository {
  // CRUD
  getAll(includeArchived?: boolean): Promise<Project[]>;
  getById(id: string): Promise<Project | null>;
  create(data: CreateProjectData): Promise<Project>;
  update(id: string, data: Partial<CreateProjectData>): Promise<Project>;
  delete(id: string): Promise<void>;

  // With stats
  getAllWithStats(includeArchived?: boolean): Promise<Project[]>;
}

// ============================================================================
// Repository Factory
// ============================================================================

export interface Repositories {
  tasks: ITaskRepository;
  habits: IHabitRepository;
  finance: IFinanceRepository;
  calendar: ICalendarRepository;
  projects: IProjectRepository;
}
