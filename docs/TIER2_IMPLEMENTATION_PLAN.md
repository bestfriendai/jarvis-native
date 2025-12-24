# TIER 2 Implementation Plan
**Jarvis Native - Phase 2 Feature Roadmap**
**Date:** December 24, 2025
**Planner:** Life-Dashboard Architect

---

## Executive Summary

**Context:** Phase 1 (Global Search, Recurring Tasks, Projects, Budgets, Charts) is 100% complete. App has 183 TypeScript files, ~22k LOC, all validation passing (type-check, lint, tests).

**Status Assessment:** Reviewed codebase to identify which TIER 2 features are partially implemented vs. need full implementation.

**Prioritization Strategy:** Focus on features that add the most user value with reasonable effort. Prioritize cross-feature intelligence and UX polish over isolated features.

---

## Feature Status Analysis

### Already Implemented/Partially Done

1. **Dashboard "Today's Focus" Section** - PARTIALLY IMPLEMENTED
   - `TodaysFocusCard.tsx` exists with hero focus design
   - `dashboard.ts` has `getTodaysFocus()` function
   - Aggregates tasks, habits, events for today
   - Status: 80% complete, needs minor enhancements

2. **Tasks - Sorting and Advanced Filters** - IMPLEMENTED
   - `taskSorting.ts` has intelligent sorting (priority, due date, status, created)
   - `taskFiltering.ts` has comprehensive filters (search, priority, status, projects, tags, date range)
   - `taskFilterStore.ts` has persistent filter state with AsyncStorage
   - Status: 95% complete, may need UI refinements

3. **Tasks - Bulk Actions** - IMPLEMENTED
   - `BulkActionBar.tsx` exists with complete/delete/change status/priority/project
   - `SwipeableTaskItem.tsx` for quick actions
   - Multi-select mode in TasksScreen
   - Status: 100% complete

4. **Habits - Insights (Best Time of Day)** - IMPLEMENTED
   - `habitAnalytics.ts` has `analyzeBestTime()` function
   - `analyzeWeeklyPattern()` for best/worst days
   - `generateCompletionTrend()` for sparklines
   - Status: 90% complete, needs UI integration

5. **Calendar - Conflict Detection** - IMPLEMENTED
   - `calendar.ts` has `detectConflicts()` function with overlap calculation
   - `EventConflict` type with overlap minutes and timestamps
   - Status: 80% complete, needs UI warnings

6. **Finance - Budgets and Spending Limits** - IMPLEMENTED
   - Complete budgets module (Phase 1 Task 4)
   - Database, CRUD, UI components, progress tracking
   - Status: 100% complete

### Not Implemented

7. **Tasks - Priority Visual System (Colored Borders)** - NOT IMPLEMENTED
   - Priority colors exist in `priorities.ts` (urgent: red, high: orange, medium: blue, low: gray)
   - `TodaysFocusCard` has left border with priority color
   - TasksScreen likely doesn't have priority borders on task cards
   - Status: 30% complete, needs consistent implementation

8. **Calendar - Reminders/Notifications** - PARTIALLY IMPLEMENTED
   - Database schema has `reminder_minutes` and `notification_id` columns
   - `notificationService` exists for scheduling
   - Settings has notification toggle (non-functional per audit)
   - Status: 40% complete, needs permission handling and UI

9. **AI Chat - Conversation History Persistence** - NOT IMPLEMENTED
   - AIChatScreen has `messages` state but no persistence
   - Quick prompts exist but no conversation history
   - Status: 10% complete, needs database schema and persistence

10. **AI Chat - Quick Prompt Templates** - IMPLEMENTED
    - `QUICK_PROMPTS` array exists in AIChatScreen (6 prompts)
    - Status: 100% complete

11. **Cross-Feature Deep Links** - NOT IMPLEMENTED
    - No deep linking infrastructure detected
    - Status: 0% complete

---

## Prioritized Implementation Plan

### Priority 1: High Impact, Low Effort (Do First)

#### **Feature 1: Tasks - Priority Visual System (Colored Borders)**
**Impact:** High - Instant visual hierarchy, reduces cognitive load
**Effort:** Low (2-4 hours)
**Status:** 30% complete

**Why This First:**
- Colors already defined in `priorities.ts`
- `TodaysFocusCard` already shows pattern
- Simple styling change to TaskCard components
- Immediate visual improvement, no backend changes

**Implementation:**
1. **Locate TaskCard Component:**
   - Find main task card component(s) used in TasksScreen
   - Likely in `src/components/tasks/` or `src/components/`

2. **Add Priority Border:**
   - Import `getPriorityColor` from `priorities.ts`
   - Add `borderLeftWidth: 3` and `borderLeftColor: getPriorityColor(task.priority)`
   - Ensure works in all view modes (List, Kanban if implemented)

3. **Test Cases:**
   - Verify all 4 priority levels show correct colors
   - Check accessibility (sufficient contrast)
   - Test on both light and dark themes

**Files to Modify:**
- TaskCard component (find via glob)
- Possibly `SwipeableTaskItem.tsx` styling

**Success Criteria:**
- All tasks show left border with priority color
- Colors match `PRIORITY_COLORS` constants
- No performance degradation
- Passes type-check and lint

---

#### **Feature 2: Habits - Insights UI Integration**
**Impact:** High - Provides actionable insights, unique value prop
**Effort:** Low-Medium (4-6 hours)
**Status:** 90% complete (logic done, needs UI)

**Why This Second:**
- Analytics functions already implemented
- Unique feature that differentiates from competitors
- Helps users optimize habit completion
- Leverages existing chart infrastructure

**Implementation:**
1. **Create HabitInsightsCard Component:**
   - Location: `src/components/habits/HabitInsightsCard.tsx`
   - Props: `habitId`, `completionDates`, `completionTimes`
   - Use `analyzeBestTime()` and `analyzeWeeklyPattern()`

2. **Display Best Time Analysis:**
   - Show time of day icon (🌅 morning, ☀️ afternoon, 🌆 evening, 🌙 night)
   - Display hour range (e.g., "6-12am")
   - Show percentage (e.g., "75% of completions")
   - Suggestion text: "You're most successful in the morning!"

3. **Display Weekly Pattern:**
   - Show best day (e.g., "Monday is your strongest day")
   - Show worst day (e.g., "Consider extra reminders on Fridays")
   - Optional: Small bar chart of day completion rates

4. **Integration Points:**
   - Add insights card to individual habit detail view
   - Add summary insights to HabitsScreen overview
   - Cache calculations to avoid recomputing on every render

**Files to Create:**
- `src/components/habits/HabitInsightsCard.tsx`

**Files to Modify:**
- `src/screens/main/HabitsScreen.tsx` (add insights)
- Habit detail view component (if exists)

**Success Criteria:**
- Insights display correctly for habits with 7+ completions
- Handles edge cases (new habits, sparse data)
- Updates when new completions added
- Passes validation

---

#### **Feature 3: Calendar - Conflict Detection UI**
**Impact:** High - Prevents double-booking, critical for productivity
**Effort:** Low-Medium (4-6 hours)
**Status:** 80% complete (backend done, needs UI)

**Why This Third:**
- Backend logic already implemented
- High-value feature for calendar users
- Simple UI additions to existing flows

**Implementation:**
1. **Event Creation/Edit Warning:**
   - Call `detectConflicts()` before saving event
   - If conflicts detected, show warning modal
   - List conflicting events with overlap time
   - Allow user to proceed or cancel

2. **Conflict Warning Component:**
   - Location: `src/components/calendar/ConflictWarning.tsx`
   - Props: `conflicts: EventConflict[]`, `onProceed`, `onCancel`
   - Show list of conflicts with:
     - Event title
     - Overlap duration (e.g., "Overlaps 30 min")
     - Time range of overlap

3. **Visual Indicators:**
   - Add warning icon to events with conflicts
   - Show orange/red border on conflicting events
   - Add filter to show "Conflicts" in calendar view

4. **Integration Points:**
   - Event creation modal (check before save)
   - Event edit modal (check when times change)
   - Calendar day/week view (visual indicators)

**Files to Create:**
- `src/components/calendar/ConflictWarning.tsx`

**Files to Modify:**
- Event form modal component
- Calendar event card component
- `src/screens/main/CalendarScreen.tsx`

**Success Criteria:**
- Conflicts detected when creating/editing events
- User warned before saving conflicting event
- Visual indicators on conflicting events
- No false positives (all-day events, etc.)
- Passes validation

---

### Priority 2: Medium Impact, Medium Effort (Do Next)

#### **Feature 4: Calendar - Reminders/Notifications**
**Impact:** Medium-High - Critical for event utility
**Effort:** Medium (6-8 hours)
**Status:** 40% complete

**Why This Fourth:**
- Database schema already supports it
- Notification service exists
- Completes calendar feature set
- Requires permission handling (important pattern for app)

**Implementation:**
1. **Permission Flow:**
   - Check notification permissions on app launch
   - Request permissions when user enables reminders
   - Handle denied state gracefully
   - Link to system settings if blocked

2. **Reminder Settings:**
   - Add reminder picker to event form
   - Options: 5min, 15min, 30min, 1hr, 1day before
   - Default: 15min for new events
   - Allow "No reminder" option

3. **Notification Scheduling:**
   - Schedule notification when event created
   - Update notification when event edited
   - Cancel notification when event deleted
   - Handle recurring events (schedule next instance)

4. **Notification Content:**
   - Title: Event title
   - Body: Time and location (if set)
   - Actions: "View" (opens event), "Snooze" (reschedule)

5. **Settings Integration:**
   - Make notification toggle functional
   - Show permission status
   - Add "Manage Notifications" link to system settings

**Files to Modify:**
- `src/screens/settings/SettingsScreen.tsx`
- Event form modal component
- `src/services/notifications.ts` (enhance)
- `src/database/calendar.ts` (ensure notification_id persisted)

**Success Criteria:**
- Permissions requested and handled correctly
- Notifications scheduled for events with reminders
- Notifications appear at correct time
- Settings toggle reflects actual permission state
- Recurring events get proper notification scheduling
- Passes validation

---

#### **Feature 5: AI Chat - Conversation History Persistence**
**Impact:** Medium - Improves AI chat utility
**Effort:** Medium (6-8 hours)
**Status:** 10% complete

**Why This Fifth:**
- Adds long-term value to AI chat
- Allows context across sessions
- Relatively isolated feature (low risk)

**Implementation:**
1. **Database Schema:**
   - Create `ai_conversations` table
   - Columns: id, title, created_at, updated_at
   - Create `ai_messages` table
   - Columns: id, conversation_id, role, content, timestamp, synced

2. **Database Operations:**
   - Location: `src/database/aiChat.ts`
   - Functions:
     - `createConversation(title?: string)`
     - `getConversations()`
     - `getConversationMessages(conversationId)`
     - `addMessage(conversationId, message)`
     - `deleteConversation(conversationId)`
     - `updateConversationTitle(conversationId, title)`

3. **UI Updates:**
   - Add "Conversations" list view to AIChatScreen
   - Show conversation history sidebar/modal
   - Allow starting new conversation
   - Auto-save messages as they're sent
   - Generate conversation titles from first message

4. **State Management:**
   - Track current conversation ID
   - Load messages on conversation switch
   - Clear messages when starting new conversation
   - Persist current conversation to AsyncStorage

5. **UX Enhancements:**
   - Show timestamp on messages
   - Add "New Chat" button
   - Add "Conversation History" button
   - Swipe to delete conversations
   - Edit conversation titles

**Files to Create:**
- `src/database/aiChat.ts`
- `src/components/ai/ConversationList.tsx`
- Database migration for ai_conversations and ai_messages tables

**Files to Modify:**
- `src/screens/main/AIChatScreen.tsx`
- `src/database/schema.ts` (add tables)
- `src/database/index.ts` (add migration)

**Success Criteria:**
- Messages persist across app restarts
- Can create/view/delete conversations
- Current conversation state maintained
- Old conversations loadable
- No data loss on app crash
- Passes validation

---

### Priority 3: Lower Impact or High Effort (Do Last)

#### **Feature 6: Cross-Feature Deep Links**
**Impact:** Medium - Nice-to-have, improves navigation
**Effort:** High (10-12 hours)
**Status:** 0% complete

**Why This Last:**
- Requires significant infrastructure
- Lower immediate user value
- Can be added incrementally later
- Other features provide more immediate value

**Implementation (High-Level):**
1. **Deep Linking Setup:**
   - Configure URL schemes (jarvis://...)
   - Set up React Navigation deep linking
   - Define URL patterns for each screen

2. **Link Patterns:**
   - `jarvis://task/{taskId}` - Open task detail
   - `jarvis://habit/{habitId}` - Open habit detail
   - `jarvis://event/{eventId}` - Open event detail
   - `jarvis://project/{projectId}` - Open project view
   - `jarvis://budget/{budgetId}` - Open budget detail

3. **Link Generation:**
   - Add "Copy Link" to all entity context menus
   - Add "Share" functionality with deep links
   - Use in notifications (tap to open)

4. **Link Handling:**
   - Parse URLs on app launch/foreground
   - Navigate to correct screen with params
   - Handle invalid/deleted entities gracefully

**Files to Create:**
- `src/navigation/linking.ts` (deep link config)
- `src/utils/deepLinks.ts` (link generation helpers)

**Files to Modify:**
- `src/navigation/RootNavigator.tsx`
- All entity detail screens (add share button)
- Context menus across app

**Success Criteria:**
- Deep links work from external sources
- Links navigate to correct screen
- Handles invalid links gracefully
- Works with notifications
- Passes validation

**Note:** This feature is lower priority but has high long-term value for cross-app integration and sharing.

---

## Implementation Order Summary

### Sprint 1 (Week 1): Visual Polish & Quick Wins - COMPLETED
1. **Tasks - Priority Visual System** - COMPLETE (Already implemented)
   - Colored left borders on TaskCard using `getPriorityColor()`
   - Colors: urgent=red, high=orange, medium=blue, low=gray
   - Overdue tasks show error color (red) to prioritize urgency
   - Location: `/src/screens/main/TasksScreen.tsx` lines 916-921, 954

2. **Habits - Insights UI Integration** - COMPLETE (Already implemented)
   - HabitInsightsCard component fully implemented
   - Uses `analyzeBestTime()` and `analyzeWeeklyPattern()` from habitAnalytics.ts
   - Shows best time of day, weekly patterns, completion trends
   - Location: `/src/components/habits/HabitInsightsCard.tsx`
   - Integrated in: `/src/screens/main/HabitsScreen.tsx` line 627

3. **Calendar - Conflict Detection UI** - COMPLETE (Already implemented)
   - ConflictWarning component fully implemented
   - Calls `detectConflicts()` before saving events
   - Shows warning modal listing conflicts with overlap details
   - Visual indicators on conflicting events
   - Location: `/src/components/calendar/ConflictWarning.tsx`
   - Integrated in: `/src/screens/main/CalendarScreen.tsx` lines 910-922

**Status:** Sprint 1 features were already implemented during Phase 1
**Validation:** TypeScript and ESLint pass with no new errors
**Completed:** December 24, 2025

### Sprint 2 (Week 2): Core Functionality Completions
4. **Calendar - Reminders/Notifications** (6-8 hours)
5. **AI Chat - Conversation History Persistence** (6-8 hours)

**Total Effort:** 12-16 hours
**Impact:** Completes core features, adds long-term utility

### Sprint 3: Advanced Features - COMPLETED
6. **Cross-Feature Deep Links** - COMPLETE (Implemented December 24, 2025)
   - Deep linking infrastructure with jarvis:// URL scheme
   - Linking configuration in `src/navigation/linking.ts`
   - Deep link generation utilities in `src/utils/deepLinks.ts`
   - ShareButton component for copy-to-clipboard functionality
   - Integration in TasksScreen, HabitsScreen, CalendarScreen, ProjectsScreen
   - Link patterns: jarvis://tasks/task/{id}, jarvis://habits/habit/{id}, etc.
   - Location: Multiple files (see commit 142200f)

**Total Effort:** 10-12 hours
**Impact:** Enables sharing and direct navigation to specific entities
**Status:** Sprint 3 complete
**Validation:** TypeScript and ESLint pass, all tests pass
**Completed:** December 24, 2025

---

## Quality Assurance Checklist

For each feature:
- [ ] TypeScript compilation passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Unit tests pass (if applicable)
- [ ] Manual testing on iOS and Android
- [ ] Accessibility verified (screen reader, color contrast)
- [ ] Error handling tested (offline, invalid data, etc.)
- [ ] Performance profiled (no jank, memory leaks)
- [ ] Documentation updated (if needed)

---

## Risk Assessment

### Low Risk
- Priority visual system (styling only)
- Habit insights UI (leverages existing functions)
- Conflict detection UI (backend ready)

### Medium Risk
- Notifications (permission handling, OS differences)
- Conversation history (database migrations, state management)

### High Risk
- Deep links (complex navigation logic, testing matrix)

---

## Success Metrics

### User Experience
- Reduced time to identify important tasks (priority colors)
- Increased habit completion rates (insights)
- Fewer calendar conflicts (detection warnings)
- Higher engagement with AI chat (history)

### Technical Quality
- Zero TypeScript errors
- Zero lint warnings
- 100% test pass rate
- No performance regressions

### Completion Criteria
- All Priority 1 features shipped and stable
- All Priority 2 features shipped and stable
- Priority 3 feature deferred or implemented based on user feedback

---

## Next Steps

1. **Sprint 1:** COMPLETED - All three features already implemented and validated
2. **Sprint 2 (Next):** Implement Calendar Reminders/Notifications and AI Chat History
3. **Sprint 3:** COMPLETED - Cross-feature deep linking implemented December 24, 2025

**Resume development from Sprint 2, Feature 4: Calendar - Reminders/Notifications**

---

## Appendix: Features Already Complete

These TIER 2 features are already done and don't need implementation:
- Dashboard - Today's Focus (minor enhancements only)
- Tasks - Sorting and Advanced Filters (UI refinements only)
- Tasks - Bulk Actions (complete)
- Finance - Budgets and Spending Limits (complete)
- AI Chat - Quick Prompt Templates (complete)

Focus effort on the 6 prioritized features above for maximum impact.
