/**
 * Budgets Database Operations
 * CRUD operations for budget management with spending tracking
 */

import {
  generateId,
  getCurrentTimestamp,
  executeQuery,
  executeQuerySingle,
  executeWrite,
} from './index';

export type BudgetPeriod = 'monthly' | 'weekly' | 'yearly';
export type BudgetStatus = 'safe' | 'warning' | 'exceeded';

export interface Budget {
  id: string;
  category: string;
  amount: number; // Amount in cents
  period: BudgetPeriod;
  startDate: string; // ISO date
  endDate: string; // ISO date
  isRecurring: boolean;
  alertThreshold: number; // 0.8 = 80%
  currency: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface BudgetWithSpending extends Budget {
  spent: number; // Amount spent in cents
  remaining: number; // Budget - spent
  percentUsed: number; // 0-100+
  transactionCount: number;
  status: BudgetStatus;
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  budgetCount: number;
  exceededCount: number;
  warningCount: number;
}

interface BudgetRow {
  id: string;
  category: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string;
  is_recurring: number;
  alert_threshold: number;
  currency: string;
  created_at: string;
  updated_at: string;
  synced: number;
}

export interface CreateBudgetData {
  category: string;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  isRecurring?: boolean;
  alertThreshold?: number;
  currency?: string;
}

export interface UpdateBudgetData extends Partial<CreateBudgetData> {}

/**
 * Convert database row to Budget object
 */
function rowToBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    category: row.category,
    amount: row.amount,
    period: row.period,
    startDate: row.start_date,
    endDate: row.end_date,
    isRecurring: row.is_recurring === 1,
    alertThreshold: row.alert_threshold,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    synced: row.synced === 1,
  };
}

/**
 * Calculate spending for a budget category within date range
 */
async function calculateBudgetSpending(
  category: string,
  startDate: string,
  endDate: string
): Promise<{ spent: number; transactionCount: number }> {
  const sql = `
    SELECT
      COALESCE(SUM(amount), 0) as total_spent,
      COUNT(*) as transaction_count
    FROM finance_transactions
    WHERE category = ?
      AND date >= ?
      AND date <= ?
      AND type = 'expense'
  `;

  const result = await executeQuerySingle<any>(sql, [category, startDate, endDate]);

  return {
    spent: result?.total_spent || 0,
    transactionCount: result?.transaction_count || 0,
  };
}

/**
 * Calculate budget status based on spending
 */
function calculateBudgetStatus(
  spent: number,
  amount: number,
  alertThreshold: number
): BudgetStatus {
  const percentUsed = (spent / amount) * 100;

  if (percentUsed >= 100) return 'exceeded';
  if (percentUsed >= alertThreshold * 100) return 'warning';
  return 'safe';
}

/**
 * Enhance budget with spending data
 */
async function enrichBudgetWithSpending(budget: Budget): Promise<BudgetWithSpending> {
  const { spent, transactionCount } = await calculateBudgetSpending(
    budget.category,
    budget.startDate,
    budget.endDate
  );

  const remaining = budget.amount - spent;
  const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const status = calculateBudgetStatus(spent, budget.amount, budget.alertThreshold);

  return {
    ...budget,
    spent,
    remaining,
    percentUsed,
    transactionCount,
    status,
  };
}

/**
 * Get all budgets
 */
export async function getBudgets(): Promise<Budget[]> {
  const sql = 'SELECT * FROM finance_budgets ORDER BY start_date DESC';
  const rows = await executeQuery<BudgetRow>(sql);
  return rows.map(rowToBudget);
}

/**
 * Get active budgets (current period) with spending data
 */
export async function getActiveBudgets(): Promise<BudgetWithSpending[]> {
  const now = new Date().toISOString().split('T')[0];

  const sql = `
    SELECT * FROM finance_budgets
    WHERE start_date <= ?
      AND end_date >= ?
    ORDER BY category ASC
  `;

  const rows = await executeQuery<BudgetRow>(sql, [now, now]);
  const budgets = rows.map(rowToBudget);

  // Enrich with spending data
  return Promise.all(budgets.map(enrichBudgetWithSpending));
}

/**
 * Get a single budget by ID
 */
export async function getBudget(id: string): Promise<Budget | null> {
  const sql = 'SELECT * FROM finance_budgets WHERE id = ?';
  const row = await executeQuerySingle<BudgetRow>(sql, [id]);
  return row ? rowToBudget(row) : null;
}

/**
 * Get a budget with spending data
 */
export async function getBudgetWithSpending(id: string): Promise<BudgetWithSpending | null> {
  const budget = await getBudget(id);
  if (!budget) return null;
  return enrichBudgetWithSpending(budget);
}

/**
 * Get budget for a specific category and date
 */
export async function getBudgetByCategory(
  category: string,
  date: string
): Promise<BudgetWithSpending | null> {
  const sql = `
    SELECT * FROM finance_budgets
    WHERE category = ?
      AND start_date <= ?
      AND end_date >= ?
    LIMIT 1
  `;

  const row = await executeQuerySingle<BudgetRow>(sql, [category, date, date]);
  if (!row) return null;

  const budget = rowToBudget(row);
  return enrichBudgetWithSpending(budget);
}

/**
 * Get summary of all active budgets
 */
export async function getBudgetSummary(): Promise<BudgetSummary> {
  const activeBudgets = await getActiveBudgets();

  const summary: BudgetSummary = {
    totalBudgeted: 0,
    totalSpent: 0,
    totalRemaining: 0,
    budgetCount: activeBudgets.length,
    exceededCount: 0,
    warningCount: 0,
  };

  activeBudgets.forEach((budget) => {
    summary.totalBudgeted += budget.amount;
    summary.totalSpent += budget.spent;
    summary.totalRemaining += budget.remaining;

    if (budget.status === 'exceeded') summary.exceededCount++;
    if (budget.status === 'warning') summary.warningCount++;
  });

  return summary;
}

/**
 * Create a new budget
 */
export async function createBudget(data: CreateBudgetData): Promise<Budget> {
  const id = generateId();
  const now = getCurrentTimestamp();

  const sql = `
    INSERT INTO finance_budgets (
      id, category, amount, period, start_date, end_date,
      is_recurring, alert_threshold, currency,
      created_at, updated_at, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `;

  const params = [
    id,
    data.category,
    data.amount,
    data.period,
    data.startDate,
    data.endDate,
    data.isRecurring ? 1 : 0,
    data.alertThreshold || 0.8,
    data.currency || 'USD',
    now,
    now,
  ];

  await executeWrite(sql, params);

  const budget = await getBudget(id);
  if (!budget) {
    throw new Error('Failed to create budget');
  }

  return budget;
}

/**
 * Update a budget
 */
export async function updateBudget(id: string, data: UpdateBudgetData): Promise<Budget> {
  const now = getCurrentTimestamp();

  const updates: string[] = [];
  const params: any[] = [];

  if (data.category !== undefined) {
    updates.push('category = ?');
    params.push(data.category);
  }

  if (data.amount !== undefined) {
    updates.push('amount = ?');
    params.push(data.amount);
  }

  if (data.period !== undefined) {
    updates.push('period = ?');
    params.push(data.period);
  }

  if (data.startDate !== undefined) {
    updates.push('start_date = ?');
    params.push(data.startDate);
  }

  if (data.endDate !== undefined) {
    updates.push('end_date = ?');
    params.push(data.endDate);
  }

  if (data.isRecurring !== undefined) {
    updates.push('is_recurring = ?');
    params.push(data.isRecurring ? 1 : 0);
  }

  if (data.alertThreshold !== undefined) {
    updates.push('alert_threshold = ?');
    params.push(data.alertThreshold);
  }

  if (data.currency !== undefined) {
    updates.push('currency = ?');
    params.push(data.currency);
  }

  updates.push('updated_at = ?');
  params.push(now);

  updates.push('synced = 0');

  params.push(id);

  const sql = `UPDATE finance_budgets SET ${updates.join(', ')} WHERE id = ?`;
  await executeWrite(sql, params);

  const budget = await getBudget(id);
  if (!budget) {
    throw new Error('Budget not found after update');
  }

  return budget;
}

/**
 * Delete a budget
 */
export async function deleteBudget(id: string): Promise<void> {
  const sql = 'DELETE FROM finance_budgets WHERE id = ?';
  await executeWrite(sql, [id]);
}

/**
 * Get budgets that are at or over their alert threshold
 */
export async function getAlertBudgets(): Promise<BudgetWithSpending[]> {
  const activeBudgets = await getActiveBudgets();
  return activeBudgets.filter(
    (budget) => budget.status === 'warning' || budget.status === 'exceeded'
  );
}

/**
 * Create next month's budgets for all recurring budgets
 */
export async function createNextMonthBudgets(): Promise<Budget[]> {
  const sql = `
    SELECT * FROM finance_budgets
    WHERE is_recurring = 1
      AND period = 'monthly'
  `;

  const rows = await executeQuery<BudgetRow>(sql);
  const recurringBudgets = rows.map(rowToBudget);

  const newBudgets: Budget[] = [];

  for (const budget of recurringBudgets) {
    // Calculate next month's dates
    const endDate = new Date(budget.endDate);
    const nextStartDate = new Date(endDate);
    nextStartDate.setDate(nextStartDate.getDate() + 1);

    const nextEndDate = new Date(nextStartDate);
    nextEndDate.setMonth(nextEndDate.getMonth() + 1);
    nextEndDate.setDate(0); // Last day of the month

    // Check if budget already exists for next month
    const existingBudget = await getBudgetByCategory(
      budget.category,
      nextStartDate.toISOString().split('T')[0]
    );

    if (!existingBudget) {
      const newBudget = await createBudget({
        category: budget.category,
        amount: budget.amount,
        period: budget.period,
        startDate: nextStartDate.toISOString().split('T')[0],
        endDate: nextEndDate.toISOString().split('T')[0],
        isRecurring: budget.isRecurring,
        alertThreshold: budget.alertThreshold,
        currency: budget.currency,
      });
      newBudgets.push(newBudget);
    }
  }

  return newBudgets;
}

/**
 * Get budget period dates based on period type
 */
export function getBudgetPeriodDates(
  period: BudgetPeriod,
  startDate?: Date
): { startDate: string; endDate: string } {
  const start = startDate || new Date();

  if (period === 'monthly') {
    // First day of current month to last day
    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);

    return {
      startDate: monthStart.toISOString().split('T')[0],
      endDate: monthEnd.toISOString().split('T')[0],
    };
  }

  if (period === 'weekly') {
    // Monday to Sunday of current week
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(start.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
    };
  }

  if (period === 'yearly') {
    // Jan 1 to Dec 31 of current year
    const yearStart = new Date(start.getFullYear(), 0, 1);
    const yearEnd = new Date(start.getFullYear(), 11, 31);

    return {
      startDate: yearStart.toISOString().split('T')[0],
      endDate: yearEnd.toISOString().split('T')[0],
    };
  }

  // Default to monthly
  return getBudgetPeriodDates('monthly', start);
}

/**
 * Format budget period for display
 */
export function formatBudgetPeriod(budget: Budget): string {
  const start = new Date(budget.startDate);
  const end = new Date(budget.endDate);

  if (budget.period === 'monthly') {
    return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  if (budget.period === 'weekly') {
    return `Week of ${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`;
  }

  if (budget.period === 'yearly') {
    return start.getFullYear().toString();
  }

  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

export default {
  getBudgets,
  getActiveBudgets,
  getBudget,
  getBudgetWithSpending,
  getBudgetByCategory,
  getBudgetSummary,
  createBudget,
  updateBudget,
  deleteBudget,
  getAlertBudgets,
  createNextMonthBudgets,
  getBudgetPeriodDates,
  formatBudgetPeriod,
};
