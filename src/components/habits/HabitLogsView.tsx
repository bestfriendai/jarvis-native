/**
 * HabitLogsView Component
 * Display and manage habit completion history with notes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import * as habitsDB from '../../database/habits';
import { HabitNotesModal } from './HabitNotesModal';
import { EmptyState, LoadingState } from '../ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { HIT_SLOP } from '../../constants/ui';

interface HabitLogsViewProps {
  habitId: string;
  habitName: string;
  onClose: () => void;
}

interface LogWithDate extends habitsDB.HabitLog {
  dateFormatted: string;
  timeAgo: string;
}

export const HabitLogsView: React.FC<HabitLogsViewProps> = ({
  habitId,
  habitName,
  onClose,
}) => {
  const [logs, setLogs] = useState<LogWithDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingLog, setEditingLog] = useState<LogWithDate | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);

  const loadLogs = async () => {
    try {
      // Get logs for the last 90 days
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const habitLogs = await habitsDB.getHabitLogs(habitId, startDate, endDate);

      // Filter to only show completed logs
      const completedLogs = habitLogs.filter((log) => log.completed);

      // Format dates
      const logsWithFormatting = completedLogs.map((log) => ({
        ...log,
        dateFormatted: formatDate(log.date),
        timeAgo: getTimeAgo(log.date),
      }));

      setLogs(logsWithFormatting);
    } catch (error) {
      console.error('[HabitLogsView] Error loading logs:', error);
      Alert.alert('Error', 'Failed to load habit history');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [habitId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
  };

  const handleEditNotes = (log: LogWithDate) => {
    setEditingLog(log);
    setShowNotesModal(true);
  };

  const handleSaveNotes = async (notes: string) => {
    if (!editingLog) return;

    try {
      await habitsDB.updateHabitLogNotes(habitId, editingLog.date, notes || null);
      setShowNotesModal(false);
      setEditingLog(null);
      await loadLogs();
    } catch (error) {
      console.error('[HabitLogsView] Error updating notes:', error);
      Alert.alert('Error', 'Failed to update notes');
    }
  };

  const handleDeleteLog = (log: LogWithDate) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this completion? This will affect your streak.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await habitsDB.deleteHabitLog(habitId, log.date);
              await loadLogs();
            } catch (error) {
              console.error('[HabitLogsView] Error deleting log:', error);
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  // Group logs by week or month
  const groupedLogs = groupLogsByWeek(logs);

  if (isLoading) {
    return <LoadingState fullScreen message="Loading history..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Completion History</Text>
          <Text style={styles.habitName}>{habitName}</Text>
          <Text style={styles.subtitle}>{logs.length} total completions</Text>
        </View>
        <IconButton
          icon="close"
          onPress={onClose}
          iconColor={colors.text.tertiary}
        
                hitSlop={HIT_SLOP}/>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
          />
        }
      >
        {logs.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No completions yet"
            description="Complete this habit to start building your history"
          />
        ) : (
          groupedLogs.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              {group.logs.map((log) => (
                <LogEntry
                  key={log.id}
                  log={log}
                  onEdit={() => handleEditNotes(log)}
                  onDelete={() => handleDeleteLog(log)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit Notes Modal */}
      {editingLog && (
        <HabitNotesModal
          visible={showNotesModal}
          habitName={habitName}
          initialNotes={editingLog.notes || ''}
          onSave={handleSaveNotes}
          onSkip={() => {}}
          onClose={() => {
            setShowNotesModal(false);
            setEditingLog(null);
          }}
          isEditing
        />
      )}
    </View>
  );
};

// Log Entry Component
interface LogEntryProps {
  log: LogWithDate;
  onEdit: () => void;
  onDelete: () => void;
}

const LogEntry: React.FC<LogEntryProps> = ({ log, onEdit, onDelete }) => {
  const hasNotes = log.notes && log.notes.trim().length > 0;

  return (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={styles.logDateContainer}>
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
          <View>
            <Text style={styles.logDate}>{log.dateFormatted}</Text>
            <Text style={styles.logTimeAgo}>{log.timeAgo}</Text>
          </View>
        </View>
        <View style={styles.logActions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>
              {hasNotes ? 'Edit' : 'Add Note'}
            </Text>
          </TouchableOpacity>
          <IconButton
            icon="delete-outline"
            size={20}
            iconColor={colors.error}
            onPress={onDelete}
          
                hitSlop={HIT_SLOP}/>
        </View>
      </View>

      {hasNotes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{log.notes}</Text>
        </View>
      )}
    </View>
  );
};

// Helper Functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = dateStr;
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateOnly === todayStr) {
    return 'Today';
  } else if (dateOnly === yesterdayStr) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  }
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
}

function groupLogsByWeek(
  logs: LogWithDate[]
): Array<{ label: string; logs: LogWithDate[] }> {
  const groups: { [key: string]: LogWithDate[] } = {};

  logs.forEach((log) => {
    const date = new Date(log.date);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    let label: string;
    if (diffDays < 7) {
      label = 'This Week';
    } else if (diffDays < 14) {
      label = 'Last Week';
    } else if (diffDays < 30) {
      label = 'Last Month';
    } else {
      const monthYear = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      label = monthYear;
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(log);
  });

  return Object.entries(groups).map(([label, logs]) => ({ label, logs }));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.base,
    paddingTop: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.background.secondary,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  habitName: {
    fontSize: typography.size.base,
    color: colors.primary.main,
    marginTop: spacing.xs,
    fontWeight: typography.weight.medium,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.base,
  },
  group: {
    marginBottom: spacing.xl,
  },
  groupLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  logCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  logDate: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
  },
  logTimeAgo: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  logActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.primary.main,
  },
  notesContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  notesLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  notesText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
});
