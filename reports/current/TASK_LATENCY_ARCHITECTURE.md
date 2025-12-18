# Task Latency Tracking - System Architecture

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐         ┌───────────────────────────┐    │
│  │  DashboardScreen     │         │     TasksScreen           │    │
│  │  (Main Dashboard)    │         │  (Task Management)        │    │
│  └──────────┬───────────┘         └────────────┬──────────────┘    │
│             │                                   │                    │
│             │ Renders                           │ Renders            │
│             ▼                                   ▼                    │
│  ┌──────────────────────┐         ┌───────────────────────────┐    │
│  │ TaskLatencyWidget    │         │  TaskLatencyBadge         │    │
│  │ ┌──────────────────┐ │         │  (on each task card)      │    │
│  │ │ 3.2 days         │ │         │  "Created 5 days ago"     │    │
│  │ │ Avg completion   │ │         │  Color: Yellow/Red/Green  │    │
│  │ ├──────────────────┤ │         └───────────┬───────────────┘    │
│  │ │  [Sparkline]     │ │                     │                     │
│  │ ├──────────────────┤ │                     │ Uses                │
│  │ │ 5 stale tasks ⚠  │ │                     │                     │
│  │ └──────────────────┘ │                     │                     │
│  └──────────┬───────────┘                     │                     │
│             │                                  │                     │
└─────────────┼──────────────────────────────────┼─────────────────────┘
              │                                  │
              │ Fetches Data                     │ Calculates
              ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BUSINESS LOGIC                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  taskLatency.ts (Utility Functions)                          │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │ calculateTaskLatency(task) → number | null             │  │   │
│  │  │ calculateTaskAge(task) → number                        │  │   │
│  │  │ formatLatency(days) → string                           │  │   │
│  │  │ isStaleTask(task, threshold) → boolean                 │  │   │
│  │  │ getLatencyColor(days) → color                          │  │   │
│  │  │ getLatencyCategory(days) → 'fast'|'normal'|'slow'      │  │   │
│  │  │ formatTaskLatencyLabel(task) → string                  │  │   │
│  │  │ generateLatencyInsight(avg, stale) → string            │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Uses
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  tasks.ts (Database Operations)                              │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │ Analytics Functions (Lines 556-787)                    │  │   │
│  │  │                                                         │  │   │
│  │  │ getAverageLatencyByPriority()                          │  │   │
│  │  │   → { priority, avgDays, count }[]                     │  │   │
│  │  │                                                         │  │   │
│  │  │ getAverageLatencyByProject()                           │  │   │
│  │  │   → { projectId, projectName, avgDays, count }[]       │  │   │
│  │  │                                                         │  │   │
│  │  │ getStaleTasks(thresholdDays = 7)                       │  │   │
│  │  │   → Task[]                                             │  │   │
│  │  │                                                         │  │   │
│  │  │ getLatencyTrend(days = 30)                             │  │   │
│  │  │   → { date, avgDays, count }[]                         │  │   │
│  │  │                                                         │  │   │
│  │  │ getCompletionLatencyStats()                            │  │   │
│  │  │   → { overall, staleCount, byPriority, byProject }     │  │   │
│  │  │                                                         │  │   │
│  │  │ getLatencyTrendSparkline()                             │  │   │
│  │  │   → number[7]  // Last 7 days                          │  │   │
│  │  │                                                         │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Queries
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (SQLite)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  tasks table                                                  │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │ Columns:                                               │  │   │
│  │  │  - id (PRIMARY KEY)                                    │  │   │
│  │  │  - title                                               │  │   │
│  │  │  - status ('todo'|'in_progress'|'blocked'|'completed') │  │   │
│  │  │  - priority ('low'|'medium'|'high'|'urgent')           │  │   │
│  │  │  - created_at (ISO timestamp) ← Used for latency       │  │   │
│  │  │  - completed_at (ISO timestamp) ← Used for latency     │  │   │
│  │  │  - project_id (FK to projects)                         │  │   │
│  │  │  - ... other fields                                    │  │   │
│  │  │                                                         │  │   │
│  │  │ Indexes:                                               │  │   │
│  │  │  - idx_tasks_status ON status                          │  │   │
│  │  │  - idx_tasks_created_at ON created_at                  │  │   │
│  │  │  - idx_tasks_completed_at ON completed_at              │  │   │
│  │  │  - idx_tasks_priority ON priority                      │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Flow 1: Dashboard Widget Loading

```
User Opens App
     │
     ▼
DashboardScreen.tsx (useEffect)
     │
     ├─── Parallel Fetch ───┐
     │                       │
     ▼                       ▼
getCompletionLatencyStats()  getLatencyTrendSparkline()
     │                       │
     ├─── SQL Query ────┐    ├─── SQL Query ────┐
     │                  │    │                  │
     ▼                  ▼    ▼                  ▼
SELECT AVG(...)       SELECT ...  SELECT ...    Fill gaps
FROM tasks            FROM tasks  FROM tasks    for 7 days
WHERE completed       GROUP BY    WHERE
                      priority    completed_at
     │                  │           │              │
     ▼                  ▼           ▼              ▼
overall: 3.2        byPriority   byProject    [2.3,3.1,2.8,
staleCount: 5       [...data]    [...data]     0,4.5,3.2,2.9]
     │                  │           │              │
     └──────┬───────────┴──────┬────┴──────────────┘
            │                  │
            ▼                  ▼
    Stats Object          Trend Array
            │                  │
            └────────┬─────────┘
                     │
                     ▼
          TaskLatencyWidget renders
                     │
                     ├─── Main Metric: "3.2 days"
                     ├─── Sparkline Chart
                     ├─── Stale Badge: "5"
                     ├─── Bottleneck: "high priority: 5.1 days"
                     └─── Insight: "Good job! Your task..."
```

---

### Flow 2: Task Card Badge Rendering

```
TasksScreen renders task list
     │
     ▼
For each task in tasks[]
     │
     ▼
<TaskLatencyBadge task={task} showIcon />
     │
     ▼
TaskLatencyBadge.tsx
     │
     ├─── Check if completed
     │    │
     │    ├─ YES ──▶ calculateTaskLatency(task)
     │    │              │
     │    │              ▼
     │    │         latency = (completed_at - created_at) / day_ms
     │    │              │
     │    │              ▼
     │    │         formatTaskLatencyLabel(task)
     │    │              │
     │    │              ▼
     │    │         "Completed in 3 days"
     │    │
     │    └─ NO ───▶ calculateTaskAge(task)
     │                   │
     │                   ▼
     │              age = (now - created_at) / day_ms
     │                   │
     │                   ▼
     │              formatTaskLatencyLabel(task)
     │                   │
     │                   ▼
     │              "Created 5 days ago"
     │
     ▼
getLatencyColor(days)
     │
     ├─ < 3 days ──▶ Green
     ├─ 3-7 days ──▶ Yellow
     └─ > 7 days ──▶ Red
     │
     ▼
Render badge with:
 - Border color (green/yellow/red)
 - Icon (check/clock/alert)
 - Label text
 - Background tint (if stale)
```

---

## Component Hierarchy

```
App
└── NavigationContainer
    └── MainNavigator
        ├── DashboardScreen
        │   ├── ScrollView
        │   │   ├── TodaysFocusCard
        │   │   ├── Daily Metrics
        │   │   ├── TASK COMPLETION Section
        │   │   │   └── TaskLatencyWidget ◄────────────┐
        │   │   │       ├── Header                     │
        │   │   │       ├── Main Metric                │
        │   │   │       ├── Sparkline (from charts)    │
        │   │   │       ├── Bottleneck Alert           │
        │   │   │       ├── Insight Message            │
        │   │   │       └── CTA Button                 │
        │   │   ├── Budget Alerts                      │
        │   │   └── Macro Goals                        │
        │   └── (pulls data from database)             │
        │                                               │
        └── TasksScreen                                 │
            ├── FlatList (or ScrollView)                │
            │   └── For each task:                      │
            │       └── Task Card                       │
            │           ├── Title                       │
            │           ├── Description                 │
            │           └── Metadata Row                │
            │               ├── TaskLatencyBadge ◄──────┘
            │               ├── Priority Badge
            │               ├── Due Date Badge
            │               └── Tags
            └── (pulls task data from database)
```

---

## SQL Query Examples

### Query 1: Average Latency by Priority
```sql
SELECT
  priority,
  AVG((julianday(completed_at) - julianday(created_at))) as avgDays,
  COUNT(*) as count
FROM tasks
WHERE status = 'completed'
  AND completed_at IS NOT NULL
  AND created_at IS NOT NULL
GROUP BY priority
ORDER BY avgDays DESC;
```

**Result:**
```
priority | avgDays | count
---------|---------|------
high     |   5.2   |  15
medium   |   3.1   |  42
low      |   2.8   |  23
urgent   |   1.5   |   8
```

---

### Query 2: Stale Tasks Detection
```sql
SELECT
  t.*,
  p.name as project_name,
  p.color as project_color
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
WHERE t.status != 'completed'
  AND t.status != 'cancelled'
  AND t.created_at < date('now', '-7 days')
ORDER BY t.created_at ASC;
```

**Result:** Returns all tasks older than 7 days with project info

---

### Query 3: Latency Trend (Last 7 Days)
```sql
SELECT
  DATE(completed_at) as date,
  AVG((julianday(completed_at) - julianday(created_at))) as avgDays,
  COUNT(*) as count
FROM tasks
WHERE status = 'completed'
  AND completed_at IS NOT NULL
  AND created_at IS NOT NULL
  AND completed_at >= date('now', '-7 days')
GROUP BY DATE(completed_at)
ORDER BY date ASC;
```

**Result:**
```
date       | avgDays | count
-----------|---------|------
2025-12-09 |   2.3   |   5
2025-12-10 |   3.1   |   7
2025-12-11 |   2.8   |   4
2025-12-13 |   4.5   |   3
2025-12-14 |   3.2   |   6
2025-12-15 |   2.9   |   2
```

*Note: Missing dates are filled with 0 in the sparkline*

---

## Calculation Examples

### Example 1: Fast Task (< 3 days)
```javascript
Task:
  created_at: "2025-12-13T09:00:00Z"
  completed_at: "2025-12-15T15:00:00Z"
  status: "completed"

Calculation:
  diff_ms = completed - created
  diff_ms = 193,200,000 ms (2.236 days)
  rounded = 2.2 days

Output:
  Badge: "Completed in 2 days" (GREEN)
  Color: #4CAF50 (success)
  Category: "fast"
```

---

### Example 2: Normal Task (3-7 days)
```javascript
Task:
  created_at: "2025-12-10T09:00:00Z"
  completed_at: "2025-12-15T09:00:00Z"
  status: "completed"

Calculation:
  diff_ms = completed - created
  diff_ms = 432,000,000 ms (5.0 days)
  rounded = 5.0 days

Output:
  Badge: "Completed in 5 days" (YELLOW)
  Color: #FF9800 (warning)
  Category: "normal"
```

---

### Example 3: Stale Task (> 7 days, incomplete)
```javascript
Task:
  created_at: "2025-12-03T09:00:00Z"
  completed_at: null
  status: "todo"

Calculation:
  now = "2025-12-15T09:00:00Z"
  diff_ms = now - created
  diff_ms = 1,036,800,000 ms (12.0 days)
  rounded = 12.0 days

Output:
  Badge: "Created 12 days ago" (RED)
  Color: #F44336 (error)
  Category: "slow"
  isStale: true (> 7 days)
  Background: Red tint
  Icon: alert-circle
```

---

### Example 4: Same-Day Completion
```javascript
Task:
  created_at: "2025-12-15T09:00:00Z"
  completed_at: "2025-12-15T15:00:00Z"
  status: "completed"

Calculation:
  diff_ms = completed - created
  diff_ms = 21,600,000 ms (0.25 days = 6 hours)
  rounded = 0.3 days

Output:
  Badge: "6 hours" (GREEN)
  Color: #4CAF50 (success)
  Category: "fast"
```

---

## Insight Generation Logic

```javascript
function generateLatencyInsight(avgLatency, staleTasks) {
  if (staleTasks > 5) {
    return `You have ${staleTasks} stale tasks. Time to tackle them!`;
  }

  if (avgLatency < 2) {
    return 'Excellent! You complete tasks quickly.';
  }

  if (avgLatency < 5) {
    return 'Good job! Your task completion is steady.';
  }

  if (avgLatency < 10) {
    return 'Tasks take a bit longer. Consider breaking them down.';
  }

  return 'Tasks are taking too long. Review your workflow.';
}
```

**Examples:**
- avgLatency=1.5, staleTasks=2 → "Excellent! You complete tasks quickly."
- avgLatency=4.2, staleTasks=3 → "Good job! Your task completion is steady."
- avgLatency=7.8, staleTasks=4 → "Tasks take a bit longer. Consider breaking them down."
- avgLatency=3.2, staleTasks=8 → "You have 8 stale tasks. Time to tackle them!"

---

## Performance Optimizations

### 1. Database Level
- **Indexed Queries**: All date fields have indexes
- **Efficient SQL**: Uses SQLite's julianday() for date math
- **Aggregation**: GROUP BY at database level, not client-side
- **Minimal Data Transfer**: Only fetch required columns

### 2. Component Level
- **Lazy Loading**: Widget fetches data after mount
- **Parallel Fetching**: Multiple queries run simultaneously
- **Memoization**: Sparkline component memoizes data
- **Conditional Rendering**: Empty states prevent unnecessary renders

### 3. Application Level
- **Result Caching**: Dashboard data cached until refresh
- **Optimistic Updates**: Task status changes update UI immediately
- **Background Calculation**: Heavy calculations off main thread
- **Debounced Refresh**: Prevents excessive database queries

---

## Error Handling

### 1. Data Corruption
```javascript
// Handle completed_at < created_at
if (completed.getTime() < created.getTime()) {
  console.warn('[taskLatency] Task completed before created:', task.id);
  return 0; // Treat as instant completion
}
```

### 2. Missing Timestamps
```javascript
// Handle missing created_at
if (!task.createdAt) {
  console.warn('[taskLatency] Task missing created_at:', task.id);
  return null; // Cannot calculate
}
```

### 3. Empty States
```javascript
// Handle no completed tasks
if (!stats || stats.overall === 0) {
  return (
    <View style={styles.emptyState}>
      <Text>Complete some tasks to see latency analytics</Text>
    </View>
  );
}
```

### 4. Database Errors
```javascript
try {
  const stats = await getCompletionLatencyStats();
  setStats(stats);
} catch (error) {
  console.error('[TaskLatencyWidget] Error loading data:', error);
  // Component gracefully degrades to loading/error state
}
```

---

## Type Safety

All components use strict TypeScript types:

```typescript
// Utility function types
export function calculateTaskLatency(task: Task): number | null;
export function calculateTaskAge(task: Task): number;
export function formatLatency(days: number): string;
export function isStaleTask(task: Task, thresholdDays?: number): boolean;
export function getLatencyColor(days: number): string;

// Database query types
export async function getAverageLatencyByPriority(): Promise<{
  priority: TaskPriority;
  avgDays: number;
  count: number;
}[]>;

export async function getStaleTasks(thresholdDays?: number): Promise<Task[]>;

export async function getCompletionLatencyStats(): Promise<{
  overall: number;
  staleCount: number;
  byPriority: { priority: TaskPriority; avgDays: number; count: number }[];
  byProject: { projectId: string; projectName: string; avgDays: number; count: number }[];
}>;

// Component prop types
interface TaskLatencyBadgeProps {
  task: Task;
  compact?: boolean;
  showIcon?: boolean;
  staleThreshold?: number;
}

interface TaskLatencyWidgetProps {
  onPress?: () => void;
}
```

---

## Testing Strategy

### Unit Tests (Future)
```typescript
describe('taskLatency utilities', () => {
  test('calculateTaskLatency returns correct days', () => {
    const task = {
      created_at: '2025-12-10T00:00:00Z',
      completed_at: '2025-12-13T00:00:00Z',
    };
    expect(calculateTaskLatency(task)).toBe(3.0);
  });

  test('formatLatency formats correctly', () => {
    expect(formatLatency(0.5)).toBe('12 hours');
    expect(formatLatency(3)).toBe('3 days');
    expect(formatLatency(14)).toBe('2 weeks');
  });
});
```

### Integration Tests (Future)
```typescript
describe('database queries', () => {
  test('getAverageLatencyByPriority returns correct data', async () => {
    // Seed database with test data
    // Query and verify results
  });
});
```

### E2E Tests (Future)
```typescript
describe('TaskLatencyWidget', () => {
  test('displays correct metrics on dashboard', async () => {
    // Navigate to dashboard
    // Verify widget renders
    // Verify metrics match expected values
  });
});
```

---

## Accessibility Compliance

### Color Blindness Support
- Icons supplement color coding
- Text labels always present
- Border patterns differ by state
- No information conveyed by color alone

### Screen Reader Support
- Semantic component structure
- Descriptive aria-labels (web)
- Context-aware announcements
- Logical focus order

### Text Scaling
- Relative font sizes (em/rem)
- Responsive layouts
- No fixed pixel heights
- Content reflows properly

---

**Architecture Document Version:** 1.0.0
**Last Updated:** December 15, 2025
**Status:** Production-Ready
