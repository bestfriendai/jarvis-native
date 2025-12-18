# Screen Migration Guide: API to Offline-First

This guide shows how to migrate each screen from API calls to local SQLite database.

## Pattern: Before vs After

### Before (API-based with React Query)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../../services/tasks.api';

const queryClient = useQueryClient();

const { data: tasks = [], isLoading } = useQuery({
  queryKey: ['tasks'],
  queryFn: tasksApi.getTasks,
});

const updateMutation = useMutation({
  mutationFn: ({ id, data }) => tasksApi.updateTask(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  },
});
```

### After (Offline-first with SQLite)
```typescript
import { useState, useEffect, useCallback } from 'react';
import * as tasksDB from '../../database/tasks';

const [tasks, setTasks] = useState([]);
const [isLoading, setIsLoading] = useState(true);

const loadTasks = useCallback(async () => {
  try {
    const loadedTasks = await tasksDB.getTasks();
    setTasks(loadedTasks);
  } catch (error) {
    console.error('Error loading tasks:', error);
    Alert.alert('Error', 'Failed to load tasks');
  } finally {
    setIsLoading(false);
  }
}, []);

useEffect(() => {
  loadTasks();
}, [loadTasks]);

const handleUpdate = async (id, data) => {
  try {
    await tasksDB.updateTask(id, data);
    await loadTasks(); // Refresh
  } catch (error) {
    Alert.alert('Error', 'Failed to update');
  }
};
```

## HabitsScreen Migration

### Changes needed:

1. **Imports**
```typescript
// Remove:
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsApi } from '../../services/habits.api';

// Add:
import { useState, useEffect, useCallback } from 'react';
import * as habitsDB from '../../database/habits';
```

2. **State Management**
```typescript
// Remove React Query hooks
const [habits, setHabits] = useState([]);
const [isLoading, setIsLoading] = useState(true);

const loadHabits = useCallback(async () => {
  try {
    const loadedHabits = await habitsDB.getHabits();
    setHabits(loadedHabits);
  } catch (error) {
    console.error('Error loading habits:', error);
  } finally {
    setIsLoading(false);
  }
}, []);

useEffect(() => {
  loadHabits();
}, [loadHabits]);
```

3. **Operations**
```typescript
const handleLogToday = async (habitId: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    await habitsDB.logHabitCompletion(habitId, today, true);
    await loadHabits();
  } catch (error) {
    Alert.alert('Error', 'Failed to log habit');
  }
};

const handleDelete = async (habitId: string) => {
  Alert.alert(
    'Delete Habit',
    'Are you sure? All completion history will be lost.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await habitsDB.deleteHabit(habitId);
            await loadHabits();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete habit');
          }
        },
      },
    ]
  );
};
```

## CalendarScreen Migration

### Changes needed:

1. **Imports**
```typescript
import * as calendarDB from '../../database/calendar';
```

2. **Load Events**
```typescript
const [events, setEvents] = useState([]);
const [selectedDate, setSelectedDate] = useState(new Date());

const loadEvents = useCallback(async () => {
  try {
    // Get events for the month
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    const loadedEvents = await calendarDB.getEventsByDateRange(
      startOfMonth.toISOString(),
      endOfMonth.toISOString()
    );
    setEvents(loadedEvents);
  } catch (error) {
    console.error('Error loading events:', error);
  }
}, [selectedDate]);

useEffect(() => {
  loadEvents();
}, [loadEvents]);
```

3. **Create Event**
```typescript
const handleCreateEvent = async (eventData) => {
  try {
    await calendarDB.createEvent(eventData);
    await loadEvents();
  } catch (error) {
    Alert.alert('Error', 'Failed to create event');
  }
};
```

## FinanceScreen Migration

### Changes needed:

1. **Imports**
```typescript
import * as financeDB from '../../database/finance';
```

2. **Load Financial Data**
```typescript
const [summary, setSummary] = useState(null);
const [transactions, setTransactions] = useState([]);
const [assets, setAssets] = useState([]);
const [liabilities, setLiabilities] = useState([]);

const loadFinanceData = useCallback(async () => {
  try {
    const [summaryData, transData, assetData, liabData] = await Promise.all([
      financeDB.getFinanceSummary(),
      financeDB.getTransactions(),
      financeDB.getAssets(),
      financeDB.getLiabilities(),
    ]);

    setSummary(summaryData);
    setTransactions(transData);
    setAssets(assetData);
    setLiabilities(liabData);
  } catch (error) {
    console.error('Error loading finance data:', error);
  } finally {
    setIsLoading(false);
  }
}, []);

useEffect(() => {
  loadFinanceData();
}, [loadFinanceData]);
```

3. **Add Transaction**
```typescript
const handleAddTransaction = async (transactionData) => {
  try {
    await financeDB.createTransaction(transactionData);
    await loadFinanceData();
  } catch (error) {
    Alert.alert('Error', 'Failed to add transaction');
  }
};
```

## DashboardScreen Migration

The Dashboard aggregates data from multiple sources:

```typescript
import * as tasksDB from '../../database/tasks';
import * as habitsDB from '../../database/habits';
import * as calendarDB from '../../database/calendar';
import * as financeDB from '../../database/finance';

const [dashboardData, setDashboardData] = useState({
  tasks: null,
  habits: [],
  upcomingEvents: [],
  financeSummary: null,
});

const loadDashboard = useCallback(async () => {
  try {
    const [taskStats, habitList, events, finance] = await Promise.all([
      tasksDB.getTaskStats(),
      habitsDB.getHabits(),
      calendarDB.getUpcomingEvents(7), // Next 7 days
      financeDB.getFinanceSummary(),
    ]);

    setDashboardData({
      tasks: taskStats,
      habits: habitList.slice(0, 5), // Top 5 habits
      upcomingEvents: events.slice(0, 3), // Next 3 events
      financeSummary: finance,
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
  } finally {
    setIsLoading(false);
  }
}, []);

useEffect(() => {
  loadDashboard();
}, [loadDashboard]);
```

## Form Modal Pattern

For create/edit modals:

```typescript
const TaskFormModal = ({ visible, task, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = { /* form data */ };

      if (task) {
        await tasksDB.updateTask(task.id, data);
      } else {
        await tasksDB.createTask(data);
      }

      onClose();
      // Trigger parent refresh (use callback or event)
      onSuccess?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible}>
      {/* Form fields */}
      <AppButton
        title={task ? 'Update' : 'Create'}
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={!isValid}
      />
    </Modal>
  );
};
```

## Refresh Pattern

```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await loadData(); // Your load function
  setRefreshing(false);
};

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary.main}
    />
  }
>
  {/* Content */}
</ScrollView>
```

## Key Differences Summary

| Aspect | API (Before) | SQLite (After) |
|--------|-------------|----------------|
| **State** | React Query cache | useState + useEffect |
| **Loading** | `isLoading` from useQuery | useState isLoading |
| **Mutations** | useMutation hooks | Async functions |
| **Refresh** | invalidateQueries | Call load function |
| **Speed** | Network latency | Instant (<10ms) |
| **Offline** | Fails without internet | Always works |
| **Errors** | Network errors | DB errors (rare) |

## Testing Checklist

For each migrated screen:

- [ ] Data loads on mount
- [ ] Create operation works
- [ ] Update operation works
- [ ] Delete operation works
- [ ] Refresh works (pull-to-refresh)
- [ ] Loading states show correctly
- [ ] Errors handled gracefully
- [ ] Works in airplane mode
- [ ] Fast and responsive

## Benefits

✅ **Instant loading** - No network delay
✅ **Always available** - Works offline
✅ **Smooth UX** - No loading spinners for local ops
✅ **Reliable** - No backend downtime
✅ **Private** - Data stays local

## Next Steps

1. Apply pattern to HabitsScreen
2. Apply pattern to CalendarScreen
3. Apply pattern to FinanceScreen
4. Apply pattern to DashboardScreen
5. Test all screens offline
6. Remove unused API services (keep AI endpoints)

---

**Migration Status**: TasksScreen ✅ Complete
