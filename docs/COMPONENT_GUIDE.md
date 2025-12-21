# Component Guide

**Last Updated**: 2025-12-21
**Purpose**: Comprehensive guide to UI components and their usage in Jarvis Native

---

## Table of Contents

1. [Overview](#overview)
2. [Core UI Components](#core-ui-components)
3. [Layout Components](#layout-components)
4. [Form Components](#form-components)
5. [Feedback Components](#feedback-components)
6. [Navigation Components](#navigation-components)
7. [Domain-Specific Components](#domain-specific-components)
8. [Chart Components](#chart-components)
9. [Skeleton Components](#skeleton-components)
10. [Best Practices](#best-practices)
11. [Creating New Components](#creating-new-components)

---

## Overview

All reusable UI components live in `/src/components/ui/`. Domain-specific components (tasks, habits, finance, etc.) are organized in subdirectories under `/src/components/`.

### Component Philosophy

1. **Composable**: Components should be small, focused, and composable
2. **Themeable**: Always use theme tokens, never hardcoded values
3. **Accessible**: Include proper accessibility props by default
4. **Typed**: Use TypeScript interfaces for all props
5. **Tested**: Critical components should have tests

### Import Convention

```typescript
// UI components barrel export
import { AppButton, AppCard, AppInput, SearchBar, EmptyState } from '../components/ui';

// Domain-specific components
import { TaskCard } from '../components/tasks/TaskCard';
import { HabitCard } from '../components/habits/HabitCard';
```

---

## Core UI Components

### AppButton

Professional button component with variants, loading states, and animations.

**File**: `/src/components/ui/AppButton.tsx`

**Props**:
```typescript
interface AppButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}
```

**Usage**:
```typescript
import { AppButton } from '../components/ui';

// Primary button
<AppButton
  title="Save Task"
  onPress={handleSave}
  variant="primary"
/>

// Loading state
<AppButton
  title="Saving..."
  onPress={handleSave}
  loading={isSaving}
  disabled={isSaving}
/>

// With icon
<AppButton
  title="Delete"
  variant="danger"
  icon={<Icon name="delete" size={20} />}
  iconPosition="left"
  onPress={handleDelete}
/>

// Full width
<AppButton
  title="Continue"
  variant="primary"
  fullWidth
  onPress={handleContinue}
/>
```

**Variants**:
- `primary` - Gradient background, glow shadow (main actions)
- `secondary` - Tertiary background (secondary actions)
- `outline` - Transparent with border (tertiary actions)
- `ghost` - Transparent, no border (subtle actions)
- `danger` - Red gradient (destructive actions)

**Features**:
- Press animation (scale down to 0.97)
- Automatic accessibility props
- Loading spinner replaces content
- Haptic feedback (via parent component)

### AppCard

Professional card component with multiple variants and press handling.

**File**: `/src/components/ui/AppCard.tsx`

**Props**:
```typescript
interface AppCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'glass';
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}
```

**Usage**:
```typescript
import { AppCard } from '../components/ui';

// Default card
<AppCard>
  <Text>Card content</Text>
</AppCard>

// Elevated card (more shadow)
<AppCard variant="elevated">
  <Text>Important content</Text>
</AppCard>

// Card with header and footer
<AppCard
  header={<Text style={textStyles.h4}>Card Title</Text>}
  footer={<AppButton title="Action" onPress={handleAction} />}
>
  <Text>Main content</Text>
</AppCard>

// Pressable card
<AppCard
  onPress={() => navigation.navigate('Details', { id })}
>
  <Text>Tap me</Text>
</AppCard>

// Glass card (gradient background)
<AppCard variant="glass">
  <Text>Premium look</Text>
</AppCard>

// No padding (for full-width content)
<AppCard noPadding>
  <Image source={...} style={{ width: '100%' }} />
</AppCard>
```

**Variants**:
- `default` - Secondary background, border, medium shadow
- `elevated` - Secondary background, large shadow
- `outlined` - Transparent background, thick border, no shadow
- `filled` - Tertiary background, subtle shadow
- `glass` - Gradient background, colored border, glow effect

### FloatingActionButton (FAB)

Prominent circular button positioned in the thumb zone.

**File**: `/src/components/ui/FloatingActionButton.tsx`

**Props**:
```typescript
interface FloatingActionButtonProps {
  icon: string;
  onPress: () => void;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  style?: ViewStyle;
  size?: number;
  iconSize?: number;
  variant?: 'primary' | 'secondary';
  accessibilityLabel?: string;
  accessibilityHint?: string;
}
```

**Usage**:
```typescript
import { FloatingActionButton } from '../components/ui';

// Bottom-right FAB (default)
<FloatingActionButton
  icon="plus"
  onPress={handleCreate}
  accessibilityLabel="Create new task"
  accessibilityHint="Opens task creation form"
/>

// Bottom-center FAB
<FloatingActionButton
  icon="microphone"
  onPress={handleVoiceInput}
  position="bottom-center"
/>

// Secondary variant (cyan gradient)
<FloatingActionButton
  icon="refresh"
  onPress={handleRefresh}
  variant="secondary"
/>

// Custom size
<FloatingActionButton
  icon="camera"
  onPress={handleCamera}
  size={72}
  iconSize={32}
/>
```

**Features**:
- Gradient background with glow shadow
- Press animation
- Built-in haptic feedback
- Positioned absolutely for easy access

**Best Practice**: Use sparingly - only one FAB per screen for the primary action.

### EmptyState

Beautiful empty state component with animations.

**File**: `/src/components/ui/EmptyState.tsx`

**Props**:
```typescript
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  compact?: boolean;
}
```

**Usage**:
```typescript
import { EmptyState } from '../components/ui';

// Basic empty state
<EmptyState
  icon="📋"
  title="No tasks"
  description="Create your first task to get started"
/>

// With action
<EmptyState
  icon="💰"
  title="No transactions"
  description="Add a transaction to track your finances"
  actionLabel="Add Transaction"
  onAction={handleAddTransaction}
/>

// Compact variant
<EmptyState
  icon="🔍"
  title="No results"
  compact
/>

// In FlatList
<FlatList
  data={tasks}
  renderItem={renderItem}
  ListEmptyComponent={
    <EmptyState
      icon="✅"
      title="All caught up!"
      description="You have no pending tasks"
    />
  }
/>
```

**Features**:
- Bounce-in animation
- Fade-in animation
- Optional action button
- Compact mode for smaller spaces

### SearchBar

Reusable search bar with debouncing and result count.

**File**: `/src/components/ui/SearchBar.tsx`

**Props**:
```typescript
interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  resultCount?: number;
  showResultCount?: boolean;
  autoFocus?: boolean;
}
```

**Usage**:
```typescript
import { SearchBar } from '../components/ui';
import { useDebounce } from '../hooks/useDebounce';

function MyScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  return (
    <>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search tasks"
        resultCount={filteredItems.length}
      />
      <FlatList data={filteredItems} ... />
    </>
  );
}
```

**Features**:
- Focus state styling (primary border, glow)
- Clear button (X icon) when text present
- Result count display
- Haptic feedback on clear

**Best Practice**: Always use with `useDebounce` hook to prevent excessive filtering.

### Skeleton

Loading placeholder component with shimmer animation.

**File**: `/src/components/ui/Skeleton.tsx`

**Components**:
```typescript
// Base skeleton
<Skeleton width="100%" height={20} />

// Circle skeleton
<SkeletonCircle size={48} />

// Text skeleton (multiple lines)
<SkeletonText lines={3} lineHeight={16} />
```

**Usage**:
```typescript
import { Skeleton, SkeletonCircle, SkeletonText } from '../components/ui';

// Loading card
<AppCard>
  <View style={{ flexDirection: 'row' }}>
    <SkeletonCircle size={48} />
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Skeleton width="60%" height={16} />
      <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
    </View>
  </View>
  <SkeletonText lines={3} style={{ marginTop: 16 }} />
</AppCard>

// Loading list
{isLoading ? (
  <>
    <TaskCardSkeleton />
    <TaskCardSkeleton />
    <TaskCardSkeleton />
  </>
) : (
  <FlatList data={tasks} renderItem={renderTask} />
)}
```

**Variants**:
- `shimmer` (default) - Animated shimmer effect
- `pulse` - Pulsing opacity

**See also**: Domain-specific skeleton components (`TaskCardSkeleton`, `HabitCardSkeleton`, etc.)

---

## Layout Components

### Screen Container

Use theme's `screenStyle` preset:

```typescript
import { screenStyle } from '../theme';

function MyScreen() {
  return (
    <View style={screenStyle}>
      {/* Screen content */}
    </View>
  );
}
```

### SafeArea with Insets

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function MyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }}>
      {/* Content */}
    </View>
  );
}
```

### FlatList with Optimizations

**File**: `/src/screens/main/TasksScreen.tsx`, Lines 550-580

```typescript
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}
  // Performance optimizations
  removeClippedSubviews
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  windowSize={10}
  initialNumToRender={15}
  // Pull to refresh
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={colors.primary.main}
    />
  }
  // Empty state
  ListEmptyComponent={
    <EmptyState icon="📋" title="No items" />
  }
  // Header
  ListHeaderComponent={
    <SearchBar value={query} onChangeText={setQuery} />
  }
  // Footer spacing
  contentContainerStyle={{
    paddingBottom: insets.bottom + 80  // Space for FAB
  }}
/>
```

**Best Practice**: Always use `FlatList` instead of `ScrollView` for lists. See [PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md) for details.

---

## Form Components

### AppInput

**File**: `/src/components/ui/AppInput.tsx`

```typescript
interface AppInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  // ... and more
}
```

**Usage**:
```typescript
import { AppInput } from '../components/ui';

<AppInput
  label="Task Title"
  value={title}
  onChangeText={setTitle}
  placeholder="Enter task title"
  error={titleError}
  maxLength={100}
/>
```

### AppChip

**File**: `/src/components/ui/AppChip.tsx`

Tag/chip component for filters, categories, etc.

```typescript
<AppChip
  label="High Priority"
  selected={selectedPriority === 'high'}
  onPress={() => setSelectedPriority('high')}
  variant="primary"
/>
```

### RecurrencePicker

**File**: `/src/components/RecurrencePicker.tsx`

Modal picker for recurring task patterns.

```typescript
import { RecurrencePicker } from '../components/RecurrencePicker';

<RecurrencePicker
  visible={showPicker}
  value={recurrence}
  onChange={setRecurrence}
  onClose={() => setShowPicker(false)}
/>
```

### EnhancedDatePicker

**File**: `/src/components/tasks/EnhancedDatePicker.tsx`

Date picker with quick presets (Today, Tomorrow, Next Week, etc.).

```typescript
import { EnhancedDatePicker } from '../components/tasks/EnhancedDatePicker';

<EnhancedDatePicker
  value={dueDate}
  onChange={setDueDate}
  label="Due Date"
/>
```

---

## Feedback Components

### LoadingState

**File**: `/src/components/ui/LoadingState.tsx`

```typescript
import { LoadingState } from '../components/ui';

// Centered loading spinner
<LoadingState message="Loading tasks..." />

// Full screen loading
<LoadingState fullScreen />

// Small spinner
<LoadingState size="small" />
```

### UndoToast

**File**: `/src/components/ui/UndoToast.tsx`

Toast notification with undo action.

```typescript
import { UndoToast } from '../components/ui';

function MyComponent() {
  const [showToast, setShowToast] = useState(false);

  const handleDelete = (item) => {
    // Delete item
    deleteItem(item.id);

    // Show undo toast
    setShowToast(true);
  };

  const handleUndo = () => {
    // Restore item
    restoreItem();
    setShowToast(false);
  };

  return (
    <>
      {/* Content */}
      <UndoToast
        visible={showToast}
        message="Task deleted"
        onUndo={handleUndo}
        onDismiss={() => setShowToast(false)}
      />
    </>
  );
}
```

### ErrorBoundary

**File**: `/src/components/ErrorBoundary.tsx`

Catches React errors and shows fallback UI.

```typescript
import ErrorBoundary from '../components/ErrorBoundary';

// Wrap screens
<ErrorBoundary>
  <MyScreen />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary
  fallback={
    <View>
      <Text>Oops! Something went wrong.</Text>
      <AppButton title="Reload" onPress={() => window.location.reload()} />
    </View>
  }
>
  <MyScreen />
</ErrorBoundary>
```

**Best Practice**: All tab screens are already wrapped with ErrorBoundary in `MainNavigator.tsx`.

### Tooltip

**File**: `/src/components/ui/Tooltip.tsx`

Contextual tooltips with automatic positioning.

```typescript
import { useTooltip } from '../hooks/useTooltip';
import Tooltip from '../components/ui/Tooltip';

function MyComponent() {
  const tooltip = useTooltip();

  return (
    <>
      <TouchableOpacity
        onLongPress={() => tooltip.show('This is a tooltip', x, y)}
      >
        <Icon name="help" />
      </TouchableOpacity>

      <Tooltip
        visible={tooltip.visible}
        text={tooltip.text}
        x={tooltip.x}
        y={tooltip.y}
        onDismiss={tooltip.hide}
      />
    </>
  );
}
```

---

## Navigation Components

### LastUpdated

**File**: `/src/components/ui/LastUpdated.tsx`

Shows last refresh timestamp.

```typescript
import { LastUpdated } from '../components/ui';

function MyScreen() {
  const { lastUpdated, handleRefresh } = useRefreshControl({
    screenName: 'tasks',
    onRefresh: loadTasks,
  });

  return (
    <>
      <LastUpdated timestamp={lastUpdated} />
      {/* Screen content */}
    </>
  );
}
```

### AnimatedListItem

**File**: `/src/components/ui/AnimatedListItem.tsx`

Wrapper for list items with enter/exit animations.

```typescript
import { AnimatedListItem } from '../components/ui';

<FlatList
  data={items}
  renderItem={({ item, index }) => (
    <AnimatedListItem index={index}>
      <TaskCard task={item} />
    </AnimatedListItem>
  )}
/>
```

---

## Domain-Specific Components

### Task Components

**Files**: `/src/components/tasks/`

- `SwipeableTaskItem` - Task item with swipe actions
- `TaskCardSkeleton` - Loading placeholder
- `EnhancedDatePicker` - Date picker with presets
- `TaskLatencyBadge` - Shows how long task has been pending
- `BulkActionBar` - Bulk action toolbar

**Usage Example**:
```typescript
import { SwipeableTaskItem } from '../components/tasks/SwipeableTaskItem';

<SwipeableTaskItem
  task={task}
  onComplete={handleComplete}
  onDelete={handleDelete}
  onPress={handlePress}
/>
```

### Habit Components

**Files**: `/src/components/habits/`

- `HabitCard` - Habit display card
- `HabitCardSkeleton` - Loading placeholder
- `StreakBadge` - Shows current streak
- `CelebrationOverlay` - Celebration animation on milestone
- `HabitInsightsCard` - Analytics card
- `HabitLogsView` - Completion history
- `HabitNotesModal` - Notes for completion

### Finance Components

**Files**: `/src/components/finance/`

- `CategoryFormModal` - Category creation/edit
- `CategoryPicker` - Category selector
- `ExportButton` - CSV export button

### Calendar Components

**Files**: `/src/components/calendar/`

- `DayTimelineView` - Day view with timeline
- `WeekGridView` - Week view grid
- `ConflictWarning` - Event conflict alert
- `ReminderPicker` - Reminder time picker
- `CalendarEventSkeleton` - Loading placeholder

### Chart Components

See [Chart Components](#chart-components) section below.

---

## Chart Components

All charts support accessibility with text alternatives.

**Files**: `/src/components/charts/`

### BarChart

**File**: `/src/components/charts/BarChart.tsx`

```typescript
import { BarChart } from '../components/charts/BarChart';

<BarChart
  data={[
    { label: 'Mon', value: 10 },
    { label: 'Tue', value: 15 },
    { label: 'Wed', value: 12 },
  ]}
  color={colors.primary.main}
  showValues
/>
```

### LineChart

**File**: `/src/components/charts/LineChart.tsx`

```typescript
import { LineChart } from '../components/charts/LineChart';

<LineChart
  data={[
    { x: 0, y: 10 },
    { x: 1, y: 15 },
    { x: 2, y: 12 },
  ]}
  color={colors.accent.cyan}
  fill
/>
```

### PieChart

**File**: `/src/components/charts/PieChart.tsx`

```typescript
import { PieChart } from '../components/charts/PieChart';

<PieChart
  data={[
    { label: 'Food', value: 400, color: colors.accent.orange },
    { label: 'Transport', value: 200, color: colors.accent.blue },
    { label: 'Entertainment', value: 150, color: colors.accent.purple },
  ]}
  showPercentages
/>
```

### Domain-Specific Charts

- `SpendingTrendChart` - Daily spending trend
- `CategoryPieChart` - Expense breakdown
- `MonthlyComparisonChart` - Income vs expenses
- `WeeklyCompletionChart` - Task completion
- `HabitsComparisonChart` - Habit performance
- `HabitHeatmap` - Completion heatmap

**Accessibility**: All charts include descriptive labels using `getChartDescription()` from `/src/utils/chartAccessibility.ts`.

---

## Skeleton Components

Pre-built loading skeletons for domain entities:

- `TaskCardSkeleton` - Task item placeholder
- `HabitCardSkeleton` - Habit item placeholder
- `CalendarEventSkeleton` - Calendar event placeholder
- `TransactionCardSkeleton` - Transaction placeholder
- `DashboardCardSkeleton` - Dashboard widget placeholder

**Usage Pattern**:
```typescript
{isLoading ? (
  <>
    <TaskCardSkeleton />
    <TaskCardSkeleton />
    <TaskCardSkeleton />
  </>
) : (
  <FlatList data={tasks} renderItem={renderTask} />
)}
```

---

## Best Practices

### 1. Component Composition

**Bad**: Monolithic component
```typescript
function TaskCard({ task }) {
  return (
    <View>
      {/* 200+ lines of code */}
    </View>
  );
}
```

**Good**: Composed from smaller components
```typescript
function TaskCard({ task }) {
  return (
    <AppCard onPress={handlePress}>
      <TaskHeader task={task} />
      <TaskBody task={task} />
      <TaskFooter task={task} />
    </AppCard>
  );
}
```

### 2. Props Interface

Always define TypeScript interfaces:

```typescript
interface MyComponentProps {
  // Required props
  title: string;
  onPress: () => void;

  // Optional props with defaults
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'large';

  // Style overrides
  style?: ViewStyle;
  textStyle?: TextStyle;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  // Implementation
};
```

### 3. Memoization

Use `React.memo` for list items and expensive components:

```typescript
import React, { memo } from 'react';

export const TaskCard = memo<TaskCardProps>(({ task, onPress }) => {
  return (
    <AppCard onPress={onPress}>
      <Text>{task.title}</Text>
    </AppCard>
  );
});
```

**See**: [PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md) for more details.

### 4. Accessibility

Always include accessibility props:

```typescript
import { makeButton } from '../utils/accessibility';

<TouchableOpacity
  {...makeButton('Delete task', 'Permanently deletes this task')}
  onPress={handleDelete}
>
  <Icon name="delete" />
</TouchableOpacity>
```

**See**: [ACCESSIBILITY_GUIDE.md](./ACCESSIBILITY_GUIDE.md) for complete guide.

### 5. Theming

Always use theme tokens:

```typescript
import { useTheme } from '../theme/ThemeProvider';
import { spacing, borderRadius } from '../theme';

function MyComponent() {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background.secondary,
      padding: spacing.base,
      borderRadius: borderRadius.lg,
    },
  });

  return <View style={styles.container}>...</View>;
}
```

**See**: [THEME_GUIDE.md](./THEME_GUIDE.md) for complete guide.

### 6. Error Handling

Wrap async operations with try/catch:

```typescript
const handleSave = async () => {
  try {
    setIsLoading(true);
    await saveTask(task);
    haptic.success();
    alertSuccess('Task saved successfully');
  } catch (error) {
    console.error('Error saving task:', error);
    alertError('Error', 'Failed to save task');
  } finally {
    setIsLoading(false);
  }
};
```

### 7. Haptic Feedback

Add haptic feedback for interactions:

```typescript
import { haptic } from '../utils/haptics';

const handleComplete = () => {
  haptic.taskComplete();  // Success haptic
  completeTask(taskId);
};

const handleDelete = () => {
  haptic.taskDelete();  // Heavy haptic
  deleteTask(taskId);
};
```

**See**: `/src/utils/haptics.ts` for all haptic helpers.

### 8. Loading States

Show loading states with minimum duration:

```typescript
import { useMinDurationLoading } from '../hooks/useMinDurationLoading';

const loadData = async () => {
  setIsLoading(true);
  try {
    const data = await withMinLoadingDuration(fetchData());
    setData(data);
  } finally {
    setIsLoading(false);
  }
};
```

**See**: `/src/utils/loadingUtils.ts` for utilities.

---

## Creating New Components

### Component Template

```typescript
/**
 * MyComponent - Brief description
 * Features: Feature list
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing, borderRadius, typography, shadows } from '../../theme';
import { makeButton } from '../../utils/accessibility';
import { haptic } from '../../utils/haptics';

interface MyComponentProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
}) => {
  const { colors } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = useCallback(() => {
    haptic.light();
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      {...makeButton(title, 'Description of what this does')}
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
        isPressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.base,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.8,
  },
  title: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});

export default MyComponent;
```

### Checklist

- [ ] TypeScript interface for props
- [ ] Theme colors (no hardcoded values)
- [ ] Spacing tokens
- [ ] Border radius tokens
- [ ] Accessibility props
- [ ] Haptic feedback (if interactive)
- [ ] Press states
- [ ] Loading states (if async)
- [ ] Error handling (if async)
- [ ] Memoization (if in lists)
- [ ] JSDoc comment
- [ ] Export from barrel file

---

## Reference

### Component Directories

- **Core UI**: `/src/components/ui/`
- **Tasks**: `/src/components/tasks/`
- **Habits**: `/src/components/habits/`
- **Finance**: `/src/components/finance/`
- **Calendar**: `/src/components/calendar/`
- **Charts**: `/src/components/charts/`
- **Focus**: `/src/components/focus/`
- **Pomodoro**: `/src/components/pomodoro/`
- **Dashboard**: `/src/components/dashboard/`

### Related Guides

- [THEME_GUIDE.md](./THEME_GUIDE.md) - Design system and theming
- [ACCESSIBILITY_GUIDE.md](./ACCESSIBILITY_GUIDE.md) - Accessibility patterns
- [PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md) - Performance optimization
- [MOBILE_UX_PATTERNS.md](./MOBILE_UX_PATTERNS.md) - UX patterns and best practices

### External Resources

- [React Native Components](https://reactnative.dev/docs/components-and-apis)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)

---

**Questions or Issues?** Check existing component implementations in `/src/components/` for patterns and examples.
