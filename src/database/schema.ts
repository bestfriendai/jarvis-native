/**
 * Database Schema Definitions
 * SQLite table schemas for offline-first data storage
 */

export const DB_NAME = 'jarvis.db';
export const DB_VERSION = 1;

/**
 * SQL statements to create all tables
 */
export const CREATE_TABLES = {
  projects: `
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
  `,

  tasks: `
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      effort INTEGER,
      impact INTEGER,
      due_date TEXT,
      completed_at TEXT,
      project_id TEXT,
      tags TEXT,
      recurrence_rule TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );
  `,

  habits: `
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      cadence TEXT DEFAULT 'daily',
      target_count INTEGER DEFAULT 1,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      reminder_time TEXT,
      notification_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
  `,

  habit_logs: `
    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      UNIQUE(habit_id, date)
    );
  `,

  calendar_events: `
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      location TEXT,
      attendees TEXT,
      is_all_day INTEGER DEFAULT 0,
      recurring TEXT,
      reminder_minutes INTEGER,
      notification_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
  `,

  finance_transactions: `
    CREATE TABLE IF NOT EXISTS finance_transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      date TEXT NOT NULL,
      description TEXT,
      currency TEXT DEFAULT 'USD',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
  `,

  finance_assets: `
    CREATE TABLE IF NOT EXISTS finance_assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
  `,

  finance_liabilities: `
    CREATE TABLE IF NOT EXISTS finance_liabilities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      interest_rate REAL,
      currency TEXT DEFAULT 'USD',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
  `,

  finance_budgets: `
    CREATE TABLE IF NOT EXISTS finance_budgets (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      period TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_recurring INTEGER DEFAULT 0,
      alert_threshold REAL DEFAULT 0.8,
      currency TEXT DEFAULT 'USD',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      UNIQUE(category, start_date)
    );
  `,

  finance_categories: `
    CREATE TABLE IF NOT EXISTS finance_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      is_custom INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `,

  focus_blocks: `
    CREATE TABLE IF NOT EXISTS focus_blocks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      duration_minutes INTEGER NOT NULL,
      actual_minutes INTEGER,
      task_id TEXT,
      status TEXT DEFAULT 'scheduled',
      start_time TEXT,
      end_time TEXT,
      phone_in_mode INTEGER DEFAULT 0,
      break_taken INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
    );
  `,
};

/**
 * SQL statements to create indexes for better query performance
 */
export const CREATE_INDEXES = {
  tasks_status: 'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);',
  tasks_priority: 'CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);',
  tasks_project: 'CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);',
  tasks_due_date: 'CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);',

  habits_cadence: 'CREATE INDEX IF NOT EXISTS idx_habits_cadence ON habits(cadence);',

  habit_logs_habit: 'CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id);',
  habit_logs_date: 'CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);',

  calendar_start: 'CREATE INDEX IF NOT EXISTS idx_calendar_start ON calendar_events(start_time);',
  calendar_end: 'CREATE INDEX IF NOT EXISTS idx_calendar_end ON calendar_events(end_time);',

  finance_trans_date: 'CREATE INDEX IF NOT EXISTS idx_finance_trans_date ON finance_transactions(date);',
  finance_trans_type: 'CREATE INDEX IF NOT EXISTS idx_finance_trans_type ON finance_transactions(type);',

  finance_budgets_category: 'CREATE INDEX IF NOT EXISTS idx_budgets_category ON finance_budgets(category);',
  finance_budgets_period: 'CREATE INDEX IF NOT EXISTS idx_budgets_period ON finance_budgets(start_date, end_date);',
  finance_budgets_recurring: 'CREATE INDEX IF NOT EXISTS idx_budgets_recurring ON finance_budgets(is_recurring);',

  finance_categories_type: 'CREATE INDEX IF NOT EXISTS idx_categories_type ON finance_categories(type);',
  finance_categories_custom: 'CREATE INDEX IF NOT EXISTS idx_categories_custom ON finance_categories(is_custom);',

  focus_blocks_status: 'CREATE INDEX IF NOT EXISTS idx_focus_blocks_status ON focus_blocks(status);',
  focus_blocks_task: 'CREATE INDEX IF NOT EXISTS idx_focus_blocks_task ON focus_blocks(task_id);',
  focus_blocks_start_time: 'CREATE INDEX IF NOT EXISTS idx_focus_blocks_start_time ON focus_blocks(start_time);',
};

/**
 * Drop all tables (for reset/testing)
 */
export const DROP_TABLES = [
  'DROP TABLE IF EXISTS focus_blocks',
  'DROP TABLE IF EXISTS habit_logs',
  'DROP TABLE IF EXISTS habits',
  'DROP TABLE IF EXISTS tasks',
  'DROP TABLE IF EXISTS projects',
  'DROP TABLE IF EXISTS calendar_events',
  'DROP TABLE IF EXISTS finance_transactions',
  'DROP TABLE IF EXISTS finance_categories',
  'DROP TABLE IF EXISTS finance_assets',
  'DROP TABLE IF EXISTS finance_liabilities',
  'DROP TABLE IF EXISTS finance_budgets',
];

/**
 * Migration helper types
 */
export interface MigrationFunction {
  name: string;
  run: (db: any) => Promise<void>;
}
