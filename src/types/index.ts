/**
 * Core TypeScript Types
 * Shared types across the application
 */

// User & Authentication
export interface User {
  id: string;
  email: string;
  name?: string;
  timezone: string;
  currency: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name?: string;
  timezone?: string;
  currency?: string;
}

// Tasks & Projects
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  projectId?: string;
  recurrence?: RecurrenceRule;
  createdAt: string;
  updatedAt: string;
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  targetEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Habits
export enum HabitCadence {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  cadence: HabitCadence;
  targetCount: number;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  notes?: string;
}

// AI Chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// Recurrence
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurrenceEndType = 'never' | 'until' | 'count';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // every N days/weeks/months/years
  endType: RecurrenceEndType;
  endDate?: string; // ISO date string, for 'until' endType
  count?: number; // number of occurrences, for 'count' endType
  weekdays?: number[]; // for weekly: 0=Sun, 1=Mon, ... 6=Sat
}

// Calendar
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  isAllDay: boolean;
  recurrence?: RecurrenceRule;
}

// Finance
export interface FinanceSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  value: number;
  currency: string;
  updatedAt: string;
}

export interface Liability {
  id: string;
  name: string;
  type: string;
  amount: number;
  interestRate?: number;
  currency: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Search: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  AIChat: undefined;
  Tasks: undefined;
  Projects: undefined;
  Habits: undefined;
  Focus: undefined;
  Calendar: undefined;
  Finance: undefined;
  Settings: undefined;
};

export type ProjectsStackParamList = {
  ProjectsList: undefined;
  ProjectDetail: { projectId: string };
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  StorageOverview: undefined;
  DataManagement: undefined;
  CategoryManagement: undefined;
};
