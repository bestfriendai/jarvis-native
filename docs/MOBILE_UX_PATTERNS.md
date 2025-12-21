# Mobile UX Patterns

**Last Updated**: 2025-12-21
**Purpose**: Best practices and patterns for mobile user experience in Jarvis Native

---

## Table of Contents

1. [Overview](#overview)
2. [Touch Targets & Gestures](#touch-targets--gestures)
3. [Navigation Patterns](#navigation-patterns)
4. [Feedback & Confirmation](#feedback--confirmation)
5. [Forms & Input](#forms--input)
6. [Empty States & Errors](#empty-states--errors)
7. [Loading & Progress](#loading--progress)
8. [Pull-to-Refresh](#pull-to-refresh)
9. [Swipe Actions](#swipe-actions)
10. [Modal & Bottom Sheets](#modals--bottom-sheets)
11. [Search & Filtering](#search--filtering)
12. [Thumb Zone Optimization](#thumb-zone-optimization)
13. [Dark Mode Considerations](#dark-mode-considerations)
14. [Platform-Specific Patterns](#platform-specific-patterns)
15. [Common Anti-Patterns](#common-anti-patterns)

---

## Overview

Mobile UX differs significantly from desktop. This guide covers mobile-specific patterns used in Jarvis Native.

### Core Principles

1. **Thumb-Friendly**: Optimize for one-handed use
2. **Clear Feedback**: Immediate visual/haptic response to actions
3. **Forgiving**: Easy to undo mistakes
4. **Efficient**: Minimize taps/input required
5. **Consistent**: Follow platform conventions

---

## Touch Targets & Gestures

### Minimum Touch Target Size

All interactive elements should be at least 44x44 points (iOS HIG) or 48x48 dp (Material Design).

**File**: `/src/constants/ui.ts`

```typescript
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
export const HIT_SLOP_LARGE = { top: 12, bottom: 12, left: 12, right: 12 };
```

**Usage**:
```typescript
<IconButton
  icon="delete"
  size={20}
  onPress={handleDelete}
  hitSlop={HIT_SLOP}  // Expands touch area
/>
```

**Applied**: 38+ files across the codebase.

### Touch Feedback

Provide immediate visual and haptic feedback:

**File**: `/src/utils/haptics.ts`

```typescript
import { haptic } from '../utils/haptics';

<TouchableOpacity
  onPress={() => {
    haptic.light();  // Immediate haptic feedback
    handleAction();
  }}
  activeOpacity={0.7}  // Visual feedback (dimming)
>
  <Text>Button</Text>
</TouchableOpacity>
```

**Haptic Types**:
- `haptic.light()` - Lightweight interactions (taps)
- `haptic.medium()` - Moderate actions (completing tasks)
- `haptic.heavy()` - Important actions (deletions)
- `haptic.success()` - Success states
- `haptic.error()` - Error states
- `haptic.warning()` - Warning states

**Usage**: 66+ instances across the app.

### Common Gestures

**Tap**: Primary action (button press, select item)
**Long Press**: Secondary actions, context menus
**Swipe**: Navigate, reveal actions
**Pinch**: Zoom (images, maps)
**Pull**: Refresh content

### Long Press Pattern

**File**: `/src/components/ui/Tooltip.tsx` usage pattern

```typescript
import { useTooltip } from '../hooks/useTooltip';

function MyComponent() {
  const tooltip = useTooltip();

  return (
    <TouchableOpacity
      onPress={handlePrimaryAction}
      onLongPress={(event) => {
        haptic.medium();
        tooltip.show('Long press action', event.nativeEvent.pageX, event.nativeEvent.pageY);
      }}
    >
      <Icon name="help" />
    </TouchableOpacity>
  );
}
```

---

## Navigation Patterns

### Tab Navigation (Bottom)

Primary navigation at the bottom for easy thumb access.

**File**: `/src/navigation/MainNavigator.tsx`

```typescript
<Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: colors.primary.main,
    tabBarInactiveTintColor: colors.text.tertiary,
    tabBarStyle: {
      backgroundColor: colors.background.secondary,
      borderTopColor: colors.border.subtle,
    },
  }}
>
  <Tab.Screen name="Dashboard" component={DashboardScreen} />
  <Tab.Screen name="Tasks" component={TasksScreen} />
  {/* More tabs */}
</Tab.Navigator>
```

**Best Practice**: 3-5 tabs maximum. More than 5 creates cognitive overload.

### Stack Navigation

Use stack navigation for hierarchical content:

```typescript
<Stack.Navigator
  screenOptions={{
    headerStyle: {
      backgroundColor: colors.background.secondary,
    },
    headerTintColor: colors.primary.main,
    animation: 'slide_from_right',  // iOS style
  }}
>
  <Stack.Screen name="TaskList" component={TasksScreen} />
  <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
</Stack.Navigator>
```

### Page Transitions

**File**: All navigators include consistent animations

```typescript
screenOptions={{
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: {
    open: { animation: 'timing', config: { duration: 250 } },
    close: { animation: 'timing', config: { duration: 250 } },
  },
}}
```

**Best Practice**: Keep transitions under 300ms. Longer feels sluggish.

---

## Feedback & Confirmation

### Immediate Feedback

Always provide immediate feedback for actions:

```typescript
const handleComplete = async (taskId: string) => {
  // 1. Immediate haptic
  haptic.taskComplete();

  // 2. Optimistic update
  setTasks(tasks => tasks.map(t =>
    t.id === taskId ? { ...t, completed: true } : t
  ));

  // 3. API call
  try {
    await completeTask(taskId);

    // 4. Success feedback
    announceForAccessibility('Task marked as complete');
  } catch (error) {
    // 5. Revert on error
    setTasks(tasks => tasks.map(t =>
      t.id === taskId ? { ...t, completed: false } : t
    ));
    alertError('Error', 'Failed to complete task');
  }
};
```

### Undo Actions

**File**: `/src/components/ui/UndoToast.tsx`

```typescript
const handleDelete = async (task: Task) => {
  // Store for undo
  const deletedTask = task;

  // Optimistic delete
  setTasks(tasks => tasks.filter(t => t.id !== task.id));

  // Show undo toast
  setShowUndo(true);

  // Wait for undo timeout
  setTimeout(async () => {
    if (!undoTriggered) {
      await deleteTask(task.id);
    }
  }, 5000);
};

<UndoToast
  visible={showUndo}
  message="Task deleted"
  onUndo={() => {
    setTasks(tasks => [...tasks, deletedTask]);
    setShowUndo(false);
  }}
  onDismiss={() => setShowUndo(false)}
/>
```

**Best Practice**: 5 seconds is the standard undo timeout.

### Destructive Action Confirmation

**File**: `/src/utils/dialogs.ts`

```typescript
import { confirmDestructive } from '../utils/dialogs';

const handleDelete = async () => {
  const confirmed = await confirmDestructive(
    'Delete Task',
    'This action cannot be undone.',
    'Delete'
  );

  if (confirmed) {
    haptic.heavy();
    await deleteTask(taskId);
  }
};
```

**Pattern**: Always confirm destructive actions (delete, archive, etc.).

---

## Forms & Input

### Form Layout

Stack form fields vertically on mobile:

```typescript
<View style={{ padding: spacing.base }}>
  <AppInput
    label="Task Title"
    value={title}
    onChangeText={setTitle}
    autoFocus
    returnKeyType="next"
    onSubmitEditing={() => descriptionRef.current?.focus()}
  />

  <AppInput
    ref={descriptionRef}
    label="Description"
    value={description}
    onChangeText={setDescription}
    multiline
    numberOfLines={4}
    returnKeyType="done"
  />

  <EnhancedDatePicker
    label="Due Date"
    value={dueDate}
    onChange={setDueDate}
  />

  <AppButton
    title="Save Task"
    onPress={handleSave}
    fullWidth
    disabled={!isValid}
  />
</View>
```

### Keyboard Management

**File**: Pattern used throughout the app

```typescript
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  <ScrollView keyboardShouldPersistTaps="handled">
    {/* Form fields */}
  </ScrollView>
</KeyboardAvoidingView>
```

### Return Key Types

Guide users through forms with return key hints:

```typescript
<TextInput returnKeyType="next" />     // More fields below
<TextInput returnKeyType="done" />     // Last field
<TextInput returnKeyType="search" />   // Search field
<TextInput returnKeyType="send" />     // Message input
```

### Input Validation

Show validation errors inline:

```typescript
<AppInput
  label="Email"
  value={email}
  onChangeText={setEmail}
  error={emailError}  // Shows red error text
  keyboardType="email-address"
  autoCapitalize="none"
/>
```

---

## Empty States & Errors

### Empty States

Always show helpful empty states, never blank screens.

**File**: `/src/components/ui/EmptyState.tsx`

```typescript
<FlatList
  data={tasks}
  renderItem={renderTask}
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

**Elements**:
1. **Icon/Emoji** - Visual interest
2. **Title** - Clear, concise message
3. **Description** - Explain why it's empty or what to do
4. **Action** - Primary action to resolve empty state

### Zero State vs. Empty State

**Zero State**: First-time user experience
```typescript
<EmptyState
  icon="👋"
  title="Welcome to Jarvis"
  description="Let's create your first task to get started"
  actionLabel="Create Task"
  onAction={handleOnboarding}
/>
```

**Empty State**: Temporary condition (filtered, searched, etc.)
```typescript
<EmptyState
  icon="🔍"
  title="No results"
  description="Try adjusting your search or filters"
  compact
/>
```

### Error States

**File**: `/src/components/ErrorBoundary.tsx`

```typescript
<View style={styles.errorContainer}>
  <Text style={styles.errorEmoji}>⚠️</Text>
  <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
  <Text style={styles.errorMessage}>
    We've logged the error and will look into it
  </Text>
  <AppButton
    title="Try Again"
    onPress={handleRetry}
    variant="primary"
  />
  <AppButton
    title="Go Back"
    onPress={handleGoBack}
    variant="ghost"
  />
</View>
```

**Pattern**:
1. Clear error message
2. Reassurance (we're aware)
3. Primary action (retry)
4. Secondary action (go back)

---

## Loading & Progress

### Loading Patterns

**Skeleton Screens** (preferred):
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

**Spinner** (fallback):
```typescript
{isLoading ? (
  <LoadingState message="Loading tasks..." />
) : (
  <FlatList data={tasks} renderItem={renderTask} />
)}
```

**Best Practice**: Skeletons > Spinners for better perceived performance.

### Progress Indicators

For determinate progress:

```typescript
<View>
  <View style={styles.progressBar}>
    <View style={[styles.progressFill, { width: `${progress}%` }]} />
  </View>
  <Text>{Math.round(progress)}% complete</Text>
</View>
```

### Button Loading States

**File**: `/src/components/ui/AppButton.tsx`

```typescript
<AppButton
  title="Save"
  onPress={handleSave}
  loading={isSaving}
  disabled={isSaving}
/>
```

The button shows a spinner and becomes disabled during the async operation.

---

## Pull-to-Refresh

**File**: `/src/hooks/useRefreshControl.ts`

```typescript
import { useRefreshControl } from '../hooks/useRefreshControl';

function MyScreen() {
  const { refreshing, handleRefresh, lastUpdated } = useRefreshControl({
    screenName: 'tasks',
    onRefresh: loadTasks,
  });

  return (
    <>
      <LastUpdated timestamp={lastUpdated} />
      <FlatList
        data={tasks}
        renderItem={renderTask}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.main}
          />
        }
      />
    </>
  );
}
```

**Features**:
- Haptic feedback on pull
- Tracks last refresh time
- Persists timestamp

**Best Practice**: All list screens should have pull-to-refresh.

---

## Swipe Actions

**File**: `/src/components/tasks/SwipeableTaskItem.tsx`

```typescript
import { SwipeableTaskItem } from '../components/tasks/SwipeableTaskItem';

<SwipeableTaskItem
  task={task}
  onComplete={handleComplete}
  onDelete={handleDelete}
  onPress={handlePress}
/>
```

**Common Patterns**:
- **Swipe Right**: Complete/archive (positive action)
- **Swipe Left**: Delete/remove (negative action)

**Visual Indicators**:
- Color coding (green for complete, red for delete)
- Icons
- Haptic feedback at threshold

### Custom Swipe Actions

```typescript
<Swipeable
  renderLeftActions={() => (
    <TouchableOpacity
      style={[styles.action, { backgroundColor: colors.success }]}
      onPress={handleComplete}
    >
      <Icon name="check" size={24} color="#FFF" />
    </TouchableOpacity>
  )}
  renderRightActions={() => (
    <TouchableOpacity
      style={[styles.action, { backgroundColor: colors.error }]}
      onPress={handleDelete}
    >
      <Icon name="delete" size={24} color="#FFF" />
    </TouchableOpacity>
  )}
>
  <TaskCard task={task} />
</Swipeable>
```

---

## Modals & Bottom Sheets

### Modal Patterns

**Full Screen Modal**: Complex forms, multi-step flows
```typescript
<Modal
  visible={showModal}
  animationType="slide"
  presentationStyle="fullScreen"
>
  <View style={{ flex: 1 }}>
    {/* Full screen content */}
  </View>
</Modal>
```

**Bottom Sheet**: Quick actions, simple forms
```typescript
<Modal
  visible={showModal}
  animationType="slide"
  presentationStyle="pageSheet"  // iOS: slides from bottom
  transparent
>
  <View style={styles.overlay}>
    <View style={styles.bottomSheet}>
      {/* Sheet content */}
    </View>
  </View>
</Modal>
```

**File**: Theme presets for modals

```typescript
import { modalOverlayStyle, modalContentStyle } from '../theme';

const styles = StyleSheet.create({
  overlay: {
    ...modalOverlayStyle,
    // Semi-transparent backdrop, bottom-aligned
  },
  sheet: {
    ...modalContentStyle,
    // Rounded top corners, max 90% height
  },
});
```

### Modal Best Practices

1. **Dismissible**: Always provide a way to close (X button, backdrop tap, swipe down)
2. **Focus Trap**: Prevent interaction with background content
3. **Keyboard Aware**: Handle keyboard appearance
4. **Clear Purpose**: Modal should have a clear, singular purpose

### Modal Accessibility

```typescript
<Modal
  visible={isVisible}
  onRequestClose={handleClose}  // Android back button
  accessibilityViewIsModal={true}  // Prevents background interaction
>
  <View>
    <TouchableOpacity
      {...makeButton('Close', 'Closes the modal')}
      onPress={handleClose}
    >
      <Icon name="close" />
    </TouchableOpacity>
    {/* Modal content */}
  </View>
</Modal>
```

---

## Search & Filtering

### Search Pattern

**File**: `/src/components/ui/SearchBar.tsx` usage

```typescript
import { SearchBar } from '../components/ui';
import { useDebounce } from '../hooks/useDebounce';

function MyScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const filteredItems = useMemo(() => {
    if (!debouncedQuery) return items;
    return items.filter(item =>
      item.title.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
  }, [items, debouncedQuery]);

  return (
    <>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search tasks"
        resultCount={filteredItems.length}
      />
      <FlatList data={filteredItems} renderItem={renderItem} />
    </>
  );
}
```

**Features**:
- Debounced input (300ms delay)
- Result count display
- Clear button
- Focus state styling

### Filter Chips

**File**: `/src/screens/main/TasksScreen.tsx` pattern

```typescript
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  <AppChip
    label="All"
    selected={filterStatus === 'all'}
    onPress={() => setFilterStatus('all')}
  />
  <AppChip
    label="To Do"
    selected={filterStatus === 'todo'}
    onPress={() => setFilterStatus('todo')}
  />
  <AppChip
    label="In Progress"
    selected={filterStatus === 'in_progress'}
    onPress={() => setFilterStatus('in_progress')}
  />
  <AppChip
    label="Completed"
    selected={filterStatus === 'completed'}
    onPress={() => setFilterStatus('completed')}
  />
</ScrollView>
```

### Advanced Filters

Show filter count badge:

```typescript
<TouchableOpacity
  onPress={() => setShowFilters(true)}
  style={styles.filterButton}
>
  <Icon name="filter-variant" size={24} />
  {activeFilterCount > 0 && (
    <Badge size={18}>{activeFilterCount}</Badge>
  )}
</TouchableOpacity>
```

---

## Thumb Zone Optimization

### The Thumb Zone

On smartphones, the easiest area to reach with your thumb is the bottom 60% of the screen.

**Thumb Zone Hierarchy**:
1. **Natural (green)**: Bottom third - easiest to reach
2. **Stretch (yellow)**: Middle third - reachable with slight stretch
3. **Hard (red)**: Top third - requires hand repositioning

### Optimized Layout

**File**: FAB positioning in all list screens

```typescript
// Primary action (FAB) - bottom right (natural thumb zone)
<FloatingActionButton
  icon="plus"
  onPress={handleCreate}
  position="bottom-right"
/>

// Tab navigation - bottom (natural thumb zone)
<Tab.Navigator tabBarPosition="bottom">

// Search/filters - top (stretch zone, accessed less frequently)
<View style={styles.header}>
  <SearchBar />
</View>
```

### Right-Handed Optimization

Most users are right-handed, so place primary actions on the right side:

- **FAB**: Bottom-right
- **Primary action in list item**: Right side
- **Swipe actions**: Complete on right, delete on left

### Left-Handed Consideration

Provide options for left-handed users in settings:

```typescript
const fabPosition = settings.leftHanded ? 'bottom-left' : 'bottom-right';

<FloatingActionButton
  icon="plus"
  onPress={handleCreate}
  position={fabPosition}
/>
```

---

## Dark Mode Considerations

### Contrast Requirements

All text must meet WCAG 2.1 AA contrast ratios:
- **Normal text**: 4.5:1 minimum
- **Large text**: 3:1 minimum

**File**: `/src/theme/index.ts` - All colors are tested for contrast.

### Dark Mode Patterns

**Pure Black Backgrounds** (OLED optimization):
```typescript
colors.background.primary: '#000000'  // Pure black saves battery on OLED
```

**Elevated Surfaces**:
```typescript
// Use lighter shades for elevated content
colors.background.secondary: '#0D1117'  // Cards
colors.background.tertiary: '#161B22'   // Highlights
colors.background.elevated: '#1C2128'   // Modals
```

### Visual Hierarchy in Dark Mode

Use elevation, not just color:

```typescript
// Card elevation shows hierarchy
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    ...shadows.sm,  // Shadow creates depth
  },
});
```

### Avoid Pure White Text

Use slightly off-white for better readability:

```typescript
colors.text.primary: '#FFFFFF'    // Headers
colors.text.secondary: '#F0F0F0'  // Body text (easier on eyes)
colors.text.tertiary: '#A0A0A0'   // Captions
```

---

## Platform-Specific Patterns

### iOS Patterns

**Navigation**:
- Back button: Top-left with "<" chevron
- Large titles in navigation bar
- Swipe from left edge to go back

**Modals**:
- Slide up from bottom
- Pull down to dismiss
- Rounded top corners

**Haptics**:
- More nuanced (light, medium, heavy, success, error, warning)

### Android Patterns

**Navigation**:
- Back button: Hardware back or top-left arrow
- App drawer: Hamburger menu or bottom navigation
- Swipe from left edge for drawer

**Modals**:
- Centered dialogs or bottom sheets
- Backdrop tap to dismiss
- Elevation instead of shadows

**Haptics**:
- Limited (mainly click)

### Cross-Platform Considerations

```typescript
import { Platform } from 'react-native';

const modalPresentationStyle = Platform.select({
  ios: 'pageSheet',
  android: 'slide',
});

const shadowStyle = Platform.select({
  ios: shadows.sm,
  android: { elevation: 4 },
});
```

---

## Common Anti-Patterns

### 1. Tiny Touch Targets

**Bad**: 20x20 icon without hit slop
```typescript
<IconButton icon="delete" size={20} onPress={handleDelete} />
```

**Good**: Icon with expanded touch area
```typescript
<IconButton
  icon="delete"
  size={20}
  onPress={handleDelete}
  hitSlop={HIT_SLOP}
/>
```

### 2. No Feedback on Actions

**Bad**: No indication that action succeeded
```typescript
const handleSave = async () => {
  await saveTask(task);
};
```

**Good**: Immediate haptic + visual feedback
```typescript
const handleSave = async () => {
  haptic.medium();
  setIsSaving(true);
  try {
    await saveTask(task);
    haptic.success();
    alertSuccess('Task saved');
  } catch (error) {
    haptic.error();
    alertError('Error', 'Failed to save task');
  } finally {
    setIsSaving(false);
  }
};
```

### 3. Horizontal Scrolling for Primary Content

**Bad**: Horizontal carousel for tasks
```typescript
<ScrollView horizontal>
  {tasks.map(task => <TaskCard task={task} />)}
</ScrollView>
```

**Good**: Vertical scrolling
```typescript
<FlatList
  data={tasks}
  renderItem={({ item }) => <TaskCard task={item} />}
/>
```

**Exception**: Horizontal scrolling is OK for filters, categories, or secondary content.

### 4. Destructive Actions Without Confirmation

**Bad**: Delete without warning
```typescript
<IconButton icon="delete" onPress={() => deleteTask(task.id)} />
```

**Good**: Confirm before deleting
```typescript
<IconButton
  icon="delete"
  onPress={async () => {
    const confirmed = await confirmDestructive(
      'Delete Task',
      'This action cannot be undone.'
    );
    if (confirmed) {
      deleteTask(task.id);
    }
  }}
/>
```

### 5. Forms Without Validation Feedback

**Bad**: No indication of errors
```typescript
<TextInput value={email} onChangeText={setEmail} />
```

**Good**: Inline validation errors
```typescript
<AppInput
  value={email}
  onChangeText={setEmail}
  error={emailError}
  label="Email"
/>
```

### 6. Loading States That Flash

**Bad**: Spinner appears for 50ms
```typescript
const loadData = async () => {
  setIsLoading(true);
  const data = await fetchData();  // Returns in 50ms
  setIsLoading(false);
};
```

**Good**: Minimum loading duration
```typescript
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

### 7. No Empty States

**Bad**: Blank screen when no data
```typescript
<FlatList data={tasks} renderItem={renderTask} />
```

**Good**: Helpful empty state
```typescript
<FlatList
  data={tasks}
  renderItem={renderTask}
  ListEmptyComponent={
    <EmptyState
      icon="📋"
      title="No tasks"
      description="Create your first task to get started"
      actionLabel="Create Task"
      onAction={handleCreate}
    />
  }
/>
```

---

## UX Checklist

### Every Screen Should Have

- [ ] Pull-to-refresh for data lists
- [ ] Empty state for lists
- [ ] Loading state (skeleton or spinner)
- [ ] Error handling
- [ ] Proper navigation (back button, header)
- [ ] Safe area handling (notches, home indicators)
- [ ] Keyboard avoidance for forms
- [ ] Accessibility labels and hints

### Every Action Should Have

- [ ] Immediate haptic feedback
- [ ] Visual feedback (press state, animation)
- [ ] Loading state for async operations
- [ ] Error handling with user-friendly messages
- [ ] Success confirmation
- [ ] Undo option for destructive actions

### Every List Should Have

- [ ] FlatList (not ScrollView)
- [ ] Performance optimizations (see PERFORMANCE_GUIDE)
- [ ] Pull-to-refresh
- [ ] Empty state
- [ ] Loading skeletons
- [ ] Proper key extraction

---

## Reference

### Files

- **Haptics**: `/src/utils/haptics.ts`
- **Dialogs**: `/src/utils/dialogs.ts`
- **Toast**: `/src/utils/toast.ts`
- **UI constants**: `/src/constants/ui.ts`
- **Navigation**: `/src/navigation/`
- **Example screens**: `/src/screens/main/`

### Related Guides

- [ACCESSIBILITY_GUIDE.md](./ACCESSIBILITY_GUIDE.md) - Accessibility patterns
- [THEME_GUIDE.md](./THEME_GUIDE.md) - Visual design
- [COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md) - Component usage
- [PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md) - Performance optimization

### External Resources

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design](https://material.io/design)
- [React Native Best Practices](https://reactnative.dev/docs/performance)

---

**Questions or Issues?** Check existing screen implementations for UX patterns and conventions.
