/**
 * Pomodoro History Component
 * Display list of completed and cancelled pomodoro sessions
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { PomodoroSession } from '../../database/pomodoro';
import { formatDuration } from '../../utils/pomodoroHelpers';
import { typography, spacing, borderRadius, shadows } from '../../theme';

interface PomodoroHistoryProps {
  sessions: PomodoroSession[];
  onSessionPress?: (session: PomodoroSession) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export function PomodoroHistory({
  sessions,
  onSessionPress,
  onDeleteSession,
}: PomodoroHistoryProps) {
  const { colors } = useTheme();

  const renderSession = ({ item }: { item: PomodoroSession }) => {
    const date = new Date(item.startedAt);
    const dateString = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    const statusColor =
      item.status === 'completed'
        ? colors.success
        : item.status === 'cancelled'
        ? colors.text.disabled
        : colors.warning;

    const statusIcon =
      item.status === 'completed'
        ? 'check-circle'
        : item.status === 'cancelled'
        ? 'close-circle'
        : 'clock-outline';

    return (
      <TouchableOpacity
        style={[
          styles.sessionCard,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.subtle,
          },
        ]}
        onPress={() => onSessionPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionInfo}>
            <View style={styles.statusRow}>
              <IconButton
                icon={statusIcon}
                iconColor={statusColor}
                size={20}
                style={styles.statusIcon}
              />
              <Text style={[styles.sessionTitle, { color: colors.text.primary }]}>
                Pomodoro #{item.sessionNumber}
              </Text>
            </View>
            <Text style={[styles.sessionTime, { color: colors.text.tertiary }]}>
              {dateString} at {timeString}
            </Text>
          </View>

          {onDeleteSession && (
            <IconButton
              icon="delete-outline"
              iconColor={colors.text.disabled}
              size={20}
              onPress={() => onDeleteSession(item.id)}
            />
          )}
        </View>

        <View style={styles.sessionDetails}>
          <View style={styles.detailItem}>
            <IconButton icon="timer" iconColor={colors.text.tertiary} size={18} />
            <Text style={[styles.detailText, { color: colors.text.secondary }]}>
              {formatDuration(item.durationMinutes)}
            </Text>
          </View>

          {item.status === 'completed' && item.completedAt && (
            <View style={styles.detailItem}>
              <IconButton icon="check" iconColor={colors.success} size={18} />
              <Text style={[styles.detailText, { color: colors.success }]}>
                Completed
              </Text>
            </View>
          )}

          {item.status === 'cancelled' && (
            <View style={styles.detailItem}>
              <IconButton icon="close" iconColor={colors.text.disabled} size={18} />
              <Text style={[styles.detailText, { color: colors.text.disabled }]}>
                Cancelled
              </Text>
            </View>
          )}
        </View>

        {item.notes && (
          <Text style={[styles.sessionNotes, { color: colors.text.tertiary }]}>
            {item.notes}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (sessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconButton icon="history" iconColor={colors.text.disabled} size={64} />
        <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
          No History Yet
        </Text>
        <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
          Your completed pomodoro sessions will appear here
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sessions}
      keyExtractor={(item) => item.id}
      renderItem={renderSession}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.lg,
  },
  sessionCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...shadows.xs,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionInfo: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusIcon: {
    margin: 0,
    marginRight: -spacing.xs,
  },
  sessionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  sessionTime: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
  },
  sessionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -spacing.xs,
  },
  detailText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginLeft: -spacing.xs,
  },
  sessionNotes: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.1)',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['4xl'],
  },
  emptyTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.regular,
    textAlign: 'center',
  },
});
