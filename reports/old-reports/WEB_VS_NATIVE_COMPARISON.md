# Web App vs Native App Comparison
**Comparing:** claude-dash (Next.js web) vs jarvis-native (React Native mobile)  
**Date:** December 13, 2025  
**Analyst:** Madam Claudia

---

## Executive Summary

**Web App (claude-dash):** Full-featured productivity cockpit with 20+ modules, PostgreSQL backend, NextAuth, API routes, server-side rendering, and extensive integrations (Google Calendar, Plaid, AI).

**Native App (jarvis-native):** Streamlined offline-first mobile app with 6 core modules, SQLite local storage, no backend dependency, focused on essential daily productivity features.

**Key Difference:** Web app is a comprehensive life operating system with deep integrations. Native app is a focused, portable, offline-capable subset optimized for mobile use.

---

## Architecture Comparison

### Web App (claude-dash)
```
Stack:
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Database: PostgreSQL (Prisma ORM)
- Auth: NextAuth.js (magic-link email)
- Styling: Tailwind CSS
- State: React Query
- Charts: Recharts
- Testing: Vitest + Playwright
- Monitoring: Sentry

Architecture:
- Server-side rendering (SSR)
- API routes (/app/api/*)
- Database-backed (PostgreSQL)
- Email authentication
- Google Calendar sync
- Plaid financial integration
- AI chat with context
- Keyboard shortcuts (S, M, N, J, D)
```

### Native App (jarvis-native)
```
Stack:
- Framework: React Native (Expo)
- Language: TypeScript
- Database: SQLite (local)
- Auth: JWT (local storage)
- Styling: React Native Paper + custom theme
- State: React Query
- Charts: None yet
- Testing: None yet
- Monitoring: None

Architecture:
- Client-side only (no server)
- Local database (SQLite)
- Offline-first (no network required)
- Simple auth (email/password JWT)
- No external integrations
- AI chat (API calls only)
- Touch-optimized UI
```

---

## Feature Comparison Matrix

| Feature | Web App | Native App | Status |
|---------|---------|------------|--------|
| **Core Features** |
| Dashboard | ✅ Full metrics, trends, sparklines | ✅ Basic metrics, quick capture | Native: Simplified |
| Tasks | ✅ Full CRUD, projects, tags, filters | ✅ CRUD, list/kanban/matrix views | Native: Core complete |
| Habits | ✅ Full tracking, cadence, streaks | ✅ Tracking, streaks, heatmap | Native: Core complete |
| Calendar | ✅ Full calendar, Google sync, enrichment | ✅ Agenda/day/week views, local only | Native: No sync |
| Finance | ✅ Plaid integration, budgets, trends | ✅ Manual entry, basic dashboard | Native: No Plaid |
| AI Chat | ✅ Contextual, history, integrations | ✅ Basic chat, no context | Native: Simplified |
| **Advanced Features** |
| Focus Blocks | ✅ Timeboxing, deep work sessions | ❌ Not implemented | Missing |
| Pomodoro Timer | ✅ Timer with calendar sync | ❌ Not implemented | Missing |
| Journal | ✅ AM/PM, sentiment analysis | ❌ Not implemented | Missing |
| OKRs | ✅ Quarterly objectives, key results | ❌ Not implemented | Missing |
| Reviews | ✅ Weekly/monthly automated reviews | ❌ Not implemented | Missing |
| Projects | ✅ Full project management | ❌ Not implemented | Missing |
| Knowledge Base | ✅ Notes, wiki, search | ❌ Not implemented | Missing |
| Wellbeing | ✅ Mood, sleep, exercise tracking | ❌ Not implemented | Missing |
| Social | ✅ Social goals, connections | ❌ Not implemented | Missing |
| Automation | ✅ Workflow automation, triggers | ❌ Not implemented | Missing |
| **Integrations** |
| Google Calendar | ✅ Bidirectional sync | ❌ Not implemented | Missing |
| Plaid (Banking) | ✅ Account linking, transactions | ❌ Not implemented | Missing |
| Email (SMTP) | ✅ Magic-link auth, notifications | ❌ Not implemented | Missing |
| AI Context | ✅ Full app context, smart suggestions | ❌ Basic chat only | Missing |
| **Data & Sync** |
| Database | PostgreSQL (server) | SQLite (local) | Different |
| Backup | Server-side (PostgreSQL backups) | Manual export to JSON | Native: Manual |
| Multi-device | ✅ Synced via server | ❌ Single device only | Missing |
| Offline | ⚠️ Limited (needs server) | ✅ Fully offline | Native: Better |
| **Auth & Security** |
| Authentication | NextAuth (magic-link) | JWT (email/password) | Different |
| Multi-user | ✅ Yes (server-based) | ❌ Single user per device | Native: Single user |
| Password | ❌ No password (magic-link) | ✅ Password required | Different |
| Session | Server-side sessions | Local JWT token | Different |
| **UI/UX** |
| Keyboard Shortcuts | ✅ S, M, N, J, D | ❌ Not applicable (mobile) | N/A |
| Dark Mode | ✅ Default | ✅ Default + Light mode | Native: More options |
| Responsive | ✅ Desktop-optimized | ✅ Mobile-optimized | Different targets |
| Charts | ✅ Recharts (trends, sparklines) | ❌ Not implemented | Missing |
| Notifications | ✅ Browser + email | ✅ Local push (basic) | Native: Simpler |

---

## Detailed Feature Analysis

### 1. Dashboard

**Web App:**
- Aggregates last 30 days of data
- Shows starts, study minutes, cash snapshots
- Trend charts with sparklines
- Latency medians
- Quick actions: Start 10s, Start 1m, New Idea, Journal
- Keyboard shortcuts
- Real-time metrics updates

**Native App:**
- Shows today's metrics only
- Starts, study minutes, cash on hand
- Quick capture: Idea, Study, Cash
- No charts or trends
- Touch-optimized cards
- Snackbar feedback with undo

**Gap:** Native missing trends, charts, historical data, keyboard shortcuts.

---

### 2. Tasks

**Web App:**
- Full CRUD with projects, tags, priorities
- Effort/impact scoring (1-5 scale)
- Priority matrix (effort vs impact)
- Project grouping
- Tag filtering
- Due dates with reminders
- Recurring tasks
- Bulk actions
- Search
- Calendar integration (link tasks to events)

**Native App:**
- CRUD with priorities, tags, status
- List, Kanban (status columns), Matrix (priority quadrants) views
- Basic filtering by status
- No projects (yet)
- No recurring tasks
- No bulk actions
- No search
- No calendar integration

**Gap:** Native missing projects, effort/impact, recurring tasks, bulk actions, search, calendar links.

---

### 3. Habits

**Web App:**
- Cadence: daily, weekly, monthly
- Streak tracking with best streak
- Heatmap visualization
- Completion rate analytics
- Habit stacking suggestions
- Reminders with notifications
- Notes on completion
- Sentiment tracking

**Native App:**
- Daily tracking (no weekly/monthly cadence yet)
- Streak tracking with current/best
- Heatmap visualization
- Basic completion stats
- Quick check-in (tap to complete)
- Celebration on milestones (confetti, haptic)
- No reminders yet
- No notes on completion

**Gap:** Native missing weekly/monthly cadence, reminders, notes, sentiment, habit stacking.

---

### 4. Calendar

**Web App:**
- Full calendar UI (month/week/day views)
- Google Calendar bidirectional sync
- Event enrichment (link to tasks, habits, projects)
- Conflict detection
- Travel time calculation
- Recurring events
- Reminders/notifications
- Calendar-aware AI suggestions

**Native App:**
- Agenda, Day timeline, Week grid views
- Local events only (no sync)
- Basic CRUD
- Date/time pickers
- No enrichment
- No conflict detection
- No travel time
- No recurring events
- No reminders yet

**Gap:** Native missing Google sync, enrichment, conflicts, travel time, recurring events, reminders.

---

### 5. Finance

**Web App:**
- Plaid integration (automatic bank sync)
- Assets, liabilities, net worth tracking
- Transaction categorization (auto + manual)
- Budget tracking with alerts
- Spending trends and forecasts
- Category breakdown charts
- Monthly/yearly comparisons
- Receipt scanning (planned)
- Recurring transactions
- Financial goals

**Native App:**
- Manual transaction entry only
- Assets, liabilities, net worth tracking
- Basic categorization
- Monthly income/expenses/savings summary
- Category breakdown (top 5)
- No budgets yet
- No charts
- No Plaid
- No recurring transactions
- No goals

**Gap:** Native missing Plaid, budgets, charts, forecasts, recurring transactions, goals.

---

### 6. AI Chat

**Web App:**
- Full app context (knows your tasks, habits, calendar, etc.)
- Proactive suggestions based on patterns
- Can create tasks, schedule events, log habits
- Conversation history with search
- Smart prompts based on time/context
- Integration with all modules
- Sentiment analysis
- Learning from user behavior

**Native App:**
- Basic chat interface
- No app context (isolated)
- Cannot create tasks/events/habits
- Conversation history (local storage)
- Generic quick prompts
- No integrations
- No sentiment analysis
- No learning

**Gap:** Native missing context, integrations, smart suggestions, learning, actions.

---

### 7. Missing Modules in Native App

**Focus Blocks:**
- Timeboxing system for deep work
- Calendar integration
- Task linking
- Distraction tracking

**Pomodoro Timer:**
- 25/5/15 minute cycles
- Calendar sync
- Task tracking
- Break reminders

**Journal:**
- AM/PM reflections
- Sentiment analysis
- Mood tracking
- Gratitude prompts

**OKRs:**
- Quarterly objectives
- Key results with progress
- Alignment with tasks/projects
- Review cadence

**Reviews:**
- Automated weekly/monthly reviews
- Aggregates all data
- Insights and patterns
- Action items

**Projects:**
- Multi-task grouping
- Milestones
- Progress tracking
- Team collaboration (future)

**Knowledge Base:**
- Notes and wiki
- Full-text search
- Tagging and organization
- Linking between notes

**Wellbeing:**
- Mood tracking
- Sleep logging
- Exercise tracking
- Health metrics

**Social:**
- Social goals
- Connection tracking
- Event planning

**Automation:**
- Workflow triggers
- Conditional actions
- Scheduled tasks
- Integration webhooks

---

## Data Model Comparison

### Web App (PostgreSQL Schema)
```
29 API endpoints:
- /api/start, /api/pomodoro, /api/finance
- /api/macro-goal, /api/journal, /api/social
- /api/reviews, /api/okrs, /api/study
- /api/idea, /api/focus-blocks, /api/metrics
- /api/projects, /api/tasks, /api/auth
- /api/experiment, /api/calendar, /api/ai
- /api/action, /api/cash, /api/reminder
- /api/plaid, /api/knowledge, /api/settings
- /api/wellbeing, /api/user, /api/automation
- /api/habits

Tables (estimated 30+):
- User, Account, Session
- MacroGoal, StartEvent, StudySession
- CashSnapshot, Asset, Liability, Transaction
- Task, Project, TaskTag
- Habit, HabitLog
- CalendarEvent, CalendarSync
- Idea, RoutineExperiment
- Reminder, Action
- FocusBlock, PomodoroSession
- Journal, JournalEntry
- Objective, KeyResult
- Review, ReviewItem
- KnowledgeEntry, Note
- WellbeingLog, MoodEntry
- SocialGoal, Connection
- Automation, Trigger, Workflow
```

### Native App (SQLite Schema)
```
6 core modules:
- Tasks
- Habits
- Calendar
- Finance
- Dashboard (aggregates)
- AI Chat (messages)

Tables (estimated 10):
- User (single user)
- Task, TaskTag
- Habit, HabitLog
- CalendarEvent
- Transaction, Asset, Liability
- MacroGoal, StartEvent
- ChatMessage
```

**Gap:** Native has ~20 fewer tables, missing 10+ modules.

---

## Integration Comparison

### Web App Integrations
1. **Google Calendar** - Bidirectional sync, OAuth flow
2. **Plaid** - Bank account linking, transaction sync
3. **SMTP** - Email for magic-link auth, notifications
4. **AI API** - Contextual chat with full app data
5. **Sentry** - Error monitoring and tracking
6. **PostgreSQL** - Server database with backups

### Native App Integrations
1. **AI API** - Basic chat (no context)
2. **SQLite** - Local database only
3. **Expo Notifications** - Local push notifications

**Gap:** Native missing Google Calendar, Plaid, email, Sentry, server database.

---

## User Experience Comparison

### Web App UX
**Strengths:**
- Keyboard-driven workflow (S, M, N, J, D shortcuts)
- Desktop-optimized layouts
- Rich charts and visualizations
- Comprehensive data views
- Deep integrations (calendar, banking)
- Multi-device sync
- Automated insights and reviews

**Weaknesses:**
- Requires internet connection
- Desktop-focused (less mobile-friendly)
- Complex UI with many modules
- Steeper learning curve
- Requires server setup

### Native App UX
**Strengths:**
- Touch-optimized interface
- Fully offline (no network needed)
- Simple, focused feature set
- Fast and responsive
- Native mobile feel
- Easy to get started
- No server setup required

**Weaknesses:**
- Single device only (no sync)
- Limited features vs web
- No charts or visualizations
- Manual data entry (no integrations)
- Basic AI (no context)
- No keyboard shortcuts

---

## Performance Comparison

### Web App
- **Load Time:** 1-3s (server-side rendering)
- **Data Sync:** Real-time via PostgreSQL
- **Offline:** Limited (needs server for most features)
- **Scalability:** High (server can handle large datasets)
- **Multi-user:** Yes (server-based)

### Native App
- **Load Time:** <500ms (local data)
- **Data Sync:** None (single device)
- **Offline:** 100% (fully offline)
- **Scalability:** Limited (SQLite on device)
- **Multi-user:** No (single user per device)

---

## Development Comparison

### Web App
- **Codebase Size:** Large (~20+ modules, 30+ API routes)
- **Dependencies:** 42 packages
- **Testing:** Vitest + Playwright (E2E)
- **Deployment:** Vercel/server (requires hosting)
- **Maintenance:** High (server, database, integrations)

### Native App
- **Codebase Size:** Medium (6 modules, no API routes)
- **Dependencies:** ~30 packages
- **Testing:** None yet
- **Deployment:** App stores (iOS/Android)
- **Maintenance:** Low (no server, local only)

---

## Migration Path: Web → Native

### What Transferred Successfully
1. ✅ **Core CRUD operations** (Tasks, Habits, Calendar, Finance)
2. ✅ **Database patterns** (Prisma → SQLite with similar schema)
3. ✅ **UI components** (adapted from web to React Native)
4. ✅ **State management** (React Query works on both)
5. ✅ **Theme system** (Tailwind concepts → React Native tokens)
6. ✅ **Quick capture** (Dashboard feature preserved)

### What Required Adaptation
1. ⚠️ **Authentication** (NextAuth → JWT)
2. ⚠️ **Styling** (Tailwind → React Native StyleSheet)
3. ⚠️ **Navigation** (Next.js router → React Navigation)
4. ⚠️ **Forms** (HTML forms → React Native inputs)
5. ⚠️ **Charts** (Recharts → not yet implemented)
6. ⚠️ **Keyboard shortcuts** (not applicable on mobile)

### What Was Lost
1. ❌ **Server-side features** (SSR, API routes, middleware)
2. ❌ **External integrations** (Google Calendar, Plaid, email)
3. ❌ **Advanced modules** (Focus, Pomodoro, Journal, OKRs, Reviews, Projects, Knowledge, Wellbeing, Social, Automation)
4. ❌ **Multi-device sync** (PostgreSQL → local SQLite)
5. ❌ **Contextual AI** (full app context → basic chat)
6. ❌ **Automated insights** (reviews, patterns, suggestions)

---

## Recommendations

### For Native App to Reach Feature Parity

**Phase 1: Core Enhancements (TIER 2)**
1. Add Projects module (link tasks to projects)
2. Implement recurring tasks/habits/events
3. Add budgets and financial goals
4. Implement search across all modules
5. Add charts and visualizations
6. Improve AI with app context

**Phase 2: Advanced Features**
7. Add Focus Blocks and Pomodoro Timer
8. Implement Journal module
9. Add OKRs tracking
10. Build automated Reviews

**Phase 3: Integrations**
11. Google Calendar sync (OAuth + API)
12. Cloud backup/sync (Firebase/Supabase)
13. AI context integration (pass app data to AI)
14. Push notifications with reminders

**Phase 4: Platform Parity**
15. Add Knowledge Base
16. Implement Wellbeing tracking
17. Add Social goals
18. Build Automation system

**Estimated Effort:** 400-600 hours to reach 80% feature parity.

---

## Use Case Recommendations

### Use Web App When:
- Working on desktop/laptop
- Need comprehensive life operating system
- Want automated insights and reviews
- Need Google Calendar or banking integration
- Collaborating with others (future)
- Want keyboard-driven workflow
- Need multi-device sync

### Use Native App When:
- On mobile device
- Need offline access
- Want simple, focused productivity
- Don't need external integrations
- Single user, single device
- Prefer touch-optimized UI
- Want fast, local-only app

---

## Conclusion

**Web App (claude-dash):** Comprehensive productivity platform with 20+ modules, deep integrations, and server-side intelligence. Best for desktop power users who want a complete life operating system.

**Native App (jarvis-native):** Streamlined mobile productivity app with 6 core modules, offline-first architecture, and touch-optimized UX. Best for mobile users who want essential features without complexity.

**Strategic Position:** Native app is a focused subset (30% feature coverage) optimized for mobile. Not a replacement for web app, but a complementary mobile companion for core daily tasks.

**Path Forward:** Continue developing native app with focus on mobile-first features (quick capture, notifications, offline access) while web app remains the comprehensive desktop solution.

---

**Report prepared by:** Madam Claudia  
**Date:** December 13, 2025  
**Comparison Scope:** Full feature, architecture, and UX analysis
