# Screen Completeness Report
**Goal:** Identify what feels unfinished and how to make each screen production-ready.

## Dashboard (src/screens/main/DashboardScreen.tsx)
**State:** Partially complete
- **What’s good:** Greeting/date, metrics grid, quick start card, quick capture tiles.
- **Feels skeletal:**
  - Metrics are static placeholders (no sparkline/history, no drill-in).
  - Quick capture doesn’t save anywhere (no persistence/feedback).
  - No personalization or recommendations.
- **Recommendations:**
  - Persist quick captures (ideas/study/cash) to local DB with toasts and undo.
  - Add trend indicators/sparklines on metrics; tap to open detail screens.
  - Surface today’s top tasks/habits/events with deep links.
  - Empty/zero states for metrics with guidance.

## Tasks (src/screens/main/TasksScreen.tsx)
**State:** Functional but missing UX depth
- **What’s good:** CRUD, filtering, status change, multiple view modes declared.
- **Feels skeletal:**
  - Kanban/matrix not implemented (despite view modes).
  - No bulk actions; no sorting by priority/due.
  - Priority colors hardcoded; no chips/badges for tags/projects.
- **Recommendations:**
  - Implement Kanban and Priority Matrix views or hide until ready.
  - Add sorting (priority/due/status) and saved filters.
  - Bulk complete/delete; swipe actions in list.
  - Show priority/tag chips on cards; overdue highlighting.
  - Toasts/optimistic updates for edits.

## Habits (src/screens/main/HabitsScreen.tsx)
**State:** Unknown completeness (review lightly assumed)
- **Likely gaps:**
  - Streak visualization/gamification limited.
  - Quick check-in UX (swipe to complete) may be missing.
  - Insights (best time, completion rate) not surfaced.
- **Recommendations:**
  - Add streak cards, milestones, and confetti on streak wins.
  - One-tap/one-swipe check-ins with haptics and undo.
  - Show 30-day completion rate and time-of-day insights.

## Calendar (src/screens/main/CalendarScreen.tsx)
**State:** Recently improved offline CRUD, still minimal views
- **What’s good:** Offline SQLite, create/edit/delete modal, better cards, filters.
- **Feels skeletal:**
  - Only agenda-style list; no day/week/month views.
  - No time-block visualization/conflict detection.
  - No reminders/notifications or external sync.
- **Recommendations:**
  - Add day timeline and week grid views; keep agenda as default.
  - Conflict highlighting; travel/prep time placeholders.
  - Hooks for reminders (even if stubbed) and future sync toggle.
  - Calendar-level empty/loading/error states already present—keep consistent.

## Finance (src/screens/main/FinanceScreen.tsx)
**State:** Likely basic list (assumed)
- **Feels skeletal:**
  - No dashboards (income/expense/savings), no category breakdowns.
  - No budgets or alerts.
- **Recommendations:**
  - Add top summary cards (Income, Expenses, Savings) with deltas vs prior period.
  - Category spend chart, top categories list.
  - Budget progress bars and near-limit warnings.
  - Transaction quick add and filters (date/category/type).

## AI Chat (src/screens/main/AIChatScreen.tsx)
**State:** Likely raw chat UI
- **Feels skeletal:**
  - Missing message grouping, timestamps, delivery states.
  - No input affordances (quick prompts, attachments) depending on feature scope.
- **Recommendations:**
  - Add message bubbles with timestamps/status; loading placeholder for AI replies.
  - Quick prompts/shortcuts; error + retry UI.
  - Persist conversation history locally.

## Settings (src/screens/main/SettingsScreen.tsx)
**State:** Solid base with stats/export/clear/privacy
- **Feels skeletal:**
  - No theme selector despite theme system.
  - Export only copies to clipboard; destructive action proximity.
  - Notifications toggle not tied to permissions.
- **Recommendations:**
  - Add theme selector (Default/Whoop/Light) in Appearance.
  - Export: add Share/Save options; show file size/record count.
  - Move “Clear All Data” to bottom with double-confirm (e.g., type DELETE).
  - Hook notifications to actual permission state.

## Cross-Screen Priorities
1. **Finish declared features or hide them** (Kanban/Matrix, additional calendar views).
2. **Persistence & feedback**: Every action should store to DB and show success/error/undo toasts.
3. **Empty/loading/error states**: Ensure consistent components across all screens.
4. **Theme usage**: Remove any remaining hardcoded colors; use tokens.
5. **Navigation polish**: Add deep links from Dashboard to detail screens; quick actions everywhere.

## Suggested Sequence (to feel “complete” fast)
1) Implement/hide incomplete modes: Kanban/Matrix; add Calendar day/week view.
2) Add persistence + toasts to Dashboard quick capture.
3) Theme selector in Settings; safer destructive flows; better export.
4) Habit streaks + quick check-ins; Finance summary cards.
5) Add charts/sparklines and drill-ins for Dashboard/Finance.
