# Remaining Screen Migrations Guide

Quick guide to complete the remaining screen migrations to SQLite.

---

## 1. FinanceScreen Migration

**Current State:** Uses `financeApi` (API layer)
**Target:** Use `financeDB` (database layer) directly

### Files to Modify
- `/mnt/d/claude dash/jarvis-native/src/screens/main/FinanceScreen.tsx`

### Migration Pattern (Same as Tasks/Habits/Calendar)

```typescript
// BEFORE (API layer)
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../services/finance.api';

const { data: transactions = [] } = useQuery({
  queryKey: ['transactions'],
  queryFn: financeApi.getTransactions,
});

// AFTER (Database layer)
import { useState, useCallback, useEffect } from 'react';
import * as financeDB from '../../database/finance';

const [transactions, setTransactions] = useState([]);
const [isLoading, setIsLoading] = useState(true);

const loadTransactions = useCallback(async () => {
  try {
    const loaded = await financeDB.getTransactions();
    setTransactions(loaded);
  } catch (error) {
    console.error('Error loading transactions:', error);
    Alert.alert('Error', 'Failed to load transactions');
  } finally {
    setIsLoading(false);
  }
}, []);

useEffect(() => {
  loadTransactions();
}, [loadTransactions]);
```

### Database Functions Available
From `/mnt/d/claude dash/jarvis-native/src/database/finance.ts`:

**Transactions:**
- `getTransactions(filters?)` - Get all transactions
- `getTransaction(id)` - Get single transaction
- `createTransaction(data)` - Create new
- `updateTransaction(id, data)` - Update
- `deleteTransaction(id)` - Delete
- `getTransactionsByDateRange(startDate, endDate)` - Filter by date

**Assets:**
- `getAssets()` - Get all assets
- `createAsset(data)` - Create new
- `updateAsset(id, data)` - Update
- `deleteAsset(id)` - Delete

**Liabilities:**
- `getLiabilities()` - Get all liabilities
- `createLiability(data)` - Create new
- `updateLiability(id, data)` - Update
- `deleteLiability(id)` - Delete

**Stats:**
- `getFinancialSummary()` - Get totals, net worth, etc.

### Steps
1. Replace all `useQuery` with `useState` + `useCallback` + `useEffect`
2. Replace all `useMutation` with async functions
3. Remove `useQueryClient` and `invalidateQueries`
4. Add try/catch with Alert for errors
5. Add loading and empty states
6. Test create, edit, delete flows

---

## 2. DashboardScreen Migration

**Current State:** Uses `dashboardApi` (API layer)
**Target:** Use multiple database modules directly

### Files to Modify
- `/mnt/d/claude dash/jarvis-native/src/screens/main/DashboardScreen.tsx`

### Migration Pattern

```typescript
// BEFORE
const { data: metrics } = useQuery({
  queryKey: ['metrics', 'today'],
  queryFn: dashboardApi.getTodayMetrics,
});

// AFTER
import * as tasksDB from '../../database/tasks';
import * as habitsDB from '../../database/habits';
import * as calendarDB from '../../database/calendar';
import * as financeDB from '../../database/finance';

const [metrics, setMetrics] = useState(null);

const loadMetrics = useCallback(async () => {
  try {
    // Get data from multiple databases
    const taskStats = await tasksDB.getTaskStats();
    const todayEvents = await calendarDB.getTodayEventsCount();
    const financialSummary = await financeDB.getFinancialSummary();

    // Aggregate into dashboard metrics
    const dashboardMetrics = {
      activeTasks: taskStats.todo + taskStats.inProgress,
      completedTasks: taskStats.completed,
      todayEvents: todayEvents,
      netWorth: financialSummary.netWorth,
      // Add more metrics as needed
    };

    setMetrics(dashboardMetrics);
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}, []);

useEffect(() => {
  loadMetrics();
}, [loadMetrics]);
```

### Database Functions to Use

**From tasksDB:**
- `getTaskStats()` - Returns total, todo, inProgress, completed, blocked counts
- `getTasks({ status: 'todo' })` - Get today's active tasks

**From habitsDB:**
- `getHabits()` - Get all habits
- `isHabitCompletedToday(habitId)` - Check if habit done today

**From calendarDB:**
- `getUpcomingEvents(days)` - Get next N days of events
- `getTodayEventsCount()` - Count today's events
- `getEventsByDate(date)` - Get today's events

**From financeDB:**
- `getFinancialSummary()` - Get net worth, total assets, total liabilities

### Steps
1. Import all database modules
2. Create `loadMetrics` function that queries all databases
3. Aggregate results into dashboard-friendly format
4. Replace `useQuery` with local state + useCallback
5. Add refresh handler
6. Test all metric calculations

---

## 3. SettingsScreen Enhancement

**Current State:** Basic settings structure
**Target:** Add database management features

### Files to Modify
- `/mnt/d/claude dash/jarvis-native/src/screens/main/SettingsScreen.tsx`

### Features to Add

#### A. Clear All Data Button

```typescript
import { resetDatabase } from '../../database';

const handleClearData = () => {
  Alert.alert(
    'Clear All Data',
    'This will delete all tasks, habits, events, and financial data. This cannot be undone!',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Everything',
        style: 'destructive',
        onPress: async () => {
          try {
            await resetDatabase();
            Alert.alert('Success', 'All data cleared successfully');
          } catch (error) {
            console.error('Error clearing data:', error);
            Alert.alert('Error', 'Failed to clear data');
          }
        },
      },
    ]
  );
};
```

#### B. Database Info Section

```typescript
import * as tasksDB from '../../database/tasks';
import * as habitsDB from '../../database/habits';
import * as calendarDB from '../../database/calendar';

const [dbStats, setDbStats] = useState({
  tasks: 0,
  habits: 0,
  events: 0,
});

const loadDbStats = useCallback(async () => {
  try {
    const tasks = await tasksDB.getTasks();
    const habits = await habitsDB.getHabits();
    const events = await calendarDB.getEvents();

    setDbStats({
      tasks: tasks.length,
      habits: habits.length,
      events: events.length,
    });
  } catch (error) {
    console.error('Error loading database stats:', error);
  }
}, []);

// In render:
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Database Info</Text>
  <Text>Tasks: {dbStats.tasks}</Text>
  <Text>Habits: {dbStats.habits}</Text>
  <Text>Events: {dbStats.events}</Text>
</View>
```

#### C. Optional: Enable Sample Data

```typescript
import { seedDatabase, needsSeeding } from '../../database/seed';

const handleEnableSampleData = async () => {
  Alert.alert(
    'Load Sample Data',
    'This will add demo tasks, habits, and events to your database.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Load Demo Data',
        onPress: async () => {
          try {
            await seedDatabase();
            Alert.alert('Success', 'Sample data loaded!');
            // Reload current screen data
          } catch (error) {
            console.error('Error seeding data:', error);
            Alert.alert('Error', 'Failed to load sample data');
          }
        },
      },
    ]
  );
};
```

### Complete Settings Screen Structure

```
Settings
├── Profile Section (optional)
├── Database Section
│   ├── Database Info (task count, habit count, event count)
│   ├── Clear All Data (destructive, with confirmation)
│   └── Load Sample Data (optional, for testing)
├── Appearance Section (optional)
│   ├── Dark Mode Toggle (theme system exists)
│   └── Text Size (accessibility)
└── About Section (optional)
    ├── App Version
    └── Credits
```

---

## Migration Checklist

### FinanceScreen
- [ ] Replace useQuery with useState + useCallback
- [ ] Replace useMutation with async functions
- [ ] Import financeDB instead of financeApi
- [ ] Add error handling with try/catch
- [ ] Add loading states
- [ ] Add empty states
- [ ] Test create transaction
- [ ] Test edit transaction
- [ ] Test delete transaction
- [ ] Test assets management
- [ ] Test liabilities management
- [ ] Test financial summary calculations

### DashboardScreen
- [ ] Import all database modules
- [ ] Create loadMetrics function
- [ ] Aggregate data from multiple databases
- [ ] Replace API calls with database calls
- [ ] Update metrics display
- [ ] Test quick start controls
- [ ] Test quick capture
- [ ] Verify all metrics calculate correctly

### SettingsScreen
- [ ] Add database info section
- [ ] Load database statistics
- [ ] Add Clear All Data button
- [ ] Add confirmation dialog
- [ ] Test clear data functionality
- [ ] (Optional) Add Load Sample Data button
- [ ] (Optional) Add dark mode toggle
- [ ] Test all settings features

---

## Testing After Migration

For each migrated screen:

1. **Load Data** - Screen loads without errors
2. **Empty State** - Shows proper empty state when database is empty
3. **Create** - Can create new items
4. **Read** - Items display correctly
5. **Update** - Can edit existing items
6. **Delete** - Can delete items with confirmation
7. **Refresh** - Pull-to-refresh works
8. **Persistence** - Data remains after app restart
9. **Error Handling** - Graceful errors if database fails
10. **Loading States** - Shows loading indicator while fetching

---

## Common Patterns Reference

### Pattern 1: Basic Data Loading
```typescript
const [data, setData] = useState([]);
const [isLoading, setIsLoading] = useState(true);

const loadData = useCallback(async () => {
  try {
    const loaded = await someDB.getData();
    setData(loaded);
  } catch (error) {
    console.error('Error:', error);
    Alert.alert('Error', 'Failed to load data');
  } finally {
    setIsLoading(false);
  }
}, []);

useEffect(() => {
  loadData();
}, [loadData]);
```

### Pattern 2: Create Item
```typescript
const handleCreate = async (itemData) => {
  try {
    await someDB.createItem(itemData);
    await loadData(); // Refresh list
    setShowModal(false);
  } catch (error) {
    console.error('Error:', error);
    Alert.alert('Error', 'Failed to create item');
  }
};
```

### Pattern 3: Delete with Confirmation
```typescript
const handleDelete = (id) => {
  Alert.alert('Delete Item', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          await someDB.deleteItem(id);
          await loadData();
        } catch (error) {
          console.error('Error:', error);
          Alert.alert('Error', 'Failed to delete');
        }
      },
    },
  ]);
};
```

### Pattern 4: Pull to Refresh
```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await loadData();
  setRefreshing(false);
};

// In ScrollView:
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary.main}
    />
  }
>
```

---

## Estimated Time

- **FinanceScreen**: 1-2 hours (similar to CalendarScreen)
- **DashboardScreen**: 1 hour (aggregate existing functions)
- **SettingsScreen**: 30 minutes (add buttons and info)

**Total**: ~3-4 hours for complete migration

---

## Next Steps

1. Start with **SettingsScreen** (easiest, 30 min)
   - Add database info
   - Add clear data button

2. Then **DashboardScreen** (1 hour)
   - Aggregate metrics from databases
   - Test all calculations

3. Finally **FinanceScreen** (1-2 hours)
   - Follow CalendarScreen pattern
   - Migrate all finance features

After completing these migrations, your app will be **100% offline-first** with no API dependencies!

