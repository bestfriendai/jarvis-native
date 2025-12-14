/**
 * HabitCardSkeleton - Loading placeholder for habit cards
 * Matches HabitCard layout with icon, name, streak, and heatmap
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton, SkeletonCircle } from '../ui/Skeleton';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export const HabitCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      {/* Header with icon and name */}
      <View style={styles.header}>
        <SkeletonCircle size={48} />
        <View style={styles.headerText}>
          <Skeleton width={150} height={18} />
          <Skeleton width={100} height={14} style={{ marginTop: spacing.xs }} />
        </View>
      </View>

      {/* Streak info */}
      <View style={styles.streakContainer}>
        <View style={styles.streakItem}>
          <SkeletonCircle size={16} />
          <Skeleton width={80} height={14} style={{ marginLeft: spacing.xs }} />
        </View>
        <View style={styles.streakItem}>
          <SkeletonCircle size={16} />
          <Skeleton width={70} height={14} style={{ marginLeft: spacing.xs }} />
        </View>
      </View>

      {/* Heatmap placeholder - grid of small squares */}
      <View style={styles.heatmapContainer}>
        <View style={styles.heatmapRow}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={styles.heatmapCell} />
          ))}
        </View>
        <View style={styles.heatmapRow}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={styles.heatmapCell} />
          ))}
        </View>
        <View style={styles.heatmapRow}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={styles.heatmapCell} />
          ))}
        </View>
      </View>

      {/* Footer actions */}
      <View style={styles.footer}>
        <Skeleton width={60} height={12} />
        <SkeletonCircle size={20} />
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
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heatmapContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  heatmapCell: {
    width: 32,
    height: 32,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
});
