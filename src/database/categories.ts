/**
 * Finance Categories Database Module
 * CRUD operations for managing income and expense categories
 */

import { getDatabase, generateId, getCurrentTimestamp } from './index';

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  isCustom: boolean;
  createdAt: string;
}

interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  is_custom: number;
  created_at: string;
}

/**
 * Convert database row to Category object
 */
function mapRowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    type: row.type as CategoryType,
    isCustom: row.is_custom === 1,
    createdAt: row.created_at,
  };
}

/**
 * Get all categories, optionally filtered by type
 */
export async function getCategories(type?: CategoryType): Promise<Category[]> {
  const db = await getDatabase();

  try {
    let sql = 'SELECT * FROM finance_categories';
    const params: any[] = [];

    if (type) {
      sql += ' WHERE type = ?';
      params.push(type);
    }

    sql += ' ORDER BY is_custom ASC, name ASC';

    const rows = await db.getAllAsync<CategoryRow>(sql, params);
    return rows.map(mapRowToCategory);
  } catch (error) {
    console.error('[Categories] Error getting categories:', error);
    throw error;
  }
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  const db = await getDatabase();

  try {
    const row = await db.getFirstAsync<CategoryRow>(
      'SELECT * FROM finance_categories WHERE id = ?',
      [id]
    );

    return row ? mapRowToCategory(row) : null;
  } catch (error) {
    console.error('[Categories] Error getting category by ID:', error);
    throw error;
  }
}

/**
 * Create a new custom category
 */
export async function createCategory(data: {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
}): Promise<Category> {
  const db = await getDatabase();

  try {
    const id = generateId();
    const createdAt = getCurrentTimestamp();

    await db.runAsync(
      `INSERT INTO finance_categories (id, name, icon, color, type, is_custom, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [id, data.name, data.icon, data.color, data.type, createdAt]
    );

    return {
      id,
      name: data.name,
      icon: data.icon,
      color: data.color,
      type: data.type,
      isCustom: true,
      createdAt,
    };
  } catch (error) {
    console.error('[Categories] Error creating category:', error);
    throw error;
  }
}

/**
 * Update a custom category (only custom categories can be updated)
 */
export async function updateCategory(
  id: string,
  data: {
    name?: string;
    icon?: string;
    color?: string;
  }
): Promise<void> {
  const db = await getDatabase();

  try {
    // Verify this is a custom category
    const existing = await db.getFirstAsync<CategoryRow>(
      'SELECT is_custom FROM finance_categories WHERE id = ?',
      [id]
    );

    if (!existing) {
      throw new Error('Category not found');
    }

    if (existing.is_custom === 0) {
      throw new Error('Cannot update default categories');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }

    if (data.icon !== undefined) {
      updates.push('icon = ?');
      params.push(data.icon);
    }

    if (data.color !== undefined) {
      updates.push('color = ?');
      params.push(data.color);
    }

    if (updates.length === 0) {
      return; // Nothing to update
    }

    params.push(id);

    await db.runAsync(
      `UPDATE finance_categories SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  } catch (error) {
    console.error('[Categories] Error updating category:', error);
    throw error;
  }
}

/**
 * Delete a custom category (only if not in use)
 */
export async function deleteCategory(id: string): Promise<void> {
  const db = await getDatabase();

  try {
    // Verify this is a custom category
    const existing = await db.getFirstAsync<CategoryRow>(
      'SELECT is_custom FROM finance_categories WHERE id = ?',
      [id]
    );

    if (!existing) {
      throw new Error('Category not found');
    }

    if (existing.is_custom === 0) {
      throw new Error('Cannot delete default categories');
    }

    // Check if category is in use
    const usageCount = await getCategoryUsageCount(id);
    if (usageCount > 0) {
      throw new Error(
        `Cannot delete category: ${usageCount} transaction${usageCount > 1 ? 's' : ''} using this category`
      );
    }

    await db.runAsync('DELETE FROM finance_categories WHERE id = ?', [id]);
  } catch (error) {
    console.error('[Categories] Error deleting category:', error);
    throw error;
  }
}

/**
 * Get the number of transactions using this category
 */
export async function getCategoryUsageCount(id: string): Promise<number> {
  const db = await getDatabase();

  try {
    const category = await getCategoryById(id);
    if (!category) {
      return 0;
    }

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM finance_transactions WHERE category = ?',
      [category.name]
    );

    return result?.count || 0;
  } catch (error) {
    console.error('[Categories] Error getting category usage count:', error);
    throw error;
  }
}

/**
 * Get category statistics
 */
export async function getCategoryStats(): Promise<{
  totalCategories: number;
  expenseCategories: number;
  incomeCategories: number;
  customCategories: number;
}> {
  const db = await getDatabase();

  try {
    const total = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM finance_categories'
    );

    const expense = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM finance_categories WHERE type = 'expense'"
    );

    const income = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM finance_categories WHERE type = 'income'"
    );

    const custom = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM finance_categories WHERE is_custom = 1'
    );

    return {
      totalCategories: total?.count || 0,
      expenseCategories: expense?.count || 0,
      incomeCategories: income?.count || 0,
      customCategories: custom?.count || 0,
    };
  } catch (error) {
    console.error('[Categories] Error getting category stats:', error);
    throw error;
  }
}

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryUsageCount,
  getCategoryStats,
};
