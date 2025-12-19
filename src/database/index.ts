/**
 * Database Initialization and Management
 * SQLite database setup for offline-first architecture
 */

import * as SQLite from 'expo-sqlite';
import { DB_NAME, CREATE_TABLES, CREATE_INDEXES, DROP_TABLES } from './schema';

let database: SQLite.SQLiteDatabase | null = null;

/**
 * Run database migrations
 * Handles schema changes for existing databases
 */
async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[DB] Running migrations...');

  // Migration 1: Add recurrence_rule column to tasks
  try {
    await db.execAsync('ALTER TABLE tasks ADD COLUMN recurrence_rule TEXT;');
    console.log('[DB] Migration: Added recurrence_rule to tasks');
  } catch (error) {
    // Column might already exist, ignore error
    console.log('[DB] Migration: recurrence_rule column already exists or error:', error);
  }

  // Migration 2: Create finance_budgets table
  try {
    await db.execAsync(`
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
    `);
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_budgets_category ON finance_budgets(category);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_budgets_period ON finance_budgets(start_date, end_date);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_budgets_recurring ON finance_budgets(is_recurring);');
    console.log('[DB] Migration: Created finance_budgets table and indexes');
  } catch (error) {
    // Table might already exist, ignore error
    console.log('[DB] Migration: finance_budgets table already exists or error:', error);
  }

  // Migration 3: Add reminder fields to calendar_events
  try {
    const tableInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(calendar_events)'
    );

    const hasReminderMinutes = tableInfo.some(col => col.name === 'reminder_minutes');
    const hasNotificationId = tableInfo.some(col => col.name === 'notification_id');

    if (!hasReminderMinutes) {
      await db.execAsync('ALTER TABLE calendar_events ADD COLUMN reminder_minutes INTEGER;');
      console.log('[DB] Migration: Added reminder_minutes column');
    }

    if (!hasNotificationId) {
      await db.execAsync('ALTER TABLE calendar_events ADD COLUMN notification_id TEXT;');
      console.log('[DB] Migration: Added notification_id column');
    }

    if (hasReminderMinutes && hasNotificationId) {
      console.log('[DB] Migration: Reminder fields already exist');
    }
  } catch (error) {
    console.error('[DB] Migration: Error adding reminder fields:', error);
  }

  // Migration 4: Add reminder fields to habits
  try {
    const tableInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(habits)'
    );

    const hasReminderTime = tableInfo.some(col => col.name === 'reminder_time');
    const hasNotificationId = tableInfo.some(col => col.name === 'notification_id');

    if (!hasReminderTime) {
      await db.execAsync('ALTER TABLE habits ADD COLUMN reminder_time TEXT;');
      console.log('[DB] Migration: Added reminder_time column to habits');
    }

    if (!hasNotificationId) {
      await db.execAsync('ALTER TABLE habits ADD COLUMN notification_id TEXT;');
      console.log('[DB] Migration: Added notification_id column to habits');
    }

    if (hasReminderTime && hasNotificationId) {
      console.log('[DB] Migration: Habit reminder fields already exist');
    }
  } catch (error) {
    console.error('[DB] Migration: Error adding habit reminder fields:', error);
  }

  console.log('[DB] Migrations complete');
}

/**
 * Seed default finance categories
 * Creates expense and income categories with icons and colors
 */
async function seedDefaultCategories(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[DB] Seeding default categories...');

  try {
    // Check if categories already exist
    const existing = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM finance_categories WHERE is_custom = 0'
    );

    if (existing && existing.count > 0) {
      console.log('[DB] Default categories already exist, skipping seed');
      return;
    }

    const now = new Date().toISOString();
    const defaultCategories = [
      // Expense categories
      { id: 'cat-expense-food', name: 'Food & Dining', icon: 'food', color: '#F59E0B', type: 'expense', is_custom: 0, created_at: now },
      { id: 'cat-expense-transport', name: 'Transportation', icon: 'car', color: '#3B82F6', type: 'expense', is_custom: 0, created_at: now },
      { id: 'cat-expense-housing', name: 'Housing', icon: 'home', color: '#8B5CF6', type: 'expense', is_custom: 0, created_at: now },
      { id: 'cat-expense-utilities', name: 'Utilities', icon: 'lightbulb', color: '#10B981', type: 'expense', is_custom: 0, created_at: now },
      { id: 'cat-expense-entertainment', name: 'Entertainment', icon: 'theater', color: '#EC4899', type: 'expense', is_custom: 0, created_at: now },
      { id: 'cat-expense-healthcare', name: 'Healthcare', icon: 'medical-bag', color: '#EF4444', type: 'expense', is_custom: 0, created_at: now },
      { id: 'cat-expense-shopping', name: 'Shopping', icon: 'shopping', color: '#F97316', type: 'expense', is_custom: 0, created_at: now },
      { id: 'cat-expense-other', name: 'Other Expenses', icon: 'dots-horizontal', color: '#64748B', type: 'expense', is_custom: 0, created_at: now },

      // Income categories
      { id: 'cat-income-salary', name: 'Salary', icon: 'cash', color: '#10B981', type: 'income', is_custom: 0, created_at: now },
      { id: 'cat-income-freelance', name: 'Freelance', icon: 'briefcase', color: '#3B82F6', type: 'income', is_custom: 0, created_at: now },
      { id: 'cat-income-investments', name: 'Investments', icon: 'trending-up', color: '#8B5CF6', type: 'income', is_custom: 0, created_at: now },
      { id: 'cat-income-other', name: 'Other Income', icon: 'plus-circle', color: '#64748B', type: 'income', is_custom: 0, created_at: now },
    ];

    // Insert all categories in a transaction
    await db.withTransactionAsync(async () => {
      for (const category of defaultCategories) {
        await db.runAsync(
          'INSERT INTO finance_categories (id, name, icon, color, type, is_custom, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [category.id, category.name, category.icon, category.color, category.type, category.is_custom, category.created_at]
        );
      }
    });

    console.log('[DB] Default categories seeded successfully');
  } catch (error) {
    console.error('[DB] Error seeding default categories:', error);
    throw error;
  }
}

/**
 * Initialize the database
 * Creates tables and indexes if they don't exist
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) {
    return database;
  }

  try {
    console.log('[DB] Initializing database...');
    database = await SQLite.openDatabaseAsync(DB_NAME);

    // Enable foreign keys
    await database.execAsync('PRAGMA foreign_keys = ON;');

    // Create all tables
    for (const [tableName, createSQL] of Object.entries(CREATE_TABLES)) {
      console.log(`[DB] Creating table: ${tableName}`);
      await database.execAsync(createSQL);
    }

    // Create indexes
    for (const [indexName, createSQL] of Object.entries(CREATE_INDEXES)) {
      console.log(`[DB] Creating index: ${indexName}`);
      await database.execAsync(createSQL);
    }

    // Run migrations for existing databases
    await runMigrations(database);

    // Seed default categories
    await seedDefaultCategories(database);

    console.log('[DB] Database initialized successfully');
    return database;
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get the database instance
 * Initializes if not already done
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!database) {
    return await initDatabase();
  }
  return database;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (database) {
    await database.closeAsync();
    database = null;
    console.log('[DB] Database closed');
  }
}

/**
 * Drop all tables (WARNING: Deletes all data)
 * Useful for clearing data without recreating tables
 */
export async function dropAllTables(): Promise<void> {
  console.log('[DB] Dropping all tables...');
  const db = await getDatabase();

  // Drop all tables
  for (const dropSQL of DROP_TABLES) {
    await db.execAsync(dropSQL);
  }

  console.log('[DB] All tables dropped');
}

/**
 * Reset the database (WARNING: Deletes all data)
 * Useful for development and testing
 */
export async function resetDatabase(): Promise<void> {
  console.log('[DB] Resetting database...');
  await dropAllTables();

  const db = await getDatabase();

  // Recreate tables
  for (const createSQL of Object.values(CREATE_TABLES)) {
    await db.execAsync(createSQL);
  }

  // Recreate indexes
  for (const createSQL of Object.values(CREATE_INDEXES)) {
    await db.execAsync(createSQL);
  }

  console.log('[DB] Database reset complete');
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Execute a query with parameters
 */
export async function executeQuery<T>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const db = await getDatabase();
  try {
    const result = await db.getAllAsync<T>(sql, params);
    return result ?? [];  // Ensure we always return an array
  } catch (error) {
    console.error('[DB] Query error:', error);
    throw error;
  }
}

/**
 * Execute a single row query
 */
export async function executeQuerySingle<T>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const db = await getDatabase();
  try {
    const result = await db.getFirstAsync<T>(sql, params);
    return result || null;
  } catch (error) {
    console.error('[DB] Query error:', error);
    throw error;
  }
}

/**
 * Execute a write query (INSERT, UPDATE, DELETE)
 */
export async function executeWrite(
  sql: string,
  params: any[] = []
): Promise<SQLite.SQLiteRunResult> {
  const db = await getDatabase();
  try {
    const result = await db.runAsync(sql, params);
    return result;
  } catch (error) {
    console.error('[DB] Write error:', error);
    throw error;
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function executeTransaction(
  queries: Array<{ sql: string; params?: any[] }>
): Promise<void> {
  const db = await getDatabase();
  try {
    await db.withTransactionAsync(async () => {
      for (const query of queries) {
        await db.runAsync(query.sql, query.params || []);
      }
    });
  } catch (error) {
    console.error('[DB] Transaction error:', error);
    throw error;
  }
}

export default {
  initDatabase,
  getDatabase,
  closeDatabase,
  dropAllTables,
  resetDatabase,
  generateId,
  getCurrentTimestamp,
  executeQuery,
  executeQuerySingle,
  executeWrite,
  executeTransaction,
};
