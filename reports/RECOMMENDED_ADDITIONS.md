# Recommended Feature Additions for Jarvis Mobile
**Date:** December 15, 2025  
**Author:** Madam Claudia  
**Status:** User-approved features for future implementation

---

## Overview

Based on user feedback, these are the recommended additions to Jarvis Mobile. All other missing modules from Structure is Grace are deemed unnecessary or redundant.

---

## HIGH PRIORITY (Essential - Build These)

### 1. Focus Blocks (Timeboxing)
**What it is:** Block dedicated time for deep work  
**User request:** "Include phone-in feature if possible"

**Features:**
- Create focus blocks (e.g., "2 hours for coding")
- Link to specific tasks
- Timer with start/pause/stop
- **Phone-in mode:** Lock phone during focus block
  - Disable notifications (Do Not Disturb)
  - Show full-screen focus timer
  - Optional: Block app switching (if possible on React Native)
  - Break reminders
- Track completed focus sessions
- Analytics: total focus time, most productive hours

**Effort:** 12-16 hours (with phone-in mode)  
**Value:** High - helps with deep work and distraction management

**Implementation Notes:**
- Use expo-notifications for DND mode
- Full-screen modal during focus block
- Haptic feedback on breaks
- Link to calendar (block time automatically)

---

### 2. Task Latency Tracking (Better than Idea→Action)
**What it is:** Track time from task creation to completion  
**User feedback:** "Wouldn't it be better to track task latency? Or both?"

**Recommendation:** Track BOTH, but prioritize task latency

**Task Latency (Primary):**
- Measure: Task created → Task completed
- Show on task card: "Created 3 days ago"
- Analytics: Average completion time by priority/project
- Identify bottlenecks: "High-priority tasks take 5 days on average"
- Dashboard widget: "Average task latency: 2.3 days"

**Idea→Action (Secondary):**
- Tag tasks as "ideas" (already supported via tags)
- Filter tasks with 'idea' tag
- Show latency for idea tasks specifically
- This is just a subset of task latency

**Features:**
- Latency calculation on task completion
- Latency analytics dashboard
- Trends over time (getting faster/slower?)
- Breakdown by priority, project, tag
- Alerts for stale tasks (>7 days old, not completed)

**Effort:** 6-8 hours  
**Value:** High - core to "micro-starts" philosophy, helps identify procrastination

---

### 3. Pomodoro Timer
**What it is:** 25/5/15 minute work/break cycles  
**User feedback:** "Sounds good"

**Features:**
- Standard Pomodoro: 25 min work, 5 min break, 15 min long break
- Customizable durations
- Link to tasks (track which task you're working on)
- Session history
- Daily/weekly stats (total pomodoros completed)
- Notifications for break time
- Integration with Focus Blocks (optional)

**Effort:** 8-10 hours  
**Value:** High - proven productivity technique

---

## NICE-TO-HAVES (Optional Enhancements)

### 4. Enhanced Notifications & Alarms
**What it is:** Better reminder system for tasks and habits  
**User feedback:** "Set as nice-to-have"

**Current State:**
- ✅ Habit reminders exist (reminderTime field)
- ✅ Calendar event reminders exist (reminderMinutes field)
- ❌ Task reminders don't exist yet

**Enhancements:**
- **Task Reminders:**
  - Add reminderTime field to tasks
  - Remind at specific time or X minutes before due date
  - Snooze option (remind again in 10/30/60 minutes)
  
- **Smart Alarms:**
  - Recurring daily alarms (morning routine, evening review)
  - Location-based reminders (if permissions granted)
  - "Gentle nudges" mode vs "Urgent alerts"
  
- **Notification Actions:**
  - Mark task complete from notification
  - Mark habit complete from notification
  - Snooze reminder
  - Open app to specific item

**Effort:** 10-12 hours  
**Value:** Medium - current reminders work, this adds polish

---

### 5. Reviews (Automated Summaries)
**What it is:** Weekly/monthly automated review generation  
**User feedback:** "Set as nice-to-have"

**Features:**
- Weekly review: Tasks completed, habits tracked, time spent
- Monthly review: Trends, achievements, areas for improvement
- Automated generation from database
- Export as PDF or text

**Effort:** 16-20 hours  
**Value:** Medium - nice for reflection but not essential

**Recommendation:** Optional. Users can manually review their data.

---

## LOW PRIORITY (Save for Way Later)

### 6. Knowledge Base
**What it is:** Resources, reading tracker, flashcards  
**User feedback:** "Save for way later"

**Features:**
- Save articles, books, courses
- Reading session tracking
- Flashcards with spaced repetition
- Full-text search

**Effort:** 30-40 hours  
**Value:** Low - tasks and notes cover most use cases

**Recommendation:** Defer indefinitely unless user specifically requests.

---

## NOT RECOMMENDED (Redundant or Unnecessary)

### ❌ Reminders Module
**User feedback:** "Sounds redundant"  
**Why skip:** You already have:
- Habit reminders ✅
- Calendar event reminders ✅
- Task reminders (will be added in #4 above) ✅

A separate "Reminders" module would be a fourth reminder system. Not needed.

---

### ❌ OKRs (Objectives & Key Results)
**Why skip:** You already have macro goals in Dashboard. OKRs are corporate-focused and redundant for personal use.

---

### ❌ Automation (Rules Engine)
**Why skip:** Manual control is fine for personal productivity. Automation is overkill and adds complexity.

---

### ❌ Wellbeing Module
**Why skip:** Habits already cover exercise tracking. Mood/sleep tracking is extra unless you specifically want health analytics.

---

### ❌ Social Module
**Why skip:** Personal app, not collaborative. Accountability partners feature is unnecessary.

---

### ❌ Experiments Module
**Why skip:** Can track experiments as tasks or projects. Separate module is overkill.

---

## Implementation Priority

### Phase A: Essential Features (Build These)
1. **Focus Blocks with phone-in mode** (12-16 hours)
2. **Task Latency Tracking** (6-8 hours)
3. **Pomodoro Timer** (8-10 hours)

**Total:** 26-34 hours  
**Result:** Jarvis Mobile reaches 100% of essential features

### Phase B: Nice-to-Haves (Optional)
4. **Enhanced Task/Habit Notifications** (10-12 hours)
5. **Reviews** (16-20 hours)

**Total:** 26-32 hours  
**Result:** Additional polish and automation

### Phase C: Deferred (Way Later)
6. **Knowledge Base** (30-40 hours)

---

## Final Recommendation

**Build Phase A (3 features, 26-34 hours):**
- Focus Blocks (with phone-in mode)
- Task Latency Tracking (better than idea→action)
- Pomodoro Timer

**Phase B is optional** - current reminders work fine, reviews are nice but not essential.

After Phase A, Jarvis Mobile will be **100% feature-complete** for core personal productivity.

---

**Report prepared by:** Madam Claudia  
**Date:** December 15, 2025  
**Based on:** User feedback and feature necessity analysis
