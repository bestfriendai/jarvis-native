/**
 * Tasks Screen
 * Professional task management with list view
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
import { IconButton, Checkbox, Badge } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as tasksDB from '../../database/tasks';
import * as undoService from '../../services/undo';
import type { Project } from '../../database/projects';
import { AppButton, AppCard, AppChip, EmptyState, LoadingState, LastUpdated, SearchBar } from '../../components/ui';
import { TaskCardSkeleton } from '../../components/tasks/TaskCardSkeleton';
import { RecurrencePicker } from '../../components/RecurrencePicker';
import { ProjectPicker } from '../../components/ProjectPicker';
import { TaskFilterBar } from '../../components/TaskFilterBar';
import { BulkActionBar } from '../../components/tasks/BulkActionBar';
import { SwipeableTaskItem } from '../../components/tasks/SwipeableTaskItem';
import { EnhancedDatePicker } from '../../components/tasks/EnhancedDatePicker';
import { TaskLatencyBadge } from '../../components/tasks/TaskLatencyBadge';
import * as filterStore from '../../store/taskFilterStore';
import { clearHighlight } from '../../utils/navigation';
import type { RecurrenceRule } from '../../types';
import { formatDueDate, getDateUrgency, getDaysUntil } from '../../utils/dateUtils';
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate';
import { useTooltip } from '../../hooks/useTooltip';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import { useDebounce } from '../../hooks/useDebounce';
import Tooltip from '../../components/ui/Tooltip';
import {
  makeButton,
  makeCheckbox,
  makeTextInput,
  makeImage,
  makeTaskLabel,
  announceForAccessibility,
} from '../../utils/accessibility';
import {
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  getColors,
} from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';
import { PRIORITY_COLORS, PRIORITY_LABELS, PRIORITY_ICONS } from '../../constants/priorities';
import { sortTasks, isOverdue } from '../../utils/taskSorting';

type ViewMode = 'list';
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
  recurrence?: RecurrenceRule;
  projectId?: string;
  project?: { id: string; name: string; color?: string };
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function TasksScreen() {
  const { colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as { highlightId?: string; scrollTo?: boolean } | undefined;
  const viewMode: ViewMode = 'list'; // Only list view is implemented
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all' | 'overdue'>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<filterStore.TaskFilters>(filterStore.getFilters());
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const insets = useSafeAreaInsets();
  const { updateOptimistically, isPending } = useOptimisticUpdate();
  const tooltip = useTooltip();

  // Load persisted filters on mount
  useEffect(() => {
    filterStore.loadFilters().then(setFilters);
  }, []);

  // Load tasks from local database with filters
  // Note: Filtering is done at the database level for performance
  // The taskFiltering utilities in src/utils/taskFiltering.ts are available
  // for client-side filtering when needed (e.g., in-memory filter changes)
  const loadTasks = useCallback(async () => {
    try {
      const loadedTasks = await tasksDB.getTasks(filters);
      // Apply intelligent sorting: status > overdue > priority > due date > created date
      const sortedTasks = sortTasks(loadedTasks);
      setTasks(sortedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks, refreshTrigger]);

  // Pull-to-refresh with haptics and timestamp
  const { refreshing, handleRefresh, lastUpdated } = useRefreshControl({
    screenName: 'tasks',
    onRefresh: loadTasks,
  });

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const previousTasks = [...tasks];
    const updatedTasks = tasks.map(t =>
      t.id === taskId
        ? { ...t, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined }
        : t
    );

    await updateOptimistically(
      // Optimistic update
      () => setTasks(updatedTasks),
      // Async operation
      async () => {
        await tasksDB.updateTask(taskId, {
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
        });
        // Reload to get fresh data from DB
        await loadTasks();
      },
      // Options
      {
        onError: (error) => {
          console.error('[TasksScreen] Error updating task:', error);
          setTasks(previousTasks); // Rollback
        },
      }
    );
  };

  const handleDelete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      // Optimistically remove from UI
      const previousTasks = [...tasks];
      setTasks(tasks.filter(t => t.id !== taskId));

      // Delete with undo capability
      await undoService.deleteTask(
        task as tasksDB.Task,
        // onDeleted callback
        () => {
          console.log('[TasksScreen] Task deleted successfully');
        },
        // onUndone callback
        async () => {
          console.log('[TasksScreen] Task undo requested, reloading...');
          await loadTasks();
        }
      );
    } catch (error) {
      console.error('[TasksScreen] Error deleting task:', error);
      // Reload tasks to restore state
      await loadTasks();
      Alert.alert('Error', 'Failed to delete task. Please try again.');
    }
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setShowCreateModal(true);
  };

  const handleApplyFilters = (newFilters: filterStore.TaskFilters) => {
    setFilters(newFilters);
  };

  // Bulk selection handlers
  const toggleBulkSelectMode = () => {
    setBulkSelectMode(!bulkSelectMode);
    setSelectedTaskIds(new Set());
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const selectAllTasks = () => {
    const allIds = new Set(tasks.map(t => t.id));
    setSelectedTaskIds(allIds);
  };

  const deselectAllTasks = () => {
    setSelectedTaskIds(new Set());
  };

  // Bulk operations
  const handleBulkComplete = async () => {
    try {
      const taskIdsArray = Array.from(selectedTaskIds);
      await tasksDB.bulkCompleteTasks(taskIdsArray);
      await loadTasks();
      setBulkSelectMode(false);
      setSelectedTaskIds(new Set());
      Alert.alert('Success', `Completed ${taskIdsArray.length} task(s)`);
    } catch (error) {
      console.error('[TasksScreen] Bulk complete error:', error);
      Alert.alert('Error', 'Failed to complete tasks. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const taskIdsArray = Array.from(selectedTaskIds);
      const tasksToDelete = tasks.filter(t => taskIdsArray.includes(t.id));

      // Optimistically remove from UI
      setTasks(tasks.filter(t => !taskIdsArray.includes(t.id)));
      setBulkSelectMode(false);
      setSelectedTaskIds(new Set());

      // Delete with undo capability
      await undoService.deleteTasks(
        tasksToDelete as tasksDB.Task[],
        // onDeleted callback
        () => {
          console.log(`[TasksScreen] ${tasksToDelete.length} tasks deleted successfully`);
        },
        // onUndone callback
        async () => {
          console.log('[TasksScreen] Bulk delete undo requested, reloading...');
          await loadTasks();
        }
      );
    } catch (error) {
      console.error('[TasksScreen] Bulk delete error:', error);
      await loadTasks();
      Alert.alert('Error', 'Failed to delete tasks. Please try again.');
    }
  };

  const handleBulkChangeStatus = async (status: TaskStatus) => {
    try {
      const taskIdsArray = Array.from(selectedTaskIds);
      await tasksDB.bulkUpdateTasks(taskIdsArray, {
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined,
      });
      await loadTasks();
      setBulkSelectMode(false);
      setSelectedTaskIds(new Set());
      Alert.alert('Success', `Updated ${taskIdsArray.length} task(s) to ${status}`);
    } catch (error) {
      console.error('[TasksScreen] Bulk status change error:', error);
      Alert.alert('Error', 'Failed to update task status. Please try again.');
    }
  };

  const handleBulkChangePriority = async (priority: TaskPriority) => {
    try {
      const taskIdsArray = Array.from(selectedTaskIds);
      await tasksDB.bulkUpdateTasks(taskIdsArray, { priority });
      await loadTasks();
      setBulkSelectMode(false);
      setSelectedTaskIds(new Set());
      Alert.alert('Success', `Updated ${taskIdsArray.length} task(s) to ${priority} priority`);
    } catch (error) {
      console.error('[TasksScreen] Bulk priority change error:', error);
      Alert.alert('Error', 'Failed to update task priority. Please try again.');
    }
  };

  const handleBulkMoveToProject = async (projectId: string | null) => {
    try {
      const taskIdsArray = Array.from(selectedTaskIds);
      await tasksDB.bulkUpdateTasks(taskIdsArray, { projectId: projectId || undefined });
      await loadTasks();
      setBulkSelectMode(false);
      setSelectedTaskIds(new Set());

      const projectName = projectId
        ? availableProjects.find(p => p.id === projectId)?.name || 'project'
        : 'No Project';
      Alert.alert('Success', `Moved ${taskIdsArray.length} task(s) to ${projectName}`);
    } catch (error) {
      console.error('[TasksScreen] Bulk move error:', error);
      Alert.alert('Error', 'Failed to move tasks. Please try again.');
    }
  };

  // Extract unique projects and tags from tasks
  const availableProjects: Array<{ id: string; name: string; color?: string }> = Array.from(
    new Map(
      tasks
        .filter((t) => t.project)
        .map((t) => [t.project!.id, t.project!])
    ).values()
  );

  const availableTags = Array.from(
    new Set(tasks.flatMap((t) => t.tags))
  ).sort();

  const activeFilterCount = filterStore.countActiveFilters(filters);

  // Apply search and status filtering
  const filteredTasks = tasks.filter((task) => {
    // Apply quick status filter (from chips)
    if (filterStatus === 'overdue') {
      if (!isOverdue(task.dueDate, task.status)) {
        return false;
      }
    } else if (filterStatus !== 'all' && task.status !== filterStatus) {
      return false;
    }

    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(query);
      const matchesDescription = task.description?.toLowerCase().includes(query);
      const matchesTags = task.tags.some(tag => tag.toLowerCase().includes(query));
      const matchesProject = task.project?.name.toLowerCase().includes(query);

      if (!matchesTitle && !matchesDescription && !matchesTags && !matchesProject) {
        return false;
      }
    }

    return true;
  });

  if (isLoading && tasks.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Tasks</Text>
          </View>
        </View>
        <ScrollView
          style={styles.content}
          accessible
          accessibilityLabel="Loading tasks"
          accessibilityRole="progressbar"
        >
          <TaskCardSkeleton />
          <TaskCardSkeleton />
          <TaskCardSkeleton />
          <TaskCardSkeleton />
          <TaskCardSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>
            {bulkSelectMode ? `${selectedTaskIds.size} Selected` : 'Tasks'}
          </Text>
          {!bulkSelectMode && (
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitle}>
                {tasks.filter((t) => t.status !== 'completed').length} active
                {activeFilterCount > 0 && (
                  <Text style={styles.filterBadgeText}> • {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}</Text>
                )}
              </Text>
              {isPending && (
                <View style={styles.savingIndicator}>
                  <Text style={styles.savingText}>Saving...</Text>
                </View>
              )}
              <LastUpdated date={lastUpdated} />
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {bulkSelectMode ? (
            <IconButton
              icon="close"
              size={24}
              onPress={toggleBulkSelectMode}
              iconColor={colors.text.primary}
              {...makeButton('Exit bulk select mode', 'Double tap to exit selection mode')}
            />
          ) : (
            <>
              <IconButton
                icon="checkbox-multiple-marked-outline"
                size={24}
                onPress={toggleBulkSelectMode}
                iconColor={colors.text.secondary}
                {...makeButton('Bulk select mode', 'Double tap to select multiple tasks')}
              />
              <View style={styles.filterButtonContainer}>
                <IconButton
                  icon="filter-variant"
                  size={24}
                  onPress={() => setShowFilterModal(true)}
                  iconColor={activeFilterCount > 0 ? colors.primary.main : colors.text.secondary}
                  style={styles.filterButton}
                  {...makeButton(
                    activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : 'Filters',
                    'Double tap to open filter options'
                  )}
                />
                {activeFilterCount > 0 && (
                  <View
                    style={styles.filterCountBadge}
                    accessible={false}
                    importantForAccessibility="no-hide-descendants"
                  >
                    <Text style={styles.filterCountText}>{activeFilterCount}</Text>
                  </View>
                )}
              </View>
              <AppButton
                title="New Task"
                onPress={() => {
                  setSelectedTask(null);
                  setShowCreateModal(true);
                }}
                size="small"
                {...makeButton('Create new task', 'Double tap to create a new task')}
              />
            </>
          )}
        </View>
      </View>

      {/* Bulk Action Bar */}
      {bulkSelectMode && (
        <BulkActionBar
          selectedCount={selectedTaskIds.size}
          onSelectAll={selectAllTasks}
          onDeselectAll={deselectAllTasks}
          onComplete={handleBulkComplete}
          onDelete={handleBulkDelete}
          onChangeStatus={handleBulkChangeStatus}
          onChangePriority={handleBulkChangePriority}
          onMoveToProject={handleBulkMoveToProject}
          availableProjects={availableProjects}
        />
      )}

      {/* Search Bar */}
      {!bulkSelectMode && (
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tasks..."
            resultCount={filteredTasks.length}
            showResultCount={searchQuery.length > 0}
          />
        </View>
      )}

      {/* View Mode Selector - Removed: Only list view is implemented */}

      {/* Filters */}
      {viewMode === 'list' && !bulkSelectMode && (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            {(['all', 'overdue', 'todo', 'in_progress', 'completed'] as const).map((status) => (
              <AppChip
                key={status}
                label={status === 'all' ? 'All' : status === 'overdue' ? 'Overdue' : STATUS_LABELS[status]}
                selected={filterStatus === status}
                onPress={() => setFilterStatus(status)}
                style={styles.filterChip}
              />
            ))}
            {activeFilterCount > 0 && (
              <TouchableOpacity
                style={[styles.clearFiltersButton, { borderColor: colors.error }]}
                onPress={() => {
                  setFilters(filterStore.getDefaultFilters());
                  announceForAccessibility('All advanced filters cleared');
                }}
                {...makeButton('Clear all advanced filters', 'Double tap to reset all filter options')}
              >
                <Icon name="filter-remove" size={16} color={colors.error} />
                <Text style={[styles.clearFiltersText, { color: colors.error }]}>
                  Clear {activeFilterCount}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          {activeFilterCount > 0 && (
            <View style={[styles.activeFiltersIndicator, { backgroundColor: `${colors.primary.main}15`, borderColor: `${colors.primary.main}40` }]}>
              <Icon name="filter-check" size={14} color={colors.primary.main} />
              <Text style={[styles.activeFiltersText, { color: colors.primary.main }]}>
                {activeFilterCount} advanced filter{activeFilterCount > 1 ? 's' : ''} active
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Content */}
      {viewMode === 'list' ? (
        <FlatList
          data={filteredTasks}
          renderItem={({ item: task }) => (
            <SwipeableTaskItem
              key={task.id}
              taskId={task.id}
              taskTitle={task.title}
              isCompleted={task.status === 'completed'}
              onComplete={() => handleStatusChange(task.id, 'completed')}
              onUncomplete={() => handleStatusChange(task.id, 'todo')}
              onDelete={() => handleDelete(task.id)}
              disabled={bulkSelectMode}
            >
              <TaskCard
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                highlightId={params?.highlightId}
                // @ts-expect-error - Navigation type compatibility
                onHighlightComplete={() => clearHighlight(navigation)}
                bulkSelectMode={bulkSelectMode}
                selected={selectedTaskIds.has(task.id)}
                onToggleSelect={() => toggleTaskSelection(task.id)}
              />
            </SwipeableTaskItem>
          )}
          keyExtractor={(item) => item.id}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary.main}
              colors={[colors.primary.main]}
              progressBackgroundColor={colors.background.primary}
              accessibilityLabel="Pull to refresh tasks"
            />
          }
          showsVerticalScrollIndicator={false}
          accessible={false}
          accessibilityLabel={`Tasks list, ${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'}`}
          ListEmptyComponent={() => (
            <EmptyState
              icon="📋"
              title="No tasks yet"
              description={
                filterStatus !== 'all'
                  ? `No ${filterStatus.replace('_', ' ')} tasks`
                  : 'Create your first task to get started'
              }
              actionLabel="Create Task"
              onAction={() => {
                setSelectedTask(null);
                setShowCreateModal(true);
              }}
            />
          )}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          initialNumToRender={15}
        />
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary.main}
              colors={[colors.primary.main]}
              progressBackgroundColor={colors.background.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredTasks.length === 0 && (
            <EmptyState
              icon="📋"
              title="No tasks yet"
              description="Create your first task to get started"
              actionLabel="Create Task"
              onAction={() => {
                setSelectedTask(null);
                setShowCreateModal(true);
              }}
            />
          )}
        </ScrollView>
      )}

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
          // Show tooltip on first task creation
          if (!selectedTask && tasks.length === 0) {
            tooltip.showTooltip({
              id: 'first-task-created',
              message: 'Great! Your first task is created. Swipe left on any task to quickly complete or delete it.',
            });
          }
        }}
      />

      {/* Filter Modal */}
      <TaskFilterBar
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        availableProjects={availableProjects}
        availableTags={availableTags}
      />

      {/* First-use Tooltip */}
      <Tooltip
        visible={tooltip.visible}
        message={tooltip.message}
        onDismiss={tooltip.hideTooltip}
        position="bottom"
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
  highlightId?: string;
  onHighlightComplete?: () => void;
  bulkSelectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = React.memo(({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  compact = false,
  highlightId,
  onHighlightComplete,
  bulkSelectMode = false,
  selected = false,
  onToggleSelect,
}) => {
  const useHighlight = require('../../hooks/useHighlight').default;
  const { shouldHighlight, highlightOpacity, highlightScale } = useHighlight({
    highlightId,
    itemId: task.id,
    onComplete: onHighlightComplete,
  });
  const [scaleValue] = useState(new Animated.Value(1));
  const isCompleted = task.status === 'completed';

  // In bulk select mode, pressing card toggles selection
  const handleCardPress = () => {
    if (bulkSelectMode && onToggleSelect) {
      onToggleSelect();
    } else {
      onEdit(task);
    }
  };

  // Check if task is overdue
  const taskIsOverdue = isOverdue(task.dueDate, task.status);

  // Get priority color or use default
  const priorityColor = task.priority
    ? PRIORITY_COLORS[task.priority]
    : PRIORITY_COLORS.medium;

  // For overdue tasks, always use error color
  const borderColor = taskIsOverdue ? colors.error : priorityColor;

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
    <Animated.View style={{
      transform: [
        { scale: shouldHighlight ? highlightScale : scaleValue }
      ],
      opacity: shouldHighlight ? highlightOpacity : 1,
    }}>
      <TouchableOpacity
        onPress={handleCardPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[
          styles.taskCard,
          compact && styles.taskCardCompact,
          { borderLeftWidth: 4, borderLeftColor: borderColor },
          taskIsOverdue && styles.taskCardOverdue,
          shouldHighlight && styles.taskCardHighlight,
          selected && styles.taskCardSelected,
        ]}
        {...makeButton(
          makeTaskLabel(task),
          bulkSelectMode
            ? 'Double tap to toggle selection'
            : 'Double tap to edit task details'
        )}
      >
        {/* Priority Badge - Top Right Corner */}
        {task.priority && !compact && (
          <View
            style={[styles.priorityCornerBadge, { backgroundColor: priorityColor }]}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          >
            <Icon
              name={PRIORITY_ICONS[task.priority]}
              size={12}
              color={colors.primary.contrast}
            />
          </View>
        )}

        {/* Overdue Badge - Top Right Corner (below priority if both exist) */}
        {taskIsOverdue && !isCompleted && (
          <View
            style={[
              styles.overdueCornerBadge,
              task.priority && !compact ? { top: 36 } : { top: 8 }
            ]}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={styles.overdueCornerText}>OVERDUE</Text>
          </View>
        )}

        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            {bulkSelectMode ? (
              // Bulk selection checkbox
              <TouchableOpacity
                onPress={onToggleSelect}
                style={styles.checkbox}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                {...makeCheckbox(
                  `Select ${task.title}`,
                  selected,
                  'Double tap to toggle selection'
                )}
              >
                <View
                  style={[
                    styles.checkboxInner,
                    selected && styles.checkboxSelected,
                  ]}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                >
                  {selected && (
                    <Icon name="check" size={16} color={colors.primary.contrast} />
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              // Normal completion checkbox
              <TouchableOpacity
                onPress={() => {
                  const newStatus = isCompleted ? 'todo' : 'completed';
                  onStatusChange(task.id, newStatus);
                  announceForAccessibility(
                    isCompleted
                      ? `${task.title} marked as incomplete`
                      : `${task.title} completed`
                  );
                }}
                style={styles.checkbox}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                {...makeCheckbox(
                  `Mark ${task.title} as ${isCompleted ? 'incomplete' : 'complete'}`,
                  isCompleted,
                  `Double tap to ${isCompleted ? 'uncomplete' : 'complete'} task`
                )}
              >
                <View
                  style={[
                    styles.checkboxInner,
                    isCompleted && styles.checkboxChecked,
                  ]}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                >
                  {isCompleted && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.taskInfo}>
              <View style={styles.taskTitleRow}>
                <Text
                  style={[
                    styles.taskTitle,
                    isCompleted && styles.taskTitleCompleted,
                  ]}
                  numberOfLines={compact ? 1 : 2}
                >
                  {task.title}
                </Text>
                {task.recurrence && (
                  <Text style={styles.recurrenceIcon}>♻️</Text>
                )}
              </View>
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
                {/* Task Latency Badge */}
                <TaskLatencyBadge task={task as any} showIcon />

                {/* Priority badge with dot */}
                {task.priority && (
                  <View style={styles.priorityBadge}>
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: PRIORITY_COLORS[task.priority] },
                      ]}
                    />
                    <Text style={styles.priorityLabel}>
                      {PRIORITY_LABELS[task.priority]}
                    </Text>
                  </View>
                )}

                {/* Enhanced Due date badge with color coding */}
                {task.dueDate && !isCompleted && (() => {
                  const urgency = getDateUrgency(task.dueDate);
                  const daysUntil = getDaysUntil(task.dueDate);
                  const formattedDate = formatDueDate(task.dueDate);

                  // Choose badge style based on urgency
                  const badgeStyle = urgency === 'overdue'
                    ? styles.overdueBadge
                    : urgency === 'today'
                    ? styles.dueTodayBadge
                    : urgency === 'this-week'
                    ? styles.dueThisWeekBadge
                    : styles.dueFutureBadge;

                  const textStyle = urgency === 'overdue'
                    ? styles.overdueText
                    : urgency === 'today'
                    ? styles.dueTodayText
                    : urgency === 'this-week'
                    ? styles.dueThisWeekText
                    : styles.dueFutureText;

                  const icon = urgency === 'overdue'
                    ? 'alert-circle'
                    : urgency === 'today'
                    ? 'clock-alert'
                    : urgency === 'this-week'
                    ? 'calendar-clock'
                    : 'calendar';

                  return (
                    <View style={[styles.dueDateBadge, badgeStyle]}>
                      <Icon name={icon} size={14} color={
                        urgency === 'overdue' ? colors.error :
                        urgency === 'today' ? colors.warning :
                        urgency === 'this-week' ? '#F59E0B' :
                        colors.text.tertiary
                      } />
                      <Text style={[styles.dueDateText, textStyle]}>
                        {urgency === 'overdue'
                          ? `Overdue (${formattedDate})`
                          : daysUntil === 0
                          ? 'Due Today'
                          : daysUntil === 1
                          ? 'Due Tomorrow'
                          : `Due ${formattedDate}`}
                      </Text>
                    </View>
                  );
                })()}

                {/* Completion date badge for completed tasks */}
                {isCompleted && task.completedAt && (
                  <View style={[styles.dueDateBadge, styles.completedBadge]}>
                    <Icon name="check-circle" size={14} color={colors.success} />
                    <Text style={[styles.dueDateText, styles.completedText]}>
                      Completed {formatDueDate(task.completedAt)}
                    </Text>
                  </View>
                )}

                {/* Project badge */}
                {task.project && (
                  <View
                    style={[
                      styles.projectBadge,
                      task.project.color && {
                        backgroundColor: `${task.project.color}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.projectBadgeText,
                        task.project.color && { color: task.project.color },
                      ]}
                    >
                      {task.project.name}
                    </Text>
                  </View>
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
                  {...makeButton(`Edit ${task.title}`, 'Double tap to edit task details')}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDelete(task.id)}
                  style={styles.actionButton}
                  {...makeButton(`Delete ${task.title}`, 'Double tap to delete task')}
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
}, (prevProps, nextProps) => {
  // Custom comparison for better performance - only re-render if these change
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.updatedAt === nextProps.task.updatedAt &&
    prevProps.bulkSelectMode === nextProps.bulkSelectMode &&
    prevProps.selected === nextProps.selected &&
    prevProps.compact === nextProps.compact &&
    prevProps.highlightId === nextProps.highlightId
  );
});

// Kanban and Matrix views removed - not implemented
// TODO: Consider adding these views in a future update

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
  const [dueDate, setDueDate] = useState<string | undefined>(task?.dueDate);
  const [recurrence, setRecurrence] = useState<RecurrenceRule | undefined>(task?.recurrence);
  const [project, setProject] = useState<Project | null>(task?.project ? task.project as Project : null);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setTitle(task?.title || '');
      setDescription(task?.description || '');
      setPriority(task?.priority || 'medium');
      setDueDate(task?.dueDate);
      setRecurrence(task?.recurrence);
      setProject(task?.project ? task.project as Project : null);
    }
  }, [visible, task]);

  const getRecurrenceSummary = (rule: RecurrenceRule): string => {
    const { frequency, interval } = rule;
    if (interval === 1) {
      return `Repeats ${frequency}`;
    }
    const unit = frequency === 'daily' ? 'days' :
                 frequency === 'weekly' ? 'weeks' :
                 frequency === 'monthly' ? 'months' : 'years';
    return `Repeats every ${interval} ${unit}`;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = {
        title,
        description: description || undefined,
        priority,
        dueDate,
        status: task?.status || ('todo' as TaskStatus),
        tags: task?.tags || [],
        recurrence,
        projectId: project?.id,
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
                {...makeButton('Close', 'Double tap to close and discard changes')}
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
                  {...makeTextInput('Task title', title, 'Enter a title for your task')}
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
                  {...makeTextInput('Task description', description, 'Enter a detailed description for your task')}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.priorityButtons}>
                  {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map(
                    (p) => (
                      <AppChip
                        key={p}
                        label={PRIORITY_LABELS[p]}
                        selected={priority === p}
                        onPress={() => setPriority(p)}
                        style={styles.priorityChip}
                      />
                    )
                  )}
                </View>
              </View>

              <EnhancedDatePicker
                value={dueDate}
                onChange={setDueDate}
                label="Due Date"
              />

              <View style={styles.formGroup}>
                <Text style={styles.label}>Recurrence</Text>
                <TouchableOpacity
                  style={styles.recurrenceButton}
                  onPress={() => setShowRecurrencePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.recurrenceButtonText}>
                    {recurrence ? getRecurrenceSummary(recurrence) : 'Does not repeat'}
                  </Text>
                  <IconButton
                    icon="chevron-right"
                    size={20}
                    iconColor={colors.text.tertiary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Project</Text>
                <ProjectPicker
                  value={project}
                  onChange={setProject}
                  placeholder="No Project"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <AppButton
                title="Cancel"
                onPress={onClose}
                variant="outline"
                style={styles.modalButton}
                {...makeButton('Cancel', 'Double tap to cancel and discard changes')}
              />
              <AppButton
                title={task ? 'Update' : 'Create'}
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!title.trim()}
                style={styles.modalButton}
                {...makeButton(
                  task ? 'Update task' : 'Create task',
                  task ? 'Double tap to save changes' : 'Double tap to create new task',
                  !title.trim()
                )}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showRecurrencePicker}
        animationType="slide"
        onRequestClose={() => setShowRecurrencePicker(false)}
      >
        <RecurrencePicker
          value={recurrence}
          onChange={setRecurrence}
          onClose={() => setShowRecurrencePicker(false)}
        />
      </Modal>
    </Modal>
  );
};

const colors = getColors();

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
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  filterBadgeText: {
    color: colors.primary.main,
    fontWeight: typography.weight.semibold,
  },
  savingIndicator: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  savingText: {
    fontSize: typography.size.xs,
    color: colors.primary.main,
    fontWeight: typography.weight.medium,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  filterButtonContainer: {
    position: 'relative',
  },
  filterButton: {
    margin: 0,
  },
  filterCountBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.full,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginLeft: spacing.sm,
  },
  clearFiltersText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  activeFiltersIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  activeFiltersText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  viewSelectorContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  viewSelector: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
  },
  filterContainer: {
    marginBottom: spacing.sm,
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
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  taskCardCompact: {
    marginBottom: spacing.sm,
  },
  taskCardOverdue: {
    backgroundColor: `${colors.error}10`,
  },
  taskCardHighlight: {
    backgroundColor: `${colors.primary.main}15`,
    shadowColor: colors.primary.main,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  taskCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
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
  checkboxSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: typography.weight.bold,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  taskTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    lineHeight: typography.size.base * typography.lineHeight.snug,
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.disabled,
  },
  recurrenceIcon: {
    fontSize: typography.size.sm,
    lineHeight: typography.size.base * typography.lineHeight.snug,
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
    alignItems: 'center',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  priorityLabel: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  priorityCornerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: borderRadius.full,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...shadows.sm,
  },
  overdueBadge: {
    backgroundColor: `${colors.error}20`,
    borderWidth: 1,
    borderColor: colors.error,
  },
  overdueText: {
    fontSize: typography.size.xs,
    color: colors.error,
    fontWeight: typography.weight.semibold,
  },
  overdueCornerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.error,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    zIndex: 10,
    ...shadows.sm,
  },
  overdueCornerText: {
    fontSize: 9,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.5,
  },
  dueTodayBadge: {
    backgroundColor: `${colors.warning}20`,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  dueTodayText: {
    fontSize: typography.size.xs,
    color: colors.warning,
    fontWeight: typography.weight.semibold,
  },
  dueThisWeekBadge: {
    backgroundColor: `${colors.warning}20`,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  dueThisWeekText: {
    fontSize: typography.size.xs,
    color: colors.warning,
    fontWeight: typography.weight.medium,
  },
  dueFutureBadge: {
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  dueFutureText: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  dueDateText: {
    fontSize: typography.size.xs,
  },
  completedBadge: {
    backgroundColor: `${colors.success}20`,
    borderWidth: 1,
    borderColor: colors.success,
  },
  completedText: {
    fontSize: typography.size.xs,
    color: colors.success,
    fontWeight: typography.weight.medium,
  },
  projectBadge: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  projectBadgeText: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
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
  // Kanban and Matrix styles removed - views not implemented
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
  recurrenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
  },
  recurrenceButtonText: {
    fontSize: typography.size.base,
    color: colors.text.primary,
    flex: 1,
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
