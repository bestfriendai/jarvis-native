/**
 * TaskPickerModal Component
 * Modal for selecting a task to link to a Pomodoro session
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import * as tasksDB from '../../database/tasks';
import type { Task } from '../../database/tasks';
import { typography, spacing, borderRadius, shadows } from '../../theme';

interface TaskPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (task: Task | null) => void;
  currentTaskId?: string | null;
}

export function TaskPickerModal({ visible, onClose, onSelect, currentTaskId }: TaskPickerModalProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const loadTasks = useCallback(async () => {
    try {
      // Load only active tasks (not completed/cancelled)
      const activeTasks = await tasksDB.getTasks({
        statuses: ['todo', 'in_progress', 'blocked'],
        sortField: 'dueDate',
        sortDirection: 'asc',
      });
      setTasks(activeTasks || []);
    } catch (error) {
      console.error('[TaskPickerModal] Error loading tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset state when modal opens and load tasks
  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setSearchQuery('');
      // Immediately invoke async function
      loadTasks().catch((error) => {
        console.error('[TaskPickerModal] Failed to load tasks in useEffect:', error);
        setIsLoading(false);
      });
    } else {
      // Reset state when modal closes (but keep isLoading false so next open works)
      setTasks([]);
      setIsLoading(false);
    }
  }, [visible, loadTasks]);

  // Compute filtered tasks directly from state (no separate state needed)
  const filteredTasks = searchQuery.trim()
    ? tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks;

  const handleSelect = (task: Task) => {
    setSearchQuery('');
    onClose();
    // Delay the onSelect call slightly to ensure modal closes first
    setTimeout(() => onSelect(task), 100);
  };

  const handleNoTask = () => {
    setSearchQuery('');
    onClose();
    setTimeout(() => onSelect(null), 100);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return colors.error;
      case 'high':
        return '#F59E0B';
      case 'medium':
        return colors.primary.main;
      case 'low':
        return colors.text.tertiary;
      default:
        return colors.text.secondary;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing.lg }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Link to Task</Text>
            <IconButton
              icon="close"
              size={24}
              iconColor={colors.text.primary}
              onPress={onClose}
            />
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks..."
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* No Task Option */}
          <TouchableOpacity
            style={[
              styles.taskItem,
              currentTaskId === null && styles.taskItemSelected,
            ]}
            onPress={handleNoTask}
            activeOpacity={0.7}
          >
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>No Task (Focus Session)</Text>
              <Text style={styles.taskDescription}>
                Start a pomodoro without linking to a specific task
              </Text>
            </View>
            {currentTaskId === null && (
              <Text style={[styles.checkmark, { color: colors.primary.main }]}>✓</Text>
            )}
          </TouchableOpacity>

          {/* Task List */}
          <ScrollView
            style={styles.taskList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {isLoading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Loading tasks...</Text>
              </View>
            ) : filteredTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📋</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'No tasks found' : 'No active tasks'}
                </Text>
                <Text style={[styles.emptyStateText, { fontSize: 12, marginTop: 8 }]}>
                  DEBUG: tasks.length={tasks.length}, filteredTasks.length={filteredTasks.length}, isLoading={isLoading.toString()}
                </Text>
              </View>
            ) : (
              filteredTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskItem,
                    currentTaskId === task.id && styles.taskItemSelected,
                  ]}
                  onPress={() => handleSelect(task)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(task.priority) }]} />
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text style={styles.taskDescription} numberOfLines={1}>
                        {task.description}
                      </Text>
                    )}
                    <View style={styles.taskMeta}>
                      {task.dueDate && (
                        <Text style={styles.taskDueDate}>
                          {formatDate(task.dueDate)}
                        </Text>
                      )}
                      {task.project?.name && (
                        <View style={styles.projectBadge}>
                          <Text style={styles.projectName} numberOfLines={1}>
                            {task.project.name}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {currentTaskId === task.id && (
                    <Text style={[styles.checkmark, { color: colors.primary.main }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof import('../../theme').getColors>) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.size.base,
    color: colors.text.primary,
    borderWidth: 1.5,
    borderColor: colors.border.default,
  },
  taskList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.xs,
  },
  taskItemSelected: {
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: spacing.md,
    position: 'absolute',
    left: 0,
  },
  taskInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  taskTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  taskDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  taskDueDate: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  projectBadge: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: 120,
  },
  projectName: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: typography.weight.bold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyStateText: {
    fontSize: typography.size.base,
    color: colors.text.tertiary,
  },
});
