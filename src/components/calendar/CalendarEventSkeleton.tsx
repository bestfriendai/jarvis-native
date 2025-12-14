/**
 * CalendarEventSkeleton - Loading placeholder for calendar events
 * Matches event list item layout with time, title, and metadata
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton, SkeletonCircle } from '../ui/Skeleton';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export const CalendarEventSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      {/* Time block on left */}
      <View style={styles.timeBlock}>
        <Skeleton width={50} height={16} />
        <Skeleton width={45} height={12} style={{ marginTop: spacing.xs }} />
      </View>

      {/* Event content */}
      <View style={styles.content}>
        {/* Event title */}
        <Skeleton width="80%" height={18} />

        {/* Description */}
        <Skeleton width="100%" height={14} style={{ marginTop: spacing.sm }} />
        <Skeleton width="60%" height={14} style={{ marginTop: spacing.xs }} />

        {/* Metadata row */}
        <View style={styles.metadata}>
          <View style={styles.metaItem}>
            <SkeletonCircle size={14} />
            <Skeleton width={80} height={12} style={{ marginLeft: spacing.xs }} />
          </View>
          <View style={styles.metaItem}>
            <SkeletonCircle size={14} />
            <Skeleton width={60} height={12} style={{ marginLeft: spacing.xs }} />
          </View>
        </View>
      </View>

      {/* Status indicator */}
      <View style={styles.statusIndicator} />
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
    borderLeftWidth: 3,
    borderLeftColor: colors.background.tertiary,
    ...shadows.sm,
  },
  timeBlock: {
    width: 70,
    alignItems: 'flex-start',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 3,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.xs,
  },
});
