# Performance Guide

**Last Updated**: 2025-12-21
**Purpose**: Comprehensive guide to performance optimization in Jarvis Native

---

## Table of Contents

1. [Overview](#overview)
2. [List Rendering Optimization](#list-rendering-optimization)
3. [Memoization Strategies](#memoization-strategies)
4. [Database Query Optimization](#database-query-optimization)
5. [Loading States](#loading-states)
6. [Image Optimization](#image-optimization)
7. [Animation Performance](#animation-performance)
8. [Bundle Size Optimization](#bundle-size-optimization)
9. [Memory Management](#memory-management)
10. [Profiling & Debugging](#profiling--debugging)
11. [Performance Checklist](#performance-checklist)

---

## Overview

Performance is critical for React Native apps. This guide covers optimization strategies used in Jarvis Native.

### Performance Principles

1. **Measure First**: Profile before optimizing
2. **Optimize Render Cycles**: Minimize unnecessary re-renders
3. **Virtualize Lists**: Use FlatList, not ScrollView
4. **Optimize Queries**: Fetch only what you need
5. **Lazy Load**: Load content as needed
6. **Cache Wisely**: Cache expensive computations

---

## List Rendering Optimization

### Use FlatList, Not ScrollView

**Bad**:
```typescript
<ScrollView>
  {tasks.map(task => (
    <TaskCard key={task.id} task={task} />
  ))}
</ScrollView>
```

**Good**:
```typescript
<FlatList
  data={tasks}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <TaskCard task={item} />}
  // Performance optimizations
  removeClippedSubviews
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  windowSize={10}
  initialNumToRender={15}
/>
```

**File**: `/src/screens/main/TasksScreen.tsx`, Lines 550-580

### FlatList Props Explained

#### removeClippedSubviews
Unmounts components that are off-screen. **Huge performance gain** for long lists.

```typescript
removeClippedSubviews={true}
```

#### maxToRenderPerBatch
How many items to render in each batch (default: 10).

```typescript
maxToRenderPerBatch={10}  // Render 10 items at a time
```

#### updateCellsBatchingPeriod
Time between rendering batches in ms (default: 50ms).

```typescript
updateCellsBatchingPeriod={50}  // 50ms between batches
```

#### windowSize
How many screen heights to render (default: 21).

```typescript
windowSize={10}  // Render 10 screen heights worth of items
```

Lower values = better performance, but more blank space during fast scrolling.

#### initialNumToRender
How many items to render initially.

```typescript
initialNumToRender={15}  // Render first 15 items immediately
```

Higher values = less blank space on mount, but slower initial render.

### getItemLayout

For lists with fixed-height items, provide `getItemLayout` for instant scrolling:

```typescript
const ITEM_HEIGHT = 100;

<FlatList
  data={items}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  renderItem={renderItem}
/>
```

**Benefit**: Enables instant scroll-to-index without measuring.

### keyExtractor

Always provide stable, unique keys:

```typescript
// Good
keyExtractor={(item) => item.id}

// Bad
keyExtractor={(item, index) => index.toString()}
```

**Why**: Index-based keys cause issues when items are reordered or filtered.

---

## Memoization Strategies

### React.memo for Components

Prevent unnecessary re-renders of list items:

**File**: `/src/components/tasks/TaskCard.tsx` (example pattern)

```typescript
import React, { memo } from 'react';

interface TaskCardProps {
  task: Task;
  onPress: (id: string) => void;
}

export const TaskCard = memo<TaskCardProps>(({ task, onPress }) => {
  return (
    <AppCard onPress={() => onPress(task.id)}>
      <Text>{task.title}</Text>
    </AppCard>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if task actually changed
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.updatedAt === nextProps.task.updatedAt
  );
});
```

**When to use**:
- List items (TaskCard, HabitCard, etc.)
- Expensive components (charts, complex layouts)
- Components that receive stable props

**When NOT to use**:
- Components that always change
- Components that are cheap to render
- Components with many props (comparison overhead)

### useCallback for Functions

Memoize callbacks passed to child components:

```typescript
import { useCallback } from 'react';

function TasksScreen() {
  const [tasks, setTasks] = useState([]);

  // Bad: New function on every render
  const handleTaskPress = (id) => {
    navigation.navigate('TaskDetail', { id });
  };

  // Good: Memoized function
  const handleTaskPress = useCallback((id: string) => {
    navigation.navigate('TaskDetail', { id });
  }, [navigation]);

  return (
    <FlatList
      data={tasks}
      renderItem={({ item }) => (
        <TaskCard task={item} onPress={handleTaskPress} />
      )}
    />
  );
}
```

**Rule**: Always wrap callbacks passed to memoized components.

### useMemo for Expensive Computations

Cache expensive calculations:

```typescript
import { useMemo } from 'react';

function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({});

  // Bad: Filter on every render
  const filteredTasks = tasks.filter(task => matchesFilters(task, filters));

  // Good: Memoized filtering
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => matchesFilters(task, filters));
  }, [tasks, filters]);

  return <FlatList data={filteredTasks} ... />;
}
```

**When to use**:
- Filtering/sorting large arrays
- Complex calculations
- Data transformations

**When NOT to use**:
- Simple calculations (overhead > benefit)
- Values that change on every render

### Computed Values Example

**File**: `/src/utils/taskSorting.ts`

```typescript
// Sorting is expensive - memoize the result
const sortedTasks = useMemo(() => {
  return sortTasks(tasks);  // Complex sorting logic
}, [tasks]);
```

---

## Database Query Optimization

### Avoid N+1 Queries

**Bad**:
```typescript
// N+1 problem: 1 query for habits + N queries for stats
const habits = await getHabits();
for (const habit of habits) {
  habit.stats = await getHabitStats(habit.id);  // N queries
}
```

**Good**:
```typescript
// Single optimized query with JOIN
const habitsWithStats = await getHabitsWithStats();
```

**File**: `/database/habits.ts`

```typescript
export async function getHabitsWithStats(): Promise<HabitWithStats[]> {
  // JOIN habit logs in a single query
  const habits = await db.getAllAsync(`
    SELECT
      h.*,
      COUNT(DISTINCT hl.id) as totalCompletions,
      COUNT(DISTINCT CASE
        WHEN DATE(hl.completedAt) >= DATE('now', '-7 days')
        THEN hl.id
      END) as completionsLast7Days
    FROM habits h
    LEFT JOIN habit_logs hl ON h.id = hl.habitId
    GROUP BY h.id
  `);
  return habits;
}
```

**Impact**: Reduced query time from ~500ms to ~50ms for 50 habits.

### Database Indexing

Add indexes for frequently queried columns:

```sql
-- Index for task queries
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_dueDate ON tasks(dueDate);
CREATE INDEX idx_tasks_projectId ON tasks(projectId);

-- Index for habit queries
CREATE INDEX idx_habit_logs_habitId ON habit_logs(habitId);
CREATE INDEX idx_habit_logs_completedAt ON habit_logs(completedAt);
```

**Impact**: 10-100x faster queries on large datasets.

### Limit Query Results

Don't fetch more than you need:

```typescript
// Bad: Fetch all tasks
const tasks = await db.getAllAsync('SELECT * FROM tasks');

// Good: Fetch only needed columns and rows
const tasks = await db.getAllAsync(`
  SELECT id, title, status, dueDate, priority
  FROM tasks
  WHERE status != 'archived'
  ORDER BY dueDate ASC
  LIMIT 100
`);
```

### Pagination

For very large datasets, implement pagination:

```typescript
async function getTasks(page: number = 0, pageSize: number = 50) {
  const offset = page * pageSize;
  return await db.getAllAsync(`
    SELECT * FROM tasks
    LIMIT ? OFFSET ?
  `, [pageSize, offset]);
}
```

---

## Loading States

### Minimum Loading Duration

Prevent flashing loading states for fast operations:

**File**: `/src/utils/loadingUtils.ts`

```typescript
import { withMinLoadingDuration } from '../utils/loadingUtils';

const loadData = async () => {
  setIsLoading(true);
  try {
    // Ensures loading shows for at least 150ms
    const data = await withMinLoadingDuration(fetchData());
    setData(data);
  } finally {
    setIsLoading(false);
  }
};
```

**Why**: Loading states that flash for <100ms are jarring and look buggy.

### Debounced Loading

Only show loading if operation takes longer than threshold:

```typescript
import { withDebouncedLoading } from '../utils/loadingUtils';

const searchTasks = async (query: string) => {
  await withDebouncedLoading(
    performSearch(query),
    setIsLoading,
    200,  // Only show loading if search takes >200ms
    150   // But keep it visible for at least 150ms once shown
  );
};
```

### Skeleton Screens

Show content placeholders instead of spinners:

**File**: `/src/components/tasks/TaskCardSkeleton.tsx`

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

**Benefits**:
- Better perceived performance
- Less jarring than spinners
- Shows expected layout

---

## Image Optimization

### Use Image Resizing

```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  style={{ width: 100, height: 100 }}
  contentFit="cover"
  cachePolicy="memory-disk"
/>
```

### Cache Images

```typescript
import * as FileSystem from 'expo-file-system';

async function cacheImage(uri: string): Promise<string> {
  const filename = uri.split('/').pop();
  const path = `${FileSystem.cacheDirectory}${filename}`;

  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    return path;  // Return cached version
  }

  await FileSystem.downloadAsync(uri, path);
  return path;
}
```

### Lazy Load Images

Load images as they come into view:

```typescript
import { useInViewport } from 'react-native-intersection-observer';

function LazyImage({ uri }) {
  const { ref, inViewport } = useInViewport();

  return (
    <View ref={ref}>
      {inViewport && <Image source={{ uri }} />}
    </View>
  );
}
```

---

## Animation Performance

### Use Native Driver

Always use `useNativeDriver: true` when possible:

**File**: `/src/components/ui/AppButton.tsx`, Lines 64-69

```typescript
Animated.spring(scaleValue, {
  toValue: animation.pressedScale,
  useNativeDriver: true,  // Runs on native thread
  speed: 50,
  bounciness: 4,
}).start();
```

**Why**: Animations run at 60fps on the native thread, not the JS thread.

**Supported properties**:
- `transform` (scale, rotate, translate)
- `opacity`

**NOT supported**:
- `width`, `height` (use scale instead)
- `backgroundColor` (use opacity on colored overlay instead)

### Avoid Layout Animations

Layout animations trigger expensive layout calculations:

```typescript
// Bad: Animating height
Animated.timing(height, {
  toValue: 200,
  useNativeDriver: false,  // Can't use native driver
}).start();

// Good: Use scale or opacity instead
Animated.timing(scale, {
  toValue: 1,
  useNativeDriver: true,  // Native driver works
}).start();
```

### Reanimated for Complex Animations

For gesture-driven animations, use `react-native-reanimated`:

```typescript
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

function SwipeableItem() {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={animatedStyle}>...</Animated.View>;
}
```

**When to use**:
- Swipe gestures
- Drag-and-drop
- Complex, interactive animations

---

## Bundle Size Optimization

### Tree Shaking

Import only what you need:

```typescript
// Bad: Imports entire library
import _ from 'lodash';
const result = _.debounce(fn, 300);

// Good: Import specific function
import debounce from 'lodash/debounce';
const result = debounce(fn, 300);
```

### Code Splitting

Split large features into separate chunks:

```typescript
import React, { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function MyScreen() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Remove Console Logs

Use a babel plugin to remove console logs in production:

```javascript
// babel.config.js
module.exports = {
  plugins: [
    ['transform-remove-console', { exclude: ['error', 'warn'] }]
  ]
};
```

---

## Memory Management

### Clean Up Subscriptions

Always clean up event listeners and subscriptions:

```typescript
useEffect(() => {
  const subscription = someEventEmitter.addListener('event', handleEvent);

  return () => {
    subscription.remove();  // Cleanup
  };
}, []);
```

### Clean Up Timers

```typescript
useEffect(() => {
  const timeout = setTimeout(() => {
    // Do something
  }, 1000);

  return () => {
    clearTimeout(timeout);  // Cleanup
  };
}, []);
```

### Avoid Memory Leaks in Async

```typescript
useEffect(() => {
  let isMounted = true;

  const loadData = async () => {
    const data = await fetchData();
    if (isMounted) {
      setData(data);  // Only update if still mounted
    }
  };

  loadData();

  return () => {
    isMounted = false;  // Prevent updates after unmount
  };
}, []);
```

### WeakMap for Caches

Use WeakMap for object caches that should be garbage collected:

```typescript
const cache = new WeakMap<object, any>();

function getCachedValue(obj: object) {
  if (cache.has(obj)) {
    return cache.get(obj);
  }

  const value = expensiveComputation(obj);
  cache.set(obj, value);
  return value;
}
```

---

## Profiling & Debugging

### React DevTools Profiler

1. Install React DevTools: `npm install -g react-devtools`
2. Run: `react-devtools`
3. Record a profile
4. Analyze flame graph

**Look for**:
- Components that render too often
- Expensive render times
- Cascading updates

### Flipper

Use Flipper for React Native debugging:

```bash
npx react-native-flipper
```

**Features**:
- Network inspector
- Database viewer
- Performance monitor
- Crash reporter

### Performance Monitor

Enable the in-app performance monitor:

```typescript
import { enableScreens } from 'react-native-screens';
enableScreens();

// Show FPS monitor
import { setJSExceptionHandler } from 'react-native-exception-handler';
```

### Bundle Analyzer

Analyze bundle size:

```bash
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output bundle.js \
  --sourcemap-output bundle.map

npx source-map-explorer bundle.js bundle.map
```

---

## Performance Checklist

### Lists
- [ ] Use `FlatList` instead of `ScrollView`
- [ ] Provide `keyExtractor`
- [ ] Add `removeClippedSubviews`
- [ ] Optimize `maxToRenderPerBatch` and `windowSize`
- [ ] Use `getItemLayout` for fixed-height items
- [ ] Memoize `renderItem` function

### Components
- [ ] Wrap list items in `React.memo`
- [ ] Use `useCallback` for event handlers
- [ ] Use `useMemo` for expensive computations
- [ ] Avoid inline object/array creation in render
- [ ] Extract static styles outside component

### Database
- [ ] Add indexes for frequent queries
- [ ] Avoid N+1 queries
- [ ] Use JOINs instead of multiple queries
- [ ] Limit query results
- [ ] Fetch only needed columns

### Images
- [ ] Resize images appropriately
- [ ] Cache images
- [ ] Lazy load off-screen images
- [ ] Use `expo-image` with caching

### Animations
- [ ] Use `useNativeDriver: true`
- [ ] Avoid animating layout properties
- [ ] Use Reanimated for gestures
- [ ] Keep animations under 16ms (60fps)

### Loading
- [ ] Show skeleton screens
- [ ] Use minimum loading duration
- [ ] Debounce search/filter inputs
- [ ] Show optimistic updates

### Memory
- [ ] Clean up event listeners
- [ ] Clear timers in useEffect cleanup
- [ ] Prevent state updates after unmount
- [ ] Remove console.logs in production

---

## Performance Metrics

### Target Metrics

- **JS Frame Rate**: 60 FPS (16ms per frame)
- **UI Frame Rate**: 60 FPS
- **Initial Render**: <500ms for main screens
- **List Scroll**: No dropped frames
- **Navigation**: <300ms screen transitions
- **App Size**: <50MB for release build
- **Memory**: <200MB on average

### Measurement Tools

1. **React DevTools Profiler**: Component render times
2. **Flipper**: Network, database, performance
3. **Xcode Instruments**: iOS profiling
4. **Android Profiler**: Android profiling
5. **Metro Bundler**: Bundle analysis

---

## Common Performance Pitfalls

### 1. Anonymous Functions in Render

**Bad**:
```typescript
<FlatList
  data={items}
  renderItem={({ item }) => <Item onPress={() => handlePress(item.id)} />}
/>
```

**Good**:
```typescript
const handlePress = useCallback((id: string) => {
  // Handle press
}, []);

const renderItem = useCallback(({ item }) => (
  <Item onPress={() => handlePress(item.id)} />
), [handlePress]);

<FlatList data={items} renderItem={renderItem} />
```

### 2. Inline Styles

**Bad**:
```typescript
<View style={{ padding: 16, backgroundColor: '#000' }}>
```

**Good**:
```typescript
const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#000' }
});

<View style={styles.container}>
```

### 3. Over-Fetching Data

**Bad**:
```typescript
const tasks = await db.getAllAsync('SELECT * FROM tasks');
```

**Good**:
```typescript
const tasks = await db.getAllAsync(`
  SELECT id, title, status FROM tasks WHERE status != 'archived' LIMIT 100
`);
```

### 4. Not Cleaning Up

**Bad**:
```typescript
useEffect(() => {
  const interval = setInterval(updateData, 1000);
  // No cleanup!
}, []);
```

**Good**:
```typescript
useEffect(() => {
  const interval = setInterval(updateData, 1000);
  return () => clearInterval(interval);
}, []);
```

---

## Reference

### Files

- **Loading utilities**: `/src/utils/loadingUtils.ts`
- **Sorting utilities**: `/src/utils/taskSorting.ts`
- **Database functions**: `/database/*.ts`
- **Example screens**: `/src/screens/main/TasksScreen.tsx`
- **Skeleton components**: `/src/components/*/Skeleton.tsx`

### Related Guides

- [COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md) - Component patterns
- [MOBILE_UX_PATTERNS.md](./MOBILE_UX_PATTERNS.md) - UX best practices

### External Resources

- [React Native Performance](https://reactnative.dev/docs/performance)
- [FlatList Performance](https://reactnative.dev/docs/optimizing-flatlist-configuration)
- [React Profiler](https://reactjs.org/docs/profiler.html)
- [Flipper](https://fbflipper.com/)

---

**Questions or Issues?** Profile first, then optimize. Always measure the impact of changes.
