# Accessibility Guide

**Last Updated**: 2025-12-21
**Purpose**: Comprehensive guide to implementing and maintaining accessibility in Jarvis Native

---

## Table of Contents

1. [Overview](#overview)
2. [Core Utilities](#core-utilities)
3. [Best Practices](#best-practices)
4. [Component-Specific Patterns](#component-specific-patterns)
5. [Testing Accessibility](#testing-accessibility)
6. [Common Pitfalls](#common-pitfalls)
7. [Reference](#reference)

---

## Overview

Accessibility is a first-class concern in Jarvis Native. We follow the WCAG 2.1 AA standard and leverage React Native's built-in accessibility APIs to ensure our app works seamlessly with VoiceOver (iOS) and TalkBack (Android).

### Design Principles

1. **Perceivable**: Information and UI components must be presentable to users in ways they can perceive
2. **Operable**: UI components and navigation must be operable
3. **Understandable**: Information and UI operation must be understandable
4. **Robust**: Content must be robust enough to be interpreted by assistive technologies

### Key Features

- Comprehensive accessibility utility library (`/src/utils/accessibility.ts`)
- Semantic role helpers for all interactive elements
- Chart accessibility with text alternatives (`/src/utils/chartAccessibility.ts`)
- Consistent touch target sizes (minimum 44x44 points)
- Screen reader optimized labels and hints
- Keyboard navigation support (hardware keyboard shortcuts)

---

## Core Utilities

All accessibility utilities are located in `/src/utils/accessibility.ts`.

### Basic Accessibility Props

The `makeAccessible()` function creates standardized accessibility props:

```typescript
import { makeAccessible } from '../utils/accessibility';

const props = makeAccessible({
  role: 'button',
  label: 'Delete task',
  hint: 'Double tap to delete this task',
  state: { disabled: false },
});

// Returns:
// {
//   accessible: true,
//   accessibilityRole: 'button',
//   accessibilityLabel: 'Delete task',
//   accessibilityHint: 'Double tap to delete this task',
//   accessibilityState: { disabled: false }
// }
```

### Semantic Helpers

Use these helper functions for common UI elements:

#### Buttons

```typescript
import { makeButton } from '../utils/accessibility';

<TouchableOpacity
  {...makeButton('Save task', 'Saves the current task', false)}
  onPress={handleSave}
>
  <Text>Save</Text>
</TouchableOpacity>
```

**File**: `/src/screens/main/TasksScreen.tsx`, Lines 500-510
**Example**: FAB with accessibility label

```typescript
<FloatingActionButton
  icon="plus"
  onPress={handleCreateTask}
  accessibilityLabel="Create new task"
  accessibilityHint="Opens task creation form"
/>
```

#### Checkboxes

```typescript
import { makeCheckbox } from '../utils/accessibility';

<TouchableOpacity
  {...makeCheckbox('Mark as complete', isCompleted, 'Toggle task completion status')}
  onPress={handleToggleComplete}
>
  <Checkbox checked={isCompleted} />
</TouchableOpacity>
```

**File**: `/src/screens/main/TasksScreen.tsx`, Lines 450-460
**Example**: Task completion checkbox

#### Text Inputs

```typescript
import { makeTextInput } from '../utils/accessibility';

<TextInput
  {...makeTextInput('Task title', taskTitle, 'Enter a descriptive title for your task')}
  value={taskTitle}
  onChangeText={setTaskTitle}
  placeholder="Enter task title"
/>
```

#### Switches

```typescript
import { makeSwitch } from '../utils/accessibility';

<Switch
  {...makeSwitch('Enable notifications', isEnabled, 'Toggle notifications on or off')}
  value={isEnabled}
  onValueChange={setIsEnabled}
/>
```

#### Headers

```typescript
import { makeHeader } from '../utils/accessibility';

<Text {...makeHeader('Tasks Overview', 1)}>
  Tasks Overview
</Text>
```

**File**: `/src/screens/main/DashboardScreen.tsx`, Lines 200-210
**Example**: Section headers with proper heading roles

### Domain-Specific Helpers

#### Task Labels

```typescript
import { makeTaskLabel } from '../utils/accessibility';

const task = {
  title: 'Review pull request',
  priority: 'high',
  dueDate: '2025-12-25',
  completed: false,
  project: { name: 'Web App' }
};

const label = makeTaskLabel(task);
// Returns: "Review pull request, High priority, Due in 4 days, Project: Web App"
```

**File**: `/src/screens/main/TasksScreen.tsx`, Lines 350-380
**Example**: Full task item accessibility

```typescript
<TouchableOpacity
  {...makeButton(makeTaskLabel(task), 'Double tap to view task details')}
  onPress={() => handleTaskPress(task)}
>
  {/* Task UI */}
</TouchableOpacity>
```

#### Habit Labels

```typescript
import { makeHabitLabel } from '../utils/accessibility';

const habit = {
  name: 'Morning meditation',
  currentStreak: 7,
  completedToday: true,
  frequency: 'daily'
};

const label = makeHabitLabel(habit);
// Returns: "Morning meditation, Completed today, 7 day streak, daily frequency"
```

**File**: `/src/screens/main/HabitsScreen.tsx`, Lines 250-270

#### Transaction Labels

```typescript
import { makeTransactionLabel } from '../utils/accessibility';

const transaction = {
  description: 'Grocery shopping',
  amount: -4599,  // cents
  type: 'expense',
  category: { name: 'Food' },
  date: '2025-12-21'
};

const label = makeTransactionLabel(transaction);
// Returns: "Grocery shopping, Expense $45.99, Category: Food, Today"
```

**File**: `/src/screens/main/FinanceScreen.tsx`, Lines 400-420

#### Project Labels

```typescript
import { makeProjectLabel } from '../utils/accessibility';

const project = {
  name: 'Mobile App',
  taskCount: 15,
  completedCount: 8,
  status: 'in_progress'
};

const label = makeProjectLabel(project);
// Returns: "Mobile App, In progress, 8 of 15 tasks completed"
```

### Formatting Helpers

#### Date Formatting

```typescript
import { formatDateForA11y } from '../utils/accessibility';

formatDateForA11y(new Date());  // "Today"
formatDateForA11y(tomorrowDate);  // "Tomorrow"
formatDateForA11y(nextWeekDate);  // "In 5 days"
formatDateForA11y(lastWeekDate);  // "3 days ago"
```

#### Currency Formatting

```typescript
import { formatCurrencyForA11y } from '../utils/accessibility';

formatCurrencyForA11y(1234.56);  // "$1,234.56"
formatCurrencyForA11y(99.99, 'EUR');  // "€99.99"
```

#### Priority Formatting

```typescript
import { formatPriority } from '../utils/accessibility';

formatPriority('high');  // "High priority"
formatPriority('medium');  // "Medium priority"
```

#### Status Formatting

```typescript
import { formatStatus } from '../utils/accessibility';

formatStatus('in_progress');  // "In progress"
formatStatus('completed');  // "Completed"
```

### Announcements

Use announcements to provide feedback for important state changes:

```typescript
import { announceForAccessibility } from '../utils/accessibility';

// After completing a task
announceForAccessibility('Task marked as complete');

// After deleting an item
announceForAccessibility('Task deleted successfully');

// After error
announceForAccessibility('Error: Unable to save changes');
```

**File**: `/src/screens/main/HabitsScreen.tsx`, Lines 180-200
**Example**: Announcing habit completion

```typescript
const handleCompleteHabit = async (habitId: string) => {
  try {
    await completeHabit(habitId);
    haptic.habitComplete();
    announceForAccessibility('Habit marked as complete');
    loadHabits();
  } catch (error) {
    announceForAccessibility('Error completing habit');
  }
};
```

---

## Best Practices

### 1. Always Provide Meaningful Labels

**Bad**:
```typescript
<TouchableOpacity onPress={handleSave}>
  <Icon name="check" />
</TouchableOpacity>
```

**Good**:
```typescript
<TouchableOpacity
  {...makeButton('Save changes', 'Saves your edits and closes the form')}
  onPress={handleSave}
>
  <Icon name="check" />
</TouchableOpacity>
```

### 2. Use Semantic Roles

Always specify the correct `accessibilityRole`:

- `button` - Buttons, touchable elements
- `checkbox` - Checkboxes, completion toggles
- `radio` - Radio buttons, mutually exclusive options
- `switch` - Toggle switches
- `header` - Section headers
- `link` - Navigation links
- `image` - Images, icons (decorative)
- `text` - Static text (rarely needed)
- `adjustable` - Sliders, steppers

### 3. Provide Helpful Hints

Hints explain what will happen when the user interacts:

```typescript
// Good hints
accessibilityHint: "Opens task details"
accessibilityHint: "Deletes this task permanently"
accessibilityHint: "Toggle between light and dark mode"

// Avoid redundant hints
accessibilityHint: "Button to save"  // Role already says it's a button
```

### 4. Touch Target Sizes

Ensure all interactive elements meet minimum touch target size of 44x44 points:

```typescript
import { HIT_SLOP, HIT_SLOP_LARGE } from '../constants/ui';

// Standard hit slop for icon buttons
<IconButton
  icon="delete"
  onPress={handleDelete}
  hitSlop={HIT_SLOP}
/>

// Larger hit slop for small icons or critical actions
<IconButton
  icon="close"
  onPress={handleClose}
  hitSlop={HIT_SLOP_LARGE}
/>
```

**File**: `/src/constants/ui.ts`
```typescript
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
export const HIT_SLOP_LARGE = { top: 12, bottom: 12, left: 12, right: 12 };
```

**Usage**: Applied in 38+ files across the codebase for all IconButton instances.

### 5. Group Related Elements

Use `accessible={false}` on child elements and provide a single label for the parent:

```typescript
<TouchableOpacity
  accessible
  accessibilityLabel="High priority task: Review pull request, Due today"
  onPress={handlePress}
>
  <View accessible={false}>
    <Icon name="flag" color="red" />
    <Text>Review pull request</Text>
    <Text>Due today</Text>
  </View>
</TouchableOpacity>
```

### 6. Handle State Changes

Update accessibility state when component state changes:

```typescript
const [isCompleted, setIsCompleted] = useState(false);

<TouchableOpacity
  {...makeCheckbox('Task item', isCompleted, 'Toggle completion')}
  onPress={() => {
    setIsCompleted(!isCompleted);
    announceForAccessibility(
      isCompleted ? 'Task marked as incomplete' : 'Task marked as complete'
    );
  }}
>
  <Checkbox checked={isCompleted} />
</TouchableOpacity>
```

### 7. Disable Accessibility for Decorative Elements

```typescript
// Decorative icon - skip for screen readers
<Icon name="sparkles" accessible={false} />

// Meaningful icon - include with label
<Icon
  name="warning"
  {...makeImage('Warning')}
/>
```

---

## Component-Specific Patterns

### AppButton

The `AppButton` component has built-in accessibility:

**File**: `/src/components/ui/AppButton.tsx`, Lines 172-189

```typescript
<AppButton
  title="Save Task"
  onPress={handleSave}
  variant="primary"
  disabled={!isValid}
  accessibilityLabel="Save task"  // Optional: defaults to title
  accessibilityHint="Saves the current task and closes the form"
/>
```

Built-in features:
- Automatic `accessibilityRole="button"`
- Disabled state handling
- Loading/busy state
- Press animation with haptic feedback

### FloatingActionButton

**File**: `/src/components/ui/FloatingActionButton.tsx`, Lines 84-132

```typescript
<FloatingActionButton
  icon="plus"
  onPress={handleCreate}
  accessibilityLabel="Create new item"
  accessibilityHint="Opens creation form"
/>
```

### SearchBar

**File**: `/src/components/ui/SearchBar.tsx`

```typescript
<SearchBar
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Search tasks"
  resultCount={filteredTasks.length}
  accessibilityLabel="Search tasks"
  accessibilityHint="Enter keywords to filter tasks"
/>
```

The result count is automatically announced to screen readers.

### Charts

All chart components use the chart accessibility utilities:

**File**: `/src/utils/chartAccessibility.ts`

```typescript
import { getChartDescription, getChartDataTable } from '../utils/chartAccessibility';

const data = [
  { label: 'Mon', value: 10 },
  { label: 'Tue', value: 15 },
  { label: 'Wed', value: 12 },
];

const description = getChartDescription(data, {
  title: 'Weekly Tasks',
  type: 'bar',
  unit: 'tasks'
});
// "Weekly Tasks. Bar chart with 3 data points. Range from 10 tasks to 15 tasks..."

<View
  accessible
  accessibilityLabel={description}
  accessibilityHint="Double tap to view data table"
>
  <BarChart data={data} />
</View>
```

**File**: `/src/components/charts/BarChart.tsx`, Lines 150-170
**Example**: BarChart with full accessibility

### Modals

```typescript
<Modal
  visible={isVisible}
  onRequestClose={handleClose}
  accessibilityViewIsModal={true}  // Prevents background interaction
>
  <View>
    <Text {...makeHeader('Edit Task', 1)}>Edit Task</Text>
    {/* Modal content */}
  </View>
</Modal>
```

### Lists (FlatList)

```typescript
<FlatList
  data={tasks}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <TaskItem
      task={item}
      accessibilityLabel={makeTaskLabel(item)}
    />
  )}
  ListEmptyComponent={
    <EmptyState
      icon="📋"
      title="No tasks"
      description="Create your first task to get started"
      actionLabel="Create Task"
      onAction={handleCreateTask}
    />
  }
/>
```

---

## Testing Accessibility

### iOS - VoiceOver

1. **Enable VoiceOver**: Settings > Accessibility > VoiceOver
2. **Triple-click shortcut**: Settings > Accessibility > Accessibility Shortcut > VoiceOver
3. **Test navigation**:
   - Swipe right/left to navigate between elements
   - Double-tap to activate
   - Two-finger swipe up to read entire screen

### Android - TalkBack

1. **Enable TalkBack**: Settings > Accessibility > TalkBack
2. **Test navigation**:
   - Swipe right/left to navigate
   - Double-tap to activate
   - Swipe down then right for local context menu

### Testing Checklist

- [ ] All interactive elements have labels
- [ ] Labels are descriptive and concise
- [ ] Hints explain the action outcome
- [ ] Navigation order is logical (top to bottom, left to right)
- [ ] State changes are announced
- [ ] Touch targets are at least 44x44 points
- [ ] Form inputs have proper labels
- [ ] Errors are announced
- [ ] Charts have text alternatives
- [ ] Modals trap focus appropriately

### Automated Testing

Use `@testing-library/react-native` to test accessibility:

```typescript
import { render } from '@testing-library/react-native';

test('button has proper accessibility', () => {
  const { getByA11yRole, getByLabelText } = render(
    <AppButton
      title="Save"
      onPress={jest.fn()}
      accessibilityLabel="Save changes"
    />
  );

  const button = getByA11yRole('button');
  expect(button).toHaveAccessibilityState({ disabled: false });

  const labeledButton = getByLabelText('Save changes');
  expect(labeledButton).toBeTruthy();
});
```

---

## Common Pitfalls

### 1. Missing Labels on Icon-Only Buttons

**Problem**:
```typescript
<IconButton icon="delete" onPress={handleDelete} />
```

**Solution**:
```typescript
<IconButton
  icon="delete"
  onPress={handleDelete}
  {...makeButton('Delete task', 'Permanently deletes this task')}
/>
```

### 2. Non-Descriptive Labels

**Problem**:
```typescript
accessibilityLabel="Item"  // Too generic
```

**Solution**:
```typescript
accessibilityLabel={makeTaskLabel(task)}  // Descriptive and contextual
```

### 3. Not Announcing State Changes

**Problem**:
```typescript
const handleComplete = () => {
  setCompleted(true);
  // User doesn't know it succeeded
};
```

**Solution**:
```typescript
const handleComplete = () => {
  setCompleted(true);
  announceForAccessibility('Task marked as complete');
  haptic.taskComplete();
};
```

### 4. Nested Touchables

**Problem**:
```typescript
<TouchableOpacity onPress={handleCardPress}>
  <TouchableOpacity onPress={handleCheckboxPress}>
    <Checkbox />
  </TouchableOpacity>
</TouchableOpacity>
```

**Solution**: Separate the touchables or use a single parent with clear actions.

### 5. Small Touch Targets

**Problem**:
```typescript
<TouchableOpacity onPress={handlePress}>
  <Icon name="close" size={16} />
</TouchableOpacity>
```

**Solution**:
```typescript
<TouchableOpacity
  onPress={handlePress}
  hitSlop={HIT_SLOP_LARGE}
>
  <Icon name="close" size={16} />
</TouchableOpacity>
```

### 6. Not Testing with Assistive Technologies

Always test your UI with VoiceOver and TalkBack before considering it complete.

---

## Reference

### Files

- **Main utility**: `/src/utils/accessibility.ts`
- **Chart accessibility**: `/src/utils/chartAccessibility.ts`
- **UI constants**: `/src/constants/ui.ts`
- **Example usage**:
  - `/src/screens/main/TasksScreen.tsx` - Comprehensive example
  - `/src/screens/main/HabitsScreen.tsx` - Habit-specific labels
  - `/src/screens/main/FinanceScreen.tsx` - Transaction labels
  - `/src/screens/main/DashboardScreen.tsx` - Headers and metrics
  - `/src/components/ui/AppButton.tsx` - Accessible button component
  - `/src/components/ui/FloatingActionButton.tsx` - FAB accessibility

### External Resources

- [React Native Accessibility Docs](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS VoiceOver Guide](https://support.apple.com/guide/iphone/turn-on-and-practice-voiceover-iph3e2e415f/ios)
- [Android TalkBack Guide](https://support.google.com/accessibility/android/answer/6283677)

---

**Questions or Issues?** Check existing screen implementations for patterns or consult the main accessibility utility file.
