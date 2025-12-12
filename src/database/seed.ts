/**
 * Database Seed Data
 * Initial sample data for first-time app experience
 */

import { createTask } from './tasks';
import { createHabit, logHabitCompletion } from './habits';
import { createEvent } from './calendar';
import { createTransaction, createAsset, createLiability } from './finance';

/**
 * Check if database needs seeding
 */
export async function needsSeeding(): Promise<boolean> {
  const { getTasks } = await import('./tasks');
  const tasks = await getTasks();
  return tasks.length === 0;
}

/**
 * Seed the database with sample data
 */
export async function seedDatabase(): Promise<void> {
  console.log('[Seed] Starting database seed...');

  try {
    // Seed Tasks
    await seedTasks();

    // Seed Habits
    await seedHabits();

    // Seed Calendar Events
    await seedCalendarEvents();

    // Seed Finance Data
    await seedFinanceData();

    console.log('[Seed] Database seeding complete!');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    throw error;
  }
}

/**
 * Seed sample tasks
 */
async function seedTasks(): Promise<void> {
  console.log('[Seed] Creating sample tasks...');

  const tasks = [
    {
      title: 'Welcome to Jarvis!',
      description: 'This is a sample task. Tap to edit or swipe to complete.',
      status: 'todo' as const,
      priority: 'high' as const,
      tags: ['welcome', 'demo'],
    },
    {
      title: 'Review your daily habits',
      description: 'Check the Habits tab to track your daily routines.',
      status: 'todo' as const,
      priority: 'medium' as const,
      tags: ['habits'],
    },
    {
      title: 'Check your calendar',
      description: 'View upcoming events in the Calendar tab.',
      status: 'todo' as const,
      priority: 'medium' as const,
      tags: ['calendar'],
    },
    {
      title: 'Explore AI Chat',
      description:
        'Try the AI Chat feature to get help with tasks and planning (requires internet).',
      status: 'todo' as const,
      priority: 'low' as const,
      tags: ['ai', 'chat'],
    },
    {
      title: 'Set up your first project',
      description: 'Organize tasks into projects for better management.',
      status: 'in_progress' as const,
      priority: 'medium' as const,
      tags: ['projects'],
    },
  ];

  for (const task of tasks) {
    await createTask(task);
  }

  console.log(`[Seed] Created ${tasks.length} sample tasks`);
}

/**
 * Seed sample habits
 */
async function seedHabits(): Promise<void> {
  console.log('[Seed] Creating sample habits...');

  const habits = [
    {
      name: 'Morning Exercise',
      description: 'Start your day with 20 minutes of exercise',
      cadence: 'daily' as const,
      targetCount: 1,
    },
    {
      name: 'Read for 30 minutes',
      description: 'Read books or articles to expand your knowledge',
      cadence: 'daily' as const,
      targetCount: 1,
    },
    {
      name: 'Meditate',
      description: 'Practice mindfulness meditation',
      cadence: 'daily' as const,
      targetCount: 1,
    },
    {
      name: 'Weekly Review',
      description: 'Review your goals and progress from the week',
      cadence: 'weekly' as const,
      targetCount: 1,
    },
  ];

  for (const habit of habits) {
    const created = await createHabit(habit);

    // Log some completions for demo purposes
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (habit.cadence === 'daily') {
      await logHabitCompletion(created.id, yesterday, true);
      // Today's habits not completed yet
    }
  }

  console.log(`[Seed] Created ${habits.length} sample habits`);
}

/**
 * Seed sample calendar events
 */
async function seedCalendarEvents(): Promise<void> {
  console.log('[Seed] Creating sample events...');

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const events = [
    {
      title: 'Team Standup',
      description: 'Daily team sync meeting',
      startTime: new Date(tomorrow.setHours(9, 0, 0, 0)).toISOString(),
      endTime: new Date(tomorrow.setHours(9, 30, 0, 0)).toISOString(),
      location: 'Video Call',
      isAllDay: false,
    },
    {
      title: 'Project Planning Session',
      description: 'Plan next sprint with the team',
      startTime: new Date(tomorrow.setHours(14, 0, 0, 0)).toISOString(),
      endTime: new Date(tomorrow.setHours(15, 30, 0, 0)).toISOString(),
      location: 'Conference Room A',
      isAllDay: false,
    },
    {
      title: 'Weekend Hiking Trip',
      description: 'Mountain trail hike with friends',
      startTime: new Date(nextWeek.setHours(8, 0, 0, 0)).toISOString(),
      endTime: new Date(nextWeek.setHours(17, 0, 0, 0)).toISOString(),
      location: 'Mountain Trail Park',
      isAllDay: false,
    },
  ];

  for (const event of events) {
    await createEvent(event);
  }

  console.log(`[Seed] Created ${events.length} sample events`);
}

/**
 * Seed sample finance data
 */
async function seedFinanceData(): Promise<void> {
  console.log('[Seed] Creating sample finance data...');

  // Create sample assets
  const assets = [
    {
      name: 'Savings Account',
      type: 'Cash',
      value: 15000,
      currency: 'USD',
    },
    {
      name: 'Investment Portfolio',
      type: 'Stocks',
      value: 25000,
      currency: 'USD',
    },
    {
      name: 'Emergency Fund',
      type: 'Cash',
      value: 10000,
      currency: 'USD',
    },
  ];

  for (const asset of assets) {
    await createAsset(asset);
  }

  // Create sample liabilities
  const liabilities = [
    {
      name: 'Student Loan',
      type: 'Loan',
      amount: 15000,
      interestRate: 4.5,
      currency: 'USD',
    },
    {
      name: 'Credit Card',
      type: 'Credit Card',
      amount: 2000,
      interestRate: 18.9,
      currency: 'USD',
    },
  ];

  for (const liability of liabilities) {
    await createLiability(liability);
  }

  // Create sample transactions for current month
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
      amount: 1500,
      category: 'Rent',
      date: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
      description: 'Monthly rent payment',
    },
    {
      type: 'expense' as const,
      amount: 150,
      category: 'Utilities',
      date: new Date(currentYear, currentMonth, 5).toISOString().split('T')[0],
      description: 'Electric and water bills',
    },
    {
      type: 'expense' as const,
      amount: 400,
      category: 'Groceries',
      date: new Date(currentYear, currentMonth, 10).toISOString().split('T')[0],
      description: 'Weekly grocery shopping',
    },
    {
      type: 'expense' as const,
      amount: 60,
      category: 'Transport',
      date: new Date(currentYear, currentMonth, 12).toISOString().split('T')[0],
      description: 'Gas and public transport',
    },
    {
      type: 'income' as const,
      amount: 500,
      category: 'Freelance',
      date: new Date(currentYear, currentMonth, 15).toISOString().split('T')[0],
      description: 'Freelance project payment',
    },
    {
      type: 'expense' as const,
      amount: 80,
      category: 'Entertainment',
      date: new Date(currentYear, currentMonth, 18).toISOString().split('T')[0],
      description: 'Movies and dining out',
    },
  ];

  for (const transaction of transactions) {
    await createTransaction(transaction);
  }

  console.log(
    `[Seed] Created ${assets.length} assets, ${liabilities.length} liabilities, and ${transactions.length} transactions`
  );
}

export default {
  needsSeeding,
  seedDatabase,
};
