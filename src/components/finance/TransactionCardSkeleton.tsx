/**
 * TransactionCardSkeleton - Loading placeholder for finance transactions
 * Matches transaction list item with category icon, description, and amount
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton, SkeletonCircle } from '../ui/Skeleton';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export const TransactionCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      {/* Category icon circle */}
      <SkeletonCircle size={40} />

      {/* Transaction details */}
      <View style={styles.content}>
        {/* Category/Description */}
        <Skeleton width="70%" height={16} />

        {/* Date */}
        <Skeleton width={80} height={12} style={{ marginTop: spacing.xs }} />

        {/* Additional info */}
        <Skeleton width="50%" height={12} style={{ marginTop: spacing.xs }} />
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Skeleton width={70} height={20} />
        <Skeleton width={50} height={12} style={{ marginTop: spacing.xs }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
});
