/**
 * Dashboard Database Operations
 * Provides offline dashboard metrics from existing data
 */

import {
  executeQuery,
  executeQuerySingle,
} from './index';
import { getAssets, getLiabilities, getFinanceSummary } from './finance';
import { getTasks, Task } from './tasks';
import { getHabits, Habit, isHabitCompletedToday } from './habits';
import { getEvents, CalendarEvent } from './calendar';

export interface TodayMetrics {
  starts: number;
  studyMinutes: number;
  cash: number | null;
  currency: string;
}

export interface MacroGoal {
  id: string;
  title: string;
  description?: string;
}

export interface TodaysFocusItem {
  id: string;
  type: 'task' | 'habit' | 'event';
  title: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  time?: string;
  status?: string;
  isOverdue?: boolean;
  project?: string;
}

export interface TodaysFocus {
  tasks: TodaysFocusItem[];
  habits: TodaysFocusItem[];
  events: TodaysFocusItem[];
  summary: {
    totalItems: number;
    highPriority: number;
    completed: number;
  };
}

/**
 * Get today's metrics
 * Calculates metrics from existing data
 */
export async function getTodayMetrics(): Promise<TodayMetrics> {
  try {
    // For now, provide placeholder data until starts tracking is implemented
    // Get latest asset value as "cash on hand"
    const assets = await getAssets();
    const cashAsset = assets.find(a => a.type.toLowerCase().includes('cash') || a.type.toLowerCase().includes('checking'));

    return {
      starts: 0, // TODO: Implement starts tracking
      studyMinutes: 0, // TODO: Implement study time tracking
      cash: cashAsset ? cashAsset.value * 100 : null, // Convert to cents
      currency: cashAsset?.currency || 'USD',
    };
  } catch (error) {
    console.error('[Dashboard] Error getting today metrics:', error);
    return {
      starts: 0,
      studyMinutes: 0,
      cash: null,
      currency: 'USD',
    };
  }
}

/**
 * Get today's focus items
 * Aggregates tasks, habits, and events for today
 */
export async function getTodaysFocus(): Promise<TodaysFocus> {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get tasks (due today or overdue, not completed)
    const allTasks = await getTasks();
    const relevantTasks = allTasks.filter((task: Task) => {
      if (task.completedAt) return false; // Skip completed
      if (!task.dueDate) return false; // Skip tasks without due date

      const dueDate = task.dueDate.split('T')[0];
      return dueDate <= todayStr; // Due today or overdue
    });

    const taskItems: TodaysFocusItem[] = relevantTasks
      .sort((a, b) => {
        // Sort by priority then due date
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return (a.dueDate || '').localeCompare(b.dueDate || '');
      })
      .slice(0, 5) // Top 5 tasks
      .map((task: Task) => ({
        id: task.id,
        type: 'task' as const,
        title: task.title,
        priority: task.priority,
        time: task.dueDate,
        isOverdue: task.dueDate ? task.dueDate.split('T')[0] < todayStr : false,
        project: task.project?.name,
      }));

    // Get habits (not completed today)
    const allHabits = await getHabits();
    const habitStatuses = await Promise.all(
      allHabits.map(async (habit: Habit) => ({
        habit,
        completed: await isHabitCompletedToday(habit.id),
      }))
    );

    const habitItems: TodaysFocusItem[] = habitStatuses
      .filter(({ completed }) => !completed)
      .slice(0, 5) // Top 5 habits
      .map(({ habit }) => ({
        id: habit.id,
        type: 'habit' as const,
        title: habit.name,
        status: `${habit.currentStreak} day streak`,
      }));

    // Get today's events
    const allEvents = await getEvents();
    const todayEvents = allEvents.filter((event: CalendarEvent) => {
      const eventDate = event.startTime.split('T')[0];
      return eventDate === todayStr;
    });

    const eventItems: TodaysFocusItem[] = todayEvents
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 5) // Next 5 events
      .map((event: CalendarEvent) => ({
        id: event.id,
        type: 'event' as const,
        title: event.title,
        time: event.startTime,
      }));

    // Calculate summary
    const totalItems = taskItems.length + habitItems.length + eventItems.length;
    const highPriority = taskItems.filter((t) => t.priority === 'high').length;
    const completed = 0; // Will be calculated from actual completion status

    return {
      tasks: taskItems,
      habits: habitItems,
      events: eventItems,
      summary: {
        totalItems,
        highPriority,
        completed,
      },
    };
  } catch (error) {
    console.error('[Dashboard] Error getting today\'s focus:', error);
    return {
      tasks: [],
      habits: [],
      events: [],
      summary: {
        totalItems: 0,
        highPriority: 0,
        completed: 0,
      },
    };
  }
}

/**
 * Get macro goals
 * For now returns empty array - can be implemented later
 */
export async function getMacroGoals(): Promise<MacroGoal[]> {
  // TODO: Implement macro goals table and CRUD
  return [];
}

export default {
  getTodayMetrics,
  getTodaysFocus,
  getMacroGoals,
};
