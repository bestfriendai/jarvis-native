/**
 * Dashboard Screen
 * Beautiful, polished overview of daily metrics and quick actions
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { ActivityIndicator, Snackbar, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as dashboardDB from '../../database/dashboard';
import * as tasksDB from '../../database/tasks';
import * as financeDB from '../../database/finance';
import * as budgetsDB from '../../database/budgets';
import * as analyticsDB from '../../database/analytics';
import { MetricCard } from '../../components/MetricCard';
import { StartControls } from '../../components/StartControls';
import { TodaysFocusCard } from '../../components/TodaysFocusCard';
import { TaskLatencyWidget } from '../../components/dashboard/TaskLatencyWidget';
import { AppCard, AppButton, EmptyState, LoadingState, LastUpdated } from '../../components/ui';
import { DashboardCardSkeleton } from '../../components/dashboard/DashboardCardSkeleton';
import { DetailedChartModal, ChartDataType } from '../../components/charts/DetailedChartModal';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';
import { QuickCaptureSheet } from '../../components/dashboard/QuickCaptureSheet';
import { navigateToItem, navigateToViewAll } from '../../utils/navigation';
import { calculatePercentageChange } from '../../utils/chartUtils';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import {
  typography,
  spacing,
  borderRadius,
  shadows,
  textStyles,
  getColors,
} from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';
import {
  makeButton,
  makeTextInput,
  formatCurrencyForA11y,
  announceForAccessibility,
} from '../../utils/accessibility';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [metrics, setMetrics] = useState<dashboardDB.TodayMetrics | null>(null);
  const [macroGoals, setMacroGoals] = useState<dashboardDB.MacroGoal[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<budgetsDB.BudgetWithSpending[]>([]);
  const [todaysFocus, setTodaysFocus] = useState<dashboardDB.TodaysFocus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [lastSavedItem, setLastSavedItem] = useState<{
    type: 'idea' | 'study' | 'cash';
    id: string;
  } | null>(null);
  const [trendData, setTrendData] = useState<analyticsDB.DashboardTrendData | null>(null);
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<ChartDataType>('tasks');
  const [selectedChartTitle, setSelectedChartTitle] = useState('');
  const [quickCaptureVisible, setQuickCaptureVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Load dashboard data
  const loadData = useCallback(async () => {
    try {
      const [metricsData, goalsData, alertsData, focusData, trendsData] = await Promise.all([
        dashboardDB.getTodayMetrics(),
        dashboardDB.getMacroGoals(),
        budgetsDB.getAlertBudgets(),
        dashboardDB.getTodaysFocus(),
        analyticsDB.getDashboardTrendData(7),
      ]);
      setMetrics(metricsData);
      setMacroGoals(goalsData);
      setBudgetAlerts(alertsData);
      setTodaysFocus(focusData);
      setTrendData(trendsData);
    } catch (error) {
      console.error('[Dashboard] Error loading data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pull-to-refresh with haptics and timestamp
  const { refreshing, handleRefresh, lastUpdated } = useRefreshControl({
    screenName: 'dashboard',
    onRefresh: loadData,
  });

  const formatCash = (value: number | null, currency: string) => {
    if (value == null) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleQuickTask = async (title: string) => {
    const task = await tasksDB.createTask({
      title,
      tags: ['quick-capture'],
      priority: 'low',
    });
    setLastSavedItem({ type: 'idea', id: task.id });
    setSnackbarMessage('Task created!');
    setSnackbarVisible(true);
    await loadData();
  };

  const handleLogExpense = async (cashValue: string) => {
    const amount = parseFloat(cashValue);
    if (isNaN(amount)) {
      Alert.alert('Invalid Amount', 'Please enter a valid number');
      throw new Error('Invalid amount');
    }

    const transaction = await financeDB.createTransaction({
      type: amount >= 0 ? 'income' : 'expense',
      amount: Math.abs(amount),
      category: 'Cash Snapshot',
      date: new Date().toISOString().split('T')[0],
      description: 'Quick capture from dashboard',
    });
    setLastSavedItem({ type: 'cash', id: transaction.id });
    setSnackbarMessage('Expense logged!');
    setSnackbarVisible(true);
    await loadData();
  };

  const handleStartFocus = async () => {
    // Navigate to Focus screen
    // @ts-expect-error - Navigation type compatibility
    navigation.navigate('Focus');
  };

  const handleUndo = async () => {
    if (!lastSavedItem) return;

    try {
      if (lastSavedItem.type === 'idea' || lastSavedItem.type === 'study') {
        await tasksDB.deleteTask(lastSavedItem.id);
        setSnackbarMessage('Undone!');
      } else if (lastSavedItem.type === 'cash') {
        await financeDB.deleteTransaction(lastSavedItem.id);
        setSnackbarMessage('Undone!');
      }
      setLastSavedItem(null);
      await loadData();
    } catch (error) {
      console.error('[Dashboard] Error undoing:', error);
      Alert.alert('Error', 'Failed to undo');
    }
  };

  const handleFocusNavigate = (type: 'task' | 'habit' | 'event', id: string) => {
    // @ts-expect-error - Navigation type compatibility
    navigateToItem(navigation, type, id);
  };

  const handleFocusViewAll = (type: 'tasks' | 'habits' | 'events') => {
    // @ts-expect-error - Navigation type compatibility
    navigateToViewAll(navigation, type);
  };

  const handleOpenChart = (type: ChartDataType, title: string) => {
    setSelectedChartType(type);
    setSelectedChartTitle(title);
    setChartModalVisible(true);
  };

  const calculateMetricPercentageChange = (currentData: number[]): number => {
    if (!currentData || currentData.length < 2) return 0;
    const current = currentData[currentData.length - 1];
    const previous = currentData[0];
    return calculatePercentageChange(current, previous);
  };

  if (isLoading && !metrics) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        accessible
        accessibilityLabel="Loading dashboard"
        accessibilityRole="progressbar"
      >
        <View style={[styles.content, { paddingTop: insets.top + spacing.base }]}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.dateLabel}>TODAY</Text>
                <Text style={styles.dateText}>{getFormattedDate()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <DashboardCardSkeleton showChart />
            <DashboardCardSkeleton showChart />
            <DashboardCardSkeleton />
            <DashboardCardSkeleton />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: insets.bottom + spacing['3xl'] },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary.main}
          colors={[colors.primary.main]}
          progressBackgroundColor={colors.background.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.content, { paddingTop: insets.top + spacing.base }]}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.dateLabel}>TODAY</Text>
              <Text style={styles.dateText}>{getFormattedDate()}</Text>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <LastUpdated date={lastUpdated} style={styles.lastUpdated} />
            </View>
            <IconButton
              icon="magnify"
              iconColor={colors.text.secondary}
              size={24}
              onPress={() => navigation.navigate('Search' as never)}
              style={styles.searchButton}
              {...makeButton('Search', 'Double tap to search tasks, habits, and finances')}
            />
          </View>
        </View>

        {/* Today's Focus */}
        {todaysFocus && (
          <TodaysFocusCard
            focus={todaysFocus}
            onNavigate={handleFocusNavigate}
            onViewAll={handleFocusViewAll}
          />
        )}

        {/* Metrics Grid - 2 column layout */}
        {metrics && (
          <View style={styles.metricsSection}>
            <Text style={styles.sectionLabel}>YOUR PROGRESS</Text>
            <View style={styles.metricsGrid}>
              {/* Top row: 2 metrics side by side */}
              <View style={styles.metricsRow}>
                <MetricCard
                  label="Tasks"
                  value={metrics.starts}
                  helper={metrics.starts >= 3 ? 'Great!' : 'Keep going'}
                  variant={metrics.starts >= 3 ? 'success' : 'default'}
                  percentageChange={
                    trendData?.tasks ? calculateMetricPercentageChange(trendData.tasks) : undefined
                  }
                  onPress={() => handleOpenChart('tasks', 'Tasks Completed')}
                  style={styles.metricHalf}
                  compact
                  accessible={true}
                  accessibilityLabel={`Tasks completed today: ${metrics.starts}`}
                  accessibilityHint="Double tap to view detailed chart"
                />
                <MetricCard
                  label="Habits"
                  value={metrics.studyMinutes}
                  helper="Today"
                  variant="info"
                  percentageChange={
                    trendData?.habits ? calculateMetricPercentageChange(trendData.habits) : undefined
                  }
                  onPress={() => handleOpenChart('habits', 'Habits Completed')}
                  style={styles.metricHalf}
                  compact
                  accessible={true}
                  accessibilityLabel={`Habits completed today: ${metrics.studyMinutes}`}
                  accessibilityHint="Double tap to view detailed chart"
                />
              </View>
              {/* Bottom row: 1 metric as banner */}
              <MetricCard
                label="Cash on hand"
                value={formatCash(metrics.cash, metrics.currency)}
                helper="Latest snapshot"
                variant="success"
                percentageChange={
                  trendData?.spending
                    ? calculateMetricPercentageChange(trendData.spending)
                    : undefined
                }
                onPress={() => handleOpenChart('spending', 'Daily Spending')}
                accessible={true}
                accessibilityLabel={`Cash on hand: ${formatCurrencyForA11y(
                  metrics.cash || 0,
                  metrics.currency
                )}`}
                accessibilityHint="Double tap to view spending chart"
              />
            </View>
          </View>
        )}

        {/* Task Latency Widget */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TASK COMPLETION</Text>
          <TaskLatencyWidget />
        </View>

        {/* Budget Alerts */}
        {budgetAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BUDGET ALERTS</Text>
            {budgetAlerts.map((budget) => (
              <TouchableOpacity
                key={budget.id}
                style={[
                  styles.budgetAlert,
                  budget.status === 'exceeded'
                    ? styles.budgetAlertError
                    : styles.budgetAlertWarning,
                ]}
                onPress={() => navigation.navigate('Finance' as never)}
                {...makeButton(
                  `Budget alert: ${budget.category}, ${Math.round(budget.percentUsed)}% used, ${formatCash(
                    budget.remaining,
                    budget.currency
                  )} remaining`,
                  'Double tap to view budget details'
                )}
              >
                <View
                  style={styles.budgetAlertIcon}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                >
                  <IconButton
                    icon={budget.status === 'exceeded' ? 'alert-octagon' : 'alert-circle'}
                    size={20}
                    iconColor={budget.status === 'exceeded' ? colors.error : colors.warning}
                    style={{ margin: 0 }}
                  />
                </View>
                <View
                  style={styles.budgetAlertContent}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                >
                  <Text style={styles.budgetAlertCategory}>{budget.category}</Text>
                  <Text style={styles.budgetAlertText}>
                    {Math.round(budget.percentUsed)}% used • {formatCash(budget.remaining, budget.currency)} remaining
                  </Text>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={20}
                  iconColor={colors.text.tertiary}
                  style={{ margin: 0 }}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Start Controls Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK START</Text>
          <AppCard variant="elevated">
            <StartControls macroGoals={macroGoals} defaultDuration={10} />
          </AppCard>
        </View>
      </View>

      {/* Floating Action Button for Quick Capture */}
      {!quickCaptureVisible && (
        <FloatingActionButton
          icon="plus"
          onPress={() => setQuickCaptureVisible(true)}
          position="bottom-right"
        />
      )}

      {/* Quick Capture Bottom Sheet */}
      <QuickCaptureSheet
        visible={quickCaptureVisible}
        onClose={() => setQuickCaptureVisible(false)}
        onQuickTask={handleQuickTask}
        onLogExpense={handleLogExpense}
        onStartFocus={handleStartFocus}
      />

      {/* Snackbar for feedback */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={
          lastSavedItem
            ? {
                label: 'Undo',
                onPress: handleUndo,
              }
            : undefined
        }
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>

      {/* Detailed Chart Modal */}
      <DetailedChartModal
        visible={chartModalVisible}
        onClose={() => setChartModalVisible(false)}
        dataType={selectedChartType}
        title={selectedChartTitle}
      />
    </ScrollView>
  );
}

const colors = getColors();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  // Header styles
  header: {
    marginBottom: spacing['2xl'],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  searchButton: {
    margin: 0,
  },
  dateLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primary.main,
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
    marginBottom: spacing.xs,
  },
  greeting: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.regular,
    color: colors.text.tertiary,
  },
  lastUpdated: {
    marginTop: spacing.xs,
  },
  // Section styles
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing.md,
  },
  // Metrics styles
  metricsSection: {
    marginBottom: spacing.xl,
  },
  metricsGrid: {
    gap: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricHalf: {
    flex: 1,
  },
  // Budget alert styles
  budgetAlert: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    ...shadows.sm,
  },
  budgetAlertError: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}10`,
  },
  budgetAlertWarning: {
    borderColor: colors.warning,
    backgroundColor: `${colors.warning}10`,
  },
  budgetAlertIcon: {
    marginRight: spacing.sm,
  },
  budgetAlertContent: {
    flex: 1,
  },
  budgetAlertCategory: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  budgetAlertText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  snackbar: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
  },
});
