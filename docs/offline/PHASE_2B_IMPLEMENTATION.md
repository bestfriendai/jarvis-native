# Phase 2B Implementation Plan

**Version:** 1.0
**Date:** 2025-12-14
**Status:** Ready for Implementation
**Total Estimated Duration:** 20-26 hours

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Prerequisites & Dependencies](#prerequisites--dependencies)
3. [Feature 2B.1: Habits - Insights & Analytics](#feature-2b1-habits---insights--analytics)
4. [Feature 2B.2: Calendar - Conflict Detection](#feature-2b2-calendar---conflict-detection)
5. [Feature 2B.3: Calendar - Reminders/Notifications](#feature-2b3-calendar---remindersnotifications)
6. [Feature 2B.4: Tasks - Bulk Actions](#feature-2b4-tasks---bulk-actions)
7. [Implementation Order](#implementation-order)
8. [Testing Strategy](#testing-strategy)
9. [Rollback Plan](#rollback-plan)

---

## Executive Summary

Phase 2B introduces advanced analytics, conflict prevention, notifications, and productivity enhancements to the Jarvis Native Life Dashboard. This phase builds on the complete Phase 1 (Core Features) and Phase 2A (Dashboard Enhancements) to deliver:

### Feature Overview

| Feature | Priority | Effort | Impact | Dependencies |
|---------|----------|--------|--------|--------------|
| **2B.1: Habits Insights** | HIGH | 8-10h | HIGH | Phase 2A.1 |
| **2B.2: Conflict Detection** | HIGH | 4-6h | HIGH | Phase 1 Calendar |
| **2B.3: Event Reminders** | HIGH | 4-6h | HIGH | expo-notifications |
| **2B.4: Bulk Task Actions** | HIGH | 4-6h | HIGH | Phase 1 Tasks |

### Key Deliverables

1. **Habit Analytics Dashboard**: 7-day/30-day completion rates, streak tracking, time-of-day analysis, weekday patterns
2. **Smart Calendar**: Automatic conflict detection with detailed overlap information
3. **Event Notifications**: Local push notifications with configurable reminder times
4. **Productivity Tools**: Multi-select bulk operations for tasks (complete, delete, move, status change)

### Technical Requirements

- **Existing Dependencies**: ✅ All required (expo-notifications@0.32.14 already installed)
- **Database Changes**: 2 schema modifications (calendar_events table)
- **New Components**: 5 new components, 4 modified screens
- **API Changes**: 7 new database functions

---

## Prerequisites & Dependencies

### Phase Completion Requirements

- ✅ **Phase 1 Complete**: All CRUD operations, offline-first architecture, SQLite setup
- ✅ **Phase 2A Complete**: Dashboard widgets, priority visuals, deep links
- ✅ **Package Dependencies**: expo-notifications (v0.32.14) already installed

### Dependency Verification

```bash
# Verify expo-notifications is installed
grep "expo-notifications" package.json

# Expected output:
# "expo-notifications": "^0.32.14"
```

### Database Compatibility

- SQLite version: expo-sqlite@16.0.10
- Schema version: 1 (current)
- Migration strategy: ALTER TABLE (backward compatible)

---

## Feature 2B.1: Habits - Insights & Analytics

**Priority:** TIER 2 - High Impact
**Effort:** 8-10 hours
**Complexity:** Medium-High
**Dependencies:** Phase 2A.1 (habit completion data)

### Overview

Add comprehensive analytics to habit tracking including completion rates, streak analysis, time-of-day patterns, and weekday performance visualization.

### User Stories

- As a user, I want to see my 7-day and 30-day completion rates
- As a user, I want to know what time of day I'm most successful at completing habits
- As a user, I want to see which weekdays I perform best/worst
- As a user, I want to track my current and longest streaks
- As a user, I want visual charts showing my habit patterns

### Database Changes

**No schema changes required** - Uses existing `habit_logs` and `habits` tables.

### Implementation Details

#### Step 1: Add Analytics Types (30 min)

**File:** `/mnt/d/claude dash/jarvis-native/src/database/habits.ts`

Add new interfaces at the top of the file (after existing imports):

```typescript
/**
 * Analytics data for a single habit
 */
export interface HabitInsights {
  habitId: string;
  completionRate30Days: number;  // Percentage (0-100)
  completionRate7Days: number;   // Percentage (0-100)
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening' | null;
  longestStreak: number;
  currentStreak: number;
  totalCompletions: number;
  weekdayPattern: WeekdayPattern;
  timeDistribution: TimeDistribution;
}

export interface WeekdayPattern {
  Sunday: number;
  Monday: number;
  Tuesday: number;
  Wednesday: number;
  Thursday: number;
  Friday: number;
  Saturday: number;
}

export interface TimeDistribution {
  morning: number;    // 5am - 12pm
  afternoon: number;  // 12pm - 6pm
  evening: number;    // 6pm - 5am
}
```

#### Step 2: Implement Analytics Functions (2 hours)

**File:** `/mnt/d/claude dash/jarvis-native/src/database/habits.ts`

Add these functions at the end of the file:

```typescript
/**
 * Get comprehensive insights for a habit
 */
export async function getHabitInsights(habitId: string): Promise<HabitInsights> {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get completion logs for last 30 days
  const logs = await executeQuery<HabitLogRow>(
    `SELECT * FROM habit_logs
     WHERE habit_id = ?
     AND date >= ?
     ORDER BY date DESC`,
    [habitId, thirtyDaysAgo.toISOString().split('T')[0]]
  );

  // Calculate 30-day completion rate
  const completedLast30 = logs.filter(l => l.completed === 1).length;
  const completionRate30Days = (completedLast30 / 30) * 100;

  // Calculate 7-day completion rate
  const sevenDaysAgoDate = sevenDaysAgo.toISOString().split('T')[0];
  const completedLast7 = logs.filter(
    l => l.date >= sevenDaysAgoDate && l.completed === 1
  ).length;
  const completionRate7Days = (completedLast7 / 7) * 100;

  // Analyze time of day (if we have created_at timestamps)
  const timeDistribution = analyzeTimeOfDay(logs);
  const bestTimeOfDay = getBestTimeOfDay(timeDistribution);

  // Weekday pattern
  const weekdayPattern = analyzeWeekdayPattern(logs);

  // Get streak data from habit record
  const habit = await getHabitById(habitId);
  if (!habit) {
    throw new Error(`Habit ${habitId} not found`);
  }

  return {
    habitId,
    completionRate30Days: Math.round(completionRate30Days),
    completionRate7Days: Math.round(completionRate7Days),
    bestTimeOfDay,
    longestStreak: habit.longestStreak,
    currentStreak: habit.currentStreak,
    totalCompletions: completedLast30,
    weekdayPattern,
    timeDistribution,
  };
}

/**
 * Analyze completion times to determine time-of-day distribution
 */
function analyzeTimeOfDay(logs: HabitLogRow[]): TimeDistribution {
  const distribution: TimeDistribution = {
    morning: 0,
    afternoon: 0,
    evening: 0,
  };

  logs.forEach(log => {
    // Only count completed logs with timestamps
    if (log.completed !== 1 || !log.created_at) return;

    const hour = new Date(log.created_at).getHours();

    if (hour >= 5 && hour < 12) {
      distribution.morning++;
    } else if (hour >= 12 && hour < 18) {
      distribution.afternoon++;
    } else {
      distribution.evening++;
    }
  });

  return distribution;
}

/**
 * Determine the best time of day based on completion distribution
 */
function getBestTimeOfDay(
  distribution: TimeDistribution
): 'morning' | 'afternoon' | 'evening' | null {
  const total = distribution.morning + distribution.afternoon + distribution.evening;

  if (total === 0) return null;

  const max = Math.max(
    distribution.morning,
    distribution.afternoon,
    distribution.evening
  );

  if (distribution.morning === max) return 'morning';
  if (distribution.afternoon === max) return 'afternoon';
  return 'evening';
}

/**
 * Analyze completion rates by weekday
 */
function analyzeWeekdayPattern(logs: HabitLogRow[]): WeekdayPattern {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

  const counts: Record<string, { completed: number; total: number }> = {};

  weekdays.forEach(day => {
    counts[day] = { completed: 0, total: 0 };
  });

  logs.forEach(log => {
    const dayName = weekdays[new Date(log.date).getDay()];
    counts[dayName].total++;
    if (log.completed === 1) {
      counts[dayName].completed++;
    }
  });

  const pattern: WeekdayPattern = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };

  weekdays.forEach(day => {
    pattern[day] = counts[day].total > 0
      ? Math.round((counts[day].completed / counts[day].total) * 100)
      : 0;
  });

  return pattern;
}
```

#### Step 3: Create Insights Card Component (3 hours)

**File:** `/mnt/d/claude dash/jarvis-native/src/components/habits/HabitInsightsCard.tsx` (NEW FILE)

```typescript
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { HabitInsights } from '../../database/habits';

interface HabitInsightsCardProps {
  insights: HabitInsights;
  habitName: string;
}

export function HabitInsightsCard({ insights, habitName }: HabitInsightsCardProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <Text style={styles.title}>{habitName} Insights</Text>

        {/* Completion Rates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completion Rates</Text>
          <View style={styles.ratesContainer}>
            <View style={styles.rateBox}>
              <Text style={styles.rateValue}>{insights.completionRate7Days}%</Text>
              <Text style={styles.rateLabel}>Last 7 Days</Text>
              <View style={[styles.rateBar, { width: `${insights.completionRate7Days}%` }]} />
            </View>
            <View style={styles.divider} />
            <View style={styles.rateBox}>
              <Text style={styles.rateValue}>{insights.completionRate30Days}%</Text>
              <Text style={styles.rateLabel}>Last 30 Days</Text>
              <View style={[styles.rateBar, { width: `${insights.completionRate30Days}%` }]} />
            </View>
          </View>
        </View>

        {/* Streaks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streaks</Text>
          <View style={styles.streaksContainer}>
            <View style={styles.streakBox}>
              <Icon name="fire" size={32} color="#FF6B35" />
              <Text style={styles.streakValue}>{insights.currentStreak}</Text>
              <Text style={styles.streakLabel}>Current Streak</Text>
            </View>
            <View style={styles.streakBox}>
              <Icon name="trophy" size={32} color="#FFD23F" />
              <Text style={styles.streakValue}>{insights.longestStreak}</Text>
              <Text style={styles.streakLabel}>Best Streak</Text>
            </View>
          </View>
        </View>

        {/* Best Time of Day */}
        {insights.bestTimeOfDay && (
          <View style={styles.section}>
            <View style={styles.insightRow}>
              <Icon name="clock-outline" size={24} color="#4A90E2" />
              <View style={styles.insightTextContainer}>
                <Text style={styles.insightText}>
                  You complete this habit most often in the{' '}
                  <Text style={styles.insightHighlight}>{insights.bestTimeOfDay}</Text>
                </Text>
                <View style={styles.timeDistribution}>
                  <Text style={styles.timeDistLabel}>
                    Morning: {insights.timeDistribution.morning}
                  </Text>
                  <Text style={styles.timeDistLabel}>
                    Afternoon: {insights.timeDistribution.afternoon}
                  </Text>
                  <Text style={styles.timeDistLabel}>
                    Evening: {insights.timeDistribution.evening}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Weekday Pattern Chart */}
        <View style={styles.section}>
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
                      },
                    ]}
                  />
                </View>
                <Text style={styles.weekdayLabel}>{day.slice(0, 3)}</Text>
                <Text style={styles.weekdayRate}>{rate}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Summary Footer */}
        <View style={styles.footer}>
          <Icon name="check-circle" size={16} color="#999" />
          <Text style={styles.footerText}>
            {insights.totalCompletions} completions in last 30 days
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function getBarColor(rate: number): string {
  if (rate >= 80) return '#4CAF50'; // Green
  if (rate >= 50) return '#FFB74D'; // Orange
  return '#EF5350'; // Red
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 12,
  },
  ratesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
  },
  rateBox: {
    flex: 1,
    alignItems: 'center',
  },
  rateValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  rateLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginBottom: 8,
  },
  rateBar: {
    height: 4,
    backgroundColor: '#4A90E2',
    borderRadius: 2,
    maxWidth: '100%',
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  streaksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
  },
  streakBox: {
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  streakLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
  },
  insightTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  insightHighlight: {
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  timeDistribution: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeDistLabel: {
    fontSize: 11,
    color: '#777',
  },
  weekdayBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 120,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  weekdayBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  weekdayLabel: {
    fontSize: 11,
    color: '#555',
    marginTop: 4,
    fontWeight: '500',
  },
  weekdayRate: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
});
```

#### Step 4: Integrate into HabitsScreen (2 hours)

**File:** `/mnt/d/claude dash/jarvis-native/src/screens/main/HabitsScreen.tsx`

Add to imports section:

```typescript
import { HabitInsightsCard } from '../../components/habits/HabitInsightsCard';
import { getHabitInsights, HabitInsights } from '../../database/habits';
```

Add state variables (after existing state):

```typescript
const [selectedHabitInsights, setSelectedHabitInsights] = useState<HabitInsights | null>(null);
const [showInsightsModal, setShowInsightsModal] = useState(false);
const [insightsHabitName, setInsightsHabitName] = useState('');
```

Add insights loading function:

```typescript
const loadInsights = async (habitId: string, habitName: string) => {
  try {
    const insights = await getHabitInsights(habitId);
    setSelectedHabitInsights(insights);
    setInsightsHabitName(habitName);
    setShowInsightsModal(true);
  } catch (error) {
    console.error('[HabitsScreen] Error loading insights:', error);
    Alert.alert('Error', 'Failed to load habit insights. Please try again.');
  }
};
```

Add "View Insights" button to each habit card (modify existing habit rendering):

```typescript
// In the habit list rendering, add a button after habit name/description:
<TouchableOpacity
  style={styles.insightsButton}
  onPress={() => loadInsights(habit.id, habit.name)}
>
  <Icon name="chart-line" size={20} color="#4A90E2" />
  <Text style={styles.insightsButtonText}>View Insights</Text>
</TouchableOpacity>
```

Add insights modal at the end of the return statement:

```typescript
{/* Insights Modal */}
<Modal
  visible={showInsightsModal}
  animationType="slide"
  presentationStyle="pageSheet"
  onRequestClose={() => setShowInsightsModal(false)}
>
  <View style={styles.insightsModalContainer}>
    <View style={styles.modalHeader}>
      <Text style={styles.modalHeaderTitle}>Habit Insights</Text>
      <TouchableOpacity
        onPress={() => setShowInsightsModal(false)}
        style={styles.closeButton}
      >
        <Icon name="close" size={24} color="#333" />
      </TouchableOpacity>
    </View>

    {selectedHabitInsights && (
      <HabitInsightsCard
        insights={selectedHabitInsights}
        habitName={insightsHabitName}
      />
    )}
  </View>
</Modal>
```

Add styles:

```typescript
insightsButton: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 8,
  backgroundColor: '#E3F2FD',
  borderRadius: 6,
  marginTop: 8,
},
insightsButtonText: {
  fontSize: 14,
  color: '#4A90E2',
  marginLeft: 6,
  fontWeight: '500',
},
insightsModalContainer: {
  flex: 1,
  backgroundColor: '#F5F5F5',
},
modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 16,
  backgroundColor: '#FFFFFF',
  borderBottomWidth: 1,
  borderBottomColor: '#E0E0E0',
},
modalHeaderTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
},
closeButton: {
  padding: 4,
},
```

### Testing Checklist

- [ ] **Data Accuracy**
  - [ ] 7-day completion rate calculates correctly with various completion patterns
  - [ ] 30-day completion rate calculates correctly
  - [ ] Handles incomplete data (< 7 or < 30 days of logs)
  - [ ] Zero completions displays 0% (not NaN or error)

- [ ] **Time Analysis**
  - [ ] Best time of day determined accurately from completion timestamps
  - [ ] Returns null when no completion data exists
  - [ ] Time distribution counts match actual completions

- [ ] **Weekday Pattern**
  - [ ] All 7 days display in correct order
  - [ ] Percentages accurate for each weekday
  - [ ] Handles weeks with no completions on certain days
  - [ ] Bar chart renders proportionally

- [ ] **Streaks**
  - [ ] Current streak displays correctly from habits table
  - [ ] Longest streak displays correctly
  - [ ] Matches actual streak calculation in habit logs

- [ ] **UI/UX**
  - [ ] Insights modal opens smoothly
  - [ ] Insights modal closes properly
  - [ ] All sections render without layout issues
  - [ ] Scrolling works when content exceeds screen height
  - [ ] Loading state handles async data fetch
  - [ ] Error handling displays user-friendly messages

- [ ] **Edge Cases**
  - [ ] New habit with no logs displays gracefully
  - [ ] Habit with only 1-2 completions doesn't crash
  - [ ] Future-dated logs are excluded (if any exist)
  - [ ] Multiple habits' insights don't interfere with each other

### Files Modified/Created

```
✅ MODIFY: src/database/habits.ts
   - Add HabitInsights, WeekdayPattern, TimeDistribution interfaces
   - Add getHabitInsights() function
   - Add analyzeTimeOfDay() helper
   - Add getBestTimeOfDay() helper
   - Add analyzeWeekdayPattern() helper

✅ CREATE: src/components/habits/HabitInsightsCard.tsx
   - New component for displaying insights
   - Completion rate visualization
   - Streak display
   - Time-of-day insight
   - Weekday bar chart

✅ MODIFY: src/screens/main/HabitsScreen.tsx
   - Add insights state management
   - Add loadInsights() function
   - Add "View Insights" button to habit cards
   - Add insights modal
   - Add new styles
```

---

## Feature 2B.2: Calendar - Conflict Detection

**Priority:** TIER 2 - High Impact
**Effort:** 4-6 hours
**Complexity:** Medium
**Dependencies:** Phase 1 Calendar

### Overview

Automatically detect overlapping calendar events and warn users before creating/editing events that conflict with existing schedules.

### User Stories

- As a user, I want to be warned when scheduling overlapping events
- As a user, I want to see which events conflict and by how much
- As a user, I want to view conflicting event details
- As a user, I want the option to proceed anyway if conflicts are intentional

### Database Changes

**No schema changes required** - Uses existing `calendar_events` table.

### Implementation Details

#### Step 1: Add Conflict Detection Types (15 min)

**File:** `/mnt/d/claude dash/jarvis-native/src/database/calendar.ts`

Add after existing interfaces:

```typescript
/**
 * Represents an event conflict with overlap information
 */
export interface EventConflict {
  event: CalendarEvent;
  overlapMinutes: number;
  overlapStart: string;  // ISO timestamp
  overlapEnd: string;    // ISO timestamp
}
```

#### Step 2: Implement Conflict Detection Function (1.5 hours)

**File:** `/mnt/d/claude dash/jarvis-native/src/database/calendar.ts`

Add at the end of the file:

```typescript
/**
 * Detect calendar event conflicts for a given time range
 * @param startTime - Event start time (ISO string)
 * @param endTime - Event end time (ISO string)
 * @param excludeEventId - Optional event ID to exclude (for editing)
 * @returns Array of conflicting events with overlap details
 */
export async function detectConflicts(
  startTime: string,
  endTime: string,
  excludeEventId?: string
): Promise<EventConflict[]> {
  // Query for overlapping events
  // Events overlap if:
  // 1. Event wraps our timeframe (starts before, ends after)
  // 2. Event starts during our timeframe
  // 3. Event ends during our timeframe

  const query = `
    SELECT * FROM calendar_events
    WHERE id != ?
    AND (
      (start_time < ? AND end_time > ?) OR
      (start_time >= ? AND start_time < ?) OR
      (end_time > ? AND end_time <= ?)
    )
    ORDER BY start_time ASC
  `;

  const params = [
    excludeEventId || '',
    endTime, startTime,  // Event wraps our timeframe
    startTime, endTime,  // Event starts during our timeframe
    startTime, endTime   // Event ends during our timeframe
  ];

  const overlappingEvents = await executeQuery<CalendarEventRow>(query, params);

  // Calculate overlap duration for each conflict
  const conflicts: EventConflict[] = overlappingEvents.map(eventRow => {
    const event = rowToCalendarEvent(eventRow);

    // Calculate actual overlap window
    const overlapStart = new Date(Math.max(
      new Date(startTime).getTime(),
      new Date(event.startTime).getTime()
    ));

    const overlapEnd = new Date(Math.min(
      new Date(endTime).getTime(),
      new Date(event.endTime).getTime()
    ));

    const overlapMinutes = Math.round(
      (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60)
    );

    return {
      event,
      overlapMinutes,
      overlapStart: overlapStart.toISOString(),
      overlapEnd: overlapEnd.toISOString(),
    };
  });

  return conflicts;
}

/**
 * Format time range for display (e.g., "2:00 PM - 3:30 PM")
 */
export function formatEventTimeRange(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  return `${formatTime(start)} - ${formatTime(end)}`;
}
```

#### Step 3: Create Conflict Warning Component (2 hours)

**File:** `/mnt/d/claude dash/jarvis-native/src/components/calendar/ConflictWarning.tsx` (NEW FILE)

```typescript
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { EventConflict } from '../../database/calendar';
import { formatEventTimeRange } from '../../database/calendar';

interface ConflictWarningProps {
  conflicts: EventConflict[];
  onViewConflict: (eventId: string) => void;
  onProceed: () => void;
  onCancel: () => void;
}

export function ConflictWarning({
  conflicts,
  onViewConflict,
  onProceed,
  onCancel,
}: ConflictWarningProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="alert-circle" size={48} color="#EF5350" />
        <Text style={styles.title}>Schedule Conflict Detected</Text>
        <Text style={styles.subtitle}>
          This event overlaps with {conflicts.length} existing event{conflicts.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Conflicts List */}
      <ScrollView style={styles.conflictsList}>
        {conflicts.map(({ event, overlapMinutes, overlapStart, overlapEnd }) => (
          <TouchableOpacity
            key={event.id}
            style={styles.conflictCard}
            onPress={() => onViewConflict(event.id)}
            activeOpacity={0.7}
          >
            <View style={styles.conflictHeader}>
              <View style={styles.conflictTitleRow}>
                <Icon name="calendar-alert" size={20} color="#EF5350" />
                <Text style={styles.conflictTitle} numberOfLines={1}>
                  {event.title}
                </Text>
              </View>
              <View style={styles.overlapBadge}>
                <Text style={styles.overlapText}>
                  {overlapMinutes}min overlap
                </Text>
              </View>
            </View>

            <View style={styles.conflictDetails}>
              <View style={styles.detailRow}>
                <Icon name="clock-outline" size={14} color="#666" />
                <Text style={styles.detailText}>
                  {formatEventTimeRange(event.startTime, event.endTime)}
                </Text>
              </View>

              {event.location && (
                <View style={styles.detailRow}>
                  <Icon name="map-marker" size={14} color="#666" />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
              )}

              <View style={styles.overlapTimeRow}>
                <Icon name="alert-octagon" size={12} color="#FF9800" />
                <Text style={styles.overlapTimeText}>
                  Overlap: {formatEventTimeRange(overlapStart, overlapEnd)}
                </Text>
              </View>
            </View>

            <View style={styles.viewDetailsRow}>
              <Text style={styles.viewDetailsText}>Tap to view details</Text>
              <Icon name="chevron-right" size={16} color="#4A90E2" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.proceedButton]}
          onPress={onProceed}
        >
          <Text style={styles.proceedButtonText}>Create Anyway</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF3F3',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF5350',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  conflictsList: {
    flex: 1,
    padding: 16,
  },
  conflictCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conflictTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  conflictTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  overlapBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  overlapText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF9800',
  },
  conflictDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  overlapTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#FFF8E1',
    padding: 6,
    borderRadius: 4,
  },
  overlapTimeText: {
    fontSize: 12,
    color: '#F57C00',
    marginLeft: 6,
    fontWeight: '500',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#4A90E2',
    marginRight: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  proceedButton: {
    backgroundColor: '#EF5350',
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

#### Step 4: Integrate into Calendar Event Form (1.5 hours)

**File:** Find and modify the calendar event creation/editing screen (likely `/mnt/d/claude dash/jarvis-native/src/screens/main/CalendarScreen.tsx` or a separate form modal)

Add to imports:

```typescript
import { ConflictWarning } from '../../components/calendar/ConflictWarning';
import { detectConflicts, EventConflict } from '../../database/calendar';
```

Add state:

```typescript
const [conflicts, setConflicts] = useState<EventConflict[]>([]);
const [showConflictWarning, setShowConflictWarning] = useState(false);
```

Add conflict checking function:

```typescript
const checkConflicts = async (
  startTime: string,
  endTime: string,
  excludeEventId?: string
): Promise<EventConflict[]> => {
  try {
    const detectedConflicts = await detectConflicts(
      startTime,
      endTime,
      excludeEventId
    );
    return detectedConflicts;
  } catch (error) {
    console.error('[CalendarScreen] Error checking conflicts:', error);
    return [];
  }
};
```

Modify save/create event function:

```typescript
const handleSaveEvent = async () => {
  // ... existing validation ...

  // Check for conflicts before saving
  const detectedConflicts = await checkConflicts(
    formData.startTime,
    formData.endTime,
    editingEventId // Pass current event ID if editing
  );

  if (detectedConflicts.length > 0) {
    setConflicts(detectedConflicts);
    setShowConflictWarning(true);
    return; // Stop here and show warning
  }

  // No conflicts, proceed with save
  await saveEventToDatabase();
};

const handleProceedDespiteConflict = async () => {
  setShowConflictWarning(false);
  await saveEventToDatabase();
};

const handleViewConflictingEvent = (eventId: string) => {
  setShowConflictWarning(false);
  // Navigate to or display the conflicting event
  // Implementation depends on your navigation structure
};
```

Add modal at the end of the component:

```typescript
{/* Conflict Warning Modal */}
<Modal
  visible={showConflictWarning}
  animationType="slide"
  presentationStyle="pageSheet"
  onRequestClose={() => setShowConflictWarning(false)}
>
  <ConflictWarning
    conflicts={conflicts}
    onViewConflict={handleViewConflictingEvent}
    onProceed={handleProceedDespiteConflict}
    onCancel={() => setShowConflictWarning(false)}
  />
</Modal>
```

### Testing Checklist

- [ ] **Conflict Detection Logic**
  - [ ] Detects exact time overlaps (same start/end)
  - [ ] Detects partial overlaps (event starts during another)
  - [ ] Detects events that wrap the new event
  - [ ] Detects events wrapped by the new event
  - [ ] No false positives (adjacent events don't conflict)
  - [ ] Excludes current event when editing (doesn't conflict with itself)

- [ ] **Overlap Calculation**
  - [ ] Overlap duration calculated correctly
  - [ ] Overlap start/end times accurate
  - [ ] Multiple conflicts all detected
  - [ ] Conflicts sorted by start time

- [ ] **UI/UX**
  - [ ] Warning modal appears when conflicts exist
  - [ ] All conflicting events listed
  - [ ] Overlap badges show correct minutes
  - [ ] "View details" navigation works
  - [ ] "Cancel" dismisses warning and keeps form open
  - [ ] "Create Anyway" saves event despite conflicts

- [ ] **Edge Cases**
  - [ ] All-day events conflict detection
  - [ ] Events spanning midnight
  - [ ] Very short events (5-10 min)
  - [ ] Multiple simultaneous conflicts
  - [ ] Empty calendar (no conflicts)

### Files Modified/Created

```
✅ MODIFY: src/database/calendar.ts
   - Add EventConflict interface
   - Add detectConflicts() function
   - Add formatEventTimeRange() helper

✅ CREATE: src/components/calendar/ConflictWarning.tsx
   - New component for displaying conflicts
   - Conflict list with overlap details
   - Action buttons (cancel/proceed)

✅ MODIFY: src/screens/main/CalendarScreen.tsx (or event form component)
   - Add conflict detection state
   - Add checkConflicts() function
   - Modify save handler to check conflicts
   - Add conflict warning modal
```

---

## Feature 2B.3: Calendar - Reminders/Notifications

**Priority:** TIER 2 - High Impact
**Effort:** 4-6 hours
**Complexity:** Medium-High
**Dependencies:** expo-notifications (already installed)

### Overview

Add local push notifications for calendar events with configurable reminder times (5min, 15min, 30min, 1hr, 2hr, 1 day before).

### User Stories

- As a user, I want to set reminders for events
- As a user, I want to receive notifications before events start
- As a user, I want to tap notifications to view event details
- As a user, I want reminders to be automatically rescheduled when I edit events

### Database Changes

#### Migration Required

**File:** `/mnt/d/claude dash/jarvis-native/src/database/schema.ts`

Modify the `calendar_events` table definition:

```typescript
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
    recurring TEXT,
    reminder_minutes INTEGER,      -- NEW: minutes before event to remind (5, 15, 30, 60, 120, 1440)
    notification_id TEXT,          -- NEW: expo notification ID for scheduled notification
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced INTEGER DEFAULT 0
  );
`,
```

Add migration function:

```typescript
/**
 * Migrate database to add reminder fields
 * Safe to run multiple times (checks if columns exist)
 */
export async function migrateAddReminders(): Promise<void> {
  const db = await getDB();

  try {
    // Check if columns already exist
    const tableInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(calendar_events)'
    );

    const hasReminderMinutes = tableInfo.some(col => col.name === 'reminder_minutes');
    const hasNotificationId = tableInfo.some(col => col.name === 'notification_id');

    if (!hasReminderMinutes) {
      await db.execAsync('ALTER TABLE calendar_events ADD COLUMN reminder_minutes INTEGER');
      console.log('[Migration] Added reminder_minutes column');
    }

    if (!hasNotificationId) {
      await db.execAsync('ALTER TABLE calendar_events ADD COLUMN notification_id TEXT');
      console.log('[Migration] Added notification_id column');
    }

    console.log('[Migration] Reminder fields migration complete');
  } catch (error) {
    console.error('[Migration] Error adding reminder fields:', error);
    throw error;
  }
}
```

### Implementation Details

#### Step 1: Create Notification Service (2 hours)

**File:** `/mnt/d/claude dash/jarvis-native/src/services/notifications.ts` (NEW FILE)

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure how notifications are handled when app is foregrounded
 */
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
  data?: Record<string, any>;
  triggerDate: Date;
}

/**
 * Request notification permissions from user
 * @returns true if granted, false otherwise
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted');
    return false;
  }

  // For Android, create notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('events', {
      name: 'Event Reminders',
      description: 'Notifications for upcoming calendar events',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A90E2',
      sound: 'default',
    });
  }

  return true;
}

/**
 * Schedule a local notification for an event reminder
 * @param params - Notification details
 * @returns Notification ID from Expo (for cancellation)
 */
export async function scheduleEventNotification(
  params: ScheduleNotificationParams
): Promise<string> {
  const hasPermission = await requestPermissions();

  if (!hasPermission) {
    throw new Error('Notification permission not granted');
  }

  // Don't schedule notifications for past times
  if (params.triggerDate <= new Date()) {
    throw new Error('Cannot schedule notification for past time');
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: params.data || {},
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      date: params.triggerDate,
      channelId: Platform.OS === 'android' ? 'events' : undefined,
    },
  });

  console.log('[Notifications] Scheduled notification:', notificationId, 'for', params.triggerDate);
  return notificationId;
}

/**
 * Cancel a scheduled notification
 * @param notificationId - ID returned from scheduleEventNotification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[Notifications] Cancelled notification:', notificationId);
  } catch (error) {
    console.error('[Notifications] Error cancelling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications (useful for debugging)
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] Cancelled all notifications');
}

/**
 * Get all currently scheduled notifications (for debugging)
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Add listener for notification responses (when user taps notification)
 * @param callback - Function to call with notification data
 * @returns Subscription object (call .remove() to unsubscribe)
 */
export function addNotificationResponseListener(
  callback: (data: any) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    callback(data);
  });
}
```

#### Step 2: Update Calendar Database Functions (1.5 hours)

**File:** `/mnt/d/claude dash/jarvis-native/src/database/calendar.ts`

Add notification import at the top:

```typescript
import * as notificationService from '../services/notifications';
```

Update CalendarEvent interface:

```typescript
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  isAllDay: boolean;
  recurring?: string;
  reminderMinutes?: number | null;  // NEW
  notificationId?: string | null;   // NEW
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}
```

Update rowToCalendarEvent function:

```typescript
function rowToCalendarEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    attendees: row.attendees ? JSON.parse(row.attendees) : undefined,
    isAllDay: row.is_all_day === 1,
    recurring: row.recurring,
    reminderMinutes: row.reminder_minutes,  // NEW
    notificationId: row.notification_id,    // NEW
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    synced: row.synced === 1,
  };
}
```

Modify createEvent function:

```typescript
export async function createEvent(
  data: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const id = generateId();
  const now = getCurrentTimestamp();

  // Schedule notification if reminder is set
  let notificationId: string | undefined;

  if (data.reminderMinutes && data.startTime) {
    try {
      const eventStart = new Date(data.startTime);
      const reminderTime = new Date(
        eventStart.getTime() - (data.reminderMinutes * 60 * 1000)
      );

      if (reminderTime > new Date()) {
        notificationId = await notificationService.scheduleEventNotification({
          title: '📅 Event Reminder',
          body: `${data.title} starts in ${data.reminderMinutes} minutes`,
          data: {
            eventId: id,
            type: 'event_reminder',
            eventTitle: data.title,
          },
          triggerDate: reminderTime,
        });
      }
    } catch (error) {
      console.error('[Calendar] Failed to schedule notification:', error);
      // Continue creating event even if notification fails
    }
  }

  await executeWrite(
    `INSERT INTO calendar_events (
      id, title, description, start_time, end_time, location,
      attendees, is_all_day, recurring, reminder_minutes,
      notification_id, created_at, updated_at, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title,
      data.description || null,
      data.startTime,
      data.endTime,
      data.location || null,
      data.attendees ? JSON.stringify(data.attendees) : null,
      data.isAllDay ? 1 : 0,
      data.recurring || null,
      data.reminderMinutes || null,
      notificationId || null,
      now,
      now,
      0,
    ]
  );

  const event = await getEventById(id);
  if (!event) throw new Error('Failed to create event');
  return event;
}
```

Modify updateEvent function:

```typescript
export async function updateEvent(
  id: string,
  data: Partial<CalendarEvent>
): Promise<void> {
  const event = await getEventById(id);
  if (!event) throw new Error(`Event ${id} not found`);

  // Cancel existing notification if present
  if (event.notificationId) {
    try {
      await notificationService.cancelNotification(event.notificationId);
    } catch (error) {
      console.error('[Calendar] Failed to cancel notification:', error);
    }
  }

  // Schedule new notification if reminder is set
  let notificationId: string | undefined;
  const startTime = data.startTime || event.startTime;
  const reminderMinutes = data.reminderMinutes !== undefined
    ? data.reminderMinutes
    : event.reminderMinutes;

  if (reminderMinutes && startTime) {
    try {
      const eventStart = new Date(startTime);
      const reminderTime = new Date(
        eventStart.getTime() - (reminderMinutes * 60 * 1000)
      );

      if (reminderTime > new Date()) {
        notificationId = await notificationService.scheduleEventNotification({
          title: '📅 Event Reminder',
          body: `${data.title || event.title} starts in ${reminderMinutes} minutes`,
          data: {
            eventId: id,
            type: 'event_reminder',
            eventTitle: data.title || event.title,
          },
          triggerDate: reminderTime,
        });
      }
    } catch (error) {
      console.error('[Calendar] Failed to schedule notification:', error);
    }
  }

  // Build update query
  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.startTime !== undefined) {
    updates.push('start_time = ?');
    values.push(data.startTime);
  }
  if (data.endTime !== undefined) {
    updates.push('end_time = ?');
    values.push(data.endTime);
  }
  if (data.location !== undefined) {
    updates.push('location = ?');
    values.push(data.location);
  }
  if (data.reminderMinutes !== undefined) {
    updates.push('reminder_minutes = ?');
    values.push(data.reminderMinutes);
  }
  if (notificationId !== undefined) {
    updates.push('notification_id = ?');
    values.push(notificationId);
  }

  updates.push('updated_at = ?');
  values.push(getCurrentTimestamp());
  values.push(id);

  await executeWrite(
    `UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
}
```

Modify deleteEvent function:

```typescript
export async function deleteEvent(id: string): Promise<void> {
  const event = await getEventById(id);

  if (event?.notificationId) {
    try {
      await notificationService.cancelNotification(event.notificationId);
    } catch (error) {
      console.error('[Calendar] Failed to cancel notification:', error);
    }
  }

  await executeWrite('DELETE FROM calendar_events WHERE id = ?', [id]);
}
```

#### Step 3: Create Reminder Picker Component (1 hour)

**File:** `/mnt/d/claude dash/jarvis-native/src/components/calendar/ReminderPicker.tsx` (NEW FILE)

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ReminderPickerProps {
  value: number | null;
  onChange: (minutes: number | null) => void;
}

interface ReminderOption {
  label: string;
  value: number | null;
  icon: string;
}

const REMINDER_OPTIONS: ReminderOption[] = [
  { label: 'No Reminder', value: null, icon: 'bell-off' },
  { label: '5 minutes before', value: 5, icon: 'bell' },
  { label: '15 minutes before', value: 15, icon: 'bell' },
  { label: '30 minutes before', value: 30, icon: 'bell' },
  { label: '1 hour before', value: 60, icon: 'bell-ring' },
  { label: '2 hours before', value: 120, icon: 'bell-ring' },
  { label: '1 day before', value: 1440, icon: 'bell-alert' },
];

export function ReminderPicker({ value, onChange }: ReminderPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Reminder</Text>

      <View style={styles.optionsContainer}>
        {REMINDER_OPTIONS.map((option) => {
          const isSelected = value === option.value;

          return (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.option,
                isSelected && styles.selectedOption,
              ]}
              onPress={() => onChange(option.value)}
              activeOpacity={0.7}
            >
              <Icon
                name={option.icon}
                size={20}
                color={isSelected ? '#4A90E2' : '#999'}
              />
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.selectedOptionText,
                ]}
              >
                {option.label}
              </Text>
              {isSelected && (
                <Icon name="check-circle" size={20} color="#4A90E2" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {value !== null && (
        <View style={styles.noticeContainer}>
          <Icon name="information" size={16} color="#4A90E2" />
          <Text style={styles.noticeText}>
            You'll receive a notification {getReminderDescription(value)}
          </Text>
        </View>
      )}
    </View>
  );
}

function getReminderDescription(minutes: number): string {
  if (minutes === 5) return '5 minutes before the event';
  if (minutes === 15) return '15 minutes before the event';
  if (minutes === 30) return '30 minutes before the event';
  if (minutes === 60) return '1 hour before the event';
  if (minutes === 120) return '2 hours before the event';
  if (minutes === 1440) return '1 day before the event';
  return `${minutes} minutes before the event`;
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    marginLeft: 12,
  },
  selectedOptionText: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#1976D2',
    marginLeft: 8,
  },
});
```

#### Step 4: Integrate Reminder Picker into Event Form (30 min)

**File:** Event form component (find the calendar event creation/edit form)

Add to imports:

```typescript
import { ReminderPicker } from '../../components/calendar/ReminderPicker';
```

Add to form state:

```typescript
const [reminderMinutes, setReminderMinutes] = useState<number | null>(null);
```

Add to form UI (after time/date pickers):

```typescript
<ReminderPicker
  value={reminderMinutes}
  onChange={setReminderMinutes}
/>
```

Update save function to include reminder:

```typescript
await createEvent({
  // ... other fields
  reminderMinutes: reminderMinutes,
});
```

#### Step 5: Handle Notification Taps (30 min)

**File:** `/mnt/d/claude dash/jarvis-native/App.tsx` (or main app entry point)

Add imports:

```typescript
import { addNotificationResponseListener } from './src/services/notifications';
```

Add useEffect for notification listener:

```typescript
useEffect(() => {
  // Handle notification taps
  const subscription = addNotificationResponseListener((data) => {
    console.log('[App] Notification tapped:', data);

    if (data.type === 'event_reminder' && data.eventId) {
      // Navigate to calendar with highlighted event
      // Implementation depends on your navigation setup
      navigation.navigate('Calendar', {
        highlightEventId: data.eventId,
      });
    }
  });

  return () => subscription.remove();
}, []);
```

#### Step 6: Run Migration (15 min)

**File:** `/mnt/d/claude dash/jarvis-native/src/database/index.ts`

Add migration call in database initialization:

```typescript
import { migrateAddReminders } from './schema';

export async function initializeDatabase(): Promise<void> {
  // ... existing init code ...

  // Run migrations
  await migrateAddReminders();

  console.log('[Database] Initialization complete');
}
```

### Testing Checklist

- [ ] **Permission Handling**
  - [ ] Permission request appears on first reminder set
  - [ ] Handles "Allow" permission grant
  - [ ] Handles "Deny" gracefully (shows error, doesn't crash)
  - [ ] Permissions persist across app restarts

- [ ] **Notification Scheduling**
  - [ ] Notifications schedule for future events
  - [ ] Past events don't attempt to schedule
  - [ ] Notification appears at correct time
  - [ ] Notification content (title, body) is accurate

- [ ] **CRUD Operations**
  - [ ] Creating event with reminder schedules notification
  - [ ] Creating event without reminder doesn't schedule
  - [ ] Editing event reschedules notification
  - [ ] Editing event to remove reminder cancels notification
  - [ ] Deleting event cancels notification

- [ ] **Notification Interaction**
  - [ ] Tapping notification opens app
  - [ ] Tapping notification navigates to correct event
  - [ ] Dismissing notification doesn't crash app

- [ ] **Edge Cases**
  - [ ] Multiple events with reminders work independently
  - [ ] Reminder set for less than current time is handled
  - [ ] App closed: notifications still trigger
  - [ ] App backgrounded: notifications still trigger
  - [ ] Very long reminder (1 day) schedules correctly

- [ ] **Android Specific**
  - [ ] Notification channel created
  - [ ] Notification sound plays
  - [ ] Notification vibrates

- [ ] **iOS Specific**
  - [ ] Notification permissions follow iOS guidelines
  - [ ] Notifications appear in notification center

### Files Modified/Created

```
✅ MODIFY: src/database/schema.ts
   - Add reminder_minutes column to calendar_events
   - Add notification_id column to calendar_events
   - Add migrateAddReminders() function

✅ CREATE: src/services/notifications.ts
   - Notification permission handling
   - Schedule/cancel notification functions
   - Notification response listener

✅ MODIFY: src/database/calendar.ts
   - Update CalendarEvent interface
   - Modify createEvent to schedule notifications
   - Modify updateEvent to reschedule notifications
   - Modify deleteEvent to cancel notifications

✅ CREATE: src/components/calendar/ReminderPicker.tsx
   - Reminder options UI
   - Selection handling

✅ MODIFY: [Event Form Component]
   - Add ReminderPicker component
   - Handle reminder in save logic

✅ MODIFY: App.tsx
   - Add notification tap listener
   - Handle navigation from notifications

✅ MODIFY: src/database/index.ts
   - Call migration on init
```

---

## Feature 2B.4: Tasks - Bulk Actions

**Priority:** TIER 2 - High Impact
**Effort:** 4-6 hours
**Complexity:** Medium
**Dependencies:** Phase 1 Tasks

### Overview

Add multi-select mode to tasks list with bulk operations: complete, delete, change status, and move to project.

### User Stories

- As a user, I want to select multiple tasks at once
- As a user, I want to bulk-complete tasks
- As a user, I want to bulk-delete tasks
- As a user, I want to bulk-change task status
- As a user, I want to bulk-move tasks to a project

### Database Changes

**No schema changes required** - Uses existing `tasks` table.

### Implementation Details

#### Step 1: Add Bulk Selection State (30 min)

**File:** `/mnt/d/claude dash/jarvis-native/src/screens/main/TasksScreen.tsx`

Add state variables:

```typescript
const [bulkSelectMode, setBulkSelectMode] = useState(false);
const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
const [showBulkStatusPicker, setShowBulkStatusPicker] = useState(false);
const [showBulkProjectPicker, setShowBulkProjectPicker] = useState(false);
```

#### Step 2: Implement Bulk Selection Logic (1 hour)

**File:** `/mnt/d/claude dash/jarvis-native/src/screens/main/TasksScreen.tsx`

Add selection functions:

```typescript
/**
 * Toggle bulk select mode on/off
 */
const toggleBulkSelect = () => {
  setBulkSelectMode(!bulkSelectMode);
  setSelectedTaskIds(new Set());
};

/**
 * Toggle selection for a single task
 */
const toggleTaskSelection = (taskId: string) => {
  const newSelected = new Set(selectedTaskIds);
  if (newSelected.has(taskId)) {
    newSelected.delete(taskId);
  } else {
    newSelected.add(taskId);
  }
  setSelectedTaskIds(newSelected);
};

/**
 * Select all visible tasks
 */
const selectAll = () => {
  const allIds = new Set(tasks.map(t => t.id));
  setSelectedTaskIds(allIds);
};

/**
 * Deselect all tasks
 */
const deselectAll = () => {
  setSelectedTaskIds(new Set());
};
```

#### Step 3: Implement Bulk Actions (1.5 hours)

**File:** `/mnt/d/claude dash/jarvis-native/src/screens/main/TasksScreen.tsx`

```typescript
/**
 * Bulk complete selected tasks
 */
const handleBulkComplete = async () => {
  try {
    await Promise.all(
      Array.from(selectedTaskIds).map(id =>
        updateTask(id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        })
      )
    );

    await loadTasks();
    setBulkSelectMode(false);
    setSelectedTaskIds(new Set());

    Alert.alert(
      'Success',
      `Completed ${selectedTaskIds.size} task(s)`,
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('[TasksScreen] Bulk complete error:', error);
    Alert.alert('Error', 'Failed to complete tasks. Please try again.');
  }
};

/**
 * Bulk delete selected tasks with confirmation
 */
const handleBulkDelete = () => {
  Alert.alert(
    'Delete Tasks',
    `Are you sure you want to delete ${selectedTaskIds.size} task(s)? This cannot be undone.`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await Promise.all(
              Array.from(selectedTaskIds).map(id => deleteTask(id))
            );

            await loadTasks();
            setBulkSelectMode(false);
            setSelectedTaskIds(new Set());

            Alert.alert(
              'Success',
              `Deleted ${selectedTaskIds.size} task(s)`,
              [{ text: 'OK' }]
            );
          } catch (error) {
            console.error('[TasksScreen] Bulk delete error:', error);
            Alert.alert('Error', 'Failed to delete tasks. Please try again.');
          }
        },
      },
    ]
  );
};

/**
 * Bulk change status for selected tasks
 */
const handleBulkChangeStatus = async (status: string) => {
  try {
    await Promise.all(
      Array.from(selectedTaskIds).map(id =>
        updateTask(id, { status })
      )
    );

    await loadTasks();
    setBulkSelectMode(false);
    setSelectedTaskIds(new Set());

    Alert.alert(
      'Success',
      `Updated ${selectedTaskIds.size} task(s) to ${status}`,
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('[TasksScreen] Bulk status change error:', error);
    Alert.alert('Error', 'Failed to update task status. Please try again.');
  }
};

/**
 * Bulk move tasks to a project
 */
const handleBulkMoveToProject = async (projectId: string | null) => {
  try {
    await Promise.all(
      Array.from(selectedTaskIds).map(id =>
        updateTask(id, { projectId })
      )
    );

    await loadTasks();
    setBulkSelectMode(false);
    setSelectedTaskIds(new Set());

    const projectName = projectId
      ? projects.find(p => p.id === projectId)?.name || 'project'
      : 'No Project';

    Alert.alert(
      'Success',
      `Moved ${selectedTaskIds.size} task(s) to ${projectName}`,
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('[TasksScreen] Bulk move error:', error);
    Alert.alert('Error', 'Failed to move tasks. Please try again.');
  }
};
```

#### Step 4: Update UI for Bulk Mode (1.5 hours)

**File:** `/mnt/d/claude dash/jarvis-native/src/screens/main/TasksScreen.tsx`

Modify header section:

```typescript
<View style={styles.header}>
  <Text style={styles.headerTitle}>
    {bulkSelectMode ? `${selectedTaskIds.size} Selected` : 'Tasks'}
  </Text>

  <View style={styles.headerActions}>
    {!bulkSelectMode ? (
      <>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={toggleBulkSelect}
        >
          <Icon name="checkbox-multiple-marked-outline" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Icon name="plus" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </>
    ) : (
      <TouchableOpacity
        style={styles.iconButton}
        onPress={toggleBulkSelect}
      >
        <Icon name="close" size={24} color="#333" />
      </TouchableOpacity>
    )}
  </View>
</View>
```

Add bulk action bar:

```typescript
{bulkSelectMode && (
  <View style={styles.bulkActionBar}>
    {/* Selection Actions */}
    <View style={styles.bulkSelectActions}>
      <TouchableOpacity
        onPress={selectAll}
        style={styles.bulkSelectButton}
      >
        <Text style={styles.bulkSelectButtonText}>Select All</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={deselectAll}
        style={styles.bulkSelectButton}
      >
        <Text style={styles.bulkSelectButtonText}>Deselect All</Text>
      </TouchableOpacity>
    </View>

    {/* Bulk Operations */}
    <View style={styles.bulkOperations}>
      <TouchableOpacity
        style={[
          styles.bulkOperationButton,
          selectedTaskIds.size === 0 && styles.bulkOperationButtonDisabled,
        ]}
        onPress={handleBulkComplete}
        disabled={selectedTaskIds.size === 0}
      >
        <Icon
          name="check-circle"
          size={24}
          color={selectedTaskIds.size === 0 ? '#CCC' : '#4CAF50'}
        />
        <Text style={styles.bulkOperationLabel}>Complete</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.bulkOperationButton,
          selectedTaskIds.size === 0 && styles.bulkOperationButtonDisabled,
        ]}
        onPress={() => setShowBulkStatusPicker(true)}
        disabled={selectedTaskIds.size === 0}
      >
        <Icon
          name="format-list-bulleted"
          size={24}
          color={selectedTaskIds.size === 0 ? '#CCC' : '#4A90E2'}
        />
        <Text style={styles.bulkOperationLabel}>Status</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.bulkOperationButton,
          selectedTaskIds.size === 0 && styles.bulkOperationButtonDisabled,
        ]}
        onPress={() => setShowBulkProjectPicker(true)}
        disabled={selectedTaskIds.size === 0}
      >
        <Icon
          name="folder-move"
          size={24}
          color={selectedTaskIds.size === 0 ? '#CCC' : '#FF9800'}
        />
        <Text style={styles.bulkOperationLabel}>Move</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.bulkOperationButton,
          selectedTaskIds.size === 0 && styles.bulkOperationButtonDisabled,
        ]}
        onPress={handleBulkDelete}
        disabled={selectedTaskIds.size === 0}
      >
        <Icon
          name="delete"
          size={24}
          color={selectedTaskIds.size === 0 ? '#CCC' : '#EF5350'}
        />
        <Text style={styles.bulkOperationLabel}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
)}
```

Update task list rendering to handle bulk select:

```typescript
<FlatList
  data={tasks}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <TaskCard
      task={item}
      bulkSelectMode={bulkSelectMode}
      selected={selectedTaskIds.has(item.id)}
      onToggleSelect={() => toggleTaskSelection(item.id)}
      onPress={() => !bulkSelectMode && handleEditTask(item)}
      // ... other props
    />
  )}
/>
```

Add modals for status and project pickers:

```typescript
{/* Status Picker Modal */}
<Modal
  visible={showBulkStatusPicker}
  transparent
  animationType="slide"
  onRequestClose={() => setShowBulkStatusPicker(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.pickerCard}>
      <Text style={styles.pickerTitle}>Change Status</Text>

      {['todo', 'in_progress', 'blocked', 'completed'].map((status) => (
        <TouchableOpacity
          key={status}
          style={styles.pickerOption}
          onPress={() => {
            handleBulkChangeStatus(status);
            setShowBulkStatusPicker(false);
          }}
        >
          <Text style={styles.pickerOptionText}>
            {status.replace('_', ' ').toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.pickerCancelButton}
        onPress={() => setShowBulkStatusPicker(false)}
      >
        <Text style={styles.pickerCancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{/* Project Picker Modal */}
<Modal
  visible={showBulkProjectPicker}
  transparent
  animationType="slide"
  onRequestClose={() => setShowBulkProjectPicker(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.pickerCard}>
      <Text style={styles.pickerTitle}>Move to Project</Text>

      <TouchableOpacity
        style={styles.pickerOption}
        onPress={() => {
          handleBulkMoveToProject(null);
          setShowBulkProjectPicker(false);
        }}
      >
        <Text style={styles.pickerOptionText}>No Project</Text>
      </TouchableOpacity>

      {projects.map((project) => (
        <TouchableOpacity
          key={project.id}
          style={styles.pickerOption}
          onPress={() => {
            handleBulkMoveToProject(project.id);
            setShowBulkProjectPicker(false);
          }}
        >
          <Text style={styles.pickerOptionText}>{project.name}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.pickerCancelButton}
        onPress={() => setShowBulkProjectPicker(false)}
      >
        <Text style={styles.pickerCancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
```

Add styles:

```typescript
bulkActionBar: {
  backgroundColor: '#FFFFFF',
  borderBottomWidth: 1,
  borderBottomColor: '#E0E0E0',
  paddingVertical: 12,
  paddingHorizontal: 16,
},
bulkSelectActions: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginBottom: 12,
},
bulkSelectButton: {
  paddingVertical: 6,
  paddingHorizontal: 16,
  backgroundColor: '#E3F2FD',
  borderRadius: 6,
},
bulkSelectButtonText: {
  fontSize: 14,
  color: '#4A90E2',
  fontWeight: '500',
},
bulkOperations: {
  flexDirection: 'row',
  justifyContent: 'space-around',
},
bulkOperationButton: {
  alignItems: 'center',
  padding: 8,
},
bulkOperationButtonDisabled: {
  opacity: 0.4,
},
bulkOperationLabel: {
  fontSize: 11,
  color: '#666',
  marginTop: 4,
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'flex-end',
},
pickerCard: {
  backgroundColor: '#FFFFFF',
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  padding: 20,
  maxHeight: '70%',
},
pickerTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 16,
  textAlign: 'center',
  color: '#333',
},
pickerOption: {
  paddingVertical: 14,
  borderBottomWidth: 1,
  borderBottomColor: '#F0F0F0',
},
pickerOptionText: {
  fontSize: 16,
  color: '#333',
},
pickerCancelButton: {
  paddingVertical: 14,
  marginTop: 8,
  alignItems: 'center',
},
pickerCancelText: {
  fontSize: 16,
  color: '#EF5350',
  fontWeight: '600',
},
```

#### Step 5: Update TaskCard Component (1 hour)

**File:** `/mnt/d/claude dash/jarvis-native/src/components/tasks/TaskCard.tsx` (if exists, or create inline in TasksScreen)

Add props:

```typescript
interface TaskCardProps {
  task: Task;
  bulkSelectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onPress: () => void;
  // ... other existing props
}
```

Update render logic:

```typescript
export function TaskCard({
  task,
  bulkSelectMode,
  selected,
  onToggleSelect,
  onPress,
  // ... other props
}: TaskCardProps) {
  const handlePress = () => {
    if (bulkSelectMode && onToggleSelect) {
      onToggleSelect();
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.card,
        selected && styles.selectedCard,
      ]}
    >
      {/* Checkbox in bulk mode */}
      {bulkSelectMode && (
        <View style={styles.checkboxContainer}>
          <Icon
            name={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color={selected ? '#4A90E2' : '#CCC'}
          />
        </View>
      )}

      {/* Rest of task card content */}
      <View style={styles.content}>
        <Text style={styles.title}>{task.title}</Text>
        {task.description && (
          <Text style={styles.description}>{task.description}</Text>
        )}
        {/* ... other task details ... */}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedCard: {
    borderColor: '#4A90E2',
    borderWidth: 2,
    backgroundColor: '#E3F2FD',
  },
  checkboxContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  content: {
    marginLeft: bulkSelectMode ? 36 : 0, // Offset for checkbox
  },
  // ... other styles
});
```

### Testing Checklist

- [ ] **Bulk Mode Toggle**
  - [ ] Bulk mode activates when button pressed
  - [ ] Bulk mode deactivates and clears selection
  - [ ] Header updates to show selection count
  - [ ] Action bar appears/disappears correctly

- [ ] **Task Selection**
  - [ ] Single task can be selected/deselected
  - [ ] Multiple tasks can be selected
  - [ ] Select All selects all visible tasks
  - [ ] Deselect All clears selection
  - [ ] Checkboxes display correct state
  - [ ] Selected cards have visual highlight

- [ ] **Bulk Complete**
  - [ ] Completes all selected tasks
  - [ ] Updates task status to 'completed'
  - [ ] Sets completedAt timestamp
  - [ ] Exits bulk mode after operation
  - [ ] Shows success message
  - [ ] Disabled when no tasks selected

- [ ] **Bulk Delete**
  - [ ] Shows confirmation dialog
  - [ ] Deletes all selected tasks on confirm
  - [ ] Cancels on "Cancel"
  - [ ] Exits bulk mode after operation
  - [ ] Shows success message
  - [ ] Tasks removed from list

- [ ] **Bulk Status Change**
  - [ ] Status picker modal appears
  - [ ] All status options available
  - [ ] Updates all selected tasks
  - [ ] Closes modal after selection
  - [ ] Cancels without changes

- [ ] **Bulk Move to Project**
  - [ ] Project picker modal appears
  - [ ] Shows all projects + "No Project" option
  - [ ] Moves all selected tasks
  - [ ] Closes modal after selection
  - [ ] Cancels without changes

- [ ] **Edge Cases**
  - [ ] Empty selection: all bulk actions disabled
  - [ ] Single task selection works
  - [ ] All tasks selected works
  - [ ] Bulk operations with filtered tasks
  - [ ] Error handling for failed operations

- [ ] **UX**
  - [ ] Smooth transitions
  - [ ] Clear visual feedback
  - [ ] Loading states during operations
  - [ ] Error messages user-friendly
  - [ ] Can exit bulk mode anytime

### Files Modified/Created

```
✅ MODIFY: src/screens/main/TasksScreen.tsx
   - Add bulk selection state
   - Add bulk operation functions
   - Add bulk action bar UI
   - Add status/project picker modals
   - Update header for bulk mode
   - Update task list rendering

✅ MODIFY: src/components/tasks/TaskCard.tsx (if exists)
   - Add bulk select props
   - Add checkbox display
   - Add selected state styling
   - Handle bulk vs normal press
```

---

## Implementation Order

Execute features in this order to minimize dependencies and allow incremental testing:

### Week 1 (10-12 hours)

**Day 1-2: Feature 2B.1 - Habits Insights (8-10h)**
- Fully self-contained
- No dependencies on other 2B features
- High user value

### Week 2 (10-14 hours)

**Day 3: Feature 2B.2 - Conflict Detection (4-6h)**
- Self-contained
- Can be tested independently

**Day 4: Feature 2B.4 - Bulk Actions (4-6h)**
- Self-contained
- High productivity impact

**Day 5: Feature 2B.3 - Reminders (4-6h)**
- Requires migration (run carefully)
- Test thoroughly on multiple devices

### Parallel Development (Optional)

If multiple developers are available:
- **Dev 1**: 2B.1 (Habits Insights)
- **Dev 2**: 2B.2 (Conflict Detection) + 2B.4 (Bulk Actions)
- **Dev 3**: 2B.3 (Reminders) - requires most careful testing

---

## Testing Strategy

### Unit Testing

For each feature, create tests covering:

1. **Database Functions**
   ```typescript
   // Example: Test habit insights calculation
   describe('getHabitInsights', () => {
     it('calculates 30-day completion rate correctly', async () => {
       // Setup: Create habit with known completion data
       // Execute: Call getHabitInsights()
       // Assert: Check completion rate matches expected
     });
   });
   ```

2. **Helper Functions**
   - Time-of-day analysis
   - Weekday pattern calculation
   - Conflict detection logic
   - Overlap duration calculation

### Integration Testing

1. **End-to-End User Flows**
   - Complete habit tracking → View insights → Verify data
   - Create overlapping events → Verify conflict warning
   - Set event reminder → Verify notification triggers
   - Select multiple tasks → Bulk complete → Verify updates

2. **Cross-Feature Testing**
   - Dashboard widgets reflect bulk task changes
   - Calendar updates after resolving conflicts
   - Habit insights update after new completions

### Manual Testing Checklist

Before marking any feature as complete:

- [ ] Test on iOS device/simulator
- [ ] Test on Android device/emulator
- [ ] Test with empty data (new user)
- [ ] Test with full data (heavy user)
- [ ] Test offline functionality
- [ ] Test error scenarios
- [ ] Test performance with 100+ items
- [ ] Verify UI on different screen sizes
- [ ] Test accessibility (screen readers)
- [ ] Test with dark mode (if supported)

### Performance Testing

Monitor for:
- Habit insights calculation time (should be < 500ms)
- Conflict detection on large calendars (should be < 200ms)
- Bulk operations on 50+ tasks (should complete < 2s)
- No memory leaks during repeated operations

---

## Rollback Plan

If a feature causes critical issues:

### Feature 2B.1 (Habits Insights)
**Rollback Steps:**
1. Remove `HabitInsightsCard` component
2. Remove "View Insights" button from HabitsScreen
3. Remove `getHabitInsights()` function (keep interface for future)

**Impact:** No data loss, feature simply unavailable

### Feature 2B.2 (Conflict Detection)
**Rollback Steps:**
1. Remove conflict check from event save handler
2. Remove `ConflictWarning` component
3. Keep `detectConflicts()` function (harmless if not called)

**Impact:** No data loss, events save without warnings

### Feature 2B.3 (Reminders)
**Rollback Steps:**
1. **DO NOT** rollback database migration (columns are nullable, safe to keep)
2. Remove `ReminderPicker` from event form
3. Stop calling notification service in create/update/delete
4. Cancel all scheduled notifications: `cancelAllNotifications()`

**Impact:** Existing reminder data preserved but ignored

### Feature 2B.4 (Bulk Actions)
**Rollback Steps:**
1. Remove bulk action bar UI
2. Remove bulk mode state from TasksScreen
3. Restore normal TaskCard rendering

**Impact:** No data loss, bulk operations simply unavailable

---

## Additional Notes

### Database Migrations

Only Feature 2B.3 requires schema changes. Migration is backward-compatible:
- New columns are nullable
- Existing queries unaffected
- Safe to rollout incrementally

### Notification Permissions

Best practices:
1. Request permissions when user first sets a reminder (contextual)
2. Handle denial gracefully (show explanatory message)
3. Provide deep link to app settings if user wants to enable later
4. Test notification delivery on both iOS and Android thoroughly

### Performance Considerations

- **Habit Insights**: Cache results for 1 hour to avoid recalculation
- **Conflict Detection**: Index calendar_events on start_time/end_time for fast queries
- **Bulk Actions**: Use transactions to ensure atomicity (all succeed or all fail)

### Accessibility

Ensure all interactive elements have:
- Proper accessibility labels
- Keyboard navigation support (if web)
- Screen reader compatibility
- Sufficient color contrast (WCAG AA)

---

## Success Metrics

Track these metrics to measure feature adoption:

### Feature 2B.1 (Habits Insights)
- % of users who view insights
- Average time spent on insights screen
- Most viewed insight (time-of-day vs weekday pattern)

### Feature 2B.2 (Conflict Detection)
- Number of conflicts detected per week
- % of conflicts that users proceed anyway
- Reduction in double-booked events

### Feature 2B.3 (Reminders)
- % of events with reminders set
- Most popular reminder time (5min, 15min, etc.)
- Notification open rate

### Feature 2B.4 (Bulk Actions)
- % of users who use bulk mode
- Average number of tasks selected per bulk operation
- Most used bulk action (complete, delete, move)

---

## Support & Troubleshooting

### Common Issues

**Issue:** Habit insights show 0% despite completions
**Solution:** Check that habit_logs have `completed = 1` and valid dates

**Issue:** Conflict detection not working
**Solution:** Verify event times are ISO strings, check SQL query logic

**Issue:** Notifications not appearing
**Solution:** Check permissions, verify trigger time is future, check device notification settings

**Issue:** Bulk actions timing out
**Solution:** Reduce batch size, add progress indicator for large selections

### Debug Commands

```typescript
// Check scheduled notifications
import { getAllScheduledNotifications } from './src/services/notifications';
const notifications = await getAllScheduledNotifications();
console.log('Scheduled notifications:', notifications);

// Check habit insights data
import { getHabitInsights } from './src/database/habits';
const insights = await getHabitInsights('habit-id');
console.log('Insights:', JSON.stringify(insights, null, 2));

// Check for conflicts
import { detectConflicts } from './src/database/calendar';
const conflicts = await detectConflicts(startTime, endTime);
console.log('Conflicts:', conflicts);
```

---

## Conclusion

Phase 2B adds powerful productivity and analytics features to the Jarvis Native Life Dashboard. Each feature is designed to be:

- **Independent**: Can be developed and tested separately
- **Reversible**: Clear rollback plan if issues arise
- **Performant**: Optimized for offline-first operation
- **User-Friendly**: Intuitive UI with proper error handling

**Total Estimated Effort:** 20-26 hours
**Risk Level:** Low-Medium (only reminders require schema changes)
**User Impact:** High (significant productivity and insight gains)

Proceed with confidence following this implementation guide. Test thoroughly at each step and don't hesitate to roll back if any feature causes issues. Good luck!

---

**Document Version:** 1.0
**Last Updated:** 2025-12-14
**Author:** Claude Code (Life-Dashboard Architect)
**Status:** Ready for Implementation
