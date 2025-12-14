# Projects Module - Comprehensive Architecture Plan
## Phase 1, Task 3: Projects Module Implementation

**Estimated Time:** 6-8 hours
**Status:** Ready for implementation
**Date:** 2025-12-14

---

## Executive Summary

The Projects Module will enable users to organize tasks into projects, providing:
- Visual project organization with color coding
- Task filtering and grouping by project
- Project progress tracking and statistics
- Archive/active status management
- Seamless integration with existing task system

---

## 1. Current Architecture Analysis

### Existing Database Schema
The database **already has** the `projects` table defined in `/src/database/schema.ts`:

```sql
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced INTEGER DEFAULT 0
);
```

**Key Discovery:** The `tasks` table **already includes** a foreign key relationship:
- `project_id TEXT` column exists
- `FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL`
- Index already created: `idx_tasks_project ON tasks(project_id)`

**Impact:** This significantly reduces implementation effort. The core data model is complete!

### Current Task System
- **Location:** `/src/database/tasks.ts`
- **Features:**
  - Full CRUD operations
  - Task filtering (status, priority, projectId, tag)
  - Project info already joined in queries (LEFT JOIN with projects)
  - Task interface already includes `project` field with `{ id, name, color }`

### Current UI Components
- **TasksScreen:** `/src/screens/main/TasksScreen.tsx`
  - List, Kanban, Matrix views
  - Task cards showing priority, status, tags
  - Modal-based create/edit forms
- **UI Library:** `/src/components/ui/`
  - AppButton, AppCard, AppChip components
  - EmptyState, LoadingState
- **Theme System:** Comprehensive design tokens in `/src/theme/index.ts`

### Navigation
- **MainNavigator:** Bottom tab navigation
- **Current Tabs:** Dashboard, AI, Tasks, Habits, Calendar, Finance, Settings
- **Pattern:** Each screen manages its own header

---

## 2. Implementation Requirements

### 2.1 Database Layer

**Status:** Schema already exists, need to create operations file

**New File:** `/src/database/projects.ts`

**Required Operations:**
```typescript
- getProjects(filters?: { status?: 'active' | 'archived' }) -> Project[]
- getProject(id: string) -> Project | null
- createProject(data: CreateProjectData) -> Project
- updateProject(id: string, data: UpdateProjectData) -> Project
- deleteProject(id: string) -> void
- archiveProject(id: string) -> Project
- getProjectStats(id: string) -> ProjectStats
- getProjectWithTasks(id: string) -> ProjectWithTasks
```

**TypeScript Interfaces:**
```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  taskCount?: number;
  completedTaskCount?: number;
}

interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  completionPercentage: number;
  highPriorityCount: number;
  urgentCount: number;
}
```

### 2.2 UI Components

#### Component 1: ProjectsScreen
**Location:** `/src/screens/main/ProjectsScreen.tsx`

**Features:**
- List view of all active projects
- Grid/card view option (toggle)
- Quick stats per project (tasks, completion %)
- Color-coded project cards
- Filter: Active/Archived
- Search projects by name
- FAB or header button to create new project

**Layout Structure:**
```
[Header]
  "Projects" title
  [New Project Button]

[Filter Tabs]
  Active | Archived

[Search Bar]

[Projects List/Grid]
  [Project Card]
    - Color indicator
    - Project name
    - Description
    - Stats: "5/12 tasks completed"
    - Progress bar
    - Quick actions (Edit, Archive)
```

#### Component 2: ProjectDetailScreen
**Location:** `/src/screens/main/ProjectDetailScreen.tsx`

**Features:**
- Full project information display
- All tasks within this project
- Task filtering (by status, priority)
- Task views: List, Kanban (reuse from TasksScreen)
- Project statistics dashboard
- Edit project details inline
- Add new task to project (pre-fill project_id)

**Layout Structure:**
```
[Header]
  [Back] Project Name [Edit] [Menu]

[Project Info Card]
  Description
  Color selector
  Created date

[Stats Row]
  Total Tasks | Completed | In Progress | Blocked

[Progress Visualization]
  Progress bar showing completion

[Tasks Section]
  [View Toggle: List | Kanban]
  [Filter: All | Todo | In Progress | Completed]

  [Task List]
    (Reuse TaskCard component)

[FAB: New Task]
```

#### Component 3: ProjectFormModal
**Location:** `/src/components/ProjectFormModal.tsx`

**Features:**
- Create/Edit project modal
- Fields: Name, Description, Color
- Color picker (preset palette)
- Form validation
- Submit/Cancel actions

**Form Fields:**
```
- Name (required, TextInput)
- Description (optional, TextArea)
- Color (ColorPicker with presets)
- Status (Active/Archived toggle for edit mode)
```

#### Component 4: ProjectPicker
**Location:** `/src/components/ProjectPicker.tsx`

**Purpose:** Reusable component for selecting project when creating/editing tasks

**Features:**
- Dropdown/modal list of projects
- Search/filter projects
- Show project color
- "No Project" option
- Quick "Create New Project" option

**Integration:** Update TaskFormModal to use ProjectPicker

### 2.3 Navigation Updates

**Update:** `/src/navigation/MainNavigator.tsx`

**Changes:**
1. Add new tab for Projects (or integrate into Tasks tab with sub-navigation)
2. Option A: Separate Projects tab
3. Option B: Combined Tasks/Projects with segmented control

**Recommendation:** Option A - Separate tab for clearer UX

```typescript
<Tab.Screen
  name="Projects"
  component={ProjectsNavigator}
  options={{
    tabBarIcon: ({ focused }) => (
      <TabIcon icon="folder-multiple" focused={focused} colors={colors} />
    ),
    tabBarLabel: 'Projects',
  }}
/>
```

**New Navigator:** `/src/navigation/ProjectsNavigator.tsx`

```typescript
Stack Navigator:
- ProjectsScreen (list)
- ProjectDetailScreen (detail view)
```

### 2.4 Enhanced Task Integration

**Updates to TasksScreen:**

1. **Add Project Filter Chip:**
   - Show list of projects as filter options
   - Filter tasks by selected project
   - "No Project" option for unassigned tasks

2. **TaskCard Enhancement:**
   - Display project badge/chip if task has project
   - Color-coded indicator matching project color
   - Already partially implemented via `task.project` field

3. **TaskFormModal Enhancement:**
   - Add ProjectPicker component
   - Allow assigning/reassigning project
   - Show current project if editing

**Code Location:** `/src/screens/main/TasksScreen.tsx`

### 2.5 Dashboard Integration

**Updates to DashboardScreen:**

**Location:** `/src/screens/main/DashboardScreen.tsx`

**New Widget:** "Active Projects" section
```
[Active Projects]
  - Show 3-5 active projects
  - Quick stats per project
  - Tap to open ProjectDetailScreen
  - "View All" link to ProjectsScreen
```

---

## 3. Implementation Plan (Step-by-Step)

### Phase A: Database Layer (1-2 hours)

**Step A1:** Create `/src/database/projects.ts`
- [ ] Define TypeScript interfaces
- [ ] Implement all CRUD operations
- [ ] Add helper functions (rowToProject)
- [ ] Implement getProjectStats
- [ ] Add getProjectWithTasks for detail view

**Step A2:** Update type definitions
- [ ] Add types to `/src/types/index.ts` if needed
- [ ] Export Project, ProjectStatus types

**Step A3:** Test database operations
- [ ] Add seed data for projects in `/src/database/seed.ts`
- [ ] Create 3-5 sample projects
- [ ] Link some existing tasks to projects

### Phase B: Core UI Components (2-3 hours)

**Step B1:** Create ProjectFormModal
- [ ] Create `/src/components/ProjectFormModal.tsx`
- [ ] Implement color picker with preset colors
- [ ] Add form validation
- [ ] Handle create/edit modes
- [ ] Style using theme system

**Step B2:** Create ProjectPicker
- [ ] Create `/src/components/ProjectPicker.tsx`
- [ ] Implement searchable dropdown
- [ ] Add "Create New Project" quick action
- [ ] Style with project colors

**Step B3:** Create ProjectCard component
- [ ] Create `/src/components/ProjectCard.tsx`
- [ ] Display project info, stats, progress
- [ ] Add quick actions (Edit, Archive)
- [ ] Reusable for list/grid views

### Phase C: Main Screens (2-3 hours)

**Step C1:** Create ProjectsScreen
- [ ] Create `/src/screens/main/ProjectsScreen.tsx`
- [ ] Implement list view
- [ ] Add search functionality
- [ ] Add Active/Archived filter
- [ ] Integrate ProjectFormModal
- [ ] Handle empty states
- [ ] Add pull-to-refresh

**Step C2:** Create ProjectDetailScreen
- [ ] Create `/src/screens/main/ProjectDetailScreen.tsx`
- [ ] Display full project info
- [ ] Show project statistics
- [ ] List tasks for this project
- [ ] Reuse TaskCard component
- [ ] Add edit/archive actions
- [ ] Implement "Add Task" with pre-filled project

**Step C3:** Create ProjectsNavigator
- [ ] Create `/src/navigation/ProjectsNavigator.tsx`
- [ ] Set up stack navigation
- [ ] Configure screen options

### Phase D: Integration & Enhancement (1-2 hours)

**Step D1:** Update MainNavigator
- [ ] Add Projects tab to `/src/navigation/MainNavigator.tsx`
- [ ] Configure tab icon and label
- [ ] Update type definitions

**Step D2:** Enhance TasksScreen
- [ ] Add ProjectPicker to TaskFormModal
- [ ] Add project filter chips
- [ ] Show project badges on TaskCard
- [ ] Update task filtering logic

**Step D3:** Update DashboardScreen
- [ ] Add "Active Projects" widget
- [ ] Show top projects with stats
- [ ] Link to ProjectsScreen and ProjectDetailScreen

**Step D4:** Update navigation types
- [ ] Update `/src/types/index.ts` with navigation types
- [ ] Add ProjectsStackParamList
- [ ] Update MainTabParamList

### Phase E: Testing & Polish (1 hour)

**Step E1:** Manual testing
- [ ] Test creating projects
- [ ] Test editing projects
- [ ] Test archiving projects
- [ ] Test assigning tasks to projects
- [ ] Test filtering tasks by project
- [ ] Test project statistics accuracy

**Step E2:** Edge cases
- [ ] Test deleting project with tasks (should set project_id to NULL)
- [ ] Test project with zero tasks
- [ ] Test search functionality
- [ ] Test color selection

**Step E3:** UI polish
- [ ] Verify all animations
- [ ] Check loading states
- [ ] Verify empty states
- [ ] Test dark mode consistency
- [ ] Check responsive layouts

---

## 4. File Structure

```
/src/database/
  projects.ts                 [NEW] - Project database operations

/src/screens/main/
  ProjectsScreen.tsx          [NEW] - Projects list screen
  ProjectDetailScreen.tsx     [NEW] - Single project detail
  TasksScreen.tsx             [MODIFY] - Add project integration

/src/components/
  ProjectFormModal.tsx        [NEW] - Create/edit project form
  ProjectPicker.tsx           [NEW] - Project selector dropdown
  ProjectCard.tsx             [NEW] - Reusable project card

/src/navigation/
  ProjectsNavigator.tsx       [NEW] - Projects stack navigator
  MainNavigator.tsx           [MODIFY] - Add Projects tab

/src/types/
  index.ts                    [MODIFY] - Add project navigation types

/docs/
  PROJECTS_MODULE_ARCHITECTURE.md  [NEW] - This document
```

---

## 5. Data Flow Architecture

### Creating a Project
```
User → ProjectsScreen
     → Tap "New Project"
     → ProjectFormModal opens
     → Enter name, description, color
     → Submit
     → createProject() in database
     → Refresh project list
     → Close modal
```

### Assigning Task to Project
```
User → TasksScreen
     → Create/Edit Task
     → TaskFormModal opens
     → Tap ProjectPicker
     → Select project or create new
     → Save task with project_id
     → Task now linked to project
```

### Viewing Project Details
```
User → ProjectsScreen
     → Tap on project card
     → Navigate to ProjectDetailScreen
     → Load project data + tasks
     → Display stats and task list
     → Can edit project or add tasks
```

### Filtering Tasks by Project
```
User → TasksScreen
     → See project filter chips
     → Tap project name chip
     → Tasks filtered by getTasks({ projectId: 'xyz' })
     → Only tasks in that project shown
```

---

## 6. Color Palette for Projects

**Preset Colors (8 options):**
```typescript
const PROJECT_COLORS = [
  { name: 'Emerald', value: '#10B981' },   // Primary brand
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Slate', value: '#64748B' },
];
```

**Usage:**
- Visual indicator on project cards
- Badge color on task cards
- Progress bar color
- Header accent color in ProjectDetailScreen

---

## 7. Progress Tracking Logic

**Completion Percentage:**
```typescript
const completionPercentage = totalTasks > 0
  ? Math.round((completedTasks / totalTasks) * 100)
  : 0;
```

**Project Health Indicators:**
- Green: > 70% completed
- Yellow: 30-70% completed
- Red: < 30% completed (or has blocked tasks)

**Statistics to Track:**
- Total tasks
- Completed tasks
- In-progress tasks
- Todo tasks
- Blocked tasks
- Urgent/high priority counts

---

## 8. Search & Filter Specifications

### ProjectsScreen Filters
1. **Status:** Active | Archived
2. **Search:** Filter by project name (case-insensitive)
3. **Sort:**
   - Recent (updated_at DESC)
   - Alphabetical (name ASC)
   - Most tasks (task count DESC)

### ProjectDetailScreen Filters
1. **Task Status:** All | Todo | In Progress | Completed
2. **Priority:** All | Low | Medium | High | Urgent
3. **View Mode:** List | Kanban

---

## 9. User Experience Flows

### Quick Task Assignment Flow
```
TasksScreen → Create Task → Auto-opens with ProjectPicker
  ↓
ProjectPicker shows recent projects at top
  ↓
User selects project → Color indicator shown
  ↓
Task saved with project_id → Shows in project's task list
```

### Project Management Flow
```
ProjectsScreen → View all projects with stats
  ↓
Tap project → ProjectDetailScreen
  ↓
See all tasks, edit project, add tasks
  ↓
Archive when complete → Moves to "Archived" filter
```

### Cross-Module Navigation
```
Dashboard → "Active Projects" widget → ProjectsScreen
TasksScreen → Project filter chip → Filtered task list
ProjectDetailScreen → Task card → Edit task (maintains project link)
```

---

## 10. Edge Cases & Error Handling

### Edge Case 1: Deleting Project with Tasks
**Scenario:** User deletes project that has tasks
**Solution:** Foreign key `ON DELETE SET NULL` - tasks become unassigned
**UI:** Show warning: "X tasks will be unassigned from this project"

### Edge Case 2: No Projects Exist
**Scenario:** First-time user, no projects created
**Solution:** EmptyState component with "Create Your First Project" CTA

### Edge Case 3: Project with Zero Tasks
**Scenario:** New project with no tasks yet
**Solution:** Show 0% progress, "No tasks yet" message, CTA to add task

### Edge Case 4: Archived Project Handling
**Scenario:** User archives project with incomplete tasks
**Solution:**
- Tasks remain visible in TasksScreen (filter by "No Project")
- Option to "Reactivate" project from archive view

### Edge Case 5: Color Conflicts
**Scenario:** Multiple projects same color
**Solution:** Allow duplicates, use color + name for differentiation

---

## 11. Performance Considerations

### Database Optimization
- **Already optimized:** Index exists on `tasks.project_id`
- **Query efficiency:** Use LEFT JOIN for single query project + tasks
- **Batch operations:** Use transactions when updating multiple tasks

### UI Optimization
- **Lazy loading:** Load project tasks only when ProjectDetailScreen opens
- **Memoization:** Use React.memo for ProjectCard components
- **Debouncing:** Search input debounced (300ms)
- **Pagination:** If > 50 projects, implement virtual list

---

## 12. Testing Checklist

### Unit Testing (Database)
- [ ] Create project successfully
- [ ] Update project fields
- [ ] Delete project and verify tasks unassigned
- [ ] Archive/unarchive project
- [ ] Get project stats correctly
- [ ] Filter projects by status

### Integration Testing
- [ ] Create project → Assign task → Verify link
- [ ] Edit task project → Verify stats update
- [ ] Delete project → Verify tasks still exist
- [ ] Archive project → Verify not in active list

### UI Testing
- [ ] Create project via modal
- [ ] Search projects
- [ ] Filter active/archived
- [ ] Navigate to project detail
- [ ] Edit project inline
- [ ] Assign project to task
- [ ] View task within project

### Accessibility
- [ ] All touch targets ≥ 44px
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader labels
- [ ] Keyboard navigation (if web)

---

## 13. Future Enhancements (Post-MVP)

**Not in scope for Task 3, but consider for later:**

1. **Project Templates**
   - Pre-defined project types (Work, Personal, Learning)
   - Quick setup with template tasks

2. **Project Collaboration**
   - Share projects with other users
   - Assign tasks to team members

3. **Project Analytics**
   - Velocity tracking (tasks completed per week)
   - Time estimates vs actual
   - Burndown charts

4. **Sub-projects / Hierarchies**
   - Parent/child project relationships
   - Nested task organization

5. **Project Tags**
   - Additional categorization beyond color
   - Multi-tag support

6. **Project Goals**
   - Target completion dates
   - Milestone tracking

7. **Bulk Operations**
   - Move multiple tasks between projects
   - Archive multiple projects at once

---

## 14. Definition of Done

Task 3 (Projects Module) is **COMPLETE** when:

- [ ] All database operations implemented and tested
- [ ] ProjectsScreen displays list of projects with stats
- [ ] ProjectDetailScreen shows project details and tasks
- [ ] Users can create, edit, archive projects
- [ ] Users can assign tasks to projects
- [ ] Task filtering by project works in TasksScreen
- [ ] Project color coding visible throughout app
- [ ] Dashboard shows active projects widget
- [ ] Navigation integrated in MainNavigator
- [ ] No TypeScript errors
- [ ] All screens follow design system
- [ ] App runs without crashes
- [ ] Manual testing completed

---

## 15. Code Style & Patterns

### Follow Existing Conventions

**Database Operations:**
- Use `rowToProject()` converter pattern
- Export named functions (not default object at bottom)
- Use `executeQuery`, `executeWrite` helpers
- Include TypeScript types for all parameters

**React Components:**
- Functional components with hooks
- TypeScript interfaces for props
- StyleSheet at bottom of file
- Use theme tokens (no hardcoded colors)
- Extract reusable logic to hooks

**File Organization:**
- Group related functionality
- Keep files under 500 lines
- Export types with implementations
- Use meaningful variable names

**Error Handling:**
- Try/catch in all database operations
- Alert user on errors
- Console.error for debugging
- Graceful fallbacks for loading states

---

## 16. Implementation Timeline

**Total Estimated Time:** 6-8 hours

| Phase | Tasks | Time | Priority |
|-------|-------|------|----------|
| A - Database | Create projects.ts, seed data | 1-2h | P0 - Critical |
| B - Components | ProjectFormModal, ProjectPicker, ProjectCard | 2-3h | P0 - Critical |
| C - Screens | ProjectsScreen, ProjectDetailScreen, Navigator | 2-3h | P0 - Critical |
| D - Integration | Update existing screens, navigation | 1-2h | P0 - Critical |
| E - Testing | Manual testing, polish, bug fixes | 1h | P0 - Critical |

**Recommended Approach:**
- Work sequentially: A → B → C → D → E
- Test incrementally after each phase
- Commit after each major component
- Don't move to next phase until current phase works

---

## 17. Key Architectural Decisions

### Decision 1: Separate Projects Tab vs. Combined with Tasks
**Chosen:** Separate tab
**Rationale:** Clearer mental model, allows dedicated project management UI, doesn't clutter task view

### Decision 2: Project-Task Relationship
**Chosen:** Optional relationship (tasks can exist without project)
**Rationale:** Flexibility for quick tasks, gradual adoption, foreign key with ON DELETE SET NULL

### Decision 3: Archive vs. Delete
**Chosen:** Archive pattern with status field
**Rationale:** Preserves data, allows reactivation, safer for users

### Decision 4: Color as String vs. Enum
**Chosen:** String (hex color)
**Rationale:** Future flexibility, easy to render, simple to store

### Decision 5: Project Statistics Calculation
**Chosen:** Calculate on-demand via SQL queries
**Rationale:** Always accurate, no sync issues, SQLite is fast enough for small datasets

---

## 18. Dependencies & Prerequisites

### Required
- expo-sqlite (already installed)
- @react-navigation/native-stack (for ProjectsNavigator)
- All UI components from existing design system

### No New Dependencies Needed
- All functionality achievable with current stack
- Reuse existing components and patterns

---

## 19. Success Metrics

**Quantitative:**
- Zero crashes related to projects module
- < 100ms query time for project list
- < 200ms navigation between screens
- All TypeScript compilation passes

**Qualitative:**
- UI matches existing design system
- Smooth animations and transitions
- Intuitive user flows
- Consistent with app's UX patterns

---

## 20. Next Steps After Completion

Once Task 3 is complete:

1. **Immediate:**
   - User testing and feedback
   - Bug fixes from testing
   - Performance optimization if needed

2. **Task 4:** Budgets & Financial Goals (next in Phase 1)

3. **Future:**
   - Consider project templates
   - Analytics and reporting
   - Collaboration features

---

## Appendix A: Example Database Queries

### Get All Active Projects with Task Counts
```sql
SELECT
  p.*,
  COUNT(t.id) as task_count,
  SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
WHERE p.status = 'active'
GROUP BY p.id
ORDER BY p.updated_at DESC;
```

### Get Project Statistics
```sql
SELECT
  COUNT(*) as total_tasks,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
  SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo_tasks,
  SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
  SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked_tasks,
  SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent_count,
  SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority_count
FROM tasks
WHERE project_id = ?;
```

---

## Appendix B: Component Wireframes

### ProjectsScreen (List View)
```
┌─────────────────────────────────────┐
│ Projects              [+ New]       │
├─────────────────────────────────────┤
│ [Active] [Archived]                 │
│ [Search projects...]                │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ● Website Redesign              │ │
│ │   Update company website        │ │
│ │   ████████░░ 8/10 tasks         │ │
│ │   [Edit] [Archive]              │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ● Mobile App                    │ │
│ │   Build native mobile app       │ │
│ │   ████░░░░░░ 4/12 tasks         │ │
│ │   [Edit] [Archive]              │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### ProjectDetailScreen
```
┌─────────────────────────────────────┐
│ ← Website Redesign     [⋮]          │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ● Update company website        │ │
│ │   Created Dec 1, 2024           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌──────┬──────┬──────┬──────┐      │
│ │  10  │  8   │  1   │  1   │      │
│ │Total │Done  │Active│Block │      │
│ └──────┴──────┴──────┴──────┘      │
│                                     │
│ Progress: 80% ████████░░            │
├─────────────────────────────────────┤
│ Tasks                [List][Kanban] │
│ [All] [Todo] [In Progress] [Done]   │
├─────────────────────────────────────┤
│ ☐ Design homepage mockups          │
│ ☐ Implement responsive layout      │
│ ☑ Setup development environment    │
└─────────────────────────────────────┘
                              [+ Task]
```

---

## Summary

This architecture plan provides a complete blueprint for implementing the Projects Module. The implementation will:

1. Leverage existing database schema (minimal new code)
2. Follow established patterns from TasksScreen
3. Integrate seamlessly with current navigation
4. Reuse existing UI components and theme
5. Provide clear user value through task organization

**The database foundation is already built**, making this primarily a UI/UX implementation task focused on creating intuitive screens for project management and enhancing the task-project relationship.

---

**Document Version:** 1.0
**Last Updated:** 2025-12-14
**Author:** Life-Dashboard Architect Agent
**Status:** Ready for Implementation
