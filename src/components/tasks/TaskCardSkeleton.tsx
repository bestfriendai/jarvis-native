/**
 * TaskCardSkeleton - Loading placeholder for task cards
 * Matches TaskCard layout with priority bar, title, description, and metadata
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton, SkeletonCircle, SkeletonText } from '../ui/Skeleton';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export const TaskCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      {/* Priority bar on left */}
      <View style={styles.priorityBar} />

      {/* Header with priority chip and icons */}
      <View style={styles.header}>
        <Skeleton width={80} height={24} borderRadius={12} />
        <View style={styles.headerIcons}>
          <SkeletonCircle size={20} style={{ marginLeft: spacing.sm }} />
        </View>
      </View>

      {/* Task title */}
      <Skeleton width="85%" height={20} style={{ marginTop: spacing.sm }} />

      {/* Description lines */}
      <View style={styles.description}>
        <Skeleton width="100%" height={14} />
        <Skeleton width="70%" height={14} style={{ marginTop: spacing.xs }} />
      </View>

      {/* Metadata row */}
      <View style={styles.metadata}>
        <View style={styles.metaItem}>
          <SkeletonCircle size={14} />
          <Skeleton width={70} height={12} style={{ marginLeft: spacing.xs }} />
        </View>
        <View style={styles.metaItem}>
          <SkeletonCircle size={14} />
          <Skeleton width={90} height={12} style={{ marginLeft: spacing.xs }} />
        </View>
      </View>

      {/* Tags */}
      <View style={styles.tags}>
        <Skeleton width={60} height={20} borderRadius={10} />
        <Skeleton width={75} height={20} borderRadius={10} style={{ marginLeft: spacing.sm }} />
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
    borderLeftWidth: 4,
    borderLeftColor: colors.background.tertiary,
    ...shadows.sm,
  },
  priorityBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.background.tertiary,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  description: {
    marginTop: spacing.md,
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
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
