/**
 * BudgetCard Component
 * Display individual budget with progress and status
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { BudgetProgressBar } from './BudgetProgressBar';
import type { BudgetWithSpending } from '../database/budgets';

interface BudgetCardProps {
  budget: BudgetWithSpending;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  onPress,
  onEdit,
  onDelete,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: budget.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  const formatPeriod = () => {
    const start = new Date(budget.startDate);
    const end = new Date(budget.endDate);

    if (budget.period === 'monthly') {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (budget.period === 'weekly') {
      return `Week of ${start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`;
    }

    if (budget.period === 'yearly') {
      return start.getFullYear().toString();
    }

    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const getStatusIcon = () => {
    switch (budget.status) {
      case 'safe':
        return 'check-circle';
      case 'warning':
        return 'alert-circle';
      case 'exceeded':
        return 'alert-octagon';
      default:
        return 'circle';
    }
  };

  const getStatusColor = () => {
    switch (budget.status) {
      case 'safe':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'exceeded':
        return colors.error;
      default:
        return colors.text.tertiary;
    }
  };

  const CardContent = (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.categoryRow}>
            <Text style={styles.category}>{budget.category}</Text>
            {budget.isRecurring && (
              <View style={styles.recurringBadge}>
                <Text style={styles.recurringText}>♻️</Text>
              </View>
            )}
          </View>
          <Text style={styles.period}>{formatPeriod()}</Text>
        </View>

        <View style={styles.headerRight}>
          {onEdit && (
            <IconButton
              icon="pencil"
              size={20}
              iconColor={colors.text.tertiary}
              onPress={onEdit}
            />
          )}
          {onDelete && (
            <IconButton
              icon="delete"
              size={20}
              iconColor={colors.error}
              onPress={onDelete}
            />
          )}
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <BudgetProgressBar
          spent={budget.spent}
          budgeted={budget.amount}
          status={budget.status}
        />
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text
            style={[
              styles.statValue,
              {
                color: budget.remaining >= 0 ? colors.success : colors.error,
              },
            ]}
          >
            {formatCurrency(budget.remaining)}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Transactions</Text>
          <Text style={styles.statValue}>{budget.transactionCount}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Status</Text>
          <View style={styles.statusRow}>
            <IconButton
              icon={getStatusIcon()}
              size={16}
              iconColor={getStatusColor()}
              style={styles.statusIcon}
            />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    marginLeft: spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  category: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  recurringBadge: {
    marginLeft: spacing.sm,
  },
  recurringText: {
    fontSize: typography.size.sm,
  },
  period: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.sm,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    margin: 0,
    padding: 0,
  },
  statusText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginLeft: -spacing.xs,
  },
});

export default BudgetCard;
