/**
 * DashboardCardSkeleton - Loading placeholder for dashboard metric cards
 * Matches metric cards with title, value, and chart/graph area
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton, SkeletonCircle } from '../ui/Skeleton';
import { colors, spacing, borderRadius, shadows } from '../../theme';

interface DashboardCardSkeletonProps {
  showChart?: boolean;
}

export const DashboardCardSkeleton: React.FC<DashboardCardSkeletonProps> = ({
  showChart = false,
}) => {
  return (
    <View style={styles.card}>
      {/* Header with icon and title */}
      <View style={styles.header}>
        <SkeletonCircle size={32} />
        <Skeleton width={120} height={16} style={{ marginLeft: spacing.md }} />
      </View>

      {/* Large metric value */}
      <View style={styles.metricContainer}>
        <Skeleton width={100} height={36} />
        <Skeleton width={80} height={14} style={{ marginTop: spacing.sm }} />
      </View>

      {/* Chart/graph placeholder */}
      {showChart && (
        <View style={styles.chartContainer}>
          <View style={styles.chartBars}>
            <View style={[styles.chartBar, { height: '60%' }]} />
            <View style={[styles.chartBar, { height: '80%' }]} />
            <View style={[styles.chartBar, { height: '45%' }]} />
            <View style={[styles.chartBar, { height: '90%' }]} />
            <View style={[styles.chartBar, { height: '65%' }]} />
            <View style={[styles.chartBar, { height: '75%' }]} />
            <View style={[styles.chartBar, { height: '50%' }]} />
          </View>
        </View>
      )}

      {/* Footer info */}
      <View style={styles.footer}>
        <SkeletonCircle size={12} />
        <Skeleton width={90} height={12} style={{ marginLeft: spacing.xs }} />
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
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricContainer: {
    marginTop: spacing.lg,
  },
  chartContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
  },
  chartBar: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.xs,
    marginHorizontal: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
});
