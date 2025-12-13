/**
 * Tasks Screen
 * Professional task management with list, kanban, and priority matrix views
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  Animated,
  FlatList,
} from 'react-native';
import { IconButton, SegmentedButtons, Checkbox } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as tasksDB from '../../database/tasks';
import { AppButton, AppCard, AppChip, EmptyState, LoadingState } from '../../components/ui';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
} from '../../theme';

type ViewMode = 'list' | 'kanban' | 'matrix';
type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  tags: string[];
  project?: { id: string; name: string };
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; label: string }> = {
  low: { color: '#64748B', label: 'Low' },
  medium: { color: '#F59E0B', label: 'Medium' },
  high: { color: '#F97316', label: 'High' },
  urgent: { color: '#EF4444', label: 'Urgent' },
};

export default function TasksScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const insets = useSafeAreaInsets();

  // Load tasks from local database
  const loadTasks = useCallback(async () => {
    try {
      const filters = filterStatus !== 'all' ? { status: filterStatus } : undefined;
      const loadedTasks = await tasksDB.getTasks(filters);
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks, refreshTrigger]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await tasksDB.updateTask(taskId, {
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
      });
      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDelete = (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await tasksDB.deleteTask(taskId);
            await loadTasks();
          } catch (error) {
            console.error('Error deleting task:', error);
            Alert.alert('Error', 'Failed to delete task');
          }
        },
      },
    ]);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setShowCreateModal(true);
  };

  if (isLoading && tasks.length === 0) {
    return <LoadingState fullScreen message="Loading tasks..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.subtitle}>
            {tasks.filter((t) => t.status !== 'completed').length} active
          </Text>
        </View>
        <AppButton
          title="New Task"
          onPress={() => {
            setSelectedTask(null);
            setShowCreateModal(true);
          }}
          size="small"
        />
      </View>

      {/* View Mode Selector */}
      <View style={styles.viewSelectorContainer}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          buttons={[
            { value: 'list', label: 'List' },
            { value: 'kanban', label: 'Board' },
            { value: 'matrix', label: 'Matrix' },
          ]}
          style={styles.viewSelector}
          theme={{
            colors: {
              secondaryContainer: colors.primary.main,
              onSecondaryContainer: '#FFFFFF',
              onSurface: colors.text.secondary,
            },
          }}
        />
      </View>

      {/* Filters */}
      {viewMode === 'list' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {(['all', 'todo', 'in_progress', 'completed'] as const).map((status) => (
            <AppChip
              key={status}
              label={status === 'all' ? 'All' : STATUS_LABELS[status]}
              selected={filterStatus === status}
              onPress={() => setFilterStatus(status)}
              style={styles.filterChip}
            />
          ))}
        </ScrollView>
      )}

      {/* Content */}
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
        showsVerticalScrollIndicator={false}
      >
        {tasks.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No tasks yet"
            description={
              viewMode === 'list' && filterStatus !== 'all'
                ? `No ${filterStatus.replace('_', ' ')} tasks`
                : 'Create your first task to get started'
            }
            actionLabel="Create Task"
            onAction={() => {
              setSelectedTask(null);
              setShowCreateModal(true);
            }}
          />
        ) : (
          <>
            {viewMode === 'list' && (
              <View style={styles.listView}>
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </View>
            )}
            {viewMode === 'kanban' && (
              <KanbanView
                tasks={tasks}
                onStatusChange={handleStatusChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
            {viewMode === 'matrix' && (
              <MatrixView
                tasks={tasks}
                onStatusChange={handleStatusChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <TaskFormModal
        visible={showCreateModal}
        task={selectedTask}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedTask(null);
        }}
        onSuccess={() => {
          setRefreshTrigger(prev => prev + 1);
        }}
      />
    </View>
  );
}

// Task Card Component
interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  compact = false,
}) => {
  const [scaleValue] = useState(new Animated.Value(1));
  const isCompleted = task.status === 'completed';

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        onPress={() => onEdit(task)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[styles.taskCard, compact && styles.taskCardCompact]}
      >
        {/* Priority indicator */}
        {task.priority && (
          <View
            style={[
              styles.priorityIndicator,
              { backgroundColor: PRIORITY_CONFIG[task.priority].color },
            ]}
          />
        )}

        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <TouchableOpacity
              onPress={() =>
                onStatusChange(
                  task.id,
                  isCompleted ? 'todo' : 'completed'
                )
              }
              style={styles.checkbox}
            >
              <View
                style={[
                  styles.checkboxInner,
                  isCompleted && styles.checkboxChecked,
                ]}
              >
                {isCompleted && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.taskInfo}>
              <Text
                style={[
                  styles.taskTitle,
                  isCompleted && styles.taskTitleCompleted,
                ]}
                numberOfLines={compact ? 1 : 2}
              >
                {task.title}
              </Text>
              {task.description && !compact && (
                <Text style={styles.taskDescription} numberOfLines={2}>
                  {task.description}
                </Text>
              )}
            </View>
          </View>

          {!compact && (
            <>
              {/* Meta info */}
              <View style={styles.taskMeta}>
                {task.priority && (
                  <AppChip
                    label={PRIORITY_CONFIG[task.priority].label}
                    variant={
                      task.priority === 'urgent'
                        ? 'error'
                        : task.priority === 'high'
                        ? 'warning'
                        : 'default'
                    }
                    compact
                  />
                )}
                {task.tags.slice(0, 2).map((tag) => (
                  <AppChip key={tag} label={`#${tag}`} compact />
                ))}
              </View>

              {/* Actions */}
              <View style={styles.taskActions}>
                <TouchableOpacity
                  onPress={() => onEdit(task)}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDelete(task.id)}
                  style={styles.actionButton}
                >
                  <Text style={[styles.actionButtonText, styles.deleteText]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Kanban View Component
interface KanbanViewProps {
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
}) => {
  const columns: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'completed'];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.kanbanView}>
        {columns.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          return (
            <View key={status} style={styles.kanbanColumn}>
              <View style={styles.kanbanHeader}>
                <Text style={styles.kanbanHeaderText}>
                  {STATUS_LABELS[status]}
                </Text>
                <View style={styles.kanbanCount}>
                  <Text style={styles.kanbanCountText}>{columnTasks.length}</Text>
                </View>
              </View>
              <ScrollView
                style={styles.kanbanContent}
                showsVerticalScrollIndicator={false}
              >
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={onStatusChange}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    compact
                  />
                ))}
              </ScrollView>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

// Matrix View Component
interface MatrixViewProps {
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const MatrixView: React.FC<MatrixViewProps> = ({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
}) => {
  const matrix = {
    urgent: tasks.filter(
      (t) => t.priority === 'urgent' && t.status !== 'completed'
    ),
    high: tasks.filter(
      (t) => t.priority === 'high' && t.status !== 'completed'
    ),
    medium: tasks.filter(
      (t) => t.priority === 'medium' && t.status !== 'completed'
    ),
    low: tasks.filter(
      (t) => (t.priority === 'low' || !t.priority) && t.status !== 'completed'
    ),
  };

  const quadrants = [
    { key: 'urgent', label: 'Urgent', color: `${colors.error}20` },
    { key: 'high', label: 'High Priority', color: `${colors.warning}20` },
    { key: 'medium', label: 'Medium', color: `${colors.info}20` },
    { key: 'low', label: 'Low Priority', color: `${colors.background.tertiary}` },
  ];

  return (
    <View style={styles.matrixView}>
      {quadrants.map((quadrant) => (
        <View
          key={quadrant.key}
          style={[styles.matrixQuadrant, { backgroundColor: quadrant.color }]}
        >
          <Text style={styles.matrixTitle}>{quadrant.label}</Text>
          <Text style={styles.matrixCount}>
            {matrix[quadrant.key as keyof typeof matrix].length} tasks
          </Text>
          {matrix[quadrant.key as keyof typeof matrix].map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
              compact
            />
          ))}
        </View>
      ))}
    </View>
  );
};

// Task Form Modal
interface TaskFormModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  visible,
  task,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setTitle(task?.title || '');
      setDescription(task?.description || '');
      setPriority(task?.priority || 'medium');
    }
  }, [visible, task]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = {
        title,
        description: description || undefined,
        priority,
        status: task?.status || ('todo' as TaskStatus),
        tags: task?.tags || [],
      };

      if (task) {
        await tasksDB.updateTask(task.id, data);
      } else {
        await tasksDB.createTask(data);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(insets.bottom, spacing.base) },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {task ? 'Edit Task' : 'New Task'}
              </Text>
              <IconButton
                icon="close"
                onPress={onClose}
                iconColor={colors.text.tertiary}
              />
            </View>

            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Task title..."
                  placeholderTextColor={colors.text.placeholder}
                  style={[styles.input, titleFocused && styles.inputFocused]}
                  onFocus={() => setTitleFocused(true)}
                  onBlur={() => setTitleFocused(false)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Task description..."
                  placeholderTextColor={colors.text.placeholder}
                  style={[
                    styles.input,
                    styles.textArea,
                    descFocused && styles.inputFocused,
                  ]}
                  multiline
                  numberOfLines={4}
                  onFocus={() => setDescFocused(true)}
                  onBlur={() => setDescFocused(false)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.priorityButtons}>
                  {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map(
                    (p) => (
                      <AppChip
                        key={p}
                        label={PRIORITY_CONFIG[p].label}
                        selected={priority === p}
                        onPress={() => setPriority(p)}
                        style={styles.priorityChip}
                      />
                    )
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <AppButton
                title="Cancel"
                onPress={onClose}
                variant="outline"
                style={styles.modalButton}
              />
              <AppButton
                title={task ? 'Update' : 'Create'}
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!title.trim()}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  viewSelectorContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  viewSelector: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
  },
  filterContainer: {
    marginBottom: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  listView: {
    gap: spacing.md,
  },
  // Task Card styles
  taskCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  taskCardCompact: {
    marginBottom: spacing.sm,
  },
  priorityIndicator: {
    width: 4,
  },
  taskContent: {
    flex: 1,
    padding: spacing.base,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  checkboxInner: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: typography.weight.bold,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    lineHeight: typography.size.base * typography.lineHeight.snug,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.disabled,
  },
  taskDescription: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.primary.main,
  },
  deleteText: {
    color: colors.error,
  },
  // Kanban styles
  kanbanView: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  kanbanColumn: {
    width: 280,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  kanbanHeader: {
    padding: spacing.md,
    backgroundColor: colors.background.tertiary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kanbanHeaderText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  kanbanCount: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  kanbanCountText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
  },
  kanbanContent: {
    padding: spacing.sm,
    maxHeight: 400,
  },
  // Matrix styles
  matrixView: {
    gap: spacing.md,
  },
  matrixQuadrant: {
    padding: spacing.base,
    borderRadius: borderRadius.lg,
  },
  matrixTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  matrixCount: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  modalBody: {
    padding: spacing.base,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: typography.size.base,
  },
  inputFocused: {
    borderColor: colors.primary.main,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 100,
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
  },
  priorityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  priorityChip: {
    marginBottom: spacing.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  modalButton: {
    flex: 1,
  },
});
