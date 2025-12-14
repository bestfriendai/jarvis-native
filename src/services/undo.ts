/**
 * Undo Service
 * High-level API for undo/redo functionality with toast notifications
 * Handles deletion operations across all entity types
 */

import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { undoQueue, UndoAction } from './undoQueue';
import * as tasksDB from '../database/tasks';
import * as habitsDB from '../database/habits';
import * as calendarDB from '../database/calendar';
import * as financeDB from '../database/finance';
import type { Task } from '../database/tasks';
import type { Habit, HabitLog } from '../database/habits';
import type { CalendarEvent } from '../database/calendar';
import type { Transaction } from '../database/finance';

const UNDO_TIMEOUT_MS = 4000; // 4 seconds

/**
 * Extended Habit with logs for complete restoration
 */
interface HabitWithLogs extends Habit {
  logs: HabitLog[];
}

/**
 * Show undo toast notification with custom action button
 */
function showUndoToast(
  message: string,
  onUndo: () => Promise<void>
): void {
  Toast.show({
    type: 'undo',
    text1: message,
    visibilityTime: UNDO_TIMEOUT_MS,
    props: {
      onUndo,
    },
  });
}

/**
 * Perform haptic feedback for undo action
 */
async function performHapticFeedback(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.warn('[UndoService] Haptic feedback not available:', error);
  }
}

// ========================================
// TASK UNDO OPERATIONS
// ========================================

/**
 * Delete a task with undo capability
 * @param task - The task to delete
 * @param onDeleted - Callback after successful deletion
 * @param onUndone - Callback after successful undo
 */
export async function deleteTask(
  task: Task,
  onDeleted?: () => void,
  onUndone?: () => void
): Promise<void> {
  try {
    // Delete from database
    await tasksDB.deleteTask(task.id);
    console.log(`[UndoService] Task ${task.id} deleted`);

    // Add to undo queue
    undoQueue.add<Task>(
      {
        id: task.id,
        type: 'task',
        data: task,
        timestamp: Date.now(),
      },
      () => {
        // On timeout expiration (no-op, already deleted from DB)
        console.log(`[UndoService] Task ${task.id} permanently deleted (timeout expired)`);
      },
      UNDO_TIMEOUT_MS
    );

    // Show toast with undo button
    showUndoToast('Task deleted', async () => {
      const restoredTask = undoQueue.undo<Task>(task.id);
      if (restoredTask) {
        // Re-insert task into database
        await tasksDB.createTask({
          title: restoredTask.title,
          description: restoredTask.description,
          status: restoredTask.status,
          priority: restoredTask.priority,
          effort: restoredTask.effort,
          impact: restoredTask.impact,
          dueDate: restoredTask.dueDate,
          projectId: restoredTask.projectId,
          tags: restoredTask.tags,
          recurrence: restoredTask.recurrence,
        });

        await performHapticFeedback();
        console.log(`[UndoService] Task ${task.id} restored`);

        // Notify caller
        onUndone?.();

        // Show success toast
        Toast.show({
          type: 'success',
          text1: 'Task restored',
          visibilityTime: 2000,
        });
      }
    });

    // Notify caller
    onDeleted?.();
  } catch (error) {
    console.error('[UndoService] Error deleting task:', error);
    throw error;
  }
}

/**
 * Delete multiple tasks with undo capability
 * @param tasks - Array of tasks to delete
 * @param onDeleted - Callback after successful deletion
 * @param onUndone - Callback after successful undo
 */
export async function deleteTasks(
  tasks: Task[],
  onDeleted?: () => void,
  onUndone?: () => void
): Promise<void> {
  try {
    const taskIds = tasks.map(t => t.id);

    // Delete from database
    await tasksDB.bulkDeleteTasks(taskIds);
    console.log(`[UndoService] ${tasks.length} tasks deleted`);

    // Use first task ID as queue ID for bulk operation
    const bulkId = `bulk_tasks_${tasks[0].id}`;

    // Add to undo queue
    undoQueue.add<Task[]>(
      {
        id: bulkId,
        type: 'task',
        data: tasks,
        timestamp: Date.now(),
      },
      () => {
        console.log(`[UndoService] ${tasks.length} tasks permanently deleted (timeout expired)`);
      },
      UNDO_TIMEOUT_MS
    );

    // Show toast with undo button
    showUndoToast(`${tasks.length} tasks deleted`, async () => {
      const restoredTasks = undoQueue.undo<Task[]>(bulkId);
      if (restoredTasks) {
        // Re-insert all tasks
        for (const task of restoredTasks) {
          await tasksDB.createTask({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            effort: task.effort,
            impact: task.impact,
            dueDate: task.dueDate,
            projectId: task.projectId,
            tags: task.tags,
            recurrence: task.recurrence,
          });
        }

        await performHapticFeedback();
        console.log(`[UndoService] ${tasks.length} tasks restored`);

        onUndone?.();

        Toast.show({
          type: 'success',
          text1: `${tasks.length} tasks restored`,
          visibilityTime: 2000,
        });
      }
    });

    onDeleted?.();
  } catch (error) {
    console.error('[UndoService] Error deleting tasks:', error);
    throw error;
  }
}

// ========================================
// HABIT UNDO OPERATIONS
// ========================================

/**
 * Delete a habit with undo capability
 * @param habit - The habit to delete
 * @param onDeleted - Callback after successful deletion
 * @param onUndone - Callback after successful undo
 */
export async function deleteHabit(
  habit: Habit,
  onDeleted?: () => void,
  onUndone?: () => void
): Promise<void> {
  try {
    // Fetch all habit logs before deletion (use wide date range to get all logs)
    const startDate = '1970-01-01'; // Far past
    const endDate = '2099-12-31'; // Far future
    const logs = await habitsDB.getHabitLogs(habit.id, startDate, endDate);

    // Create extended habit data with logs
    const habitWithLogs: HabitWithLogs = {
      ...habit,
      logs,
    };

    // Delete from database (cascades to logs)
    await habitsDB.deleteHabit(habit.id);
    console.log(`[UndoService] Habit ${habit.id} deleted (with ${logs.length} logs)`);

    // Add to undo queue
    undoQueue.add<HabitWithLogs>(
      {
        id: habit.id,
        type: 'habit',
        data: habitWithLogs,
        timestamp: Date.now(),
      },
      () => {
        console.log(`[UndoService] Habit ${habit.id} permanently deleted (timeout expired)`);
      },
      UNDO_TIMEOUT_MS
    );

    // Show toast with undo button
    showUndoToast('Habit deleted', async () => {
      const restoredHabit = undoQueue.undo<HabitWithLogs>(habit.id);
      if (restoredHabit) {
        // Re-insert habit (this creates a new ID, but that's acceptable for undo)
        const newHabit = await habitsDB.createHabit({
          name: restoredHabit.name,
          description: restoredHabit.description,
          cadence: restoredHabit.cadence,
          targetCount: restoredHabit.targetCount,
          reminderTime: restoredHabit.reminderTime,
        });

        // Re-insert all logs with the new habit ID
        for (const log of restoredHabit.logs) {
          await habitsDB.logHabitCompletion(newHabit.id, log.date, log.completed, log.notes);
        }

        await performHapticFeedback();
        console.log(`[UndoService] Habit ${habit.id} restored (with ${restoredHabit.logs.length} logs)`);

        onUndone?.();

        Toast.show({
          type: 'success',
          text1: 'Habit restored',
          visibilityTime: 2000,
        });
      }
    });

    onDeleted?.();
  } catch (error) {
    console.error('[UndoService] Error deleting habit:', error);
    throw error;
  }
}

// ========================================
// CALENDAR EVENT UNDO OPERATIONS
// ========================================

/**
 * Delete a calendar event with undo capability
 * @param event - The event to delete
 * @param onDeleted - Callback after successful deletion
 * @param onUndone - Callback after successful undo
 */
export async function deleteEvent(
  event: CalendarEvent,
  onDeleted?: () => void,
  onUndone?: () => void
): Promise<void> {
  try {
    // Delete from database
    await calendarDB.deleteEvent(event.id);
    console.log(`[UndoService] Event ${event.id} deleted`);

    // Add to undo queue
    undoQueue.add<CalendarEvent>(
      {
        id: event.id,
        type: 'event',
        data: event,
        timestamp: Date.now(),
      },
      () => {
        console.log(`[UndoService] Event ${event.id} permanently deleted (timeout expired)`);
      },
      UNDO_TIMEOUT_MS
    );

    // Show toast with undo button
    showUndoToast('Event deleted', async () => {
      const restoredEvent = undoQueue.undo<CalendarEvent>(event.id);
      if (restoredEvent) {
        // Re-insert event
        await calendarDB.createEvent({
          title: restoredEvent.title,
          description: restoredEvent.description,
          startTime: restoredEvent.startTime,
          endTime: restoredEvent.endTime,
          location: restoredEvent.location,
          attendees: restoredEvent.attendees,
          isAllDay: restoredEvent.isAllDay,
          recurrence: restoredEvent.recurrence,
          reminderMinutes: restoredEvent.reminderMinutes,
        });

        await performHapticFeedback();
        console.log(`[UndoService] Event ${event.id} restored`);

        onUndone?.();

        Toast.show({
          type: 'success',
          text1: 'Event restored',
          visibilityTime: 2000,
        });
      }
    });

    onDeleted?.();
  } catch (error) {
    console.error('[UndoService] Error deleting event:', error);
    throw error;
  }
}

// ========================================
// FINANCE TRANSACTION UNDO OPERATIONS
// ========================================

/**
 * Delete a transaction with undo capability
 * @param transaction - The transaction to delete
 * @param onDeleted - Callback after successful deletion
 * @param onUndone - Callback after successful undo
 */
export async function deleteTransaction(
  transaction: Transaction,
  onDeleted?: () => void,
  onUndone?: () => void
): Promise<void> {
  try {
    // Delete from database
    await financeDB.deleteTransaction(transaction.id);
    console.log(`[UndoService] Transaction ${transaction.id} deleted`);

    // Add to undo queue
    undoQueue.add<Transaction>(
      {
        id: transaction.id,
        type: 'transaction',
        data: transaction,
        timestamp: Date.now(),
      },
      () => {
        console.log(`[UndoService] Transaction ${transaction.id} permanently deleted (timeout expired)`);
      },
      UNDO_TIMEOUT_MS
    );

    // Show toast with undo button
    showUndoToast('Transaction deleted', async () => {
      const restoredTransaction = undoQueue.undo<Transaction>(transaction.id);
      if (restoredTransaction) {
        // Re-insert transaction
        await financeDB.createTransaction({
          type: restoredTransaction.type,
          amount: restoredTransaction.amount,
          category: restoredTransaction.category,
          date: restoredTransaction.date,
          description: restoredTransaction.description,
          currency: restoredTransaction.currency,
        });

        await performHapticFeedback();
        console.log(`[UndoService] Transaction ${transaction.id} restored`);

        onUndone?.();

        Toast.show({
          type: 'success',
          text1: 'Transaction restored',
          visibilityTime: 2000,
        });
      }
    });

    onDeleted?.();
  } catch (error) {
    console.error('[UndoService] Error deleting transaction:', error);
    throw error;
  }
}

// ========================================
// UTILITY
// ========================================

/**
 * Clear all pending undo operations
 * (Useful on app restart or navigation)
 */
export function clearUndoQueue(): void {
  undoQueue.clear();
}
