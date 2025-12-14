# Offline Features Implementation Plan
**Comprehensive Roadmap for Tier 2 + Tier 3 Features**

**Date:** December 14, 2025
**Project:** Jarvis Native - Life Dashboard
**Status:** Phase 1 Complete (100%) - Ready for Tier 2/3 Implementation

---

## Executive Summary

This document provides a detailed implementation roadmap for all remaining offline features, organized into logical phases with clear priorities, dependencies, and technical specifications.

**Current State:**
- Phase 1: 100% Complete (Global Search, Recurring Tasks/Events, Projects, Budgets, Charts)
- Tier 1 Critical Issues: 100% Complete (7/7 items)
- Foundation: Solid offline-first architecture with SQLite, comprehensive CRUD operations

**Scope:**
- Tier 2: 8 high-priority features (contextual intelligence, priority systems, insights)
- Tier 3: 30 polish/enhancement features (advanced UX, optimizations, edge cases)
- Total Estimated Effort: 205-255 hours

---

## Table of Contents

1. [Phase Groupings Overview](#phase-groupings-overview)
2. [Phase 2A: Contextual Intelligence & Priority Systems](#phase-2a-contextual-intelligence--priority-systems)
3. [Phase 2B: Insights, Analytics & Notifications](#phase-2b-insights-analytics--notifications)
4. [Phase 3A: Advanced Interactions & Bulk Operations](#phase-3a-advanced-interactions--bulk-operations)
5. [Phase 3B: Recurring Items & Time Management](#phase-3b-recurring-items--time-management)
6. [Phase 3C: Data Management & Visualizations](#phase-3c-data-management--visualizations)
7. [Phase 3D: Polish, UX & Onboarding](#phase-3d-polish-ux--onboarding)
8. [Implementation Dependencies](#implementation-dependencies)
9. [Database Changes Required](#database-changes-required)
10. [Component Architecture](#component-architecture)
11. [Testing Strategy](#testing-strategy)
12. [Next Steps & Priorities](#next-steps--priorities)

---

## Phase Groupings Overview

### Phase 2A: Contextual Intelligence & Priority Systems (22-26 hours)
**Focus:** Making the app smart and visually informative
**Features:** Dashboard Today's Focus, Task Priority Visuals, Task Sorting/Filters, Cross-Feature Deep Links

### Phase 2B: Insights, Analytics & Notifications (20-26 hours)
**Focus:** Adding intelligence, patterns, and proactive reminders
**Features:** Habit Insights, Calendar Conflict Detection, Calendar Reminders, Task Bulk Actions

### Phase 3A: Advanced Interactions & Bulk Operations (14-20 hours)
**Focus:** Power-user features and efficiency
**Features:** Task Swipe Actions, Search Across Screens, Tab Bar Badges, Undo/Redo System

### Phase 3B: Recurring Items & Time Management (18-22 hours)
**Focus:** Automation and time-based features
**Features:** Habit Reminders, Habit Notes, Date Pickers, Project/Tag Management

### Phase 3C: Data Management & Visualizations (24-30 hours)
**Focus:** Advanced data handling and insights
**Features:** Finance Export, Category Management, Optimistic Updates, Loading Skeletons

### Phase 3D: Polish, UX & Onboarding (40-50 hours)
**Focus:** Delightful experience and user guidance
**Features:** Onboarding, Habit Stacking, Dashboard Sparklines, Pull-to-Refresh Consistency

---

# PHASE 2A: Contextual Intelligence & Priority Systems

**Duration:** 22-26 hours
**Priority:** HIGH (TIER 2)
**Dependencies:** None (can start immediately)

---

## Feature 2A.1: Dashboard - Today's Focus Section

**Priority:** TIER 2 - High Impact
**Effort:** 8-10 hours
**Complexity:** Medium

### Description
Transform Dashboard from static metrics to a smart landing page that surfaces relevant tasks, habits, and events based on current context.

### Business Value
- Users instantly see "what matters now" without navigating
- Reduces cognitive load by prioritizing information
- Increases engagement with pending items

### Technical Implementation

#### Database Changes
```typescript
// src/database/dashboard.ts - Add new functions

export interface TodaysFocus {
  urgentTasks: Task[];        // Top 3 tasks due today/overdue
  pendingHabits: Habit[];      // Habits not yet completed today
  nextEvent: CalendarEvent | null; // Next calendar event with countdown
  overdueCount: number;        // Total overdue tasks
}

export async function getTodaysFocus(): Promise<TodaysFocus> {
  const db = await getDB();
  const today = new Date().toISOString().split('T')[0];

  // Get urgent tasks (due today or overdue, not completed)
  const urgentTasks = await db.getAllAsync<Task>(
    `SELECT * FROM tasks
     WHERE status != 'completed'
     AND (due_date <= ? OR due_date = ?)
     ORDER BY
       CASE priority
         WHEN 'urgent' THEN 1
         WHEN 'high' THEN 2
         WHEN 'medium' THEN 3
         ELSE 4
       END,
       due_date ASC
     LIMIT 3`,
    [today, today]
  );

  // Get pending habits for today
  const pendingHabits = await db.getAllAsync<Habit>(
    `SELECT h.* FROM habits h
     LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.date = ?
     WHERE h.cadence = 'daily' AND (hl.completed IS NULL OR hl.completed = 0)`,
    [today]
  );

  // Get next calendar event
  const nextEvent = await db.getFirstAsync<CalendarEvent>(
    `SELECT * FROM calendar_events
     WHERE start_time >= datetime('now')
     ORDER BY start_time ASC
     LIMIT 1`
  );

  // Count overdue tasks
  const overdueResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM tasks
     WHERE status != 'completed' AND due_date < ?`,
    [today]
  );

  return {
    urgentTasks: urgentTasks || [],
    pendingHabits: pendingHabits || [],
    nextEvent: nextEvent || null,
    overdueCount: overdueResult?.count || 0,
  };
}
```

#### Component Structure
```typescript
// src/components/dashboard/TodaysFocusCard.tsx

interface TodaysFocusCardProps {
  focus: TodaysFocus;
  onTaskPress: (taskId: string) => void;
  onHabitPress: (habitId: string) => void;
  onEventPress: (eventId: string) => void;
}

export function TodaysFocusCard({ focus, onTaskPress, onHabitPress, onEventPress }: TodaysFocusCardProps) {
  return (
    <AppCard style={styles.focusCard}>
      <Text style={styles.sectionTitle}>Today's Focus</Text>

      {/* Overdue Alert */}
      {focus.overdueCount > 0 && (
        <View style={styles.overdueAlert}>
          <Icon name="alert-circle" size={20} color={colors.error} />
          <Text style={styles.overdueText}>
            {focus.overdueCount} overdue task{focus.overdueCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Urgent Tasks */}
      {focus.urgentTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>Due Today</Text>
          {focus.urgentTasks.map(task => (
            <TouchableOpacity
              key={task.id}
              onPress={() => onTaskPress(task.id)}
              style={styles.focusItem}
            >
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
              <Text style={styles.focusItemText} numberOfLines={1}>{task.title}</Text>
              <Icon name="chevron-right" size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Pending Habits */}
      {focus.pendingHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>Habits to Complete</Text>
          {focus.pendingHabits.map(habit => (
            <TouchableOpacity
              key={habit.id}
              onPress={() => onHabitPress(habit.id)}
              style={styles.focusItem}
            >
              <Icon name="circle-outline" size={20} color={colors.primary} />
              <Text style={styles.focusItemText}>{habit.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Next Event */}
      {focus.nextEvent && (
        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>Coming Up</Text>
          <TouchableOpacity
            onPress={() => onEventPress(focus.nextEvent.id)}
            style={styles.nextEventCard}
          >
            <View style={styles.eventTime}>
              <Text style={styles.eventTimeText}>
                {formatTimeUntil(focus.nextEvent.start_time)}
              </Text>
            </View>
            <Text style={styles.eventTitle}>{focus.nextEvent.title}</Text>
            <Text style={styles.eventTimeStamp}>
              {formatEventTime(focus.nextEvent.start_time)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {focus.urgentTasks.length === 0 &&
       focus.pendingHabits.length === 0 &&
       !focus.nextEvent && (
        <View style={styles.emptyState}>
          <Icon name="check-circle" size={48} color={colors.success} />
          <Text style={styles.emptyText}>You're all caught up!</Text>
        </View>
      )}
    </AppCard>
  );
}
```

#### Integration into DashboardScreen
```typescript
// src/screens/main/DashboardScreen.tsx - Add to existing file

import { TodaysFocusCard } from '../../components/dashboard/TodaysFocusCard';
import * as dashboardDB from '../../database/dashboard';

// Add state
const [todaysFocus, setTodaysFocus] = useState<dashboardDB.TodaysFocus | null>(null);

// Update loadData function
const loadData = useCallback(async () => {
  try {
    const [metricsData, goalsData, alertsData, focusData] = await Promise.all([
      dashboardDB.getTodayMetrics(),
      dashboardDB.getMacroGoals(),
      budgetsDB.getAlertBudgets(),
      dashboardDB.getTodaysFocus(), // NEW
    ]);
    setMetrics(metricsData);
    setMacroGoals(goalsData);
    setBudgetAlerts(alertsData);
    setTodaysFocus(focusData); // NEW
  } catch (error) {
    console.error('[Dashboard] Error loading data:', error);
  }
}, []);

// Add deep link handlers
const handleTaskPress = (taskId: string) => {
  navigation.navigate('Tasks', { highlightTaskId: taskId });
};

const handleHabitPress = (habitId: string) => {
  navigation.navigate('Habits', { highlightHabitId: habitId });
};

const handleEventPress = (eventId: string) => {
  navigation.navigate('Calendar', { highlightEventId: eventId });
};

// Add to render (after metrics, before quick capture)
{todaysFocus && (
  <TodaysFocusCard
    focus={todaysFocus}
    onTaskPress={handleTaskPress}
    onHabitPress={handleHabitPress}
    onEventPress={handleEventPress}
  />
)}
```

### Files to Create/Modify
- **Create:** `src/components/dashboard/TodaysFocusCard.tsx`
- **Modify:** `src/database/dashboard.ts` (add getTodaysFocus function)
- **Modify:** `src/screens/main/DashboardScreen.tsx` (integrate component)
- **Modify:** `src/navigation/MainNavigator.tsx` (add navigation params for deep links)

### Testing Checklist
- [ ] Today's Focus shows top 3 urgent tasks
- [ ] Pending habits appear correctly
- [ ] Next event shows with accurate countdown
- [ ] Overdue alert displays when tasks are overdue
- [ ] Deep links navigate to correct screens
- [ ] Empty state shows when all clear
- [ ] Refreshing updates focus data

---

## Feature 2A.2: Tasks - Priority Visual System

**Priority:** TIER 2 - High Impact
**Effort:** 4-6 hours
**Complexity:** Low-Medium

### Description
Add visual priority indicators (colored left border, priority chips, overdue highlighting) to make task importance instantly recognizable.

### Business Value
- Reduces decision fatigue by visual prioritization
- Prevents missing urgent/overdue tasks
- Improves scanning efficiency in task lists

### Technical Implementation

#### Priority Configuration
```typescript
// src/constants/priorities.ts - New file

export const PRIORITY_CONFIG = {
  urgent: {
    color: '#EF4444',
    label: 'Urgent',
    borderWidth: 4,
    icon: 'alert-circle',
  },
  high: {
    color: '#F97316',
    label: 'High',
    borderWidth: 4,
    icon: 'arrow-up-circle',
  },
  medium: {
    color: '#F59E0B',
    label: 'Medium',
    borderWidth: 3,
    icon: 'minus-circle',
  },
  low: {
    color: '#64748B',
    label: 'Low',
    borderWidth: 2,
    icon: 'arrow-down-circle',
  },
} as const;

export function getPriorityColor(priority?: string): string {
  if (!priority || !(priority in PRIORITY_CONFIG)) {
    return PRIORITY_CONFIG.low.color;
  }
  return PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG].color;
}

export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  const today = new Date().toISOString().split('T')[0];
  return dueDate < today;
}
```

#### Update TaskCard Component
```typescript
// src/components/tasks/TaskCard.tsx - Create new component

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onDelete: () => void;
}

export function TaskCard({ task, onPress, onStatusChange, onDelete }: TaskCardProps) {
  const priority = task.priority || 'low';
  const priorityConfig = PRIORITY_CONFIG[priority];
  const overdue = isOverdue(task.dueDate) && task.status !== 'completed';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[
        styles.card,
        { borderLeftWidth: priorityConfig.borderWidth, borderLeftColor: priorityConfig.color },
        overdue && styles.overdueCard
      ]}>
        {/* Overdue Badge */}
        {overdue && (
          <View style={styles.overdueBadge}>
            <Icon name="clock-alert-outline" size={14} color={colors.error} />
            <Text style={styles.overdueText}>OVERDUE</Text>
          </View>
        )}

        {/* Priority Chip */}
        <View style={styles.header}>
          <View style={[styles.priorityChip, { backgroundColor: priorityConfig.color + '20' }]}>
            <Icon name={priorityConfig.icon} size={14} color={priorityConfig.color} />
            <Text style={[styles.priorityLabel, { color: priorityConfig.color }]}>
              {priorityConfig.label}
            </Text>
          </View>

          {task.recurrence && (
            <Icon name="sync" size={16} color={colors.text.tertiary} />
          )}
        </View>

        {/* Task Title */}
        <Text style={[
          styles.title,
          task.status === 'completed' && styles.completedTitle,
          overdue && styles.overdueTitle
        ]}>
          {task.title}
        </Text>

        {/* Description */}
        {task.description && (
          <Text style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
        )}

        {/* Metadata Row */}
        <View style={styles.metadata}>
          {/* Due Date */}
          {task.dueDate && (
            <View style={styles.metaItem}>
              <Icon name="calendar" size={14} color={overdue ? colors.error : colors.text.tertiary} />
              <Text style={[styles.metaText, overdue && styles.overdueMetaText]}>
                {formatDueDate(task.dueDate)}
              </Text>
            </View>
          )}

          {/* Project */}
          {task.project && (
            <View style={styles.metaItem}>
              <View style={[styles.projectDot, { backgroundColor: task.project.color }]} />
              <Text style={styles.metaText}>{task.project.name}</Text>
            </View>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <View style={styles.tags}>
              {task.tags.slice(0, 2).map(tag => (
                <AppChip key={tag} label={tag} size="small" />
              ))}
              {task.tags.length > 2 && (
                <Text style={styles.moreTagsText}>+{task.tags.length - 2}</Text>
              )}
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onStatusChange(getNextStatus(task.status))}>
            <Icon
              name={task.status === 'completed' ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={task.status === 'completed' ? colors.success : colors.text.tertiary}
            />
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            <IconButton icon="pencil" size={20} onPress={onPress} />
            <IconButton icon="delete" size={20} onPress={onDelete} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.sm,
  },
  overdueCard: {
    backgroundColor: '#FEF2F2', // Light red background
    borderColor: colors.error,
    borderWidth: 1,
  },
  overdueBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  overdueText: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: '600',
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  priorityLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  // ... additional styles
});
```

#### Update TasksScreen
```typescript
// src/screens/main/TasksScreen.tsx - Modify existing

// Import new TaskCard
import { TaskCard } from '../../components/tasks/TaskCard';

// Update default sorting to prioritize urgent tasks
const loadTasks = useCallback(async () => {
  try {
    const filters = filterStatus !== 'all' ? { status: filterStatus } : undefined;
    const loadedTasks = await tasksDB.getTasks(filters);

    // Sort by priority and due date
    const sortedTasks = loadedTasks.sort((a, b) => {
      // First by overdue status
      const aOverdue = isOverdue(a.dueDate);
      const bOverdue = isOverdue(b.dueDate);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

      // Then by priority
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority || 'low'];
      const bPriority = priorityOrder[b.priority || 'low'];
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Then by due date
      if (a.dueDate && b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }

      return 0;
    });

    setTasks(sortedTasks);
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
}, [filterStatus]);

// Replace inline task rendering with TaskCard component
<FlatList
  data={tasks}
  keyExtractor={item => item.id}
  renderItem={({ item }) => (
    <TaskCard
      task={item}
      onPress={() => handleEdit(item)}
      onStatusChange={(status) => handleStatusChange(item.id, status)}
      onDelete={() => handleDelete(item.id)}
    />
  )}
  // ... other props
/>
```

### Files to Create/Modify
- **Create:** `src/constants/priorities.ts`
- **Create:** `src/components/tasks/TaskCard.tsx`
- **Modify:** `src/screens/main/TasksScreen.tsx`

### Testing Checklist
- [ ] Priority colors match configuration
- [ ] Left border width varies by priority
- [ ] Overdue tasks show red badge and background
- [ ] Priority chip displays correctly
- [ ] Tasks auto-sort by priority and due date
- [ ] Completed tasks have strikethrough
- [ ] Recurring icon appears when recurrence exists

---

## Feature 2A.3: Tasks - Sorting & Advanced Filters

**Priority:** TIER 2 - High Impact
**Effort:** 6-8 hours
**Complexity:** Medium

### Description
Add comprehensive sorting (priority, due date, created, alphabetical) and filtering (priority, project, tags, search) to help users find and organize tasks.

### Technical Implementation

#### Filter/Sort State Management
```typescript
// src/store/taskFiltersStore.ts - New Zustand store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SortOption = 'priority' | 'dueDate' | 'created' | 'alphabetical';
export type FilterPriority = 'urgent' | 'high' | 'medium' | 'low' | 'all';

interface TaskFiltersState {
  sortBy: SortOption;
  filterPriority: FilterPriority;
  filterProjectId: string | null;
  filterTags: string[];
  searchQuery: string;

  setSortBy: (sort: SortOption) => void;
  setFilterPriority: (priority: FilterPriority) => void;
  setFilterProjectId: (projectId: string | null) => void;
  setFilterTags: (tags: string[]) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

const DEFAULT_STATE = {
  sortBy: 'priority' as SortOption,
  filterPriority: 'all' as FilterPriority,
  filterProjectId: null,
  filterTags: [],
  searchQuery: '',
};

export const useTaskFiltersStore = create<TaskFiltersState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setSortBy: (sortBy) => set({ sortBy }),
      setFilterPriority: (filterPriority) => set({ filterPriority }),
      setFilterProjectId: (filterProjectId) => set({ filterProjectId }),
      setFilterTags: (filterTags) => set({ filterTags }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      resetFilters: () => set(DEFAULT_STATE),
    }),
    {
      name: 'task-filters',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

#### Filter Bar Component
```typescript
// src/components/tasks/TaskFilterBar.tsx - New component

import { useTaskFiltersStore } from '../../store/taskFiltersStore';

export function TaskFilterBar() {
  const {
    sortBy,
    filterPriority,
    filterProjectId,
    filterTags,
    searchQuery,
    setSortBy,
    setFilterPriority,
    setFilterProjectId,
    setFilterTags,
    setSearchQuery,
    resetFilters,
  } = useTaskFiltersStore();

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const activeFilterCount = [
    filterPriority !== 'all',
    filterProjectId !== null,
    filterTags.length > 0,
    searchQuery.length > 0,
  ].filter(Boolean).length;

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.text.tertiary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort & Filter Row */}
      <View style={styles.controlsRow}>
        {/* Sort Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowSortMenu(true)}
        >
          <Icon name="sort" size={18} color={colors.primary} />
          <Text style={styles.controlButtonText}>
            Sort: {SORT_LABELS[sortBy]}
          </Text>
        </TouchableOpacity>

        {/* Filter Button */}
        <TouchableOpacity
          style={[styles.controlButton, activeFilterCount > 0 && styles.activeControlButton]}
          onPress={() => setShowFilterMenu(true)}
        >
          <Icon name="filter" size={18} color={colors.primary} />
          <Text style={styles.controlButtonText}>Filters</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Reset Button */}
        {activeFilterCount > 0 && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetFilters}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsContainer}
        >
          {filterPriority !== 'all' && (
            <AppChip
              label={`Priority: ${filterPriority}`}
              onClose={() => setFilterPriority('all')}
            />
          )}
          {filterProjectId && (
            <AppChip
              label={`Project: ${getProjectName(filterProjectId)}`}
              onClose={() => setFilterProjectId(null)}
            />
          )}
          {filterTags.map(tag => (
            <AppChip
              key={tag}
              label={`#${tag}`}
              onClose={() => setFilterTags(filterTags.filter(t => t !== tag))}
            />
          ))}
        </ScrollView>
      )}

      {/* Sort Menu Modal */}
      <Modal visible={showSortMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowSortMenu(false)}
        >
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Sort By</Text>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={styles.menuItem}
                onPress={() => {
                  setSortBy(option.value);
                  setShowSortMenu(false);
                }}
              >
                <Icon
                  name={option.icon}
                  size={20}
                  color={sortBy === option.value ? colors.primary : colors.text.secondary}
                />
                <Text style={[
                  styles.menuItemText,
                  sortBy === option.value && styles.activeMenuItemText
                ]}>
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Icon name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Menu Modal - Similar structure with priority/project/tag pickers */}
    </View>
  );
}

const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority', icon: 'alert-circle' },
  { value: 'dueDate', label: 'Due Date', icon: 'calendar' },
  { value: 'created', label: 'Created Date', icon: 'clock' },
  { value: 'alphabetical', label: 'Alphabetical', icon: 'sort-alphabetical-ascending' },
] as const;

const SORT_LABELS = {
  priority: 'Priority',
  dueDate: 'Due Date',
  created: 'Created',
  alphabetical: 'A-Z',
};
```

#### Apply Filters in TasksScreen
```typescript
// src/screens/main/TasksScreen.tsx - Update loadTasks

import { useTaskFiltersStore } from '../../store/taskFiltersStore';

const {
  sortBy,
  filterPriority,
  filterProjectId,
  filterTags,
  searchQuery,
} = useTaskFiltersStore();

const loadTasks = useCallback(async () => {
  try {
    // Base filters
    const filters = filterStatus !== 'all' ? { status: filterStatus } : undefined;
    let loadedTasks = await tasksDB.getTasks(filters);

    // Apply priority filter
    if (filterPriority !== 'all') {
      loadedTasks = loadedTasks.filter(t => t.priority === filterPriority);
    }

    // Apply project filter
    if (filterProjectId) {
      loadedTasks = loadedTasks.filter(t => t.projectId === filterProjectId);
    }

    // Apply tag filter
    if (filterTags.length > 0) {
      loadedTasks = loadedTasks.filter(t =>
        filterTags.some(tag => t.tags?.includes(tag))
      );
    }

    // Apply search
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      loadedTasks = loadedTasks.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    loadedTasks = sortTasks(loadedTasks, sortBy);

    setTasks(loadedTasks);
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
}, [filterStatus, sortBy, filterPriority, filterProjectId, filterTags, searchQuery]);

function sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
  const sorted = [...tasks];

  switch (sortBy) {
    case 'priority':
      return sorted.sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const aOverdue = isOverdue(a.dueDate);
        const bOverdue = isOverdue(b.dueDate);
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
        return priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low'];
      });

    case 'dueDate':
      return sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });

    case 'created':
      return sorted.sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );

    case 'alphabetical':
      return sorted.sort((a, b) =>
        a.title.toLowerCase().localeCompare(b.title.toLowerCase())
      );

    default:
      return sorted;
  }
}
```

### Files to Create/Modify
- **Create:** `src/store/taskFiltersStore.ts`
- **Create:** `src/components/tasks/TaskFilterBar.tsx`
- **Modify:** `src/screens/main/TasksScreen.tsx`

### Testing Checklist
- [ ] Sort changes reflect immediately
- [ ] Filter combinations work correctly
- [ ] Search is case-insensitive
- [ ] Active filters show as chips
- [ ] Reset clears all filters
- [ ] Filter preferences persist across sessions
- [ ] Empty state shows when no tasks match filters

---

## Feature 2A.4: Cross-Feature Deep Links

**Priority:** TIER 2 - High Impact
**Effort:** 4-6 hours
**Complexity:** Low-Medium

### Description
Enable navigation from Dashboard cards to specific tasks/habits/events, and add "View All" links to navigate to full screens.

### Technical Implementation

#### Update Navigation Types
```typescript
// src/types/index.ts - Update navigation types

export type MainTabParamList = {
  Dashboard: undefined;
  AIChat: undefined;
  Tasks: { highlightTaskId?: string };
  Projects: undefined;
  Habits: { highlightHabitId?: string };
  Calendar: { highlightEventId?: string; date?: string };
  Finance: { highlightTransactionId?: string };
  Settings: undefined;
};
```

#### Implement Highlight Effect Hook
```typescript
// src/hooks/useHighlightEffect.ts - New hook

import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function useHighlightEffect(shouldHighlight: boolean) {
  const highlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shouldHighlight) {
      Animated.sequence([
        Animated.timing(highlightAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: 300,
          delay: 1000,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [shouldHighlight]);

  const backgroundColor = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', colors.primary + '20'],
  });

  return { backgroundColor };
}
```

#### Update TasksScreen for Deep Links
```typescript
// src/screens/main/TasksScreen.tsx - Add deep link handling

import { useRoute, RouteProp } from '@react-navigation/native';
import { useHighlightEffect } from '../../hooks/useHighlightEffect';
import type { MainTabParamList } from '../../types';

type TasksScreenRouteProp = RouteProp<MainTabParamList, 'Tasks'>;

export default function TasksScreen() {
  const route = useRoute<TasksScreenRouteProp>();
  const highlightTaskId = route.params?.highlightTaskId;
  const listRef = useRef<FlatList>(null);

  // Scroll to highlighted task
  useEffect(() => {
    if (highlightTaskId && tasks.length > 0) {
      const index = tasks.findIndex(t => t.id === highlightTaskId);
      if (index !== -1) {
        setTimeout(() => {
          listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        }, 300);
      }
    }
  }, [highlightTaskId, tasks]);

  // Render item with highlight
  const renderTaskItem = ({ item }: { item: Task }) => {
    const shouldHighlight = item.id === highlightTaskId;
    const { backgroundColor } = useHighlightEffect(shouldHighlight);

    return (
      <Animated.View style={{ backgroundColor }}>
        <TaskCard
          task={item}
          onPress={() => handleEdit(item)}
          onStatusChange={(status) => handleStatusChange(item.id, status)}
          onDelete={() => handleDelete(item.id)}
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ... header ... */}

      <FlatList
        ref={listRef}
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={renderTaskItem}
        onScrollToIndexFailed={(info) => {
          // Handle edge case
          listRef.current?.scrollToOffset({ offset: 0, animated: false });
        }}
        // ... other props
      />
    </View>
  );
}
```

#### Update Dashboard Navigation
```typescript
// Already implemented in 2A.1, but ensure types are correct:

const handleTaskPress = (taskId: string) => {
  navigation.navigate('Tasks', { highlightTaskId: taskId });
};

const handleHabitPress = (habitId: string) => {
  navigation.navigate('Habits', { highlightHabitId: habitId });
};

const handleEventPress = (eventId: string) => {
  navigation.navigate('Calendar', { highlightEventId: eventId });
};
```

#### Add "View All" Links
```typescript
// src/components/dashboard/SectionHeader.tsx - New component

interface SectionHeaderProps {
  title: string;
  count?: number;
  onViewAll?: () => void;
}

export function SectionHeader({ title, count, onViewAll }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {count !== undefined && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>

      {onViewAll && (
        <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Icon name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Usage in Dashboard:
<SectionHeader
  title="Today's Tasks"
  count={todaysFocus.urgentTasks.length}
  onViewAll={() => navigation.navigate('Tasks')}
/>
```

### Files to Create/Modify
- **Create:** `src/hooks/useHighlightEffect.ts`
- **Create:** `src/components/dashboard/SectionHeader.tsx`
- **Modify:** `src/types/index.ts` (update MainTabParamList)
- **Modify:** `src/screens/main/TasksScreen.tsx`
- **Modify:** `src/screens/main/HabitsScreen.tsx`
- **Modify:** `src/screens/main/CalendarScreen.tsx`
- **Modify:** `src/screens/main/DashboardScreen.tsx`

### Testing Checklist
- [ ] Tapping Dashboard task navigates to Tasks screen
- [ ] Highlighted task scrolls into view and animates
- [ ] Tapping habit navigates to Habits screen
- [ ] Tapping event navigates to Calendar screen
- [ ] "View All" links work correctly
- [ ] Highlight animation plays once
- [ ] Navigation doesn't crash on missing IDs

---

# PHASE 2B: Insights, Analytics & Notifications

**Duration:** 20-26 hours
**Priority:** HIGH (TIER 2)
**Dependencies:** Phase 2A.1 (for habit completion data)

---

## Feature 2B.1: Habits - Insights & Analytics

**Priority:** TIER 2 - High Impact
**Effort:** 8-10 hours
**Complexity:** Medium-High

### Description
Add completion rate, best time of day analysis, trend visualization, and pattern insights to habit tracking.

### Database Changes
```typescript
// src/database/habits.ts - Add analytics functions

export interface HabitInsights {
  habitId: string;
  completionRate30Days: number;  // Percentage
  completionRate7Days: number;   // Percentage
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening' | null;
  longestStreak: number;
  currentStreak: number;
  totalCompletions: number;
  weekdayPattern: { [key: string]: number }; // Mon: 80%, Tue: 60%, etc.
  timeDistribution: { morning: number; afternoon: number; evening: number };
}

export async function getHabitInsights(habitId: string): Promise<HabitInsights> {
  const db = await getDB();
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get completion logs for last 30 days
  const logs = await db.getAllAsync<HabitLog>(
    `SELECT * FROM habit_logs
     WHERE habit_id = ?
     AND date >= ?
     ORDER BY date DESC`,
    [habitId, thirtyDaysAgo.toISOString().split('T')[0]]
  );

  // Calculate 30-day completion rate
  const completedLast30 = logs.filter(l => l.completed).length;
  const completionRate30Days = (completedLast30 / 30) * 100;

  // Calculate 7-day completion rate
  const completedLast7 = logs
    .filter(l => new Date(l.date) >= sevenDaysAgo && l.completed)
    .length;
  const completionRate7Days = (completedLast7 / 7) * 100;

  // Analyze time of day (if we have created_at timestamps)
  const timeDistribution = analyzeTimeOfDay(logs);
  const bestTimeOfDay = getBestTimeOfDay(timeDistribution);

  // Weekday pattern
  const weekdayPattern = analyzeWeekdayPattern(logs);

  // Get streak data from habit record
  const habit = await getHabit(habitId);

  return {
    habitId,
    completionRate30Days: Math.round(completionRate30Days),
    completionRate7Days: Math.round(completionRate7Days),
    bestTimeOfDay,
    longestStreak: habit?.longestStreak || 0,
    currentStreak: habit?.currentStreak || 0,
    totalCompletions: completedLast30,
    weekdayPattern,
    timeDistribution,
  };
}

function analyzeTimeOfDay(logs: HabitLog[]): { morning: number; afternoon: number; evening: number } {
  const distribution = { morning: 0, afternoon: 0, evening: 0 };

  logs.forEach(log => {
    if (!log.completed || !log.created_at) return;

    const hour = new Date(log.created_at).getHours();
    if (hour >= 5 && hour < 12) distribution.morning++;
    else if (hour >= 12 && hour < 18) distribution.afternoon++;
    else distribution.evening++;
  });

  return distribution;
}

function getBestTimeOfDay(distribution: { morning: number; afternoon: number; evening: number }): 'morning' | 'afternoon' | 'evening' | null {
  const total = distribution.morning + distribution.afternoon + distribution.evening;
  if (total === 0) return null;

  const max = Math.max(distribution.morning, distribution.afternoon, distribution.evening);
  if (distribution.morning === max) return 'morning';
  if (distribution.afternoon === max) return 'afternoon';
  return 'evening';
}

function analyzeWeekdayPattern(logs: HabitLog[]): { [key: string]: number } {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const counts: { [key: string]: { completed: number; total: number } } = {};

  weekdays.forEach(day => {
    counts[day] = { completed: 0, total: 0 };
  });

  logs.forEach(log => {
    const dayName = weekdays[new Date(log.date).getDay()];
    counts[dayName].total++;
    if (log.completed) counts[dayName].completed++;
  });

  const pattern: { [key: string]: number } = {};
  weekdays.forEach(day => {
    pattern[day] = counts[day].total > 0
      ? Math.round((counts[day].completed / counts[day].total) * 100)
      : 0;
  });

  return pattern;
}
```

### Insights Component
```typescript
// src/components/habits/HabitInsightsCard.tsx - New component

interface HabitInsightsCardProps {
  insights: HabitInsights;
}

export function HabitInsightsCard({ insights }: HabitInsightsCardProps) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.title}>Insights</Text>

      {/* Completion Rates */}
      <View style={styles.ratesContainer}>
        <View style={styles.rateBox}>
          <Text style={styles.rateValue}>{insights.completionRate7Days}%</Text>
          <Text style={styles.rateLabel}>7-Day Rate</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.rateBox}>
          <Text style={styles.rateValue}>{insights.completionRate30Days}%</Text>
          <Text style={styles.rateLabel}>30-Day Rate</Text>
        </View>
      </View>

      {/* Best Time of Day */}
      {insights.bestTimeOfDay && (
        <View style={styles.insightRow}>
          <Icon name="clock-outline" size={20} color={colors.primary} />
          <Text style={styles.insightText}>
            You complete this habit most often in the{' '}
            <Text style={styles.insightHighlight}>{insights.bestTimeOfDay}</Text>
          </Text>
        </View>
      )}

      {/* Streaks */}
      <View style={styles.streaksContainer}>
        <View style={styles.streakBox}>
          <Icon name="fire" size={24} color={colors.warning} />
          <Text style={styles.streakValue}>{insights.currentStreak}</Text>
          <Text style={styles.streakLabel}>Current Streak</Text>
        </View>
        <View style={styles.streakBox}>
          <Icon name="trophy" size={24} color={colors.success} />
          <Text style={styles.streakValue}>{insights.longestStreak}</Text>
          <Text style={styles.streakLabel}>Best Streak</Text>
        </View>
      </View>

      {/* Weekday Pattern Chart */}
      <View style={styles.patternContainer}>
        <Text style={styles.sectionTitle}>Weekly Pattern</Text>
        <View style={styles.weekdayBars}>
          {Object.entries(insights.weekdayPattern).map(([day, rate]) => (
            <View key={day} style={styles.weekdayBar}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${rate}%`,
                      backgroundColor: getBarColor(rate),
                    }
                  ]}
                />
              </View>
              <Text style={styles.weekdayLabel}>{day.slice(0, 3)}</Text>
              <Text style={styles.weekdayRate}>{rate}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Total Completions */}
      <View style={styles.footer}>
        <Icon name="check-circle" size={16} color={colors.text.tertiary} />
        <Text style={styles.footerText}>
          {insights.totalCompletions} completions in last 30 days
        </Text>
      </View>
    </AppCard>
  );
}

function getBarColor(rate: number): string {
  if (rate >= 80) return colors.success;
  if (rate >= 50) return colors.warning;
  return colors.error;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  ratesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  rateBox: {
    flex: 1,
    alignItems: 'center',
  },
  rateValue: {
    ...typography.h2,
    color: colors.primary,
  },
  rateLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  weekdayBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 120,
    marginTop: spacing.sm,
  },
  weekdayBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: borderRadius.sm,
  },
  weekdayLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  weekdayRate: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  // ... additional styles
});
```

### Integration into HabitsScreen
```typescript
// src/screens/main/HabitsScreen.tsx - Add insights

import { HabitInsightsCard } from '../../components/habits/HabitInsightsCard';

// Add insights state
const [selectedHabitInsights, setSelectedHabitInsights] = useState<HabitInsights | null>(null);
const [showInsightsModal, setShowInsightsModal] = useState(false);

// Load insights function
const loadInsights = async (habitId: string) => {
  try {
    const insights = await habitsDB.getHabitInsights(habitId);
    setSelectedHabitInsights(insights);
    setShowInsightsModal(true);
  } catch (error) {
    console.error('Error loading insights:', error);
    Alert.alert('Error', 'Failed to load insights');
  }
};

// Add insights button to each habit card
<TouchableOpacity
  onPress={() => loadInsights(habit.id)}
  style={styles.insightsButton}
>
  <Icon name="chart-line" size={20} color={colors.primary} />
  <Text style={styles.insightsButtonText}>View Insights</Text>
</TouchableOpacity>

// Insights modal
<Modal
  visible={showInsightsModal}
  animationType="slide"
  presentationStyle="pageSheet"
  onRequestClose={() => setShowInsightsModal(false)}
>
  <View style={styles.insightsModal}>
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>Habit Insights</Text>
      <IconButton
        icon="close"
        size={24}
        onPress={() => setShowInsightsModal(false)}
      />
    </View>

    {selectedHabitInsights && (
      <ScrollView>
        <HabitInsightsCard insights={selectedHabitInsights} />
      </ScrollView>
    )}
  </View>
</Modal>
```

### Files to Create/Modify
- **Modify:** `src/database/habits.ts` (add getHabitInsights)
- **Create:** `src/components/habits/HabitInsightsCard.tsx`
- **Modify:** `src/screens/main/HabitsScreen.tsx`

### Testing Checklist
- [ ] Completion rates calculate correctly
- [ ] Best time of day determined accurately
- [ ] Weekday pattern chart renders
- [ ] Streak data displays correctly
- [ ] Insights modal opens/closes
- [ ] Empty insights handled gracefully
- [ ] Data refreshes when habit logs change

---

## Feature 2B.2: Calendar - Conflict Detection

**Priority:** TIER 2 - High Impact
**Effort:** 4-6 hours
**Complexity:** Medium

### Description
Detect overlapping calendar events and warn users when creating/editing events that conflict with existing ones.

### Implementation
```typescript
// src/database/calendar.ts - Add conflict detection

export interface EventConflict {
  event: CalendarEvent;
  overlapMinutes: number;
}

export async function detectConflicts(
  startTime: string,
  endTime: string,
  excludeEventId?: string
): Promise<EventConflict[]> {
  const db = await getDB();

  // Find overlapping events
  const overlappingEvents = await db.getAllAsync<CalendarEvent>(
    `SELECT * FROM calendar_events
     WHERE id != ?
     AND (
       (start_time < ? AND end_time > ?) OR
       (start_time >= ? AND start_time < ?) OR
       (end_time > ? AND end_time <= ?)
     )
     ORDER BY start_time ASC`,
    [
      excludeEventId || '',
      endTime, startTime,  // Event wraps our timeframe
      startTime, endTime,   // Event starts during our timeframe
      startTime, endTime    // Event ends during our timeframe
    ]
  );

  // Calculate overlap duration
  const conflicts: EventConflict[] = overlappingEvents.map(event => {
    const overlapStart = new Date(Math.max(
      new Date(startTime).getTime(),
      new Date(event.start_time).getTime()
    ));
    const overlapEnd = new Date(Math.min(
      new Date(endTime).getTime(),
      new Date(event.end_time).getTime()
    ));
    const overlapMinutes = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);

    return { event, overlapMinutes };
  });

  return conflicts;
}
```

### Conflict Warning Component
```typescript
// src/components/calendar/ConflictWarning.tsx - New component

interface ConflictWarningProps {
  conflicts: EventConflict[];
  onViewConflict: (eventId: string) => void;
  onProceed: () => void;
  onCancel: () => void;
}

export function ConflictWarning({ conflicts, onViewConflict, onProceed, onCancel }: ConflictWarningProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="alert-circle" size={32} color={colors.error} />
        <Text style={styles.title}>Schedule Conflict Detected</Text>
      </View>

      <Text style={styles.message}>
        This event overlaps with {conflicts.length} existing event{conflicts.length > 1 ? 's' : ''}:
      </Text>

      <ScrollView style={styles.conflictsList}>
        {conflicts.map(({ event, overlapMinutes }) => (
          <TouchableOpacity
            key={event.id}
            style={styles.conflictCard}
            onPress={() => onViewConflict(event.id)}
          >
            <View style={styles.conflictHeader}>
              <Text style={styles.conflictTitle} numberOfLines={1}>
                {event.title}
              </Text>
              <View style={styles.overlapBadge}>
                <Text style={styles.overlapText}>
                  {Math.round(overlapMinutes)}min overlap
                </Text>
              </View>
            </View>

            <View style={styles.conflictTime}>
              <Icon name="clock-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.conflictTimeText}>
                {formatEventTimeRange(event.start_time, event.end_time)}
              </Text>
            </View>

            {event.location && (
              <View style={styles.conflictLocation}>
                <Icon name="map-marker" size={14} color={colors.text.tertiary} />
                <Text style={styles.conflictLocationText}>{event.location}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <AppButton
          title="Cancel"
          variant="outlined"
          onPress={onCancel}
          style={{ flex: 1 }}
        />
        <AppButton
          title="Create Anyway"
          variant="primary"
          onPress={onProceed}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
```

### Integration into Calendar Event Form
```typescript
// src/components/calendar/CalendarEventFormModal.tsx - Add conflict check

const [conflicts, setConflicts] = useState<EventConflict[]>([]);
const [showConflictWarning, setShowConflictWarning] = useState(false);

const checkConflicts = async (startTime: string, endTime: string) => {
  try {
    const detectedConflicts = await calendarDB.detectConflicts(
      startTime,
      endTime,
      selectedEvent?.id
    );
    setConflicts(detectedConflicts);
    return detectedConflicts;
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return [];
  }
};

const handleSave = async () => {
  // Validate form
  if (!formData.title.trim()) {
    Alert.alert('Required', 'Please enter an event title');
    return;
  }

  // Check for conflicts
  const detectedConflicts = await checkConflicts(formData.startTime, formData.endTime);

  if (detectedConflicts.length > 0) {
    setShowConflictWarning(true);
    return;
  }

  // Proceed with save
  await saveEvent();
};

const handleProceedDespiteConflict = async () => {
  setShowConflictWarning(false);
  await saveEvent();
};

// In render:
{showConflictWarning && (
  <Modal visible animationType="slide" presentationStyle="pageSheet">
    <ConflictWarning
      conflicts={conflicts}
      onViewConflict={(eventId) => {
        setShowConflictWarning(false);
        onViewEvent(eventId);
      }}
      onProceed={handleProceedDespiteConflict}
      onCancel={() => setShowConflictWarning(false)}
    />
  </Modal>
)}
```

### Files to Create/Modify
- **Modify:** `src/database/calendar.ts` (add detectConflicts)
- **Create:** `src/components/calendar/ConflictWarning.tsx`
- **Modify:** `src/components/calendar/CalendarEventFormModal.tsx`

### Testing Checklist
- [ ] Detects exact time overlaps
- [ ] Detects partial overlaps
- [ ] Excludes current event when editing
- [ ] Shows all conflicts in warning
- [ ] Can view conflicting event details
- [ ] Can proceed anyway
- [ ] Can cancel to avoid conflict

---

## Feature 2B.3: Calendar - Local Notifications/Reminders

**Priority:** TIER 2 - High Impact
**Effort:** 6-8 hours
**Complexity:** Medium-High

### Description
Add reminder field to events and schedule local notifications using expo-notifications.

### Database Changes
```typescript
// src/database/schema.ts - Add reminder_minutes column

calendar_events: `
  CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    location TEXT,
    attendees TEXT,
    is_all_day INTEGER DEFAULT 0,
    recurrence_rule TEXT,
    reminder_minutes INTEGER,  -- NEW: minutes before event to remind
    notification_id TEXT,      -- NEW: track scheduled notification
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced INTEGER DEFAULT 0
  );
`,
```

### Notification Service
```typescript
// src/services/notifications.ts - New service

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface ScheduleNotificationParams {
  title: string;
  body: string;
  data?: any;
  triggerDate: Date;
}

export async function requestPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // For Android, create notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('events', {
      name: 'Event Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

export async function scheduleEventNotification(params: ScheduleNotificationParams): Promise<string> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    throw new Error('Notification permission not granted');
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: params.data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      date: params.triggerDate,
      channelId: Platform.OS === 'android' ? 'events' : undefined,
    },
  });

  return notificationId;
}

export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function getAllScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}
```

### Update Calendar Database Functions
```typescript
// src/database/calendar.ts - Update create/update functions

export async function createEvent(data: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const db = await getDB();
  const id = Date.now().toString();
  const now = new Date().toISOString();

  // Schedule notification if reminder is set
  let notificationId: string | undefined;
  if (data.reminder_minutes && data.start_time) {
    try {
      const reminderTime = new Date(
        new Date(data.start_time).getTime() - (data.reminder_minutes * 60 * 1000)
      );

      if (reminderTime > new Date()) {
        notificationId = await notificationService.scheduleEventNotification({
          title: data.title || 'Event Reminder',
          body: `${data.title} starts in ${data.reminder_minutes} minutes`,
          data: { eventId: id, type: 'event_reminder' },
          triggerDate: reminderTime,
        });
      }
    } catch (error) {
      console.error('[Calendar] Failed to schedule notification:', error);
    }
  }

  await db.runAsync(
    `INSERT INTO calendar_events (
      id, title, description, start_time, end_time, location,
      attendees, is_all_day, recurrence_rule, reminder_minutes,
      notification_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title,
      data.description || null,
      data.start_time,
      data.end_time,
      data.location || null,
      data.attendees ? JSON.stringify(data.attendees) : null,
      data.is_all_day ? 1 : 0,
      data.recurrence_rule ? JSON.stringify(data.recurrence_rule) : null,
      data.reminder_minutes || null,
      notificationId || null,
      now,
      now,
    ]
  );

  return getEvent(id);
}

export async function updateEvent(id: string, data: Partial<CalendarEvent>): Promise<void> {
  const db = await getDB();
  const event = await getEvent(id);

  // Cancel existing notification if present
  if (event.notification_id) {
    try {
      await notificationService.cancelNotification(event.notification_id);
    } catch (error) {
      console.error('[Calendar] Failed to cancel notification:', error);
    }
  }

  // Schedule new notification if reminder is set
  let notificationId: string | undefined;
  const startTime = data.start_time || event.start_time;
  const reminderMinutes = data.reminder_minutes !== undefined
    ? data.reminder_minutes
    : event.reminder_minutes;

  if (reminderMinutes && startTime) {
    try {
      const reminderTime = new Date(
        new Date(startTime).getTime() - (reminderMinutes * 60 * 1000)
      );

      if (reminderTime > new Date()) {
        notificationId = await notificationService.scheduleEventNotification({
          title: data.title || event.title,
          body: `${data.title || event.title} starts in ${reminderMinutes} minutes`,
          data: { eventId: id, type: 'event_reminder' },
          triggerDate: reminderTime,
        });
      }
    } catch (error) {
      console.error('[Calendar] Failed to schedule notification:', error);
    }
  }

  const updates: string[] = [];
  const values: any[] = [];

  // Build update query dynamically
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id') {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (notificationId) {
    updates.push('notification_id = ?');
    values.push(notificationId);
  }

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await db.runAsync(
    `UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteEvent(id: string): Promise<void> {
  const db = await getDB();
  const event = await getEvent(id);

  // Cancel notification if exists
  if (event.notification_id) {
    try {
      await notificationService.cancelNotification(event.notification_id);
    } catch (error) {
      console.error('[Calendar] Failed to cancel notification:', error);
    }
  }

  await db.runAsync('DELETE FROM calendar_events WHERE id = ?', [id]);
}
```

### Reminder Picker Component
```typescript
// src/components/calendar/ReminderPicker.tsx - New component

interface ReminderPickerProps {
  value: number | null;
  onChange: (minutes: number | null) => void;
}

const REMINDER_OPTIONS = [
  { label: 'No Reminder', value: null },
  { label: '5 minutes before', value: 5 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
  { label: '1 day before', value: 1440 },
];

export function ReminderPicker({ value, onChange }: ReminderPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Reminder</Text>

      <View style={styles.optionsContainer}>
        {REMINDER_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.label}
            style={[
              styles.option,
              value === option.value && styles.selectedOption
            ]}
            onPress={() => onChange(option.value)}
          >
            <Icon
              name={value === option.value ? 'radiobox-marked' : 'radiobox-blank'}
              size={20}
              color={value === option.value ? colors.primary : colors.text.tertiary}
            />
            <Text style={[
              styles.optionText,
              value === option.value && styles.selectedOptionText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
```

### Add to Event Form
```typescript
// src/components/calendar/CalendarEventFormModal.tsx

import { ReminderPicker } from './ReminderPicker';

// Add to form data
const [formData, setFormData] = useState({
  // ... existing fields
  reminderMinutes: null as number | null,
});

// In render:
<ReminderPicker
  value={formData.reminderMinutes}
  onChange={(minutes) => setFormData({ ...formData, reminderMinutes: minutes })}
/>
```

### Handle Notification Taps
```typescript
// App.tsx - Add notification response listener

useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;

    if (data.type === 'event_reminder' && data.eventId) {
      // Navigate to calendar with highlighted event
      navigation.navigate('Calendar', { highlightEventId: data.eventId });
    }
  });

  return () => subscription.remove();
}, []);
```

### Files to Create/Modify
- **Modify:** `src/database/schema.ts` (add reminder columns)
- **Create:** `src/services/notifications.ts`
- **Modify:** `src/database/calendar.ts` (add notification scheduling)
- **Create:** `src/components/calendar/ReminderPicker.tsx`
- **Modify:** `src/components/calendar/CalendarEventFormModal.tsx`
- **Modify:** `App.tsx` (add notification listener)

### Testing Checklist
- [ ] Permission request on first reminder set
- [ ] Notifications schedule correctly
- [ ] Notifications trigger at correct time
- [ ] Tapping notification navigates to event
- [ ] Editing event reschedules notification
- [ ] Deleting event cancels notification
- [ ] Multiple reminders work independently
- [ ] Past events don't schedule notifications

---

## Feature 2B.4: Tasks - Bulk Actions

**Priority:** TIER 2 - High Impact
**Effort:** 6-8 hours
**Complexity:** Medium

### Description
Add multi-select mode with bulk operations: complete, delete, change status, move to project.

### Implementation
```typescript
// src/screens/main/TasksScreen.tsx - Add bulk selection

const [bulkSelectMode, setBulkSelectMode] = useState(false);
const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

const toggleBulkSelect = () => {
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

const selectAll = () => {
  setSelectedTaskIds(new Set(tasks.map(t => t.id)));
};

const deselectAll = () => {
  setSelectedTaskIds(new Set());
};

const handleBulkComplete = async () => {
  try {
    await Promise.all(
      Array.from(selectedTaskIds).map(id =>
        tasksDB.updateTask(id, {
          status: 'completed',
          completedAt: new Date().toISOString()
        })
      )
    );
    await loadTasks();
    setBulkSelectMode(false);
    setSelectedTaskIds(new Set());
  } catch (error) {
    Alert.alert('Error', 'Failed to complete tasks');
  }
};

const handleBulkDelete = () => {
  Alert.alert(
    'Delete Tasks',
    `Are you sure you want to delete ${selectedTaskIds.size} task(s)?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await Promise.all(
              Array.from(selectedTaskIds).map(id => tasksDB.deleteTask(id))
            );
            await loadTasks();
            setBulkSelectMode(false);
            setSelectedTaskIds(new Set());
          } catch (error) {
            Alert.alert('Error', 'Failed to delete tasks');
          }
        },
      },
    ]
  );
};

const handleBulkChangeStatus = async (status: TaskStatus) => {
  try {
    await Promise.all(
      Array.from(selectedTaskIds).map(id =>
        tasksDB.updateTask(id, { status })
      )
    );
    await loadTasks();
    setBulkSelectMode(false);
    setSelectedTaskIds(new Set());
  } catch (error) {
    Alert.alert('Error', 'Failed to update task status');
  }
};

const handleBulkMoveToProject = async (projectId: string) => {
  try {
    await Promise.all(
      Array.from(selectedTaskIds).map(id =>
        tasksDB.updateTask(id, { projectId })
      )
    );
    await loadTasks();
    setBulkSelectMode(false);
    setSelectedTaskIds(new Set());
  } catch (error) {
    Alert.alert('Error', 'Failed to move tasks');
  }
};

// Update header with bulk actions
<View style={styles.header}>
  <Text style={styles.headerTitle}>Tasks</Text>

  <View style={styles.headerActions}>
    {!bulkSelectMode ? (
      <>
        <IconButton icon="select-multiple" onPress={toggleBulkSelect} />
        <IconButton icon="plus" onPress={() => setShowCreateModal(true)} />
      </>
    ) : (
      <Text style={styles.selectedCount}>
        {selectedTaskIds.size} selected
      </Text>
    )}
  </View>
</View>

// Bulk action bar
{bulkSelectMode && (
  <View style={styles.bulkActionBar}>
    <View style={styles.bulkSelectActions}>
      <TouchableOpacity onPress={selectAll} style={styles.bulkAction}>
        <Text style={styles.bulkActionText}>Select All</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={deselectAll} style={styles.bulkAction}>
        <Text style={styles.bulkActionText}>Deselect All</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.bulkOperations}>
      <IconButton
        icon="check-circle"
        size={24}
        onPress={handleBulkComplete}
        disabled={selectedTaskIds.size === 0}
      />
      <IconButton
        icon="folder-move"
        size={24}
        onPress={() => setShowBulkProjectPicker(true)}
        disabled={selectedTaskIds.size === 0}
      />
      <IconButton
        icon="format-list-bulleted"
        size={24}
        onPress={() => setShowBulkStatusPicker(true)}
        disabled={selectedTaskIds.size === 0}
      />
      <IconButton
        icon="delete"
        size={24}
        onPress={handleBulkDelete}
        disabled={selectedTaskIds.size === 0}
      />
    </View>

    <IconButton icon="close" onPress={toggleBulkSelect} />
  </View>
)}

// Update TaskCard to show checkbox in bulk mode
<TaskCard
  task={item}
  bulkSelectMode={bulkSelectMode}
  selected={selectedTaskIds.has(item.id)}
  onToggleSelect={() => toggleTaskSelection(item.id)}
  onPress={() => !bulkSelectMode && handleEdit(item)}
  onStatusChange={(status) => handleStatusChange(item.id, status)}
  onDelete={() => handleDelete(item.id)}
/>

// Bulk status picker modal
<Modal visible={showBulkStatusPicker} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.pickerCard}>
      <Text style={styles.pickerTitle}>Change Status</Text>
      {Object.values(TaskStatus).map(status => (
        <TouchableOpacity
          key={status}
          style={styles.pickerOption}
          onPress={() => {
            handleBulkChangeStatus(status);
            setShowBulkStatusPicker(false);
          }}
        >
          <Text style={styles.pickerOptionText}>{STATUS_LABELS[status]}</Text>
        </TouchableOpacity>
      ))}
      <AppButton
        title="Cancel"
        variant="outlined"
        onPress={() => setShowBulkStatusPicker(false)}
      />
    </View>
  </View>
</Modal>

// Bulk project picker modal
<Modal visible={showBulkProjectPicker} transparent animationType="slide">
  <ProjectPicker
    selectedProjectId={null}
    onSelect={(projectId) => {
      handleBulkMoveToProject(projectId);
      setShowBulkProjectPicker(false);
    }}
    onClose={() => setShowBulkProjectPicker(false)}
  />
</Modal>
```

### Update TaskCard for Bulk Mode
```typescript
// src/components/tasks/TaskCard.tsx - Add bulk selection support

interface TaskCardProps {
  task: Task;
  bulkSelectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onPress: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onDelete: () => void;
}

export function TaskCard({
  task,
  bulkSelectMode,
  selected,
  onToggleSelect,
  onPress,
  onStatusChange,
  onDelete
}: TaskCardProps) {
  const handlePress = () => {
    if (bulkSelectMode && onToggleSelect) {
      onToggleSelect();
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View style={[
        styles.card,
        selected && styles.selectedCard,
        // ... other styles
      ]}>
        {/* Checkbox in bulk mode */}
        {bulkSelectMode && (
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={selected ? 'checked' : 'unchecked'}
              onPress={onToggleSelect}
            />
          </View>
        )}

        {/* Rest of card content */}
        {/* ... */}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  selectedCard: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primary + '10',
  },
  checkboxContainer: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 10,
  },
  // ... other styles
});
```

### Files to Create/Modify
- **Modify:** `src/screens/main/TasksScreen.tsx` (add bulk selection logic)
- **Modify:** `src/components/tasks/TaskCard.tsx` (add checkbox support)

### Testing Checklist
- [ ] Bulk mode toggles correctly
- [ ] Select/deselect individual tasks
- [ ] Select all/deselect all work
- [ ] Bulk complete updates all selected tasks
- [ ] Bulk delete confirms before deleting
- [ ] Bulk status change works
- [ ] Bulk move to project works
- [ ] Exiting bulk mode clears selection
- [ ] Disabled state when no tasks selected

---

# PHASE 3A: Advanced Interactions & Bulk Operations

**Duration:** 14-20 hours
**Priority:** MEDIUM (TIER 3)
**Dependencies:** Phase 2A complete

Due to length constraints, I'll provide high-level summaries for Phases 3A-3D:

## Feature 3A.1: Task Swipe Actions (4-6 hours)
- Implement swipe-right to complete/uncomplete
- Implement swipe-left to delete with confirmation
- Use `react-native-gesture-handler` or `react-native-swipeable`
- Add haptic feedback on actions

## Feature 3A.2: Search Across All Screens (6-8 hours)
- Add search bar to Tasks, Habits, Calendar, Finance screens
- Implement debounced search with highlighting
- Show result counts
- Clear search functionality

## Feature 3A.3: Tab Bar Badges (4-6 hours)
- Show count of active tasks on Tasks tab
- Show incomplete habits count on Habits tab
- Show today's events count on Calendar tab
- Update badges in real-time

---

# PHASE 3B: Recurring Items & Time Management

**Duration:** 18-22 hours
**Priority:** MEDIUM (TIER 3)

## Feature 3B.1: Habit Reminders (6-8 hours)
- Add reminder time field to habits
- Schedule daily notifications
- Handle notification taps
- Manage permissions

## Feature 3B.2: Habit Completion Notes (6-8 hours)
- Add optional notes when completing habits
- Display notes in heatmap tooltips
- Notes list view per habit
- Use for insights

## Feature 3B.3: Enhanced Date Pickers (4-6 hours)
- Calendar view date picker for tasks
- Quick options: Today, Tomorrow, Next Week
- Visual display of due dates
- Sort by due date

---

# PHASE 3C: Data Management & Visualizations

**Duration:** 24-30 hours
**Priority:** MEDIUM (TIER 3)

## Feature 3C.1: Finance Export to CSV (4-6 hours)
- Generate CSV from transactions
- Filter by date range
- Share via system share sheet

## Feature 3C.2: Category Management (6-8 hours)
- Common category presets
- Custom category creation
- Category icons and colors
- Management screen

## Feature 3C.3: Optimistic Updates (8-10 hours)
- Update UI immediately on user action
- Background database writes
- Rollback on failure
- Loading indicators

## Feature 3C.4: Loading Skeletons (6-8 hours)
- Replace spinners with skeleton screens
- Match final layout
- Shimmer animations
- Smooth transitions

---

# PHASE 3D: Polish, UX & Onboarding

**Duration:** 40-50 hours
**Priority:** LOW-MEDIUM (TIER 3)

## Feature 3D.1: Onboarding Experience (10-12 hours)
- Welcome screen on first launch
- Feature tour with swipeable cards
- Sample data option
- Tooltips on first use

## Feature 3D.2: Dashboard Sparklines (6-8 hours)
- Mini charts on metric cards
- Last 7 days trend
- Percentage change indicators
- Tap to open detailed chart

## Feature 3D.3: Pull-to-Refresh Consistency (4-6 hours)
- Add to all list screens
- Consistent styling
- Last updated timestamp
- Haptic feedback

## Feature 3D.4: Undo/Redo System (6-8 hours)
- Toast with undo button after delete
- Temporary storage of deleted items
- 3-5 second undo window
- Clear queue after timeout

---

# Implementation Dependencies

## Dependency Graph

```
Phase 2A (Contextual Intelligence)
└── No dependencies - Can start immediately

Phase 2B (Insights & Notifications)
├── Depends on: Phase 2A.1 (for habit completion data)
└── Can run in parallel with other Phase 2B features

Phase 3A (Advanced Interactions)
├── Depends on: Phase 2A (TaskCard component)
└── Search depends on existing screens

Phase 3B (Recurring & Time)
├── Habit Reminders depends on: Phase 2B.3 (notification service)
└── Date Pickers can run independently

Phase 3C (Data & Visualizations)
└── Can run in parallel, mostly independent

Phase 3D (Polish & Onboarding)
├── Onboarding should be last
└── Others can run in parallel
```

## Critical Path
1. **Phase 2A** → **Phase 2B** → **Phase 3A** → **Phase 3D.1 (Onboarding)**

## Parallel Work Opportunities
- Phase 2A.2 (Priority Visuals) + Phase 2A.3 (Sorting)
- Phase 2B.1 (Habit Insights) + Phase 2B.2 (Conflict Detection)
- All Phase 3C features can run in parallel
- Phase 3D features (except onboarding) can run in parallel

---

# Database Changes Required

## Schema Migrations

### Migration 1: Calendar Reminders
```sql
ALTER TABLE calendar_events ADD COLUMN reminder_minutes INTEGER;
ALTER TABLE calendar_events ADD COLUMN notification_id TEXT;
```

### Migration 2: Habit Notes & Reminders
```sql
ALTER TABLE habit_logs ADD COLUMN created_at TEXT;
ALTER TABLE habits ADD COLUMN reminder_time TEXT;
ALTER TABLE habits ADD COLUMN notification_id TEXT;
```

### Migration 3: Task Sorting Metadata
```sql
-- Already have created_at, updated_at
-- No new columns needed
```

### Migration 4: Finance Categories
```sql
CREATE TABLE IF NOT EXISTS finance_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  type TEXT NOT NULL, -- 'income' or 'expense'
  is_custom INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Seed default categories
INSERT INTO finance_categories (id, name, icon, color, type) VALUES
  ('cat_food', 'Food & Dining', 'food', '#F59E0B', 'expense'),
  ('cat_transport', 'Transportation', 'car', '#3B82F6', 'expense'),
  ('cat_housing', 'Housing', 'home', '#8B5CF6', 'expense'),
  ('cat_utilities', 'Utilities', 'lightbulb', '#10B981', 'expense'),
  ('cat_entertainment', 'Entertainment', 'theater', '#EC4899', 'expense'),
  ('cat_healthcare', 'Healthcare', 'medical-bag', '#EF4444', 'expense'),
  ('cat_shopping', 'Shopping', 'shopping', '#F97316', 'expense'),
  ('cat_salary', 'Salary', 'cash', '#10B981', 'income'),
  ('cat_investment', 'Investments', 'trending-up', '#3B82F6', 'income'),
  ('cat_other', 'Other', 'dots-horizontal', '#64748B', 'expense');
```

---

# Component Architecture

## New Component Structure

```
src/
├── components/
│   ├── dashboard/
│   │   ├── TodaysFocusCard.tsx          [2A.1]
│   │   ├── SectionHeader.tsx            [2A.4]
│   │   └── MetricSparkline.tsx          [3D.2]
│   │
│   ├── tasks/
│   │   ├── TaskCard.tsx                 [2A.2] ✅
│   │   ├── TaskFilterBar.tsx            [2A.3]
│   │   ├── SwipeableTaskCard.tsx        [3A.1]
│   │   └── BulkActionBar.tsx            [2B.4]
│   │
│   ├── habits/
│   │   ├── HabitInsightsCard.tsx        [2B.1]
│   │   ├── HabitNotesModal.tsx          [3B.2]
│   │   └── HabitReminderPicker.tsx      [3B.1]
│   │
│   ├── calendar/
│   │   ├── ConflictWarning.tsx          [2B.2]
│   │   ├── ReminderPicker.tsx           [2B.3]
│   │   └── EnhancedDatePicker.tsx       [3B.3]
│   │
│   ├── finance/
│   │   ├── CategoryPicker.tsx           [3C.2]
│   │   └── ExportButton.tsx             [3C.1]
│   │
│   ├── ui/
│   │   ├── SkeletonCard.tsx             [3C.4]
│   │   ├── UndoToast.tsx                [3D.4]
│   │   └── TabBadge.tsx                 [3A.3]
│   │
│   └── onboarding/
│       ├── WelcomeScreen.tsx            [3D.1]
│       ├── FeatureTour.tsx              [3D.1]
│       └── TooltipProvider.tsx          [3D.1]
│
├── store/
│   ├── taskFiltersStore.ts              [2A.3]
│   ├── onboardingStore.ts               [3D.1]
│   └── undoStore.ts                     [3D.4]
│
├── services/
│   ├── notifications.ts                 [2B.3] ✅
│   └── export.ts                        [3C.1]
│
└── hooks/
    ├── useHighlightEffect.ts            [2A.4]
    ├── useOptimisticUpdate.ts           [3C.3]
    └── useUndo.ts                       [3D.4]
```

---

# Testing Strategy

## Unit Tests (Jest)
- Database functions (CRUD, queries, filters)
- Sorting/filtering logic
- Conflict detection algorithm
- Notification scheduling
- Export CSV generation

## Integration Tests
- Deep link navigation
- Notification handling
- Bulk operations
- Optimistic updates with rollback

## E2E Tests (Detox - Future)
- Critical user flows
- Onboarding experience
- Complete task creation → reminder → notification

## Manual Testing Checklist
Each feature includes a specific testing checklist (see individual features above)

---

# Next Steps & Priorities

## Immediate Next Actions (Week 1-2)

### Start with Phase 2A
1. **Day 1-2:** Feature 2A.1 - Dashboard Today's Focus
2. **Day 3-4:** Feature 2A.2 - Task Priority Visuals
3. **Day 5-7:** Feature 2A.3 - Task Sorting & Filters
4. **Day 8-9:** Feature 2A.4 - Deep Links

**Deliverable:** Smart, visually informative dashboard and task system

### Continue with Phase 2B (Week 2-3)
1. **Day 10-12:** Feature 2B.1 - Habit Insights
2. **Day 13-14:** Feature 2B.2 - Calendar Conflict Detection
3. **Day 15-17:** Feature 2B.3 - Calendar Reminders
4. **Day 18-20:** Feature 2B.4 - Task Bulk Actions

**Deliverable:** Intelligent insights and proactive notifications

## Mid-Term Goals (Week 3-6)
- Complete Phase 3A (Advanced Interactions)
- Complete Phase 3B (Recurring & Time Management)
- Start Phase 3C (Data Management)

## Long-Term Goals (Week 7-10)
- Complete Phase 3C
- Complete Phase 3D (Polish & Onboarding)
- Comprehensive testing and bug fixes
- Performance optimization

## Success Criteria
- [ ] All Tier 2 features complete and tested
- [ ] At least 50% of Tier 3 features complete
- [ ] App feels smart, not just functional
- [ ] No critical bugs or crashes
- [ ] Positive user feedback on intelligence features

---

# Effort Summary

## By Phase
| Phase | Features | Effort (hours) | Priority |
|-------|----------|---------------|----------|
| 2A | 4 | 22-26 | HIGH |
| 2B | 4 | 20-26 | HIGH |
| 3A | 3 | 14-20 | MEDIUM |
| 3B | 3 | 18-22 | MEDIUM |
| 3C | 4 | 24-30 | MEDIUM |
| 3D | 4+ | 40-50 | LOW-MEDIUM |
| **Total** | **22** | **138-174** | - |

**Note:** This excludes networking/AI features (not offline). Total offline work remaining: ~140-175 hours.

## Resource Allocation Recommendation
- **1 Developer, Full-Time:** 4-5 weeks
- **1 Developer, Part-Time (50%):** 8-10 weeks
- **2 Developers, Parallel:** 2-3 weeks (with good coordination)

---

# Appendix: Quick Reference

## File Modification Tracker
Track which files need changes for each feature:

### Most Modified Files
- `src/screens/main/TasksScreen.tsx` - 6 features
- `src/screens/main/DashboardScreen.tsx` - 3 features
- `src/screens/main/HabitsScreen.tsx` - 4 features
- `src/screens/main/CalendarScreen.tsx` - 3 features
- `src/database/tasks.ts` - 4 features
- `src/database/habits.ts` - 3 features
- `src/database/calendar.ts` - 3 features

### New Files to Create (22 total)
See Component Architecture section for full list.

---

**End of Implementation Plan**

This plan covers all remaining offline features with detailed technical specifications, implementation steps, testing requirements, and timeline estimates. Each phase builds logically on previous work while allowing for parallel development where possible.

**Questions or adjustments needed? Ready to start implementation!**
