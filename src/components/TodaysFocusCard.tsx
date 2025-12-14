/**
 * TodaysFocusCard Component
 * Displays prioritized list of today's tasks, habits, and events
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import { TodaysFocus, TodaysFocusItem } from '../database/dashboard';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

interface TodaysFocusCardProps {
  focus: TodaysFocus;
  onNavigate: (type: 'task' | 'habit' | 'event', id: string) => void;
  onViewAll: (type: 'tasks' | 'habits' | 'events') => void;
}

export const TodaysFocusCard: React.FC<TodaysFocusCardProps> = ({
  focus,
  onNavigate,
  onViewAll,
}) => {
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.text.tertiary;
    }
  };

  const renderItem = (item: TodaysFocusItem) => {
    const icon =
      item.type === 'task'
        ? 'checkbox-blank-outline'
        : item.type === 'habit'
        ? 'refresh'
        : 'calendar';

    const priorityColor = item.priority ? getPriorityColor(item.priority) : undefined;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.focusItem,
          item.isOverdue && styles.focusItemOverdue,
          priorityColor && { borderLeftColor: priorityColor },
        ]}
        onPress={() => onNavigate(item.type, item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.itemIcon}>
          <IconButton
            icon={icon}
            size={20}
            iconColor={
              item.isOverdue
                ? colors.error
                : priorityColor || colors.primary.main
            }
            style={styles.iconButton}
          />
        </View>

        <View style={styles.itemContent}>
          <Text
            style={[
              styles.itemTitle,
              item.isOverdue && styles.itemTitleOverdue,
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          <View style={styles.itemMeta}>
            {item.time && (
              <Text style={styles.itemTime}>{formatTime(item.time)}</Text>
            )}
            {item.status && (
              <Text style={styles.itemStatus}>{item.status}</Text>
            )}
            {item.project && (
              <View style={styles.projectBadge}>
                <Text style={styles.projectText} numberOfLines={1}>
                  {item.project}
                </Text>
              </View>
            )}
            {item.isOverdue && (
              <View style={styles.overdueBadge}>
                <Text style={styles.overdueText}>Overdue</Text>
              </View>
            )}
          </View>
        </View>

        <IconButton
          icon="chevron-right"
          size={20}
          iconColor={colors.text.tertiary}
          style={styles.chevron}
        />
      </TouchableOpacity>
    );
  };

  if (focus.summary.totalItems === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Today's Focus</Text>
            <Text style={styles.subtitle}>All caught up!</Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✨</Text>
          <Text style={styles.emptyText}>
            You have no pending tasks or events for today
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today's Focus</Text>
          <Text style={styles.subtitle}>
            {focus.summary.totalItems} item{focus.summary.totalItems !== 1 ? 's' : ''}
            {focus.summary.highPriority > 0 && (
              <Text style={styles.highPriority}>
                {' '}
                • {focus.summary.highPriority} high priority
              </Text>
            )}
          </Text>
        </View>
      </View>

      {/* Tasks Section */}
      {focus.tasks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            <TouchableOpacity onPress={() => onViewAll('tasks')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {focus.tasks.map(renderItem)}
        </View>
      )}

      {/* Habits Section */}
      {focus.habits.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Habits</Text>
            <TouchableOpacity onPress={() => onViewAll('habits')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {focus.habits.map(renderItem)}
        </View>
      )}

      {/* Events Section */}
      {focus.events.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Events</Text>
            <TouchableOpacity onPress={() => onViewAll('events')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {focus.events.map(renderItem)}
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
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  highPriority: {
    color: colors.error,
    fontWeight: typography.weight.medium,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: typography.size.sm,
    color: colors.primary.main,
    fontWeight: typography.weight.medium,
  },
  focusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
    overflow: 'hidden',
  },
  focusItemOverdue: {
    borderLeftColor: colors.error,
    backgroundColor: `${colors.error}10`,
  },
  itemIcon: {
    paddingLeft: spacing.xs,
  },
  iconButton: {
    margin: 0,
  },
  itemContent: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  itemTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  itemTitleOverdue: {
    color: colors.error,
  },
  itemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  itemTime: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
  },
  itemStatus: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  projectBadge: {
    backgroundColor: colors.primary.main + '20',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    maxWidth: 120,
  },
  projectText: {
    fontSize: typography.size.xs,
    color: colors.primary.main,
    fontWeight: typography.weight.medium,
  },
  overdueBadge: {
    backgroundColor: colors.error + '20',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  overdueText: {
    fontSize: typography.size.xs,
    color: colors.error,
    fontWeight: typography.weight.semibold,
  },
  chevron: {
    margin: 0,
    marginRight: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.size.base,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

export default TodaysFocusCard;
