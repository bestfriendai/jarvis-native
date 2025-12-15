# Phase 4: Nice-to-Have Features
**Date:** December 15, 2025  
**Author:** Madam Claudia  
**Status:** Optional enhancements for future consideration

---

## Overview

Based on NEXT_SESSION_TODO.md, the team has already completed:
- ✅ Recurring tasks/events (was in nice-to-haves, now done!)
- ✅ Full charts & visualizations (was in nice-to-haves, now done!)
- ✅ Global search (was in nice-to-haves, now done!)

**Remaining nice-to-haves are purely optional enhancements.**

---

## Offline-Capable Nice-to-Haves

### 1. Advanced Search Filters
**Current:** Basic search works across all modules  
**Enhancement:**
- Saved searches (persist favorite queries)
- Complex filter combinations (AND/OR logic)
- Search history with recent searches
- Search within search results

**Effort:** 6-8 hours  
**Value:** Medium - basic search is sufficient for most users

---

### 2. Habit Stacking Suggestions
**Current:** Habits are tracked independently  
**Enhancement:**
- Analyze completion patterns
- Suggest habit pairs ("After coffee, meditate")
- Recommend optimal sequences
- Show correlation between habits

**Requires:** Local ML/pattern analysis (no AI needed)  
**Effort:** 10-12 hours  
**Value:** High - helps build better routines

---

### 3. Receipt Scanning (Offline OCR)
**Current:** Manual transaction entry  
**Enhancement:**
- Camera capture for receipts
- Local OCR (react-native-vision-camera + ML Kit)
- Extract: amount, merchant, date, category
- Pre-fill transaction form
- Store receipt image

**Requires:** Camera permissions, ML Kit  
**Effort:** 12-16 hours  
**Value:** High - saves time on expense tracking

---

### 4. Enhanced Onboarding Tooltips
**Current:** Basic onboarding flow (welcome/tour/sample data)  
**Enhancement:**
- First-use tooltips on each feature
- Progressive disclosure (show hints as user explores)
- Interactive tutorials
- Help system with searchable tips

**Effort:** 8-10 hours  
**Value:** Medium - current onboarding is adequate

---

### 5. Advanced Habit Analytics
**Current:** Basic completion rate and streaks  
**Enhancement:**
- Best time of day analysis (morning/afternoon/evening)
- Day-of-week patterns (skip Mondays?)
- Correlation with other habits
- Predictive suggestions ("You're likely to skip tomorrow")
- Mood/energy correlation

**Requires:** Local analytics, no AI  
**Effort:** 12-16 hours  
**Value:** High - helps optimize habit timing

---

### 6. Financial Forecasting
**Current:** Historical data and current snapshot  
**Enhancement:**
- Predict next month's expenses based on patterns
- Cash flow projections (3-6 months)
- Savings goal tracking with timeline
- "At this rate, you'll save $X by [date]"
- Anomaly detection (unusual spending)

**Requires:** Local analytics, no AI  
**Effort:** 14-18 hours  
**Value:** High - helps with planning

---

## Features Requiring Network/AI (Excluded from Offline)

### ❌ Google Calendar Sync
**Why excluded:** Requires OAuth, Google API, network  
**Alternative:** Manual calendar entry (current approach)

### ❌ Advanced AI Context
**Why excluded:** Requires server-side AI with full app context  
**Alternative:** Basic AI chat (current approach)

### ❌ Voice Input/Output
**Why excluded:** Complex, requires speech recognition API  
**Alternative:** Text input (current approach)

### ❌ Travel Time Calculation
**Why excluded:** Requires Google Maps API, network  
**Alternative:** Manual time blocking (current approach)

### ❌ Multi-Device Sync
**Why excluded:** Requires server/cloud backend  
**Alternative:** Single-device offline (current approach)

---

## Recommended Priority Order

### High Value, Achievable
1. **Receipt Scanning** (12-16 hours) - Saves significant time
2. **Habit Stacking Suggestions** (10-12 hours) - Improves routine building
3. **Financial Forecasting** (14-18 hours) - Helps with planning
4. **Advanced Habit Analytics** (12-16 hours) - Optimizes timing

**Total:** 48-62 hours for high-value features

### Medium Value
5. **Advanced Search Filters** (6-8 hours) - Nice but not essential
6. **Enhanced Tooltips** (8-10 hours) - Current onboarding is adequate

**Total:** 14-18 hours for medium-value features

---

## What's Missing from Structure is Grace?

Let me verify what core features from the web app aren't in Jarvis Mobile yet...

### Structure is Grace Features (Web App)

**Confirmed in Web:**
1. ✅ Dashboard (metrics, quick capture, start controls)
2. ✅ Tasks (Kanban/List/Matrix, priorities, projects)
3. ✅ Habits (tracking, streaks, heatmap)
4. ✅ Calendar (full calendar, Google sync)
5. ✅ Finance (Plaid, budgets, assets/liabilities)
6. ✅ Focus Blocks (timeboxing)
7. ✅ Pomodoro Timer
8. ✅ Journal (Idea→Action tracking)
9. ✅ OKRs (quarterly objectives)
10. ✅ Projects (project management)
11. ✅ Reviews (automated weekly/monthly)
12. ✅ AI Chat (copilot + NL capture)
13. ✅ Automation (rules engine)
14. ✅ Knowledge Base (resources, flashcards)
15. ✅ Wellbeing (mood, sleep, exercise)
16. ✅ Social (accountability partners)
17. ✅ Experiments (routine experiments)
18. ✅ Reminders (scheduled prompts)

### In Jarvis Mobile
1. ✅ Dashboard
2. ✅ Tasks
3. ✅ Habits
4. ✅ Calendar (no Google sync)
5. ✅ Finance (no Plaid)
6. ✅ Projects
7. ✅ AI Chat (basic)
8. ✅ Settings

**Missing Modules (10):**
- Focus Blocks
- Pomodoro Timer
- Journal (Idea→Action)
- OKRs
- Reviews
- Automation
- Knowledge Base
- Wellbeing
- Social
- Experiments
- Reminders

**These are major feature modules, not just nice-to-haves!**

---

## Corrected Nice-to-Haves vs Missing Modules

### Nice-to-Haves (Enhancements to Existing Features)
- Receipt scanning
- Habit stacking suggestions
- Financial forecasting
- Advanced habit analytics
- Advanced search filters
- Enhanced tooltips

### Missing Core Modules (From Web App)
- Focus Blocks (timeboxing for deep work)
- Pomodoro Timer (25/5/15 cycles)
- Journal (Idea→Action latency tracking)
- OKRs (quarterly objectives & key results)
- Reviews (automated weekly/monthly reviews)
- Automation (rules engine, triggers)
- Knowledge Base (resources, reading, flashcards)
- Wellbeing (mood, sleep, exercise tracking)
- Social (accountability partners, recaps)
- Experiments (routine experiments)
- Reminders (scheduled prompts with test-fire)

**These are substantial features, not polish items.**

---

## Recommendation

**Don't conflate nice-to-haves with missing modules.**

**Nice-to-haves:** Enhancements to existing features (receipt scanning, forecasting, etc.)  
**Missing modules:** Entire feature sets from web app (Focus, Pomodoro, Journal, OKRs, etc.)

If you want feature parity with Structure is Grace web app, you need to build the 10 missing modules (estimated 200-300 hours).

If you want a polished mobile app with current features, focus on the 6 nice-to-have enhancements (estimated 62-80 hours).

---

**Report prepared by:** Madam Claudia  
**Date:** December 15, 2025
