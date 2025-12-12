/**
 * Finance Database Operations
 * CRUD operations for financial data with offline-first support
 */

import {
  generateId,
  getCurrentTimestamp,
  executeQuery,
  executeQuerySingle,
  executeWrite,
} from './index';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  description?: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  value: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface Liability {
  id: string;
  name: string;
  type: string;
  amount: number;
  interestRate?: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface FinanceSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

interface TransactionRow {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  description?: string;
  currency: string;
  created_at: string;
  updated_at: string;
  synced: number;
}

interface AssetRow {
  id: string;
  name: string;
  type: string;
  value: number;
  currency: string;
  created_at: string;
  updated_at: string;
  synced: number;
}

interface LiabilityRow {
  id: string;
  name: string;
  type: string;
  amount: number;
  interest_rate?: number;
  currency: string;
  created_at: string;
  updated_at: string;
  synced: number;
}

// Transaction Operations

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    category: row.category,
    date: row.date,
    description: row.description,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    synced: row.synced === 1,
  };
}

export async function getTransactions(): Promise<Transaction[]> {
  const sql = 'SELECT * FROM finance_transactions ORDER BY date DESC';
  const rows = await executeQuery<TransactionRow>(sql);
  return rows.map(rowToTransaction);
}

export async function getTransactionsByDateRange(
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  const sql = `
    SELECT * FROM finance_transactions
    WHERE date >= ? AND date <= ?
    ORDER BY date DESC
  `;
  const rows = await executeQuery<TransactionRow>(sql, [startDate, endDate]);
  return rows.map(rowToTransaction);
}

export async function getTransactionsByType(type: TransactionType): Promise<Transaction[]> {
  const sql = 'SELECT * FROM finance_transactions WHERE type = ? ORDER BY date DESC';
  const rows = await executeQuery<TransactionRow>(sql, [type]);
  return rows.map(rowToTransaction);
}

export async function createTransaction(data: {
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  description?: string;
  currency?: string;
}): Promise<Transaction> {
  const id = generateId();
  const now = getCurrentTimestamp();

  const sql = `
    INSERT INTO finance_transactions (
      id, type, amount, category, date, description, currency,
      created_at, updated_at, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `;

  const params = [
    id,
    data.type,
    data.amount,
    data.category,
    data.date,
    data.description || null,
    data.currency || 'USD',
    now,
    now,
  ];

  await executeWrite(sql, params);

  const transaction = await executeQuerySingle<TransactionRow>(
    'SELECT * FROM finance_transactions WHERE id = ?',
    [id]
  );

  if (!transaction) {
    throw new Error('Failed to create transaction');
  }

  return rowToTransaction(transaction);
}

export async function updateTransaction(
  id: string,
  data: Partial<{
    type: TransactionType;
    amount: number;
    category: string;
    date: string;
    description: string;
    currency: string;
  }>
): Promise<Transaction> {
  const now = getCurrentTimestamp();

  const updates: string[] = [];
  const params: any[] = [];

  if (data.type !== undefined) {
    updates.push('type = ?');
    params.push(data.type);
  }

  if (data.amount !== undefined) {
    updates.push('amount = ?');
    params.push(data.amount);
  }

  if (data.category !== undefined) {
    updates.push('category = ?');
    params.push(data.category);
  }

  if (data.date !== undefined) {
    updates.push('date = ?');
    params.push(data.date);
  }

  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description || null);
  }

  if (data.currency !== undefined) {
    updates.push('currency = ?');
    params.push(data.currency);
  }

  updates.push('updated_at = ?');
  params.push(now);

  updates.push('synced = 0');

  params.push(id);

  const sql = `UPDATE finance_transactions SET ${updates.join(', ')} WHERE id = ?`;
  await executeWrite(sql, params);

  const transaction = await executeQuerySingle<TransactionRow>(
    'SELECT * FROM finance_transactions WHERE id = ?',
    [id]
  );

  if (!transaction) {
    throw new Error('Transaction not found after update');
  }

  return rowToTransaction(transaction);
}

export async function deleteTransaction(id: string): Promise<void> {
  const sql = 'DELETE FROM finance_transactions WHERE id = ?';
  await executeWrite(sql, [id]);
}

// Asset Operations

function rowToAsset(row: AssetRow): Asset {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    value: row.value,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    synced: row.synced === 1,
  };
}

export async function getAssets(): Promise<Asset[]> {
  const sql = 'SELECT * FROM finance_assets ORDER BY value DESC';
  const rows = await executeQuery<AssetRow>(sql);
  return rows.map(rowToAsset);
}

export async function createAsset(data: {
  name: string;
  type: string;
  value: number;
  currency?: string;
}): Promise<Asset> {
  const id = generateId();
  const now = getCurrentTimestamp();

  const sql = `
    INSERT INTO finance_assets (
      id, name, type, value, currency, created_at, updated_at, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `;

  const params = [id, data.name, data.type, data.value, data.currency || 'USD', now, now];

  await executeWrite(sql, params);

  const asset = await executeQuerySingle<AssetRow>(
    'SELECT * FROM finance_assets WHERE id = ?',
    [id]
  );

  if (!asset) {
    throw new Error('Failed to create asset');
  }

  return rowToAsset(asset);
}

export async function updateAsset(
  id: string,
  data: Partial<{
    name: string;
    type: string;
    value: number;
    currency: string;
  }>
): Promise<Asset> {
  const now = getCurrentTimestamp();

  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }

  if (data.type !== undefined) {
    updates.push('type = ?');
    params.push(data.type);
  }

  if (data.value !== undefined) {
    updates.push('value = ?');
    params.push(data.value);
  }

  if (data.currency !== undefined) {
    updates.push('currency = ?');
    params.push(data.currency);
  }

  updates.push('updated_at = ?');
  params.push(now);

  updates.push('synced = 0');

  params.push(id);

  const sql = `UPDATE finance_assets SET ${updates.join(', ')} WHERE id = ?`;
  await executeWrite(sql, params);

  const asset = await executeQuerySingle<AssetRow>('SELECT * FROM finance_assets WHERE id = ?', [
    id,
  ]);

  if (!asset) {
    throw new Error('Asset not found after update');
  }

  return rowToAsset(asset);
}

export async function deleteAsset(id: string): Promise<void> {
  const sql = 'DELETE FROM finance_assets WHERE id = ?';
  await executeWrite(sql, [id]);
}

// Liability Operations

function rowToLiability(row: LiabilityRow): Liability {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    amount: row.amount,
    interestRate: row.interest_rate,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    synced: row.synced === 1,
  };
}

export async function getLiabilities(): Promise<Liability[]> {
  const sql = 'SELECT * FROM finance_liabilities ORDER BY amount DESC';
  const rows = await executeQuery<LiabilityRow>(sql);
  return rows.map(rowToLiability);
}

export async function createLiability(data: {
  name: string;
  type: string;
  amount: number;
  interestRate?: number;
  currency?: string;
}): Promise<Liability> {
  const id = generateId();
  const now = getCurrentTimestamp();

  const sql = `
    INSERT INTO finance_liabilities (
      id, name, type, amount, interest_rate, currency, created_at, updated_at, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
  `;

  const params = [
    id,
    data.name,
    data.type,
    data.amount,
    data.interestRate || null,
    data.currency || 'USD',
    now,
    now,
  ];

  await executeWrite(sql, params);

  const liability = await executeQuerySingle<LiabilityRow>(
    'SELECT * FROM finance_liabilities WHERE id = ?',
    [id]
  );

  if (!liability) {
    throw new Error('Failed to create liability');
  }

  return rowToLiability(liability);
}

export async function updateLiability(
  id: string,
  data: Partial<{
    name: string;
    type: string;
    amount: number;
    interestRate: number;
    currency: string;
  }>
): Promise<Liability> {
  const now = getCurrentTimestamp();

  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }

  if (data.type !== undefined) {
    updates.push('type = ?');
    params.push(data.type);
  }

  if (data.amount !== undefined) {
    updates.push('amount = ?');
    params.push(data.amount);
  }

  if (data.interestRate !== undefined) {
    updates.push('interest_rate = ?');
    params.push(data.interestRate || null);
  }

  if (data.currency !== undefined) {
    updates.push('currency = ?');
    params.push(data.currency);
  }

  updates.push('updated_at = ?');
  params.push(now);

  updates.push('synced = 0');

  params.push(id);

  const sql = `UPDATE finance_liabilities SET ${updates.join(', ')} WHERE id = ?`;
  await executeWrite(sql, params);

  const liability = await executeQuerySingle<LiabilityRow>(
    'SELECT * FROM finance_liabilities WHERE id = ?',
    [id]
  );

  if (!liability) {
    throw new Error('Liability not found after update');
  }

  return rowToLiability(liability);
}

export async function deleteLiability(id: string): Promise<void> {
  const sql = 'DELETE FROM finance_liabilities WHERE id = ?';
  await executeWrite(sql, [id]);
}

// Summary Operations

export async function getFinanceSummary(): Promise<FinanceSummary> {
  // Get total assets
  const assetsResult = await executeQuerySingle<{ total: number }>(
    'SELECT COALESCE(SUM(value), 0) as total FROM finance_assets'
  );
  const totalAssets = assetsResult?.total || 0;

  // Get total liabilities
  const liabilitiesResult = await executeQuerySingle<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM finance_liabilities'
  );
  const totalLiabilities = liabilitiesResult?.total || 0;

  // Get current month income/expenses
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  const incomeResult = await executeQuerySingle<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions
     WHERE type = 'income' AND date >= ? AND date <= ?`,
    [startOfMonth, endOfMonth]
  );
  const monthlyIncome = incomeResult?.total || 0;

  const expensesResult = await executeQuerySingle<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions
     WHERE type = 'expense' AND date >= ? AND date <= ?`,
    [startOfMonth, endOfMonth]
  );
  const monthlyExpenses = expensesResult?.total || 0;

  const netWorth = totalAssets - totalLiabilities;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
  };
}

export default {
  getTransactions,
  getTransactionsByDateRange,
  getTransactionsByType,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getLiabilities,
  createLiability,
  updateLiability,
  deleteLiability,
  getFinanceSummary,
};
