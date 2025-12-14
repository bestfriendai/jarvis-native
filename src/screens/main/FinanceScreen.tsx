/**
 * Finance Screen
 * Professional financial dashboard with assets, liabilities, and net worth tracking
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { IconButton, SegmentedButtons } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as financeDB from '../../database/finance';
import * as budgetsDB from '../../database/budgets';
import { AppButton, AppChip, EmptyState, LoadingState, AppCard } from '../../components/ui';
import { TransactionCardSkeleton } from '../../components/finance/TransactionCardSkeleton';
import { MetricCard } from '../../components/MetricCard';
import { BudgetCard } from '../../components/BudgetCard';
import { BudgetFormModal } from '../../components/BudgetFormModal';
import { BudgetSummaryCard } from '../../components/BudgetSummaryCard';
import { SpendingTrendChart, CategoryPieChart, MonthlyComparisonChart } from '../../components/charts';
import { ExportButton } from '../../components/finance/ExportButton';
import { CategoryPicker } from '../../components/finance/CategoryPicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';

type ViewMode = 'overview' | 'assets' | 'liabilities' | 'transactions' | 'budgets';
type TimeFilter = 'month' | 'lastMonth' | 'all';

export default function FinanceScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<financeDB.Asset | null>(null);
  const [selectedLiability, setSelectedLiability] = useState<financeDB.Liability | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<financeDB.Transaction | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<budgetsDB.Budget | null>(null);
  const [summary, setSummary] = useState<financeDB.FinanceSummary | null>(null);
  const [assets, setAssets] = useState<financeDB.Asset[]>([]);
  const [liabilities, setLiabilities] = useState<financeDB.Liability[]>([]);
  const [transactions, setTransactions] = useState<financeDB.Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<financeDB.Transaction[]>([]);
  const [budgets, setBudgets] = useState<budgetsDB.BudgetWithSpending[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<budgetsDB.BudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const { isPending } = useOptimisticUpdate();

  // Load finance data
  const loadData = useCallback(async () => {
    try {
      const [summaryData, assetsData, liabilitiesData, transactionsData, budgetsData, budgetSummaryData] = await Promise.all([
        financeDB.getFinanceSummary(),
        financeDB.getAssets(),
        financeDB.getLiabilities(),
        financeDB.getTransactions(),
        budgetsDB.getActiveBudgets(),
        budgetsDB.getBudgetSummary(),
      ]);
      setSummary(summaryData);
      setAssets(assetsData);
      setLiabilities(liabilitiesData);
      setTransactions(transactionsData);
      setBudgets(budgetsData);
      setBudgetSummary(budgetSummaryData);
    } catch (error) {
      console.error('[Finance] Error loading data:', error);
      Alert.alert('Error', 'Failed to load finance data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter transactions based on time filter
  useEffect(() => {
    const now = new Date();
    let startDate: string;
    let endDate: string;

    if (timeFilter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (timeFilter === 'lastMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    } else {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter(
      (t) => t.date >= startDate && t.date <= endDate
    );
    setFilteredTransactions(filtered);
  }, [transactions, timeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calculatePreviousMonth = () => {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .split('T')[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      .toISOString()
      .split('T')[0];

    const lastMonthTransactions = transactions.filter(
      (t) => t.date >= lastMonthStart && t.date <= lastMonthEnd
    );

    const income = lastMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = lastMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses, net: income - expenses };
  };

  const getCategoryBreakdown = () => {
    const breakdown: { [key: string]: number } = {};
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
      });

    return Object.entries(breakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value == null) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading && !summary) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Finance</Text>
          </View>
        </View>
        <ScrollView
          style={styles.content}
          accessible
          accessibilityLabel="Loading finances"
          accessibilityRole="progressbar"
        >
          <TransactionCardSkeleton />
          <TransactionCardSkeleton />
          <TransactionCardSkeleton />
          <TransactionCardSkeleton />
          <TransactionCardSkeleton />
          <TransactionCardSkeleton />
          <TransactionCardSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Finance</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>Track your wealth</Text>
            {isPending && (
              <View style={styles.savingIndicator}>
                <Text style={styles.savingText}>Saving...</Text>
              </View>
            )}
          </View>
        </View>
        {viewMode === 'transactions' && transactions.length > 0 && (
          <ExportButton transactions={transactions} />
        )}
      </View>

      {/* View Selector */}
      <View style={styles.viewSelectorContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.viewSelectorScroll}
        >
          {(['overview', 'budgets', 'transactions', 'assets', 'liabilities'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setViewMode(mode)}
              style={[
                styles.viewTab,
                viewMode === mode && styles.viewTabActive,
              ]}
            >
              <Text
                style={[
                  styles.viewTabText,
                  viewMode === mode && styles.viewTabTextActive,
                ]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'overview' && summary && (
          <>
            {/* Summary KPIs */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>NET WORTH</Text>
              <View style={styles.netWorthCard}>
                <Text
                  style={[
                    styles.netWorthValue,
                    { color: (summary.netWorth || 0) >= 0 ? colors.success : colors.error },
                  ]}
                >
                  {formatCurrency(summary.netWorth)}
                </Text>
                <Text style={styles.netWorthLabel}>
                  Assets: {formatCurrency(summary.totalAssets)} | Debts:{' '}
                  {formatCurrency(summary.totalLiabilities)}
                </Text>
              </View>
            </View>

            {/* Current Month Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>THIS MONTH</Text>
              <View style={styles.kpiGrid}>
                <MetricCard
                  label="Income"
                  value={formatCurrency(summary.monthlyIncome)}
                  variant="success"
                />
                <MetricCard
                  label="Expenses"
                  value={formatCurrency(summary.monthlyExpenses)}
                  variant="danger"
                />
                <MetricCard
                  label="Net Savings"
                  value={formatCurrency(summary.monthlyIncome - summary.monthlyExpenses)}
                  helper={`${Math.round(summary.savingsRate)}% rate`}
                  variant="info"
                />
              </View>
            </View>

            {/* Month Comparison */}
            {(() => {
              const prevMonth = calculatePreviousMonth();
              const incomeChange = summary.monthlyIncome - prevMonth.income;
              const expensesChange = summary.monthlyExpenses - prevMonth.expenses;
              const netChange = (summary.monthlyIncome - summary.monthlyExpenses) - prevMonth.net;

              return (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>VS LAST MONTH</Text>
                  <View style={styles.comparisonGrid}>
                    <View style={styles.comparisonCard}>
                      <Text style={styles.comparisonLabel}>Income</Text>
                      <Text
                        style={[
                          styles.comparisonValue,
                          { color: incomeChange >= 0 ? colors.success : colors.error },
                        ]}
                      >
                        {incomeChange >= 0 ? '+' : ''}
                        {formatCurrency(incomeChange)}
                      </Text>
                    </View>
                    <View style={styles.comparisonCard}>
                      <Text style={styles.comparisonLabel}>Expenses</Text>
                      <Text
                        style={[
                          styles.comparisonValue,
                          { color: expensesChange <= 0 ? colors.success : colors.error },
                        ]}
                      >
                        {expensesChange >= 0 ? '+' : ''}
                        {formatCurrency(expensesChange)}
                      </Text>
                    </View>
                    <View style={styles.comparisonCard}>
                      <Text style={styles.comparisonLabel}>Net</Text>
                      <Text
                        style={[
                          styles.comparisonValue,
                          { color: netChange >= 0 ? colors.success : colors.error },
                        ]}
                      >
                        {netChange >= 0 ? '+' : ''}
                        {formatCurrency(netChange)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })()}

            {/* Spending Trend Chart */}
            <View style={styles.section}>
              <SpendingTrendChart days={30} />
            </View>

            {/* Category Pie Chart */}
            <View style={styles.section}>
              <CategoryPieChart />
            </View>

            {/* Monthly Comparison Chart */}
            <View style={styles.section}>
              <MonthlyComparisonChart months={6} />
            </View>

            {/* Recent Assets */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>RECENT ASSETS</Text>
                <TouchableOpacity onPress={() => setViewMode('assets')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              {assets.slice(0, 3).map((asset) => (
                <FinanceItemCard
                  key={asset.id}
                  name={asset.name}
                  value={formatCurrency(asset.value)}
                  category={asset.type}
                  type="asset"
                />
              ))}
              {assets.length === 0 && (
                <Text style={styles.emptyText}>No assets tracked yet</Text>
              )}
            </View>

            {/* Recent Liabilities */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>RECENT LIABILITIES</Text>
                <TouchableOpacity onPress={() => setViewMode('liabilities')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              {liabilities.slice(0, 3).map((liability) => (
                <FinanceItemCard
                  key={liability.id}
                  name={liability.name}
                  value={formatCurrency(liability.amount)}
                  category={liability.interestRate ? `${liability.type} - ${liability.interestRate}% APR` : liability.type}
                  type="liability"
                />
              ))}
              {liabilities.length === 0 && (
                <Text style={styles.emptyText}>No liabilities tracked yet</Text>
              )}
            </View>

            {/* Budget Overview */}
            {budgetSummary && budgetSummary.budgetCount > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>BUDGETS</Text>
                  <TouchableOpacity onPress={() => setViewMode('budgets')}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                <BudgetSummaryCard summary={budgetSummary} compact />
              </View>
            )}
          </>
        )}

        {viewMode === 'assets' && (
          <>
            <AppButton
              title="Add Asset"
              onPress={() => setShowAssetModal(true)}
              fullWidth
              style={styles.addButton}
            />
            {assets.length === 0 ? (
              <EmptyState
                icon="💰"
                title="No assets yet"
                description="Track your assets to monitor your financial health"
                actionLabel="Add Asset"
                onAction={() => setShowAssetModal(true)}
              />
            ) : (
              <View style={styles.itemsList}>
                {assets.map((asset) => (
                  <FinanceItemCard
                    key={asset.id}
                    name={asset.name}
                    value={formatCurrency(asset.value)}
                    category={asset.type}
                    type="asset"
                  />
                ))}
              </View>
            )}
          </>
        )}

        {viewMode === 'liabilities' && (
          <>
            <AppButton
              title="Add Liability"
              onPress={() => setShowLiabilityModal(true)}
              fullWidth
              style={styles.addButton}
            />
            {liabilities.length === 0 ? (
              <EmptyState
                icon="📊"
                title="No liabilities yet"
                description="Track debts and liabilities for complete financial picture"
                actionLabel="Add Liability"
                onAction={() => setShowLiabilityModal(true)}
              />
            ) : (
              <View style={styles.itemsList}>
                {liabilities.map((liability) => (
                  <FinanceItemCard
                    key={liability.id}
                    name={liability.name}
                    value={formatCurrency(liability.amount)}
                    category={liability.interestRate ? `${liability.type} - ${liability.interestRate}% APR` : liability.type}
                    type="liability"
                  />
                ))}
              </View>
            )}
          </>
        )}

        {viewMode === 'budgets' && (
          <>
            <AppButton
              title="Create Budget"
              onPress={() => {
                setSelectedBudget(null);
                setShowBudgetModal(true);
              }}
              fullWidth
              style={styles.addButton}
            />

            {budgets.length === 0 ? (
              <EmptyState
                icon="💰"
                title="No budgets yet"
                description="Create budgets to track and manage your spending"
                actionLabel="Create Budget"
                onAction={() => {
                  setSelectedBudget(null);
                  setShowBudgetModal(true);
                }}
              />
            ) : (
              <View style={styles.itemsList}>
                {budgetSummary && <BudgetSummaryCard summary={budgetSummary} />}
                {budgets.map((budget) => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    onEdit={() => {
                      setSelectedBudget(budget);
                      setShowBudgetModal(true);
                    }}
                    onDelete={async () => {
                      Alert.alert(
                        'Delete Budget',
                        `Delete budget for ${budget.category}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await budgetsDB.deleteBudget(budget.id);
                                loadData();
                              } catch (error) {
                                console.error('Error deleting budget:', error);
                                Alert.alert('Error', 'Failed to delete budget');
                              }
                            },
                          },
                        ]
                      );
                    }}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {viewMode === 'transactions' && (
          <>
            {/* Time Filter */}
            <View style={styles.filterRow}>
              {(['month', 'lastMonth', 'all'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setTimeFilter(filter)}
                  style={[
                    styles.filterChip,
                    timeFilter === filter && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      timeFilter === filter && styles.filterChipTextActive,
                    ]}
                  >
                    {filter === 'month'
                      ? 'This Month'
                      : filter === 'lastMonth'
                      ? 'Last Month'
                      : 'All Time'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Transactions Summary */}
            {(() => {
              const income = filteredTransactions
                .filter((t) => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
              const expenses = filteredTransactions
                .filter((t) => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

              return (
                <View style={styles.transactionSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Income:</Text>
                    <Text style={[styles.summaryValue, { color: colors.success }]}>
                      {formatCurrency(income)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Expenses:</Text>
                    <Text style={[styles.summaryValue, { color: colors.error }]}>
                      {formatCurrency(expenses)}
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                    <Text style={styles.summaryLabelTotal}>Net:</Text>
                    <Text
                      style={[
                        styles.summaryValueTotal,
                        { color: income - expenses >= 0 ? colors.success : colors.error },
                      ]}
                    >
                      {formatCurrency(income - expenses)}
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* Add Transaction Button */}
            <AppButton
              title="Add Transaction"
              onPress={() => {
                setSelectedTransaction(null);
                setShowTransactionModal(true);
              }}
              fullWidth
              style={styles.addButton}
            />

            {/* Transaction List */}
            {filteredTransactions.length === 0 ? (
              <EmptyState
                icon="💳"
                title="No transactions"
                description="Start tracking your income and expenses"
                actionLabel="Add Transaction"
                onAction={() => {
                  setSelectedTransaction(null);
                  setShowTransactionModal(true);
                }}
              />
            ) : (
              <View style={styles.transactionList}>
                {filteredTransactions.map((transaction) => (
                  <View key={transaction.id} style={styles.transactionCard}>
                    <View style={styles.transactionContent}>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionCategory}>
                          {transaction.category}
                        </Text>
                        {transaction.description && (
                          <Text style={styles.transactionDescription}>
                            {transaction.description}
                          </Text>
                        )}
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.transactionAmount,
                          {
                            color:
                              transaction.type === 'income'
                                ? colors.success
                                : colors.error,
                          },
                        ]}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Transaction Modal */}
      <TransactionFormModal
        visible={showTransactionModal}
        transaction={selectedTransaction}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedTransaction(null);
        }}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* Asset Modal */}
      <AssetFormModal
        visible={showAssetModal}
        asset={selectedAsset}
        onClose={() => {
          setShowAssetModal(false);
          setSelectedAsset(null);
        }}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* Liability Modal */}
      <LiabilityFormModal
        visible={showLiabilityModal}
        liability={selectedLiability}
        onClose={() => {
          setShowLiabilityModal(false);
          setSelectedLiability(null);
        }}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* Budget Modal */}
      <BudgetFormModal
        visible={showBudgetModal}
        budget={selectedBudget}
        onClose={() => {
          setShowBudgetModal(false);
          setSelectedBudget(null);
        }}
        onSuccess={() => {
          loadData();
        }}
      />
    </View>
  );
}

// Finance Item Card Component
interface FinanceItemCardProps {
  name: string;
  value: string;
  category?: string;
  type: 'asset' | 'liability';
}

const FinanceItemCard: React.FC<FinanceItemCardProps> = ({
  name,
  value,
  category,
  type,
}) => {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemContent}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{name}</Text>
          {category && <Text style={styles.itemCategory}>{category}</Text>}
        </View>
        <Text
          style={[
            styles.itemValue,
            { color: type === 'asset' ? colors.success : colors.error },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
};

// Transaction Form Modal
interface TransactionFormModalProps {
  visible: boolean;
  transaction: financeDB.Transaction | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  visible,
  transaction,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<financeDB.TransactionType>(transaction?.type || 'expense');
  const [amount, setAmount] = useState(transaction ? (transaction.amount / 100).toString() : '');
  const [category, setCategory] = useState(transaction?.category || '');
  const [categoryIcon, setCategoryIcon] = useState('wallet');
  const [categoryColor, setCategoryColor] = useState('#3B82F6');
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(transaction?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setType(transaction?.type || 'expense');
      setAmount(transaction ? (transaction.amount / 100).toString() : '');
      setCategory(transaction?.category || '');
      setDate(transaction?.date || new Date().toISOString().split('T')[0]);
      setDescription(transaction?.description || '');
    }
  }, [visible, transaction]);

  const handleSubmit = async () => {
    if (isSubmitting || !amount || !category) return;

    setIsSubmitting(true);
    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      const data = {
        type,
        amount: amountCents,
        category,
        date,
        description: description || undefined,
      };

      if (transaction) {
        await financeDB.updateTransaction(transaction.id, data);
      } else {
        await financeDB.createTransaction(data);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{transaction ? 'Edit Transaction' : 'New Transaction'}</Text>
              <IconButton icon="close" onPress={onClose} iconColor={colors.text.tertiary} />
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Type Selector */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
                    onPress={() => setType('expense')}
                  >
                    <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
                      💸 Expense
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
                    onPress={() => setType('income')}
                  >
                    <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
                      💰 Income
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Amount</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.text.placeholder}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>

              {/* Category */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity
                  style={styles.categoryButton}
                  onPress={() => setShowCategoryPicker(true)}
                >
                  {category ? (
                    <View style={styles.selectedCategory}>
                      <View
                        style={[
                          styles.categoryIconSmall,
                          { backgroundColor: `${categoryColor}25` },
                        ]}
                      >
                        <Icon name={categoryIcon} size={20} color={categoryColor} />
                      </View>
                      <Text style={styles.categoryButtonText}>{category}</Text>
                    </View>
                  ) : (
                    <Text style={styles.categoryPlaceholder}>
                      Select category...
                    </Text>
                  )}
                  <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
                </TouchableOpacity>
              </View>

              {/* Date */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text.placeholder}
                  style={styles.input}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add details..."
                  placeholderTextColor={colors.text.placeholder}
                  multiline
                  numberOfLines={3}
                  style={[styles.input, styles.textArea]}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <AppButton title="Cancel" onPress={onClose} variant="outline" style={styles.modalButton} />
              <AppButton
                title={transaction ? 'Update' : 'Create'}
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!amount || !category}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>

        {/* Category Picker Modal */}
        <CategoryPicker
          visible={showCategoryPicker}
          type={type}
          selectedCategoryName={category}
          onSelect={(name, icon, color) => {
            setCategory(name);
            setCategoryIcon(icon);
            setCategoryColor(color);
          }}
          onClose={() => setShowCategoryPicker(false)}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Asset Form Modal
interface AssetFormModalProps {
  visible: boolean;
  asset: financeDB.Asset | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const AssetFormModal: React.FC<AssetFormModalProps> = ({
  visible,
  asset,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(asset?.name || '');
  const [type, setType] = useState(asset?.type || '');
  const [value, setValue] = useState(asset ? (asset.value / 100).toString() : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setName(asset?.name || '');
      setType(asset?.type || '');
      setValue(asset ? (asset.value / 100).toString() : '');
    }
  }, [visible, asset]);

  const handleSubmit = async () => {
    if (isSubmitting || !name || !value) return;

    setIsSubmitting(true);
    try {
      const valueCents = Math.round(parseFloat(value) * 100);
      const data = {
        name,
        type: type || 'Other',
        value: valueCents,
      };

      if (asset) {
        await financeDB.updateAsset(asset.id, data);
      } else {
        await financeDB.createAsset(data);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving asset:', error);
      Alert.alert('Error', 'Failed to save asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{asset ? 'Edit Asset' : 'New Asset'}</Text>
              <IconButton icon="close" onPress={onClose} iconColor={colors.text.tertiary} />
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Savings Account, House..."
                  placeholderTextColor={colors.text.placeholder}
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Type</Text>
                <TextInput
                  value={type}
                  onChangeText={setType}
                  placeholder="e.g., Cash, Property, Investment..."
                  placeholderTextColor={colors.text.placeholder}
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Value</Text>
                <TextInput
                  value={value}
                  onChangeText={setValue}
                  placeholder="0.00"
                  placeholderTextColor={colors.text.placeholder}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <AppButton title="Cancel" onPress={onClose} variant="outline" style={styles.modalButton} />
              <AppButton
                title={asset ? 'Update' : 'Create'}
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!name || !value}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Liability Form Modal
interface LiabilityFormModalProps {
  visible: boolean;
  liability: financeDB.Liability | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const LiabilityFormModal: React.FC<LiabilityFormModalProps> = ({
  visible,
  liability,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(liability?.name || '');
  const [type, setType] = useState(liability?.type || '');
  const [amount, setAmount] = useState(liability ? (liability.amount / 100).toString() : '');
  const [interestRate, setInterestRate] = useState(
    liability?.interestRate ? liability.interestRate.toString() : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setName(liability?.name || '');
      setType(liability?.type || '');
      setAmount(liability ? (liability.amount / 100).toString() : '');
      setInterestRate(liability?.interestRate ? liability.interestRate.toString() : '');
    }
  }, [visible, liability]);

  const handleSubmit = async () => {
    if (isSubmitting || !name || !amount) return;

    setIsSubmitting(true);
    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      const data = {
        name,
        type: type || 'Other',
        amount: amountCents,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
      };

      if (liability) {
        await financeDB.updateLiability(liability.id, data);
      } else {
        await financeDB.createLiability(data);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving liability:', error);
      Alert.alert('Error', 'Failed to save liability');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{liability ? 'Edit Liability' : 'New Liability'}</Text>
              <IconButton icon="close" onPress={onClose} iconColor={colors.text.tertiary} />
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Credit Card, Mortgage..."
                  placeholderTextColor={colors.text.placeholder}
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Type</Text>
                <TextInput
                  value={type}
                  onChangeText={setType}
                  placeholder="e.g., Loan, Debt, Mortgage..."
                  placeholderTextColor={colors.text.placeholder}
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Amount Owed</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.text.placeholder}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Interest Rate % (Optional)</Text>
                <TextInput
                  value={interestRate}
                  onChangeText={setInterestRate}
                  placeholder="e.g., 4.5"
                  placeholderTextColor={colors.text.placeholder}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <AppButton title="Cancel" onPress={onClose} variant="outline" style={styles.modalButton} />
              <AppButton
                title={liability ? 'Update' : 'Create'}
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!name || !amount}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  savingIndicator: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  savingText: {
    fontSize: typography.size.xs,
    color: colors.primary.main,
    fontWeight: typography.weight.medium,
  },
  viewSelectorContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  viewSelectorScroll: {
    gap: spacing.sm,
  },
  viewTab: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  viewTabActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  viewTabText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },
  viewTabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
  },
  viewAllText: {
    fontSize: typography.size.sm,
    color: colors.primary.main,
    fontWeight: typography.weight.medium,
  },
  netWorthCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  netWorthValue: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  netWorthLabel: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  kpiGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  addButton: {
    marginBottom: spacing.lg,
  },
  itemsList: {
    gap: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  itemDescription: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
    marginBottom: spacing.xs,
  },
  itemCategory: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  itemValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  emptyText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  // Comparison styles
  comparisonGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  comparisonCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  comparisonLabel: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  comparisonValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  // Category styles
  categoryList: {
    gap: spacing.sm,
  },
  categoryRow: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  categoryName: {
    fontSize: typography.size.base,
    color: colors.text.primary,
    fontWeight: typography.weight.medium,
  },
  categoryAmount: {
    fontSize: typography.size.base,
    color: colors.error,
    fontWeight: typography.weight.semibold,
  },
  // Filter styles
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterChipText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  // Transaction styles
  transactionSummary: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryRowTotal: {
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  summaryLabel: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  summaryValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  summaryLabelTotal: {
    fontSize: typography.size.base,
    color: colors.text.primary,
    fontWeight: typography.weight.semibold,
  },
  summaryValueTotal: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  transactionList: {
    gap: spacing.sm,
  },
  transactionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  transactionInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  transactionCategory: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  transactionDescription: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  transactionDate: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  transactionAmount: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  modalBody: {
    padding: spacing.base,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: typography.size.base,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeButton: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.md,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  typeButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  modalButton: {
    flex: 1,
  },
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.md,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  categoryIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonText: {
    fontSize: typography.size.base,
    color: colors.text.primary,
    fontWeight: typography.weight.medium,
  },
  categoryPlaceholder: {
    fontSize: typography.size.base,
    color: colors.text.placeholder,
  },
});
