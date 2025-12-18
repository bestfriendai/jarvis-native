# Pomodoro Task Link Behavior (Known Issue)

**Observed**
- On Pomodoro screen, tapping **Link to Task** immediately starts a session instead of letting the user pick a task.

**Repro steps**
1. Open Pomodoro screen (timer tab).
2. With no active timer, tap **Link to Task**.
3. Timer starts; no task picker or navigation occurs.

**Expected**
- Prompt to select a task (modal or navigation to Tasks) before starting the timer, or at least a non-destructive task picker flow.

**Current implementation note**
- `handleSelectTask` in `PomodoroScreen` currently calls `handleStart()` (auto-start). No task selection UI is wired.

**Recommended fix (future work)**
1) Add task selection flow:
   - Option A: Navigate to Tasks tab with a selection callback.
   - Option B: Inline modal listing active tasks with search/filter.
2) Only start timer after a task is chosen (or explicitly start without task if user confirms).
3) Persist the selected task ID in Pomodoro state and show it in the timer UI.

**Status**
- No code change applied; behavior documented for backlog.
