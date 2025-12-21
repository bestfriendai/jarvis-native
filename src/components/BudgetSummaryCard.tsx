/**
 * BudgetSummaryCard Component
 * Displays aggregate budget statistics with visual indicators
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import type { BudgetSummary } from '../database/budgets';
import { HIT_SLOP } from '../constants/ui';

interface BudgetSummaryCardProps {
  summary: BudgetSummary;
  compact?: boolean;
}

export const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  summary,
  compact = false,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  const overallPercentage =
    summary.totalBudgeted > 0
      ? Math.round((summary.totalSpent / summary.totalBudgeted) * 100)
      : 0;

  const getOverallStatus = () => {
    if (overallPercentage >= 100) return 'exceeded';
    if (overallPercentage >= 80) return 'warning';
    return 'safe';
  };

  const getStatusColor = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'safe':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'exceeded':
        return colors.error;
      default:
        return colors.text.primary;
    }
  };

  if (compact) {
    return (
      <View style={styles.cardCompact}>
        <View style={styles.compactRow}>
          <View style={styles.compactItem}>
            <Text style={styles.compactLabel}>Budgeted</Text>
            <Text style={styles.compactValue}>
              {formatCurrency(summary.totalBudgeted)}
            </Text>
          </View>
          <View style={styles.compactDivider} />
          <View style={styles.compactItem}>
            <Text style={styles.compactLabel}>Spent</Text>
            <Text style={[styles.compactValue, { color: getStatusColor() }]}>
              {formatCurrency(summary.totalSpent)}
            </Text>
          </View>
          <View style={styles.compactDivider} />
          <View style={styles.compactItem}>
            <Text style={styles.compactLabel}>Remaining</Text>
            <Text
              style={[
                styles.compactValue,
                { color: summary.totalRemaining >= 0 ? colors.success : colors.error },
              ]}
            >
              {formatCurrency(summary.totalRemaining)}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Budget Overview</Text>
        {summary.budgetCount > 0 && (
          <Text style={styles.budgetCount}>{summary.budgetCount} active</Text>
        )}
      </View>

      {/* Main Stats */}
      <View style={styles.mainStats}>
        <View style={styles.mainStatItem}>
          <Text style={styles.mainStatLabel}>Total Budgeted</Text>
          <Text style={styles.mainStatValue}>
            {formatCurrency(summary.totalBudgeted)}
          </Text>
        </View>

        <View style={styles.mainStatItem}>
          <Text style={styles.mainStatLabel}>Total Spent</Text>
          <Text style={[styles.mainStatValue, { color: getStatusColor() }]}>
            {formatCurrency(summary.totalSpent)}
          </Text>
          <Text style={[styles.percentageText, { color: getStatusColor() }]}>
            {overallPercentage}% used
          </Text>
        </View>

        <View style={styles.mainStatItem}>
          <Text style={styles.mainStatLabel}>Remaining</Text>
          <Text
            style={[
              styles.mainStatValue,
              { color: summary.totalRemaining >= 0 ? colors.success : colors.error },
            ]}
          >
            {formatCurrency(summary.totalRemaining)}
          </Text>
        </View>
      </View>

      {/* Alerts */}
      {(summary.exceededCount > 0 || summary.warningCount > 0) && (
        <View style={styles.alerts}>
          {summary.exceededCount > 0 && (
            <View style={[styles.alertBadge, styles.alertBadgeError]}>
              <IconButton
                icon="alert-octagon"
                size={16}
                iconColor={colors.error}
                style={styles.alertIcon}
              
                hitSlop={HIT_SLOP}/>
              <Text style={[styles.alertText, { color: colors.error }]}>
                {summary.exceededCount} over budget
              </Text>
            </View>
          )}

          {summary.warningCount > 0 && (
            <View style={[styles.alertBadge, styles.alertBadgeWarning]}>
              <IconButton
                icon="alert-circle"
                size={16}
                iconColor={colors.warning}
                style={styles.alertIcon}
              
                hitSlop={HIT_SLOP}/>
              <Text style={[styles.alertText, { color: colors.warning }]}>
                {summary.warningCount} approaching limit
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardCompact: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  budgetCount: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  mainStats: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  mainStatItem: {
    alignItems: 'center',
  },
  mainStatLabel: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
    letterSpacing: typography.letterSpacing.wide,
  },
  mainStatValue: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  percentageText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginTop: spacing.xs,
  },
  alerts: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.md,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  alertBadgeError: {
    backgroundColor: `${colors.error}15`,
  },
  alertBadgeWarning: {
    backgroundColor: `${colors.warning}15`,
  },
  alertIcon: {
    margin: 0,
    padding: 0,
  },
  alertText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginLeft: spacing.xs,
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compactItem: {
    flex: 1,
    alignItems: 'center',
  },
  compactDivider: {
    width: 1,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.sm,
  },
  compactLabel: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  compactValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
});

export default BudgetSummaryCard;
