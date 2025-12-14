/**
 * Sample Data Service
 * Generates realistic sample data for onboarding
 */

import { createTask } from '../database/tasks';
import { createHabit, logHabitCompletion } from '../database/habits';
import { createEvent } from '../database/calendar';
import { createTransaction } from '../database/finance';

/**
 * Generate and load sample data into the database
 */
export async function generateSampleData(): Promise<void> {
  console.log('[SampleData] Generating sample data...');

  try {
    await Promise.all([
      generateSampleTasks(),
      generateSampleHabits(),
      generateSampleEvents(),
      generateSampleTransactions(),
    ]);

    console.log('[SampleData] Sample data generated successfully');
  } catch (error) {
    console.error('[SampleData] Failed to generate sample data:', error);
    throw error;
  }
}

/**
 * Generate sample tasks
 */
async function generateSampleTasks(): Promise<void> {
  const tasks = [
    {
      title: 'Complete onboarding tutorial',
      description: 'Explore all the features Jarvis has to offer',
      status: 'in_progress' as const,
      priority: 'high' as const,
      tags: ['getting-started'],
    },
    {
      title: 'Review weekly goals',
      description: 'Set and review your goals for the upcoming week',
      status: 'todo' as const,
      priority: 'high' as const,
      tags: ['planning', 'goals'],
    },
    {
      title: 'Organize project files',
      description: 'Clean up and organize workspace documents',
      status: 'todo' as const,
      priority: 'medium' as const,
      tags: ['organization'],
    },
  ];

  for (const task of tasks) {
    await createTask(task);
  }

  console.log(`[SampleData] Created ${tasks.length} sample tasks`);
}

/**
 * Generate sample habits
 */
async function generateSampleHabits(): Promise<void> {
  const habits = [
    {
      name: 'Morning Workout',
      description: '30 minutes of exercise to start the day',
      cadence: 'daily' as const,
      targetCount: 1,
    },
    {
      name: 'Daily Reading',
      description: 'Read for at least 20 minutes',
      cadence: 'daily' as const,
      targetCount: 1,
    },
  ];

  for (const habit of habits) {
    const created = await createHabit(habit);

    // Log some past completions for demo
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    await logHabitCompletion(created.id, yesterday, true);
    await logHabitCompletion(created.id, twoDaysAgo, true);
  }

  console.log(`[SampleData] Created ${habits.length} sample habits`);
}

/**
 * Generate sample calendar events
 */
async function generateSampleEvents(): Promise<void> {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const events = [
    {
      title: 'Team Standup',
      description: 'Daily team sync meeting',
      startTime: new Date(tomorrow.setHours(10, 0, 0, 0)).toISOString(),
      endTime: new Date(tomorrow.setHours(10, 30, 0, 0)).toISOString(),
      location: 'Video Call',
      isAllDay: false,
    },
    {
      title: 'Lunch with Sarah',
      description: 'Catch up over lunch',
      startTime: new Date(tomorrow.setHours(12, 30, 0, 0)).toISOString(),
      endTime: new Date(tomorrow.setHours(13, 30, 0, 0)).toISOString(),
      location: 'Downtown Cafe',
      isAllDay: false,
    },
  ];

  for (const event of events) {
    await createEvent(event);
  }

  console.log(`[SampleData] Created ${events.length} sample events`);
}

/**
 * Generate sample finance transactions
 */
async function generateSampleTransactions(): Promise<void> {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const transactions = [
    {
      type: 'income' as const,
      amount: 5000,
      category: 'Salary',
      date: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
      description: 'Monthly salary',
    },
    {
      type: 'expense' as const,
      amount: 1200,
      category: 'Rent',
      date: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
      description: 'Monthly rent payment',
    },
    {
      type: 'expense' as const,
      amount: 350,
      category: 'Groceries',
      date: new Date(currentYear, currentMonth, 5).toISOString().split('T')[0],
      description: 'Weekly grocery shopping',
    },
    {
      type: 'expense' as const,
      amount: 75,
      category: 'Utilities',
      date: new Date(currentYear, currentMonth, 8).toISOString().split('T')[0],
      description: 'Electric and internet bills',
    },
    {
      type: 'income' as const,
      amount: 800,
      category: 'Freelance',
      date: new Date(currentYear, currentMonth, 15).toISOString().split('T')[0],
      description: 'Freelance project payment',
    },
  ];

  for (const transaction of transactions) {
    await createTransaction(transaction);
  }

  console.log(`[SampleData] Created ${transactions.length} sample transactions`);
}
