/**
 * TodaysFocusCard Component
 * Displays prioritized list of today's tasks, habits, and events
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { TodaysFocus, TodaysFocusItem } from '../database/dashboard';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { AppCard } from './ui/AppCard';
import { HIT_SLOP } from '../constants/ui';

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
          
                hitSlop={HIT_SLOP}/>
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
        
                hitSlop={HIT_SLOP}/>
      </TouchableOpacity>
    );
  };

  // Get the single top priority item (UX research: single focus reduces cognitive load)
  const allItems = [...focus.tasks, ...focus.habits, ...focus.events];
  const topItem = allItems.sort((a, b) => {
    // Sort by: overdue > high priority > medium priority > low priority
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    const priorityOrder: any = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.priority || 'low'] || 3) - (priorityOrder[b.priority || 'low'] || 3);
  })[0];

  if (focus.summary.totalItems === 0) {
    return (
      <AppCard variant="glass" style={styles.card}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✨</Text>
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptyText}>
            You have no pending items for today
          </Text>
        </View>
      </AppCard>
    );
  }

  const icon =
    topItem.type === 'task'
      ? 'checkbox-blank-outline'
      : topItem.type === 'habit'
      ? 'refresh'
      : 'calendar';

  const priorityColor = topItem.priority ? getPriorityColor(topItem.priority) : colors.primary.main;

  return (
    <AppCard variant="glass" style={styles.card}>
      <View style={styles.focusHeader}>
        <Text style={styles.focusLabel}>YOUR FOCUS TODAY</Text>
        {allItems.length > 1 && (
          <Text style={styles.itemCount}>+{allItems.length - 1} more</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.topFocusItem}
        onPress={() => topItem && onNavigate(topItem.type, topItem.id)}
        activeOpacity={0.8}
      >
        <View style={[styles.topIconContainer, { backgroundColor: priorityColor + '20' }]}>
          <IconButton
            icon={icon}
            size={40}              // BIGGER icon! (was 32)
            iconColor={priorityColor}
            style={styles.topIcon}
          
                hitSlop={HIT_SLOP}/>
        </View>

        <View style={styles.topContent}>
          <Text style={styles.topTitle} numberOfLines={2}>
            {topItem.title}
          </Text>

          <View style={styles.topMeta}>
            {topItem.time && (
              <Text style={styles.topTime}>
                {formatTime(topItem.time)}
              </Text>
            )}
            {topItem.isOverdue && (
              <View style={styles.topOverdueBadge}>
                <Text style={styles.topOverdueText}>OVERDUE</Text>
              </View>
            )}
            {topItem.project && (
              <Text style={styles.topProject} numberOfLines={1}>
                {topItem.project}
              </Text>
            )}
          </View>
        </View>

        <IconButton
          icon="chevron-right"
          size={24}
          iconColor={colors.text.secondary}
          style={styles.chevron}
        
                hitSlop={HIT_SLOP}/>
      </TouchableOpacity>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,       // More space (was md)
  },
  // HERO FOCUS DESIGN - Make it MASSIVE and beautiful!
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,       // More space (was base)
  },
  focusLabel: {
    fontSize: typography.size.sm,   // BIGGER (was xs)
    fontWeight: typography.weight.bold,
    color: colors.text.tertiary,
    letterSpacing: 2.5,             // More spacing (was 1.5)
    textTransform: 'uppercase',
  },
  itemCount: {
    fontSize: typography.size.base, // BIGGER (was sm)
    color: colors.primary.main,
    fontWeight: typography.weight.bold, // Bolder (was semibold)
  },
  topFocusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,            // Much more padding! (was base)
    backgroundColor: colors.background.primary + '40',
    borderRadius: borderRadius.xl,  // More rounded (was lg)
    borderWidth: 2,                 // Thicker border (was 1)
    borderColor: 'rgba(16, 232, 127, 0.3)', // Vibrant green tint (was white 0.05)
  },
  topIconContainer: {
    width: 80,                      // BIGGER (was 64)
    height: 80,                     // BIGGER (was 64)
    borderRadius: borderRadius.xl,  // More rounded (was lg)
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,        // More space (was base)
  },
  topIcon: {
    margin: 0,
  },
  topContent: {
    flex: 1,
  },
  topTitle: {
    fontSize: typography.size['2xl'], // MUCH BIGGER! (was lg)
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    lineHeight: typography.size['2xl'] * 1.3,
    marginBottom: spacing.sm,       // More space (was xs)
  },
  topMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,                // More space (was sm)
    alignItems: 'center',
  },
  topTime: {
    fontSize: typography.size.base,  // BIGGER (was sm)
    color: colors.text.secondary,
    fontWeight: typography.weight.semibold, // Bolder (was medium)
  },
  topOverdueBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,   // More padding (was sm)
    paddingVertical: 4,              // More padding (was 2)
    borderRadius: borderRadius.md,   // More rounded (was sm)
  },
  topOverdueText: {
    fontSize: typography.size.sm,    // BIGGER (was xs)
    color: colors.text.primary,
    fontWeight: typography.weight.bold,
    letterSpacing: 1,                // More spacing (was 0.5)
  },
  topProject: {
    fontSize: typography.size.base,  // BIGGER (was sm)
    color: colors.primary.main,
    fontWeight: typography.weight.semibold, // Bolder (was medium)
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
    paddingVertical: spacing['4xl'],  // More space (was 3xl)
  },
  emptyIcon: {
    fontSize: 80,                     // BIGGER! (was 64)
    marginBottom: spacing.xl,         // More space (was lg)
  },
  emptyTitle: {
    fontSize: typography.size['3xl'], // BIGGER! (was 2xl)
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,         // More space (was sm)
  },
  emptyText: {
    fontSize: typography.size.lg,     // BIGGER! (was base)
    color: colors.text.secondary,     // Brighter (was tertiary)
    textAlign: 'center',
  },
});

export default TodaysFocusCard;
