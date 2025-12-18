# Phase 2A Features 2-4: Implementation Plan
**Task Priority Visuals, Sorting/Filters, and Cross-Feature Deep Links**

**Date:** December 14, 2025
**Project:** Jarvis Native - Life Dashboard
**Context:** Phase 2A.1 (Today's Focus) Complete - Ready for 2A.2, 2A.3, 2A.4

---

## Table of Contents

1. [Feature 2A.2: Task Priority Visual System](#feature-2a2-task-priority-visual-system)
2. [Feature 2A.3: Task Sorting & Advanced Filters](#feature-2a3-task-sorting--advanced-filters)
3. [Feature 2A.4: Cross-Feature Deep Links](#feature-2a4-cross-feature-deep-links)
4. [Testing Checklist](#testing-checklist)
5. [Implementation Order](#implementation-order)

---

# Feature 2A.2: Task Priority Visual System

**Priority:** TIER 2 - High Impact
**Effort:** 4-6 hours
**Complexity:** Low
**Dependencies:** None

## Overview

Transform task lists from plain text to visually scannable priority-based interface using colored borders, badges, and visual hierarchy. Make priority immediately obvious at a glance.

## Business Value

- Users instantly identify high-priority items without reading
- Reduces cognitive load when scanning task lists
- Overdue tasks visually stand out
- Improves task completion rates for important items

## Implementation Steps

### Step 1: Update Priority Configuration (30 minutes)

**File:** `/mnt/d/claude dash/jarvis-native/src/screens/main/TasksScreen.tsx`

Enhance the existing PRIORITY_CONFIG with border colors:

```typescript
// Line 64-69 - Update existing PRIORITY_CONFIG
const PRIORITY_CONFIG: Record<TaskPriority, {
  color: string;
  label: string;
  borderColor: string;
  backgroundColor: string;
}> = {
  low: {
    color: '#64748B',
    label: 'Low',
    borderColor: '#64748B',
    backgroundColor: '#64748B15',
  },
  medium: {
    color: '#F59E0B',
    label: 'Medium',
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B15',
  },
  high: {
    color: '#F97316',
    label: 'High',
    borderColor: '#F97316',
    backgroundColor: '#F9731615',
  },
  urgent: {
    color: '#EF4444',
    label: 'Urgent',
    borderColor: '#EF4444',
    backgroundColor: '#EF444415',
  },
};
```

### Step 2: Add Overdue Detection Helper (15 minutes)

**File:** `/mnt/d/claude dash/jarvis-native/src/screens/main/TasksScreen.tsx`

Add helper function after PRIORITY_CONFIG definition (around line 70):

```typescript
/**
 * Check if task is overdue
 */
const isTaskOverdue = (task: Task): boolean => {
  if (!task.dueDate || task.status === 'completed') return false;
  const today = new Date().toISOString().split('T')[0];
  return task.dueDate < today;
};

/**
 * Get visual styling for task based on priority and status
 */
const getTaskVisualStyle = (task: Task) => {
  const isOverdue = isTaskOverdue(task);
  const priority = task.priority || 'medium';

  if (isOverdue) {
    return {
      borderLeftColor: colors.error,
      borderLeftWidth: 4,
      backgroundColor: `${colors.error}08`,
    };
  }

  return {
    borderLeftColor: PRIORITY_CONFIG[priority].borderColor,
    borderLeftWidth: 4,
    backgroundColor: colors.background.secondary,
  };
};
```

### Step 3: Update TaskCard Component (1.5 hours)

**File:** `/mnt/d/claude dash/jarvis-native/src/screens/main/TasksScreen.tsx`

**Location:** TaskCard component (lines 296-432)

Replace the existing TaskCard implementation with enhanced version:

```typescript
const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  compact = false,
}) => {
  const [scaleValue] = useState(new Animated.Value(1));
  const isCompleted = task.status === 'completed';
  const isOverdue = isTaskOverdue(task);
  const visualStyle = getTaskVisualStyle(task);

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
        style={[
          styles.taskCard,
          compact && styles.taskCardCompact,
          {
            borderLeftWidth: visualStyle.borderLeftWidth,
            borderLeftColor: visualStyle.borderLeftColor,
            backgroundColor: visualStyle.backgroundColor,
          },
        ]}
      >
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
              <View style={styles.taskTitleRow}>
                <Text
                  style={[
                    styles.taskTitle,
                    isCompleted && styles.taskTitleCompleted,
                    isOverdue && styles.taskTitleOverdue,
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
              {/* Meta info with priority badge */}
              <View style={styles.taskMeta}>
                {task.priority && (
                  <View
                    style={[
                      styles.priorityBadge,
                      {
                        backgroundColor: PRIORITY_CONFIG[task.priority].backgroundColor,
                        borderColor: PRIORITY_CONFIG[task.priority].borderColor,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: PRIORITY_CONFIG[task.priority].color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityLabel,
                        { color: PRIORITY_CONFIG[task.priority].color },
                      ]}
                    >
                      {PRIORITY_CONFIG[task.priority].label}
                    </Text>
                  </View>
                )}
                {isOverdue && (
                  <View style={styles.overdueBadge}>
                    <Text style={styles.overdueText}>⚠️ Overdue</Text>
                  </View>
                )}
                {task.dueDate && !isOverdue && (
                  <View style={styles.dueDateBadge}>
                    <Text style={styles.dueDateText}>
                      Due: {new Date(task.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
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
```

### Step 4: Update StyleSheet (30 minutes)

**File:** `/mnt/d/claude dash/jarvis-native/src/screens/main/TasksScreen.tsx`

**Location:** styles object (starting around line 772)

Update existing taskCard styles and add new badge styles:

```typescript
// Update existing taskCard style (around line 825)
taskCard: {
  backgroundColor: colors.background.secondary,
  borderRadius: borderRadius.lg,
  overflow: 'hidden',
  flexDirection: 'row',
  marginBottom: spacing.md,
  ...shadows.sm,
  // borderLeftWidth and borderLeftColor will be dynamic
},

// Remove old priorityIndicator (line 836-838)
// Add new styles after taskActions (around line 920)

// Priority Badge Styles
priorityBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: borderRadius.sm,
  borderWidth: 1,
  gap: spacing.xs,
},
priorityDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
},
priorityLabel: {
  fontSize: typography.size.xs,
  fontWeight: typography.weight.semibold,
},

// Overdue Badge
overdueBadge: {
  backgroundColor: `${colors.error}20`,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: borderRadius.sm,
},
overdueText: {
  fontSize: typography.size.xs,
  fontWeight: typography.weight.bold,
  color: colors.error,
},

// Due Date Badge
dueDateBadge: {
  backgroundColor: colors.background.tertiary,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: borderRadius.sm,
},
dueDateText: {
  fontSize: typography.size.xs,
  color: colors.text.secondary,
},

// Overdue task title
taskTitleOverdue: {
  color: colors.error,
  fontWeight: typography.weight.semibold,
},
```

### Step 5: Remove Old Priority Indicator (5 minutes)

**File:** `/mnt/d/claude dash/jarvis-native/src/screens/main/TasksScreen.tsx`

Remove the old priority indicator code (around lines 332-339 in TaskCard component):

```typescript
// DELETE THESE LINES:
{/* Priority indicator */}
{task.priority && (
  <View
    style={[
      styles.priorityIndicator,
      { backgroundColor: PRIORITY_CONFIG[task.priority].color },
    ]}
  />
)}
```

### Step 6: Update Priority Chips in Meta Section (15 minutes)

**File:** `/mnt/d/claude dash/jarvis-native/src/screens/main/TasksScreen.tsx`

The priority chip rendering in taskMeta (around line 391-402) is replaced in Step 3 above.

---

## Testing Checklist

### Visual Verification
- [ ] Low priority tasks have slate gray left border (4px wide)
- [ ] Medium priority tasks have amber left border
- [ ] High priority tasks have orange left border
- [ ] Urgent priority tasks have red left border
- [ ] Overdue tasks have red left border and light red background
- [ ] Priority badges show colored dot + label
- [ ] Overdue badge displays with warning emoji
- [ ] Due date badge shows formatted date

### Interaction Testing
- [ ] Create task with each priority level
- [ ] Verify border colors match priority
- [ ] Create task with past due date (not completed)
- [ ] Verify overdue styling overrides priority color
- [ ] Complete overdue task
- [ ] Verify overdue styling removed
- [ ] Test in List view
- [ ] Test in Kanban view (compact mode)
- [ ] Test in Matrix view (compact mode)

### Edge Cases
- [ ] Task with no priority (should default to medium)
- [ ] Task with no due date (no overdue badge)
- [ ] Completed task with past due date (no overdue badge)
- [ ] Recurring overdue task
- [ ] Task with long title + priority badge layout

---

# Feature 2A.3: Task Sorting & Advanced Filters

**Priority:** TIER 2 - High Impact
**Effort:** 8-10 hours
**Complexity:** Medium
**Dependencies:** None

## Overview

Add comprehensive sorting and filtering capabilities to Tasks screen with persistent preferences. Enable users to find and organize tasks by priority, due date, project, tags, and more.

## Business Value

- Users can quickly find specific tasks
- Multiple views of same data (by priority, by project, by due date)
- Persistent preferences reduce repetitive actions
- Power users can create custom views

## Implementation Steps

### Step 1: Define Filter & Sort Types (30 minutes)

**File:** `/mnt/d/claude dash/jarvis-native/src/database/tasks.ts`

Add to existing file (after TaskFilters interface, around line 84):

```typescript
export type SortField = 'priority' | 'dueDate' | 'createdAt' | 'updatedAt' | 'title' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface TaskSortOptions {
  field: SortField;
  order: SortOrder;
}

export interface AdvancedTaskFilters extends TaskFilters {
  priorities?: TaskPriority[]; // Multiple priority filter
  projectIds?: string[]; // Multiple projects
  tags?: string[]; // Multiple tags
  hasDueDate?: boolean; // Show only tasks with/without due date
  dueDateFrom?: string; // Date range start
  dueDateTo?: string; // Date range end
  search?: string; // Text search in title/description
}
```

### Step 2: Update getTasks Function (1.5 hours)

**File:** `/mnt/d/claude dash/jarvis-native/src/database/tasks.ts`

Replace existing getTasks function (lines 115-154):

```typescript
/**
 * Get all tasks with optional filters and sorting
 */
export async function getTasks(
  filters?: AdvancedTaskFilters,
  sort?: TaskSortOptions
): Promise<Task[]> {
  let sql = `
    SELECT
      t.*,
      p.name as project_name,
      p.color as project_color
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Status filter (existing)
  if (filters?.status) {
    sql += ' AND t.status = ?';
    params.push(filters.status);
  }

  // Single priority filter (backwards compatibility)
  if (filters?.priority) {
    sql += ' AND t.priority = ?';
    params.push(filters.priority);
  }

  // Multiple priorities filter
  if (filters?.priorities && filters.priorities.length > 0) {
    const placeholders = filters.priorities.map(() => '?').join(',');
    sql += ` AND t.priority IN (${placeholders})`;
    params.push(...filters.priorities);
  }

  // Single project filter (backwards compatibility)
  if (filters?.projectId) {
    sql += ' AND t.project_id = ?';
    params.push(filters.projectId);
  }

  // Multiple projects filter
  if (filters?.projectIds && filters.projectIds.length > 0) {
    const placeholders = filters.projectIds.map(() => '?').join(',');
    sql += ` AND t.project_id IN (${placeholders})`;
    params.push(...filters.projectIds);
  }

  // Tags filter - match ANY tag
  if (filters?.tags && filters.tags.length > 0) {
    const tagConditions = filters.tags.map(() => 't.tags LIKE ?').join(' OR ');
    sql += ` AND (${tagConditions})`;
    filters.tags.forEach(tag => {
      params.push(`%"${tag}"%`);
    });
  }

  // Single tag filter (backwards compatibility)
  if (filters?.tag) {
    sql += ' AND t.tags LIKE ?';
    params.push(`%"${filters.tag}"%`);
  }

  // Due date presence filter
  if (filters?.hasDueDate !== undefined) {
    sql += filters.hasDueDate
      ? ' AND t.due_date IS NOT NULL'
      : ' AND t.due_date IS NULL';
  }

  // Due date range filter
  if (filters?.dueDateFrom) {
    sql += ' AND t.due_date >= ?';
    params.push(filters.dueDateFrom);
  }
  if (filters?.dueDateTo) {
    sql += ' AND t.due_date <= ?';
    params.push(filters.dueDateTo);
  }

  // Text search
  if (filters?.search) {
    sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  // Sorting
  if (sort) {
    switch (sort.field) {
      case 'priority':
        sql += ` ORDER BY
          CASE t.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
          END ${sort.order === 'desc' ? 'DESC' : 'ASC'}`;
        break;
      case 'dueDate':
        sql += ` ORDER BY
          CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
          t.due_date ${sort.order === 'desc' ? 'DESC' : 'ASC'}`;
        break;
      case 'status':
        sql += ` ORDER BY
          CASE t.status
            WHEN 'in_progress' THEN 1
            WHEN 'todo' THEN 2
            WHEN 'blocked' THEN 3
            WHEN 'completed' THEN 4
            WHEN 'cancelled' THEN 5
            ELSE 6
          END ${sort.order === 'desc' ? 'DESC' : 'ASC'}`;
        break;
      case 'title':
        sql += ` ORDER BY t.title COLLATE NOCASE ${sort.order === 'desc' ? 'DESC' : 'ASC'}`;
        break;
      case 'createdAt':
        sql += ` ORDER BY t.created_at ${sort.order === 'desc' ? 'DESC' : 'ASC'}`;
        break;
      case 'updatedAt':
        sql += ` ORDER BY t.updated_at ${sort.order === 'desc' ? 'DESC' : 'ASC'}`;
        break;
      default:
        sql += ' ORDER BY t.created_at DESC';
    }
  } else {
    // Default sort
    sql += ' ORDER BY t.created_at DESC';
  }

  const rows = await executeQuery<TaskRow>(sql, params);
  return rows.map(rowToTask);
}
```

### Step 3: Create Filter Preferences Store (1 hour)

**File:** `/mnt/d/claude dash/jarvis-native/src/store/taskFilterStore.ts` (NEW FILE)

```typescript
/**
 * Task Filter & Sort Preferences Store
 * Uses AsyncStorage for persistence across app restarts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TaskStatus, TaskPriority, AdvancedTaskFilters, TaskSortOptions } from '../database/tasks';

const STORAGE_KEY = '@jarvis_task_filters';

export interface TaskFilterState {
  activeFilters: AdvancedTaskFilters;
  sortOptions: TaskSortOptions;
}

const DEFAULT_STATE: TaskFilterState = {
  activeFilters: {},
  sortOptions: {
    field: 'createdAt',
    order: 'desc',
  },
};

/**
 * Load filter state from storage
 */
export async function loadFilterState(): Promise<TaskFilterState> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[TaskFilterStore] Load error:', error);
  }
  return DEFAULT_STATE;
}

/**
 * Save filter state to storage
 */
export async function saveFilterState(state: TaskFilterState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[TaskFilterStore] Save error:', error);
  }
}

/**
 * Clear all filters (reset to default)
 */
export async function clearFilterState(): Promise<TaskFilterState> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[TaskFilterStore] Clear error:', error);
  }
  return DEFAULT_STATE;
}

/**
 * Update specific filter
 */
export async function updateFilter(
  key: keyof AdvancedTaskFilters,
  value: any
): Promise<TaskFilterState> {
  const currentState = await loadFilterState();
  const newState: TaskFilterState = {
    ...currentState,
    activeFilters: {
      ...currentState.activeFilters,
      [key]: value,
    },
  };
  await saveFilterState(newState);
  return newState;
}

/**
 * Update sort options
 */
export async function updateSort(sortOptions: TaskSortOptions): Promise<TaskFilterState> {
  const currentState = await loadFilterState();
  const newState: TaskFilterState = {
    ...currentState,
    sortOptions,
  };
  await saveFilterState(newState);
  return newState;
}

/**
 * Get active filter count (for badge display)
 */
export function getActiveFilterCount(filters: AdvancedTaskFilters): number {
  let count = 0;
  if (filters.status) count++;
  if (filters.priorities && filters.priorities.length > 0) count++;
  if (filters.projectIds && filters.projectIds.length > 0) count++;
  if (filters.tags && filters.tags.length > 0) count++;
  if (filters.hasDueDate !== undefined) count++;
  if (filters.dueDateFrom || filters.dueDateTo) count++;
  if (filters.search) count++;
  return count;
}
```

### Step 4: Create Filter Bar Component (2 hours)

**File:** `/mnt/d/claude dash/jarvis-native/src/components/TaskFilterBar.tsx` (NEW FILE)

```typescript
/**
 * TaskFilterBar Component
 * Advanced filtering UI for tasks
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { AppButton, AppChip } from './ui';
import type { TaskStatus, TaskPriority, AdvancedTaskFilters, TaskSortOptions, SortField } from '../database/tasks';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

interface TaskFilterBarProps {
  filters: AdvancedTaskFilters;
  sortOptions: TaskSortOptions;
  onFiltersChange: (filters: AdvancedTaskFilters) => void;
  onSortChange: (sort: TaskSortOptions) => void;
  onClearAll: () => void;
  activeCount: number;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  filters,
  sortOptions,
  onFiltersChange,
  onSortChange,
  onClearAll,
  activeCount,
}) => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
  const statuses: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'completed', 'cancelled'];

  const sortFields: { field: SortField; label: string }[] = [
    { field: 'priority', label: 'Priority' },
    { field: 'dueDate', label: 'Due Date' },
    { field: 'createdAt', label: 'Created' },
    { field: 'updatedAt', label: 'Updated' },
    { field: 'title', label: 'Title' },
    { field: 'status', label: 'Status' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Filter Button */}
        <TouchableOpacity
          style={[styles.actionButton, activeCount > 0 && styles.actionButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <IconButton icon="filter-variant" size={18} iconColor={colors.text.primary} />
          <Text style={styles.actionButtonText}>Filters</Text>
          {activeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Sort Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowSortModal(true)}
        >
          <IconButton
            icon={sortOptions.order === 'asc' ? 'sort-ascending' : 'sort-descending'}
            size={18}
            iconColor={colors.text.primary}
          />
          <Text style={styles.actionButtonText}>
            {sortFields.find(f => f.field === sortOptions.field)?.label || 'Sort'}
          </Text>
        </TouchableOpacity>

        {/* Active Status Filter */}
        {filters.status && (
          <AppChip
            label={`Status: ${filters.status}`}
            selected
            onPress={() => onFiltersChange({ ...filters, status: undefined })}
            style={styles.filterChip}
          />
        )}

        {/* Clear All Button */}
        {activeCount > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClearAll}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Tasks</Text>
              <IconButton
                icon="close"
                onPress={() => setShowFilterModal(false)}
                iconColor={colors.text.tertiary}
              />
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.chipRow}>
                  {statuses.map(status => (
                    <AppChip
                      key={status}
                      label={status.replace('_', ' ')}
                      selected={filters.status === status}
                      onPress={() =>
                        onFiltersChange({
                          ...filters,
                          status: filters.status === status ? undefined : status,
                        })
                      }
                      style={styles.filterChipModal}
                    />
                  ))}
                </View>
              </View>

              {/* Priority Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Priority</Text>
                <View style={styles.chipRow}>
                  {priorities.map(priority => {
                    const isSelected = filters.priorities?.includes(priority) || false;
                    return (
                      <AppChip
                        key={priority}
                        label={priority}
                        selected={isSelected}
                        onPress={() => {
                          const current = filters.priorities || [];
                          const updated = isSelected
                            ? current.filter(p => p !== priority)
                            : [...current, priority];
                          onFiltersChange({
                            ...filters,
                            priorities: updated.length > 0 ? updated : undefined,
                          });
                        }}
                        style={styles.filterChipModal}
                      />
                    );
                  })}
                </View>
              </View>

              {/* Due Date Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Due Date</Text>
                <View style={styles.chipRow}>
                  <AppChip
                    label="Has Due Date"
                    selected={filters.hasDueDate === true}
                    onPress={() =>
                      onFiltersChange({
                        ...filters,
                        hasDueDate: filters.hasDueDate === true ? undefined : true,
                      })
                    }
                    style={styles.filterChipModal}
                  />
                  <AppChip
                    label="No Due Date"
                    selected={filters.hasDueDate === false}
                    onPress={() =>
                      onFiltersChange({
                        ...filters,
                        hasDueDate: filters.hasDueDate === false ? undefined : false,
                      })
                    }
                    style={styles.filterChipModal}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <AppButton
                title="Reset"
                onPress={() => {
                  onClearAll();
                  setShowFilterModal(false);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <AppButton
                title="Apply"
                onPress={() => setShowFilterModal(false)}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort Tasks</Text>
              <IconButton
                icon="close"
                onPress={() => setShowSortModal(false)}
                iconColor={colors.text.tertiary}
              />
            </View>

            <ScrollView style={styles.modalBody}>
              {sortFields.map(({ field, label }) => (
                <TouchableOpacity
                  key={field}
                  style={[
                    styles.sortOption,
                    sortOptions.field === field && styles.sortOptionSelected,
                  ]}
                  onPress={() => {
                    onSortChange({
                      field,
                      order: sortOptions.field === field && sortOptions.order === 'desc'
                        ? 'asc'
                        : 'desc',
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortOptions.field === field && styles.sortOptionTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                  {sortOptions.field === field && (
                    <IconButton
                      icon={sortOptions.order === 'asc' ? 'arrow-up' : 'arrow-down'}
                      size={20}
                      iconColor={colors.primary.main}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <AppButton
                title="Done"
                onPress={() => setShowSortModal(false)}
                style={styles.modalButtonFull}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    paddingRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  actionButtonActive: {
    borderColor: colors.primary.main,
    backgroundColor: `${colors.primary.main}10`,
  },
  actionButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
  },
  badge: {
    backgroundColor: colors.primary.main,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: '#FFFFFF',
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  clearButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  clearButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.error,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '75%',
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
  filterSection: {
    marginBottom: spacing.xl,
  },
  filterLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChipModal: {
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
  modalButtonFull: {
    flex: 1,
  },

  // Sort Modal
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  sortOptionSelected: {
    backgroundColor: `${colors.primary.main}15`,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  sortOptionText: {
    fontSize: typography.size.base,
    color: colors.text.primary,
  },
  sortOptionTextSelected: {
    fontWeight: typography.weight.semibold,
    color: colors.primary.main,
  },
});

export default TaskFilterBar;
```

### Step 5: Update TasksScreen with Filters (2 hours)

**File:** `/mnt/d/claude dash/jarvis-native/src/screens/main/TasksScreen.tsx`

Add imports at top:

```typescript
import { TaskFilterBar } from '../../components/TaskFilterBar';
import * as taskFilterStore from '../../store/taskFilterStore';
import type { AdvancedTaskFilters, TaskSortOptions } from '../../database/tasks';
```

Update component state (around line 71):

```typescript
export default function TasksScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // NEW: Advanced filters state
  const [filters, setFilters] = useState<AdvancedTaskFilters>({});
  const [sortOptions, setSortOptions] = useState<TaskSortOptions>({
    field: 'createdAt',
    order: 'desc',
  });
  const [filterCount, setFilterCount] = useState(0);

  const insets = useSafeAreaInsets();
```

Update loadTasks function:

```typescript
// Load tasks from local database
const loadTasks = useCallback(async () => {
  try {
    // Build filters from both old status filter and new advanced filters
    const combinedFilters: AdvancedTaskFilters = {
      ...filters,
      ...(filterStatus !== 'all' ? { status: filterStatus } : {}),
    };

    const loadedTasks = await tasksDB.getTasks(combinedFilters, sortOptions);
    setTasks(loadedTasks);
    setFilterCount(taskFilterStore.getActiveFilterCount(combinedFilters));
  } catch (error) {
    console.error('Error loading tasks:', error);
    Alert.alert('Error', 'Failed to load tasks');
  } finally {
    setIsLoading(false);
  }
}, [filterStatus, filters, sortOptions]);
```

Add filter persistence hook:

```typescript
// Load persisted filter state on mount
useEffect(() => {
  const loadFilterPreferences = async () => {
    const state = await taskFilterStore.loadFilterState();
    setFilters(state.activeFilters);
    setSortOptions(state.sortOptions);
  };
  loadFilterPreferences();
}, []);
```

Add filter change handlers:

```typescript
const handleFiltersChange = async (newFilters: AdvancedTaskFilters) => {
  setFilters(newFilters);
  await taskFilterStore.updateFilter('status', newFilters.status);
  await taskFilterStore.updateFilter('priorities', newFilters.priorities);
  await taskFilterStore.updateFilter('projectIds', newFilters.projectIds);
  await taskFilterStore.updateFilter('tags', newFilters.tags);
  await taskFilterStore.updateFilter('hasDueDate', newFilters.hasDueDate);
  await taskFilterStore.updateFilter('dueDateFrom', newFilters.dueDateFrom);
  await taskFilterStore.updateFilter('dueDateTo', newFilters.dueDateTo);
  setRefreshTrigger(prev => prev + 1);
};

const handleSortChange = async (newSort: TaskSortOptions) => {
  setSortOptions(newSort);
  await taskFilterStore.updateSort(newSort);
  setRefreshTrigger(prev => prev + 1);
};

const handleClearAllFilters = async () => {
  const defaultState = await taskFilterStore.clearFilterState();
  setFilters(defaultState.activeFilters);
  setSortOptions(defaultState.sortOptions);
  setFilterStatus('all');
  setRefreshTrigger(prev => prev + 1);
};
```

Add TaskFilterBar to render (after view selector, around line 186):

```typescript
{/* View Mode Selector */}
<View style={styles.viewSelectorContainer}>
  {/* ... existing segmented buttons ... */}
</View>

{/* NEW: Advanced Filters */}
{viewMode === 'list' && (
  <TaskFilterBar
    filters={filters}
    sortOptions={sortOptions}
    onFiltersChange={handleFiltersChange}
    onSortChange={handleSortChange}
    onClearAll={handleClearAllFilters}
    activeCount={filterCount}
  />
)}

{/* OLD Filters - Keep for backwards compatibility or remove */}
{viewMode === 'list' && (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.filterContainer}
    contentContainerStyle={styles.filterContent}
  >
    {/* ... existing status chips ... */}
  </ScrollView>
)}
```

### Step 6: Install AsyncStorage Dependency (15 minutes)

**Terminal Commands:**

```bash
cd /mnt/d/claude\ dash/jarvis-native
npm install @react-native-async-storage/async-storage
```

If using Expo:
```bash
npx expo install @react-native-async-storage/async-storage
```

---

## Testing Checklist

### Filter Functionality
- [ ] Open filter modal
- [ ] Select multiple priorities
- [ ] Verify task list updates
- [ ] Select status filter
- [ ] Verify only matching tasks shown
- [ ] Toggle "Has Due Date" filter
- [ ] Verify tasks with/without due dates shown
- [ ] Clear all filters
- [ ] Verify all tasks shown

### Sort Functionality
- [ ] Open sort modal
- [ ] Sort by Priority (descending)
- [ ] Verify urgent tasks appear first
- [ ] Sort by Due Date (ascending)
- [ ] Verify earliest due dates first
- [ ] Sort by Title (ascending)
- [ ] Verify alphabetical order
- [ ] Toggle sort order (asc/desc)

### Persistence
- [ ] Set filters and sort options
- [ ] Close app completely
- [ ] Reopen app
- [ ] Verify filters/sort persisted
- [ ] Clear all filters
- [ ] Close and reopen
- [ ] Verify cleared state persisted

### UI/UX
- [ ] Filter button shows badge with count
- [ ] Sort button shows current field
- [ ] Filter chips display correctly
- [ ] Modal opens/closes smoothly
- [ ] "Clear All" button works
- [ ] Scrollable filter options
- [ ] No UI overlap or cutoff

---

# Feature 2A.4: Cross-Feature Deep Links

**Priority:** TIER 2 - Medium Impact
**Effort:** 4-6 hours
**Complexity:** Medium
**Dependencies:** React Navigation

## Overview

Enable seamless navigation between related features. Users can tap on tasks in Dashboard and jump directly to the task detail/edit screen. Add "View All" links from widget cards to their respective screens with smooth highlight effects.

## Business Value

- Reduces friction when navigating between related data
- Creates cohesive app experience
- Enables quick access to detailed views
- Future-proofs for URL scheme deep linking

## Implementation Steps

### Step 1: Update Navigation Types (30 minutes)

**File:** `/mnt/d/claude dash/jarvis-native/src/types/index.ts`

Update MainTabParamList (around line 201):

```typescript
export type MainTabParamList = {
  Dashboard: undefined;
  AIChat: undefined;
  Tasks: { highlightId?: string; scrollToId?: string } | undefined;
  Projects: undefined;
  Habits: { highlightId?: string } | undefined;
  Calendar: { highlightId?: string; date?: string } | undefined;
  Finance: undefined;
  Settings: undefined;
};

export type ProjectsStackParamList = {
  ProjectsList: undefined;
  ProjectDetail: {
    projectId: string;
    highlightTaskId?: string;
  };
};
```

### Step 2: Add Highlight Hook (1 hour)

**File:** `/mnt/d/claude dash/jarvis-native/src/hooks/useHighlight.ts` (NEW FILE)

```typescript
/**
 * useHighlight Hook
 * Provides highlight animation for deep-linked items
 */

import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { colors } from '../theme';

export interface HighlightConfig {
  duration?: number;
  color?: string;
  pulseCount?: number;
}

export function useHighlight(
  itemId: string,
  targetId: string | undefined,
  config: HighlightConfig = {}
) {
  const {
    duration = 2000,
    color = colors.primary.main,
    pulseCount = 2,
  } = config;

  const [isHighlighted, setIsHighlighted] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (targetId === itemId) {
      setIsHighlighted(true);

      // Pulse animation
      Animated.sequence([
        ...Array(pulseCount)
          .fill(0)
          .flatMap(() => [
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: duration / (pulseCount * 2),
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 1.02,
                duration: duration / (pulseCount * 2),
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: duration / (pulseCount * 2),
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: duration / (pulseCount * 2),
                useNativeDriver: true,
              }),
            ]),
          ]),
      ]).start(() => {
        setIsHighlighted(false);
      });
    }
  }, [itemId, targetId, fadeAnim, scaleAnim, duration, pulseCount]);

  const highlightStyle = isHighlighted
    ? {
        transform: [{ scale: scaleAnim }],
        backgroundColor: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['transparent', `${color}20`],
        }),
      }
    : {};

  return {
    isHighlighted,
    highlightStyle,
    animated: { fadeAnim, scaleAnim },
  };
}

export default useHighlight;
```

### Step 3: Update Dashboard Navigation (1 hour)

**File:** `/mnt/d/claude dash/jarvis-native/src/screens/main/DashboardScreen.tsx`

Add navigation import (top of file):

```typescript
import type { NavigationProp } from '@react-navigation/native';
import type { MainTabParamList } from '../../types';
```

Update component to use typed navigation:

```typescript
export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  // ... existing state ...
```

Add navigation handlers (after existing handlers, around line 170):

```typescript
/**
 * Navigate to specific task
 */
const handleNavigateToTask = (taskId: string) => {
  navigation.navigate('Tasks', {
    highlightId: taskId,
    scrollToId: taskId,
  });
};

/**
 * Navigate to specific habit
 */
const handleNavigateToHabit = (habitId: string) => {
  navigation.navigate('Habits', {
    highlightId: habitId,
  });
};

/**
 * Navigate to specific event
 */
const handleNavigateToEvent = (eventId: string, date?: string) => {
  navigation.navigate('Calendar', {
    highlightId: eventId,
    date: date,
  });
};

/**
 * Navigate to view all items of type
 */
const handleViewAll = (type: 'tasks' | 'habits' | 'events') => {
  switch (type) {
    case 'tasks':
      navigation.navigate('Tasks');
      break;
    case 'habits':
      navigation.navigate('Habits');
      break;
    case 'events':
      navigation.navigate('Calendar');
      break;
  }
};
```

Update TodaysFocusCard usage (in render, around line 250):

```typescript
<TodaysFocusCard
  focus={todaysFocus}
  onNavigate={(type, id) => {
    switch (type) {
      case 'task':
        handleNavigateToTask(id);
        break;
      case 'habit':
        handleNavigateToHabit(id);
        break;
      case 'event':
        handleNavigateToEvent(id);
        break;
    }
  }}
  onViewAll={handleViewAll}
/>
```

### Step 4: Update TasksScreen with Highlight (1.5 hours)

**File:** `/mnt/d/claude dash/jarvis-native/src/screens/main/TasksScreen.tsx`

Add imports:

```typescript
import { useRoute, RouteProp } from '@react-navigation/native';
import type { MainTabParamList } from '../../types';
import { useHighlight } from '../../hooks/useHighlight';
```

Update component to handle route params:

```typescript
export default function TasksScreen() {
  const route = useRoute<RouteProp<MainTabParamList, 'Tasks'>>();
  const { highlightId, scrollToId } = route.params || {};

  // ... existing state ...
  const scrollViewRef = useRef<ScrollView>(null);
```

Add scroll-to functionality:

```typescript
// Scroll to highlighted task on mount
useEffect(() => {
  if (scrollToId && tasks.length > 0) {
    // Give render time to complete
    setTimeout(() => {
      const index = tasks.findIndex(t => t.id === scrollToId);
      if (index >= 0 && scrollViewRef.current) {
        // Rough calculation - adjust based on card height
        const cardHeight = 120; // approximate
        const offset = index * cardHeight;
        scrollViewRef.current.scrollTo({
          y: offset,
          animated: true,
        });
      }
    }, 300);
  }
}, [scrollToId, tasks]);
```

Update TaskCard to use highlight:

```typescript
const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  compact = false,
  highlightId, // NEW: Add to props
}) => {
  const [scaleValue] = useState(new Animated.Value(1));
  const isCompleted = task.status === 'completed';
  const isOverdue = isTaskOverdue(task);
  const visualStyle = getTaskVisualStyle(task);

  // NEW: Highlight hook
  const { isHighlighted, highlightStyle } = useHighlight(
    task.id,
    highlightId,
    { color: colors.primary.main, pulseCount: 3 }
  );

  // ... rest of existing code ...

  return (
    <Animated.View style={[
      { transform: [{ scale: scaleValue }] },
      isHighlighted && highlightStyle, // NEW: Add highlight style
    ]}>
      {/* ... existing TouchableOpacity ... */}
    </Animated.View>
  );
};
```

Update TaskCard props interface (around line 288):

```typescript
interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
  highlightId?: string; // NEW
}
```

Update TaskCard usage in render (around line 240):

```typescript
{tasks.map((task) => (
  <TaskCard
    key={task.id}
    task={task}
    onStatusChange={handleStatusChange}
    onEdit={handleEdit}
    onDelete={handleDelete}
    highlightId={highlightId} // NEW: Pass highlight ID
  />
))}
```

Update ScrollView ref (around line 209):

```typescript
<ScrollView
  ref={scrollViewRef} // NEW: Add ref
  style={styles.content}
  contentContainerStyle={styles.contentContainer}
  refreshControl={/* ... */}
  showsVerticalScrollIndicator={false}
>
```

### Step 5: Update ProjectDetail Screen (1 hour)

**File:** `/mnt/d/claude dash/jarvis-native/src/screens/projects/ProjectDetailScreen.tsx`

Similar pattern to TasksScreen:

```typescript
// Add imports
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { ProjectsStackParamList, MainTabParamList } from '../../types';
import { useHighlight } from '../../hooks/useHighlight';

export default function ProjectDetailScreen() {
  const route = useRoute<RouteProp<ProjectsStackParamList, 'ProjectDetail'>>();
  const navigation = useNavigation();
  const { projectId, highlightTaskId } = route.params;

  // ... existing code ...

  // Add navigation to task with highlight
  const handleTaskPress = (taskId: string) => {
    navigation.navigate('Tasks', {
      highlightId: taskId,
      scrollToId: taskId,
    });
  };

  // Use highlight in task rendering
  // Similar implementation to TasksScreen
}
```

### Step 6: Add Navigation Helper Utility (30 minutes)

**File:** `/mnt/d/claude dash/jarvis-native/src/utils/navigation.ts` (NEW FILE)

```typescript
/**
 * Navigation Helper Utilities
 * Deep linking and cross-feature navigation
 */

import type { NavigationProp } from '@react-navigation/native';
import type { MainTabParamList, ProjectsStackParamList } from '../types';

/**
 * Navigate to task detail with highlight
 */
export function navigateToTask(
  navigation: NavigationProp<MainTabParamList>,
  taskId: string,
  options: { scrollTo?: boolean } = {}
) {
  navigation.navigate('Tasks', {
    highlightId: taskId,
    scrollToId: options.scrollTo ? taskId : undefined,
  });
}

/**
 * Navigate to habit with highlight
 */
export function navigateToHabit(
  navigation: NavigationProp<MainTabParamList>,
  habitId: string
) {
  navigation.navigate('Habits', {
    highlightId: habitId,
  });
}

/**
 * Navigate to calendar event
 */
export function navigateToEvent(
  navigation: NavigationProp<MainTabParamList>,
  eventId: string,
  date?: string
) {
  navigation.navigate('Calendar', {
    highlightId: eventId,
    date: date,
  });
}

/**
 * Navigate to project with highlighted task
 */
export function navigateToProject(
  navigation: NavigationProp<any>, // More flexible for nested navigators
  projectId: string,
  options: { highlightTaskId?: string } = {}
) {
  navigation.navigate('Projects', {
    screen: 'ProjectDetail',
    params: {
      projectId,
      highlightTaskId: options.highlightTaskId,
    },
  });
}

/**
 * Navigate to budget transactions
 */
export function navigateToBudget(
  navigation: NavigationProp<MainTabParamList>,
  budgetId: string
) {
  // Budget detail screen would need similar param support
  navigation.navigate('Finance', {
    budgetId: budgetId,
  });
}
```

---

## Testing Checklist

### Dashboard to Tasks
- [ ] Tap task in Today's Focus
- [ ] Verify navigation to Tasks screen
- [ ] Verify task is highlighted (pulsing animation)
- [ ] Verify scroll position shows highlighted task
- [ ] Tap "View All Tasks"
- [ ] Verify navigation without highlight

### Dashboard to Habits
- [ ] Tap habit in Today's Focus
- [ ] Verify navigation to Habits screen
- [ ] Verify habit is highlighted
- [ ] Tap "View All Habits"
- [ ] Verify navigation without highlight

### Dashboard to Calendar
- [ ] Tap event in Today's Focus
- [ ] Verify navigation to Calendar screen
- [ ] Verify event is highlighted
- [ ] Verify correct date shown
- [ ] Tap "View All Events"
- [ ] Verify navigation to today

### Project to Task
- [ ] Open project detail
- [ ] Tap task in project task list
- [ ] Verify navigation to Tasks screen
- [ ] Verify task highlighted and scrolled into view

### Highlight Animation
- [ ] Verify highlight pulses 2-3 times
- [ ] Verify background color fades in/out
- [ ] Verify subtle scale animation
- [ ] Verify animation completes smoothly
- [ ] Navigate away and back
- [ ] Verify no residual highlight

### Edge Cases
- [ ] Navigate to non-existent task ID
- [ ] Verify no crash (graceful handling)
- [ ] Navigate to task then immediately navigate away
- [ ] Verify animation cancels cleanly
- [ ] Rapid navigation between features
- [ ] Verify no animation conflicts

---

# Testing Checklist (All Features)

## Feature 2A.2: Priority Visuals
- [ ] All priority levels display correct border colors
- [ ] Overdue tasks show red styling
- [ ] Priority badges render properly
- [ ] Compact mode shows simplified view
- [ ] List, Kanban, Matrix views all work

## Feature 2A.3: Filters & Sorting
- [ ] Filter modal opens and closes
- [ ] Multiple filters can be applied
- [ ] Filter count badge updates
- [ ] Sort options work correctly
- [ ] Filters persist across app restarts
- [ ] Clear all filters works
- [ ] Filter + sort combination works

## Feature 2A.4: Deep Links
- [ ] Dashboard → Tasks navigation
- [ ] Dashboard → Habits navigation
- [ ] Dashboard → Calendar navigation
- [ ] Project → Task navigation
- [ ] Highlight animation works
- [ ] Scroll-to-item works
- [ ] "View All" links work
- [ ] No animation conflicts

## Integration Testing
- [ ] All three features work together
- [ ] Filtered tasks can be highlighted
- [ ] Priority visuals show in highlighted items
- [ ] Deep link to filtered view works
- [ ] Performance is smooth (no lag)
- [ ] No memory leaks
- [ ] TypeScript compiles without errors

---

# Implementation Order

## Recommended Sequence

1. **2A.2: Priority Visuals** (4-6 hours)
   - Lowest complexity
   - No dependencies
   - Immediate visual impact
   - Good foundation for other features

2. **2A.3: Sorting & Filters** (8-10 hours)
   - Builds on priority visuals
   - Adds significant functionality
   - Can test with new priority colors

3. **2A.4: Deep Links** (4-6 hours)
   - Benefits from having complete task views
   - Can test navigation to filtered/sorted views
   - Ties everything together

**Total Estimated Time:** 16-22 hours

## Parallel Development Options

If working with multiple developers:

- **Track 1:** Priority Visuals (1 dev)
- **Track 2:** Filter Store + Database (1 dev)
- **Track 3:** Deep Link Navigation Types (1 dev)

Then merge and complete UI integration.

---

## File Paths Summary

### Files to Modify
- `/mnt/d/claude dash/jarvis-native/src/screens/main/TasksScreen.tsx`
- `/mnt/d/claude dash/jarvis-native/src/database/tasks.ts`
- `/mnt/d/claude dash/jarvis-native/src/types/index.ts`
- `/mnt/d/claude dash/jarvis-native/src/screens/main/DashboardScreen.tsx`
- `/mnt/d/claude dash/jarvis-native/src/screens/projects/ProjectDetailScreen.tsx`

### Files to Create
- `/mnt/d/claude dash/jarvis-native/src/store/taskFilterStore.ts`
- `/mnt/d/claude dash/jarvis-native/src/components/TaskFilterBar.tsx`
- `/mnt/d/claude dash/jarvis-native/src/hooks/useHighlight.ts`
- `/mnt/d/claude dash/jarvis-native/src/utils/navigation.ts`

### Dependencies to Install
```bash
npm install @react-native-async-storage/async-storage
```

---

## Notes

- All features are offline-first (no network required)
- Uses existing theme system and color palette
- Follows established patterns from Phase 1
- TypeScript types are complete and type-safe
- Backwards compatible with existing functionality
- Performance optimized (lazy loading, memoization where needed)
- Animations use native driver for 60fps performance

## Next Steps After Completion

1. Commit each feature separately:
   - `feat: add task priority visual system`
   - `feat: add task sorting and advanced filters`
   - `feat: add cross-feature deep links and highlight navigation`

2. Test on both iOS and Android

3. Gather user feedback on:
   - Priority color choices
   - Filter discoverability
   - Navigation flow intuitiveness

4. Proceed to Phase 2B features:
   - Habit Insights
   - Calendar Conflict Detection
   - Task Bulk Actions
