# Projects Module - Quick Summary
**One-Page Overview for Task 3 Implementation**

---

## What We're Building

A **Projects Module** that allows users to:
- Organize tasks into projects
- Track project progress and statistics
- Filter and view tasks by project
- Manage project lifecycle (create, edit, archive)

---

## Key Discovery

**The database schema already exists!** The `projects` table and task relationship are fully defined in `/src/database/schema.ts`. This reduces implementation time significantly.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                         │
├─────────────────────────────────────────────────────────────┤
│  ProjectsScreen          ProjectDetailScreen   Dashboard    │
│  - List projects         - Project info        - Top 3-5    │
│  - Search/filter         - Task list           - Quick view │
│  - Create/edit           - Statistics          - Navigate   │
│                                                              │
│  TasksScreen (Enhanced)                                     │
│  - Project filter chips                                     │
│  - Project badges on tasks                                  │
│  - ProjectPicker in form                                    │
├─────────────────────────────────────────────────────────────┤
│                    COMPONENTS LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  ProjectFormModal    ProjectPicker    ProjectCard          │
│  - Create/edit UI    - Select project - Display project    │
│  - Color picker      - Search         - Stats & progress   │
├─────────────────────────────────────────────────────────────┤
│                    DATABASE LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  projects.ts (NEW)                                          │
│  - CRUD operations                                          │
│  - Statistics queries                                       │
│  - Archive management                                       │
│                                                              │
│  tasks.ts (EXISTING - already has project support!)        │
├─────────────────────────────────────────────────────────────┤
│                    SQLite DATABASE                          │
├─────────────────────────────────────────────────────────────┤
│  projects table (EXISTS)     tasks table (EXISTS)           │
│  - id, name, color           - project_id FK                │
│  - description, status       - ON DELETE SET NULL           │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase A: Database (1-2h)
**Create:** `/src/database/projects.ts`
- Implement all CRUD operations
- Add statistics queries
- Update seed data with sample projects

### Phase B: Components (2-3h)
**Create:**
- `ProjectFormModal.tsx` - Create/edit form with color picker
- `ProjectPicker.tsx` - Select project when creating tasks
- `ProjectCard.tsx` - Reusable project display card

### Phase C: Screens (2-3h)
**Create:**
- `ProjectsScreen.tsx` - List all projects with search/filter
- `ProjectDetailScreen.tsx` - Project details + tasks
- `ProjectsNavigator.tsx` - Stack navigation

### Phase D: Integration (1-2h)
**Modify:**
- `MainNavigator.tsx` - Add Projects tab
- `TasksScreen.tsx` - Add project filtering and picker
- `DashboardScreen.tsx` - Add active projects widget

### Phase E: Testing (1h)
- Manual testing all flows
- Edge case handling
- UI/UX polish

---

## Key Features

### 1. Project Management
```typescript
✓ Create project with name, description, color
✓ Edit project details
✓ Archive/unarchive projects
✓ Delete projects (tasks become unassigned)
✓ Color-coded visual indicators
```

### 2. Task-Project Linking
```typescript
✓ Assign task to project when creating
✓ Change task's project when editing
✓ Remove task from project
✓ View all tasks in a project
✓ Filter tasks by project in TasksScreen
```

### 3. Project Statistics
```typescript
✓ Total task count
✓ Completed task count
✓ In-progress task count
✓ Blocked task count
✓ Completion percentage
✓ Priority breakdown (urgent/high counts)
```

### 4. Visual Design
```typescript
✓ 8 preset colors (Emerald, Blue, Purple, Pink, Orange, Yellow, Red, Slate)
✓ Progress bars showing completion
✓ Color indicators throughout UI
✓ Follows existing design system
```

---

## Data Model

### Project Type
```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;               // Hex color
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  taskCount?: number;           // Calculated
  completedTaskCount?: number;  // Calculated
}
```

### Task Enhancement (Already Exists!)
```typescript
interface Task {
  // ... existing fields
  projectId?: string;           // FK to projects.id
  project?: {                   // Already joined in queries
    id: string;
    name: string;
    color?: string;
  };
}
```

---

## User Flows

### Create Project → Assign Tasks
```
1. User taps "Projects" tab
2. Taps "New Project" button
3. Enters name, description, selects color
4. Project created
5. User goes to Tasks screen
6. Creates new task
7. Selects project from ProjectPicker
8. Task now linked to project
```

### View Project Progress
```
1. User opens ProjectsScreen
2. Sees all projects with stats
3. Taps on a project
4. ProjectDetailScreen shows:
   - Project info
   - Statistics (10 total, 7 done, 70%)
   - Progress bar
   - All tasks in project
5. Can edit project or add tasks
```

### Filter Tasks by Project
```
1. User opens TasksScreen
2. Sees project filter chips
3. Taps "Website Redesign" chip
4. Only tasks in that project shown
5. Can clear filter to see all
```

---

## File Structure

```
src/
├── database/
│   ├── projects.ts              [NEW] ← Database operations
│   ├── tasks.ts                 [EXISTS] Already has project support!
│   └── seed.ts                  [MODIFY] Add sample projects
│
├── screens/main/
│   ├── ProjectsScreen.tsx       [NEW] ← List view
│   ├── ProjectDetailScreen.tsx  [NEW] ← Detail view
│   ├── TasksScreen.tsx          [MODIFY] Add project integration
│   └── DashboardScreen.tsx      [MODIFY] Add projects widget
│
├── components/
│   ├── ProjectFormModal.tsx     [NEW] ← Create/edit form
│   ├── ProjectPicker.tsx        [NEW] ← Project selector
│   └── ProjectCard.tsx          [NEW] ← Display component
│
├── navigation/
│   ├── ProjectsNavigator.tsx    [NEW] ← Stack nav
│   └── MainNavigator.tsx        [MODIFY] Add Projects tab
│
└── types/
    └── index.ts                 [MODIFY] Add types
```

**Total:** 3 new files, 4 modified files (plus documentation)

---

## Color Palette

Projects use 8 preset colors for visual organization:

| Color   | Hex     | Use Case              |
|---------|---------|------------------------|
| Emerald | #10B981 | Work/primary projects  |
| Blue    | #3B82F6 | Personal projects      |
| Purple  | #8B5CF6 | Learning/education     |
| Pink    | #EC4899 | Creative projects      |
| Orange  | #F97316 | Urgent/important       |
| Yellow  | #F59E0B | Ideas/planning         |
| Red     | #EF4444 | Critical/high priority |
| Slate   | #64748B | Archive/low priority   |

---

## Success Criteria

Task 3 is complete when:

- [x] Can create, edit, archive, delete projects
- [x] Can assign tasks to projects
- [x] Project statistics are accurate
- [x] Can view project details with task list
- [x] Can filter tasks by project
- [x] Dashboard shows active projects
- [x] UI follows design system
- [x] No TypeScript or runtime errors
- [x] All manual tests pass

---

## Time Estimate

**Total: 6-8 hours**

- Database layer: 1-2h
- Components: 2-3h
- Screens: 2-3h
- Integration: 1-2h
- Testing & polish: 1h

---

## Next Steps After Completion

1. **Task 4:** Budgets & Financial Goals
2. **Task 5:** Charts & Visualizations

---

## Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tab placement | Separate "Projects" tab | Clearer UX, dedicated management |
| Task relationship | Optional (nullable FK) | Flexibility, gradual adoption |
| Archive vs delete | Archive with status field | Data preservation, safety |
| Color storage | String (hex value) | Future flexibility |
| Stats calculation | On-demand SQL queries | Always accurate, simple |

---

## Edge Cases Handled

- ✓ Delete project with tasks → Tasks become unassigned (FK ON DELETE SET NULL)
- ✓ Project with zero tasks → Shows 0%, "Add first task" CTA
- ✓ No projects exist → Empty state with "Create first project"
- ✓ Duplicate project names → Allowed (color helps differentiate)
- ✓ Archived project → Visible in "Archived" filter only

---

## Dependencies

**No new packages needed!** Everything uses existing dependencies:
- expo-sqlite (database)
- @react-navigation/native-stack (navigation)
- react-native-paper (UI components)
- Existing design system and components

---

## Quick Reference: Database Queries

### Get projects with task counts
```sql
SELECT p.*, COUNT(t.id) as task_count
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
WHERE p.status = 'active'
GROUP BY p.id;
```

### Get project statistics
```sql
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as done
FROM tasks
WHERE project_id = ?;
```

### Get tasks for project (already works!)
```sql
SELECT * FROM tasks WHERE project_id = ?;
```

---

## Documentation

- **Full architecture:** `/docs/PROJECTS_MODULE_ARCHITECTURE.md`
- **Checklist:** `/docs/PROJECTS_MODULE_CHECKLIST.md`
- **This summary:** `/docs/PROJECTS_MODULE_SUMMARY.md`

---

**Ready to implement!** Start with Phase A (Database layer) and work sequentially through the phases.

---

**Last Updated:** 2025-12-14
**Estimated Completion:** 6-8 hours from start
**Status:** Ready for Implementation
