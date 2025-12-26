/**
 * Habit Repository Implementation
 * SQLite implementation of IHabitRepository interface
 *
 * IMPROVEMENT: Implements Repository Pattern to decouple screens from database
 */

import type {
  IHabitRepository,
  Habit,
  HabitLog,
  CreateHabitData,
  UpdateHabitData,
} from './interfaces';
import * as habitsDB from '../database/habits';

/**
 * SQLite implementation of Habit Repository
 */
export class SQLiteHabitRepository implements IHabitRepository {
  async getAll(includeArchived?: boolean): Promise<Habit[]> {
    const habits = await habitsDB.getHabits();
    // Map database habit to repository interface
    return habits.map((h) => ({
      id: h.id,
      title: h.name,
      description: h.description,
      cadence: h.cadence,
      targetCount: h.targetCount,
      currentStreak: h.currentStreak,
      longestStreak: h.longestStreak,
      totalCompletions: 0, // Would need additional query
      reminderTime: h.reminderTime,
      isArchived: false, // Not supported in current schema
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
      synced: h.synced,
    }));
  }

  async getById(id: string): Promise<Habit | null> {
    const habit = await habitsDB.getHabit(id);
    if (!habit) return null;

    return {
      id: habit.id,
      title: habit.name,
      description: habit.description,
      cadence: habit.cadence,
      targetCount: habit.targetCount,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      totalCompletions: 0,
      reminderTime: habit.reminderTime,
      isArchived: false,
      createdAt: habit.createdAt,
      updatedAt: habit.updatedAt,
      synced: habit.synced,
    };
  }

  async create(data: CreateHabitData): Promise<Habit> {
    const habit = await habitsDB.createHabit({
      name: data.title,
      description: data.description,
      cadence: data.cadence,
      targetCount: data.targetCount,
      reminderTime: data.reminderTime,
    });

    return {
      id: habit.id,
      title: habit.name,
      description: habit.description,
      cadence: habit.cadence,
      targetCount: habit.targetCount,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      totalCompletions: 0,
      reminderTime: habit.reminderTime,
      isArchived: false,
      createdAt: habit.createdAt,
      updatedAt: habit.updatedAt,
      synced: habit.synced,
    };
  }

  async update(id: string, data: UpdateHabitData): Promise<Habit> {
    const habit = await habitsDB.updateHabit(id, {
      name: data.title,
      description: data.description,
      cadence: data.cadence,
      targetCount: data.targetCount,
      reminderTime: data.reminderTime,
    });

    return {
      id: habit.id,
      title: habit.name,
      description: habit.description,
      cadence: habit.cadence,
      targetCount: habit.targetCount,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      totalCompletions: 0,
      reminderTime: habit.reminderTime,
      isArchived: false,
      createdAt: habit.createdAt,
      updatedAt: habit.updatedAt,
      synced: habit.synced,
    };
  }

  async delete(id: string): Promise<void> {
    await habitsDB.deleteHabit(id);
  }

  async logCompletion(
    habitId: string,
    date: string,
    count?: number,
    notes?: string
  ): Promise<HabitLog> {
    const log = await habitsDB.logHabitCompletion(habitId, date, true, notes);
    return {
      id: log.id,
      habitId: log.habitId,
      date: log.date,
      count: count || 1,
      notes: log.notes,
      createdAt: log.createdAt,
    };
  }

  async removeLog(habitId: string, date: string): Promise<void> {
    await habitsDB.logHabitCompletion(habitId, date, false);
  }

  async getLogsForDate(date: string): Promise<HabitLog[]> {
    const habits = await habitsDB.getHabits();
    const logs: HabitLog[] = [];

    for (const habit of habits) {
      const log = await habitsDB.getHabitLog(habit.id, date);
      if (log && log.completed) {
        logs.push({
          id: log.id,
          habitId: log.habitId,
          date: log.date,
          count: 1,
          notes: log.notes,
          createdAt: log.createdAt,
        });
      }
    }

    return logs;
  }

  async getLogsForHabit(
    habitId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitLog[]> {
    const logs = await habitsDB.getHabitLogs(habitId, startDate, endDate);
    return logs
      .filter((log) => log.completed)
      .map((log) => ({
        id: log.id,
        habitId: log.habitId,
        date: log.date,
        count: 1,
        notes: log.notes,
        createdAt: log.createdAt,
      }));
  }

  async getDueToday(): Promise<Habit[]> {
    return this.getAll();
  }

  async getCompletedToday(): Promise<string[]> {
    const today = new Date().toISOString().split('T')[0];
    const logs = await this.getLogsForDate(today);
    return logs.map((log) => log.habitId);
  }

  async getStreakData(habitId: string): Promise<{ current: number; longest: number }> {
    const habit = await habitsDB.getHabit(habitId);
    if (!habit) {
      return { current: 0, longest: 0 };
    }
    return {
      current: habit.currentStreak,
      longest: habit.longestStreak,
    };
  }
}

/**
 * Mock implementation for testing
 */
export class MockHabitRepository implements IHabitRepository {
  private habits: Habit[] = [];
  private logs: HabitLog[] = [];
  private idCounter = 1;

  async getAll(): Promise<Habit[]> {
    return [...this.habits];
  }

  async getById(id: string): Promise<Habit | null> {
    return this.habits.find((h) => h.id === id) || null;
  }

  async create(data: CreateHabitData): Promise<Habit> {
    const now = new Date().toISOString();
    const habit: Habit = {
      id: `mock-habit-${this.idCounter++}`,
      title: data.title,
      description: data.description,
      cadence: data.cadence || 'daily',
      targetCount: data.targetCount || 1,
      color: data.color,
      icon: data.icon,
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      reminderTime: data.reminderTime,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      synced: false,
    };
    this.habits.push(habit);
    return habit;
  }

  async update(id: string, data: UpdateHabitData): Promise<Habit> {
    const index = this.habits.findIndex((h) => h.id === id);
    if (index === -1) {
      throw new Error('Habit not found');
    }

    this.habits[index] = {
      ...this.habits[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return this.habits[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.habits.findIndex((h) => h.id === id);
    if (index !== -1) {
      this.habits.splice(index, 1);
    }
  }

  async logCompletion(
    habitId: string,
    date: string,
    count?: number,
    notes?: string
  ): Promise<HabitLog> {
    const log: HabitLog = {
      id: `mock-log-${this.idCounter++}`,
      habitId,
      date,
      count: count || 1,
      notes,
      createdAt: new Date().toISOString(),
    };
    this.logs.push(log);
    return log;
  }

  async removeLog(habitId: string, date: string): Promise<void> {
    const index = this.logs.findIndex(
      (l) => l.habitId === habitId && l.date === date
    );
    if (index !== -1) {
      this.logs.splice(index, 1);
    }
  }

  async getLogsForDate(date: string): Promise<HabitLog[]> {
    return this.logs.filter((l) => l.date === date);
  }

  async getLogsForHabit(
    habitId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitLog[]> {
    return this.logs.filter(
      (l) => l.habitId === habitId && l.date >= startDate && l.date <= endDate
    );
  }

  async getDueToday(): Promise<Habit[]> {
    return this.habits.filter((h) => !h.isArchived);
  }

  async getCompletedToday(): Promise<string[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.logs.filter((l) => l.date === today).map((l) => l.habitId);
  }

  async getStreakData(habitId: string): Promise<{ current: number; longest: number }> {
    const habit = this.habits.find((h) => h.id === habitId);
    if (!habit) {
      return { current: 0, longest: 0 };
    }
    return {
      current: habit.currentStreak,
      longest: habit.longestStreak,
    };
  }

  // Test helpers
  reset(): void {
    this.habits = [];
    this.logs = [];
    this.idCounter = 1;
  }

  seed(habits: Habit[]): void {
    this.habits = [...habits];
  }
}

// Default export - singleton instance
export const habitRepository = new SQLiteHabitRepository();
