# Projects Module - Component Map
**Visual Reference for Implementation**

---

## Component Hierarchy

```
MainNavigator (Bottom Tabs)
├── Dashboard Tab
│   └── DashboardScreen [MODIFY]
│       └── Active Projects Widget [NEW]
│           └── ProjectCard (compact) [NEW]
│
├── Tasks Tab
│   └── TasksScreen [MODIFY]
│       ├── TaskFormModal [MODIFY]
│       │   └── ProjectPicker [NEW]
│       └── TaskCard [MODIFY]
│           └── Project Badge [NEW]
│
├── Projects Tab [NEW]
│   └── ProjectsNavigator [NEW]
│       ├── ProjectsScreen [NEW]
│       │   ├── ProjectFormModal [NEW]
│       │   └── ProjectCard [NEW]
│       │
│       └── ProjectDetailScreen [NEW]
│           ├── ProjectFormModal [NEW]
│           ├── TaskCard (reused)
│           └── TaskFormModal (reused)
│
└── [Other Tabs...]
```

---

## Screen Flow Diagram

```
┌────────────────────┐
│  DashboardScreen   │
│  [MODIFY]          │
├────────────────────┤
│ Active Projects    │
│ ┌────────────────┐ │
│ │ ProjectCard    │─┼─────┐
│ │ ProjectCard    │ │     │
│ │ ProjectCard    │ │     │
│ └────────────────┘ │     │
│ [View All] ────────┼─┐   │
└────────────────────┘ │   │
                       │   │
    ┌──────────────────┘   │
    │                      │
    ▼                      ▼
┌────────────────────┐ ┌────────────────────┐
│  ProjectsScreen    │ │ ProjectDetail      │
│  [NEW]             │ │ Screen [NEW]       │
├────────────────────┤ ├────────────────────┤
│ [Search...]        │ │ ← Project Name   ⋮ │
│                    │ │                    │
│ [Active][Archived] │ │ ┌────────────────┐ │
│                    │ │ │ Project Info   │ │
│ ┌────────────────┐ │ │ │ Color: Blue    │ │
│ │ ProjectCard    │─┼─┘ │ Created: Dec 1 │ │
│ │ ProjectCard    │ │   └────────────────┘ │
│ │ ProjectCard    │ │                      │
│ │ ProjectCard    │ │   Total │ Done │ ... │
│ │ ProjectCard    │ │    10   │  7   │ ... │
│ └────────────────┘ │                      │
│                    │   ████████░░ 70%     │
│ [+ New Project]    │                      │
└────────────────────┘   Tasks ──────────   │
         │               ┌────────────────┐ │
         │               │ TaskCard       │ │
         │               │ TaskCard       │ │
         ▼               │ TaskCard       │ │
┌────────────────────┐   └────────────────┘ │
│ ProjectFormModal   │                      │
│ [NEW]              │        [+ New Task]  │
├────────────────────┤                      │
│ Name: [........]   │   ◄──────────────────┘
│ Desc: [........]   │            │
│ Color: ●●●●●●●●    │            │
│                    │            ▼
│ [Cancel] [Save]    │   ┌────────────────────┐
└────────────────────┘   │ TaskFormModal      │
                         │ [MODIFY]           │
                         ├────────────────────┤
                         │ Title: [........]  │
                         │ Desc:  [........]  │
                         │ Project: ┌───────┐ │
                         │          │Picker │◄┼────┐
                         │          └───────┘ │    │
                         │ Priority: [.....]  │    │
                         │                    │    │
                         │ [Cancel] [Save]    │    │
                         └────────────────────┘    │
                                  │                │
                                  ▼                │
                         ┌────────────────────┐    │
                         │ ProjectPicker      │◄───┘
                         │ [NEW]              │
                         ├────────────────────┤
                         │ [Search...]        │
                         │                    │
                         │ ● Website          │
                         │ ● Mobile App       │
                         │ ● Marketing        │
                         │                    │
                         │ ── No Project      │
                         │ + Create New...    │
                         └────────────────────┘
```

---

## Database Interaction Map

```
┌──────────────────────────────────────────────────────────────┐
│                      UI Components                           │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                  Database Operations                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  projects.ts [NEW]                tasks.ts [EXISTS]          │
│  ├── getProjects()                ├── getTasks()            │
│  ├── getProject(id)               ├── getTask(id)           │
│  ├── createProject()              ├── createTask()          │
│  ├── updateProject()              ├── updateTask()          │
│  ├── deleteProject()              ├── deleteTask()          │
│  ├── archiveProject()             └── ...                   │
│  ├── getProjectStats()                                      │
│  └── getProjectWithTasks() ───────────┐                     │
│                                        │                     │
└────────────────────────────────────────┼─────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────┐
│                     SQLite Database                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  projects table  │         │   tasks table    │          │
│  │  [EXISTS]        │         │   [EXISTS]       │          │
│  ├──────────────────┤         ├──────────────────┤          │
│  │ id (PK)          │◄────────┤ project_id (FK)  │          │
│  │ name             │         │ id (PK)          │          │
│  │ description      │         │ title            │          │
│  │ color            │         │ status           │          │
│  │ status           │         │ priority         │          │
│  │ created_at       │         │ ...              │          │
│  │ updated_at       │         │                  │          │
│  │ synced           │         │ FK ON DELETE     │          │
│  └──────────────────┘         │ SET NULL         │          │
│                               └──────────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Props Interface Map

### ProjectsScreen
```typescript
// No props - root screen
// Uses navigation for routing
```

### ProjectDetailScreen
```typescript
type Props = {
  route: {
    params: {
      projectId: string;
    };
  };
  navigation: NavigationProp;
};
```

### ProjectFormModal
```typescript
type Props = {
  visible: boolean;
  project: Project | null;      // null = create mode, object = edit mode
  onClose: () => void;
  onSuccess?: () => void;
};
```

### ProjectPicker
```typescript
type Props = {
  value?: string;                // Current project ID
  onChange: (projectId: string | undefined) => void;
  style?: StyleProp<ViewStyle>;
};
```

### ProjectCard
```typescript
type Props = {
  project: Project;
  onPress?: () => void;          // Navigate to detail
  onEdit?: () => void;           // Open edit modal
  onArchive?: () => void;        // Archive project
  compact?: boolean;             // Compact view for dashboard
};
```

---

## State Management Map

### ProjectsScreen State
```typescript
const [projects, setProjects] = useState<Project[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const [filterStatus, setFilterStatus] = useState<'active' | 'archived'>('active');
const [showCreateModal, setShowCreateModal] = useState(false);
const [selectedProject, setSelectedProject] = useState<Project | null>(null);
```

### ProjectDetailScreen State
```typescript
const [project, setProject] = useState<Project | null>(null);
const [stats, setStats] = useState<ProjectStats | null>(null);
const [tasks, setTasks] = useState<Task[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
const [showEditModal, setShowEditModal] = useState(false);
```

### ProjectFormModal State
```typescript
const [name, setName] = useState('');
const [description, setDescription] = useState('');
const [selectedColor, setSelectedColor] = useState('#10B981');
const [isSubmitting, setIsSubmitting] = useState(false);
```

### ProjectPicker State
```typescript
const [projects, setProjects] = useState<Project[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [modalVisible, setModalVisible] = useState(false);
const [showCreateModal, setShowCreateModal] = useState(false);
```

---

## Data Flow: Creating a Project

```
┌─────────────────────┐
│ User Action         │
│ "Tap New Project"   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ ProjectsScreen                  │
│ setShowCreateModal(true)        │
│ setSelectedProject(null)        │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ ProjectFormModal                │
│ visible={true}                  │
│ project={null} // create mode   │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ User fills form:                │
│ - name: "Website Redesign"      │
│ - description: "Update..."      │
│ - color: #3B82F6 (blue)         │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ User taps "Save"                │
│ handleSubmit()                  │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ projects.ts                     │
│ createProject({                 │
│   name: "Website Redesign",     │
│   description: "Update...",     │
│   color: "#3B82F6"              │
│ })                              │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ SQLite Database                 │
│ INSERT INTO projects            │
│ VALUES (...)                    │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ projects.ts                     │
│ getProject(id)                  │
│ → Returns created project       │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ ProjectFormModal                │
│ onSuccess()                     │
│ onClose()                       │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ ProjectsScreen                  │
│ Refresh project list            │
│ loadProjects()                  │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ UI Updates                      │
│ New project appears in list     │
└─────────────────────────────────┘
```

---

## Data Flow: Assigning Task to Project

```
┌─────────────────────┐
│ User Action         │
│ "Create New Task"   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ TasksScreen                     │
│ Opens TaskFormModal             │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ TaskFormModal                   │
│ Shows ProjectPicker component   │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ User taps ProjectPicker         │
│ Opens project selection modal   │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ ProjectPicker                   │
│ Loads all active projects       │
│ getProjects({ status: 'active' })│
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ User selects project            │
│ "Website Redesign"              │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ ProjectPicker                   │
│ onChange(projectId)             │
│ Closes modal                    │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ TaskFormModal                   │
│ Updates form state:             │
│ setProjectId(projectId)         │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ User completes task form        │
│ Taps "Create"                   │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ tasks.ts                        │
│ createTask({                    │
│   title: "Design homepage",     │
│   projectId: "proj-123",        │
│   ...                           │
│ })                              │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ SQLite Database                 │
│ INSERT INTO tasks               │
│ VALUES (                        │
│   ...,                          │
│   project_id = "proj-123"       │
│ )                               │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ UI Updates                      │
│ - Task list refreshes           │
│ - Task shows project badge      │
│ - Project stats update          │
└─────────────────────────────────┘
```

---

## Styling Pattern

All components follow this styling pattern:

```typescript
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  // Card styles
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },

  // Text styles
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },

  // Use theme tokens, not hardcoded values!
});
```

---

## Error Handling Pattern

All database operations follow this pattern:

```typescript
async function loadProjects() {
  setIsLoading(true);
  try {
    const data = await projectsDB.getProjects({ status: 'active' });
    setProjects(data);
  } catch (error) {
    console.error('Error loading projects:', error);
    Alert.alert('Error', 'Failed to load projects. Please try again.');
  } finally {
    setIsLoading(false);
  }
}
```

---

## Testing Flow

```
Manual Testing Sequence:
1. Create Project
   → Verify appears in list
   → Check color indicator
   → Check stats (0 tasks)

2. Edit Project
   → Change name, description, color
   → Verify updates reflected

3. Create Task with Project
   → Assign to project
   → Verify project badge shows
   → Check project stats update

4. View Project Detail
   → Verify stats accurate
   → Verify tasks listed
   → Verify progress bar correct

5. Filter Tasks by Project
   → Apply project filter
   → Verify only project tasks shown

6. Archive Project
   → Archive project
   → Verify moves to Archived filter
   → Verify tasks still accessible

7. Delete Project
   → Delete project
   → Verify tasks become unassigned
   → Verify no crashes
```

---

## Quick Implementation Checklist

```
Phase A: Database
[ ] Create projects.ts
[ ] Add seed data
[ ] Test queries

Phase B: Components
[ ] ProjectFormModal
[ ] ProjectPicker
[ ] ProjectCard

Phase C: Screens
[ ] ProjectsScreen
[ ] ProjectDetailScreen
[ ] ProjectsNavigator

Phase D: Integration
[ ] Update MainNavigator
[ ] Enhance TasksScreen
[ ] Update DashboardScreen

Phase E: Testing
[ ] Manual testing
[ ] Edge cases
[ ] Polish
```

---

## File Size Estimates

```
/src/database/projects.ts              ~400 lines
/src/components/ProjectFormModal.tsx   ~300 lines
/src/components/ProjectPicker.tsx      ~250 lines
/src/components/ProjectCard.tsx        ~200 lines
/src/screens/main/ProjectsScreen.tsx   ~400 lines
/src/screens/main/ProjectDetailScreen.tsx ~500 lines
/src/navigation/ProjectsNavigator.tsx  ~80 lines
```

**Total new code:** ~2,100 lines
**Modifications:** ~200 lines across 4 files

---

## Key Takeaways

1. **Database schema exists** - Major time saver!
2. **Follow existing patterns** - TasksScreen is a good template
3. **Reuse components** - TaskCard, UI library, theme
4. **Test incrementally** - After each phase
5. **Use theme tokens** - No hardcoded colors/spacing
6. **Error handling** - Try/catch everywhere
7. **Loading states** - Show loading indicators
8. **Empty states** - Handle zero data gracefully

---

**Ready to build! Start with Phase A (Database layer).**

Documentation:
- Architecture: `/docs/PROJECTS_MODULE_ARCHITECTURE.md`
- Checklist: `/docs/PROJECTS_MODULE_CHECKLIST.md`
- Summary: `/docs/PROJECTS_MODULE_SUMMARY.md`
- This Map: `/docs/PROJECTS_MODULE_COMPONENT_MAP.md`

---

**Last Updated:** 2025-12-14
**Status:** Ready for Implementation
