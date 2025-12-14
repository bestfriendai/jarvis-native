/**
 * BudgetProgressBar Component
 * Visual progress indicator for budget spending with color-coded status
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import type { BudgetStatus } from '../database/budgets';

interface BudgetProgressBarProps {
  spent: number;
  budgeted: number;
  status: BudgetStatus;
  showLabel?: boolean;
  compact?: boolean;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  spent,
  budgeted,
  status,
  showLabel = true,
  compact = false,
}) => {
  const percentUsed = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;

  const getStatusColor = () => {
    switch (status) {
      case 'safe':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'exceeded':
        return colors.error;
      default:
        return colors.primary.main;
    }
  };

  const getStatusBackgroundColor = () => {
    switch (status) {
      case 'safe':
        return `${colors.success}20`;
      case 'warning':
        return `${colors.warning}20`;
      case 'exceeded':
        return `${colors.error}20`;
      default:
        return `${colors.primary.main}20`;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>
            {formatCurrency(spent)} of {formatCurrency(budgeted)}
          </Text>
          <Text style={[styles.percentText, { color: getStatusColor() }]}>
            {Math.round(percentUsed)}%
          </Text>
        </View>
      )}

      <View
        style={[
          styles.track,
          compact && styles.trackCompact,
          { backgroundColor: getStatusBackgroundColor() },
        ]}
      >
        <View
          style={[
            styles.fill,
            compact && styles.fillCompact,
            {
              width: `${percentUsed}%`,
              backgroundColor: getStatusColor(),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  containerCompact: {
    marginVertical: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  labelText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  percentText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  track: {
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  trackCompact: {
    height: 6,
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  fillCompact: {
    height: 6,
  },
});

export default BudgetProgressBar;
