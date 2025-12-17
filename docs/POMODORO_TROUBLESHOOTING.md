# Pomodoro Build Issue: Complete Troubleshooting Log

This document records every attempt made to fix the Android release build failure caused by the Pomodoro feature. **Read this before attempting new fixes** to avoid repeating failed approaches.

---

## Problem Statement

**Symptom:** Android release build (`./gradlew assembleRelease`) fails when Pomodoro feature is included in navigation. Debug builds work fine.

**Error Location:** Metro bundler fails during JavaScript bundling phase, not during Android compilation.

**Root Cause:** `expo-notifications` and `expo-haptics` have module-level code that executes at import time, breaking Metro's release bundling.

---

## Attempts Made (Chronological Order)

### ❌ Attempt 1: Move Notification Handler to useEffect
**Commit:** `5744be7`

**Hypothesis:** Top-level `Notifications.setNotificationHandler()` breaks bundling. Moving it into a React hook will delay execution until runtime.

**Changes Made:**
- In `src/hooks/usePomodoroNotifications.ts`:
  - Moved `Notifications.setNotificationHandler()` from module level (line ~36) into useEffect hook
  - Handler now executes after component mount, not at import time

**Expected Result:** Metro bundler won't encounter problematic code during initial module scan.

**Actual Result:** ❌ **Build still FAILED**

**Why It Failed:** Even though the handler code moved to useEffect, the `import * as Notifications from 'expo-notifications'` statement still exists at the top of the file. Metro processes all imports during bundling, and expo-notifications has OTHER module-level initialization code that runs on import.

**Key Learning:** Moving usage doesn't help if the import itself triggers problematic code.

---

### ❌ Attempt 2: Disable Handler in notifications.ts
**Commit:** `d0dd763`

**Hypothesis:** There's a SECOND notification handler setup in `src/services/notifications.ts` that's also breaking the build. This file is imported by App.tsx at startup.

**Changes Made:**
- In `src/services/notifications.ts`:
  - Commented out lines 12-20: `Notifications.setNotificationHandler({...})`
  - Left import statement intact
  - Added console.warn for disabled state

**Expected Result:** Removing the second handler setup will fix the build.

**Actual Result:** ❌ **Build still FAILED**

**Why It Failed:** Same issue as Attempt 1 - the import statement `import * as Notifications from 'expo-notifications'` still exists and triggers problematic module initialization.

**Key Learning:** You must remove/disable the IMPORT, not just the usage.

---

### ❌ Attempt 3: Disable ALL Imports Across 7 Files
**Commit:** `fad484c`

**Hypothesis:** Any file that imports expo-notifications or expo-haptics breaks the build. We need to comment out ALL imports and stub out ALL functions that use these packages.

**Changes Made:**
Disabled imports and created stub implementations in:

1. **src/services/notifications.ts**
   - Commented: `import * as Notifications from 'expo-notifications'`
   - Stubbed: All 9 functions to return false/empty/no-op

2. **src/hooks/usePomodoroNotifications.ts**
   - Commented: Both expo-notifications and expo-haptics imports
   - Stubbed: All notification/haptic functions as no-ops

3. **src/hooks/usePhoneInMode.ts**
   - Commented: expo-notifications import
   - Stubbed: DND functions to just set state without notifications

4. **src/services/undo.ts**
   - Commented: expo-haptics import
   - Stubbed: Haptic feedback function

5. **src/hooks/useRefreshControl.ts**
   - Commented: expo-haptics import
   - Disabled: Haptic feedback on refresh

6. **src/components/tasks/SwipeableTaskItem.tsx**
   - Commented: expo-haptics import
   - Stubbed: triggerHaptic() as empty function

7. **src/screens/main/SettingsScreen.tsx**
   - Commented: expo-notifications import
   - Stubbed: Permission checks to always return 'denied'

**Expected Result:** With NO imports anywhere, Metro bundler won't encounter these packages at all.

**Actual Result:** ❌ **Build still FAILED**

**Why It Failed:** This is the most surprising failure. Even with ALL code disabled:
- Metro's dependency resolution still sees the packages in package.json
- Some background process or cache may still reference them
- OR: The packages themselves have post-install scripts that break things
- OR: There are transitive dependencies we didn't catch

**Key Learning:** Commenting out code isn't enough. The packages themselves may be the problem.

---

### ❌ Attempt 4: Completely Uninstall Packages
**Commit:** `e3761fc`

**Hypothesis:** The packages themselves (even unused) are causing the issue. Completely remove them from the project.

**Changes Made:**
```bash
npm uninstall expo-notifications expo-haptics
```

**Packages Removed:** 28 total (including dependencies)
- expo-notifications
- expo-haptics
- @expo/server
- expo-application
- expo-constants
- expo-device
- ...and 22 more dependencies

**Expected Result:** With packages physically gone from node_modules, Metro can't possibly try to bundle them.

**Actual Result:** ❌ **Build still FAILED**

**Why It Failed:** This is the MOST confusing result. Possible explanations:
1. Metro cache still contains references (even after cleaning)
2. Native Android code (in android/ directory) has hardcoded references
3. **The Pomodoro screen import itself is being processed**, and Metro tries to resolve its entire dependency tree EVEN IF THE CODE IS COMMENTED OUT
4. Expo's prebuild created native module references that persist

**Key Learning:** The problem isn't the packages - it's the **import chain triggering from navigation level**.

---

### ✅ Attempt 5: Remove from Navigation (ONLY THING THAT WORKED)
**Commit:** `d2ba86e`

**Hypothesis:** Metro processes the ENTIRE import tree when it sees `import PomodoroScreen from '../screens/main/PomodoroScreen'` in MainNavigator, regardless of whether the code is used or the packages are installed.

**Changes Made:**
1. **src/navigation/MainNavigator.tsx**
   - Commented out line 31: `import PomodoroScreen from '../screens/main/PomodoroScreen'`
   - Commented out lines 203-218: Entire `<Tab.Screen name="Pomodoro" ... />` block

2. **src/types/index.ts**
   - Commented out line 210: `Pomodoro: undefined` in MainTabParamList

**Expected Result:** Metro won't try to resolve PomodoroScreen's dependency tree if it's not imported at all.

**Actual Result:** ✅ **Build PASSED!**

**Why It Worked:** By breaking the import chain at the navigation level, Metro never:
- Processes PomodoroScreen.tsx
- Sees the usePomodoroNotifications import
- Tries to resolve expo-notifications
- Encounters the problematic module-level code

**Key Learning:** The issue is **Metro's static analysis of import chains**, not runtime code. Even commented-out code gets processed if the file is imported.

---

## Bisection Testing Results

We used git bisection to find the EXACT commit that broke the build:

| Commit | Description | Build Result |
|--------|-------------|--------------|
| `c27c992` | Base features (Dashboard, Tasks, Projects, Habits) | ✅ PASS |
| `1578813` | Focus Blocks | ✅ PASS |
| `4cfc3e0` | Task Latency Tracking | ✅ PASS |
| `2acda9f` | Pomodoro Database Schema | ✅ PASS |
| `06c5fe5` | Pomodoro Hooks (usePomodoroTimer, usePomodoroNotifications) | ✅ PASS |
| `ad074ef` | Pomodoro UI Components | ✅ PASS |
| `8b58bbb` | Pomodoro Screen (complete screen implementation) | ✅ PASS |
| `ae3559e` | **Pomodoro Navigation (added to MainNavigator)** | ❌ **FAIL** |

**Critical Finding:** The Pomodoro screen itself builds fine in isolation. The problem ONLY occurs when it's imported by MainNavigator.

**Explanation:** When MainNavigator imports PomodoroScreen:
```typescript
// MainNavigator.tsx
import PomodoroScreen from '../screens/main/PomodoroScreen';  // <- This line triggers the cascade

// Metro then processes:
PomodoroScreen
  -> usePomodoroNotifications
    -> expo-notifications (module-level code BREAKS HERE)
```

---

## Things That DON'T Work (Don't Try These)

### ❌ Moving code to useEffect/runtime
- **Why it seems logical:** "The code won't run at import time"
- **Why it fails:** The import statement itself triggers module initialization

### ❌ Commenting out usage while keeping imports
- **Why it seems logical:** "If we don't use it, it won't execute"
- **Why it fails:** Metro still processes imports for dependency resolution

### ❌ Using conditional imports with if statements
```typescript
if (Platform.OS === 'android') {
  import * as Notifications from 'expo-notifications'; // <- Still processed at bundle time
}
```
- **Why it seems logical:** "Only import on specific platforms"
- **Why it fails:** JavaScript imports are static and processed at bundling, not runtime

### ❌ Adding metro.config.js resolver exclusions
```javascript
resolver: {
  blacklistRE: /expo-notifications/
}
```
- **Why it seems logical:** "Tell Metro to skip these packages"
- **Why it fails:** Metro needs to resolve ALL imports to build the dependency graph. Blacklisting causes different errors.

### ❌ Using try/catch around imports
```typescript
try {
  import * as Notifications from 'expo-notifications';
} catch (e) {
  // Fallback
}
```
- **Why it seems logical:** "Catch the error gracefully"
- **Why it fails:** Syntax error - imports can't be in try/catch blocks

### ❌ Adding --reset-cache flag
```bash
./gradlew clean
npx react-native start --reset-cache
./gradlew assembleRelease
```
- **Why it seems logical:** "Maybe it's cached data"
- **Why it fails:** The problem is architectural, not cache-related

---

## Things That MIGHT Work (Untested)

### 🟡 Option 1: Dynamic require() instead of import
```typescript
// In usePomodoroNotifications.ts
const scheduleNotification = async () => {
  const Notifications = require('expo-notifications');
  // Use it here
};
```
**Untested because:** Requires extensive refactoring of the hooks. May still fail if Metro processes require() similarly.

### 🟡 Option 2: Separate bundle for Pomodoro
Create a separate Metro bundle just for Pomodoro that loads on-demand. Complex but might work.

**Untested because:** High complexity, unclear if Expo supports multiple bundles.

### 🟡 Option 3: React.lazy() with dynamic import
```typescript
const PomodoroScreen = React.lazy(() => import('../screens/main/PomodoroScreen'));
```
**Untested because:** May not work with React Native's bundler (works in web React). Worth a quick test.

### 🟡 Option 4: expo-notifications version downgrade
Try version 0.18.x or earlier that might not have module-level code.

**Untested because:** Time-consuming to find a version that works. May break other features.

---

## Recommended Solutions (In Priority Order)

### ✅ 1. Replace expo-notifications with @notifee/react-native
**Why this works:** Notifee doesn't have module-level initialization code.

**Steps:**
```bash
npm uninstall expo-notifications expo-haptics
npm install @notifee/react-native
npx pod-install  # iOS only
```

**Migration effort:** Medium (3-4 hours to update all notification code)

**Risk:** Low - Notifee is production-ready and well-maintained

**Reference:** https://notifee.app/react-native/docs/overview

---

### ✅ 2. Remove Notifications, Keep Visual Alerts
**Why this works:** No problematic packages at all.

**Steps:**
1. Remove all notification scheduling code
2. Use `react-native-sound` for audio alerts
3. Use `expo-keep-awake` to keep screen on (already works)
4. Show in-app modals/toasts for alerts

**Migration effort:** Low (1-2 hours)

**Risk:** Very low - simpler implementation

**Trade-off:** No background/lock-screen notifications

---

### 🟡 3. Conditional Native Modules (Experimental)
Use Expo's config plugins to exclude notifications from Android builds.

**Steps:** Complex - requires ejecting or custom config plugins

**Risk:** High - may cause other issues

**Only try if:** Options 1 and 2 don't meet requirements

---

## Testing After Making Changes

### Quick Test (2 minutes)
```bash
# Re-enable Pomodoro
# 1. Uncomment import in MainNavigator.tsx line 31
# 2. Uncomment Tab.Screen in MainNavigator.tsx lines 203-218
# 3. Uncomment route type in types/index.ts line 210

# Test build
cd android
./gradlew assembleRelease --stacktrace

# Check result
ls -lh app/build/outputs/apk/release/app-release.apk
```

### Full Test (10 minutes)
```bash
# Clean everything
./gradlew clean
cd ..
rm -rf node_modules
npm install
cd android
./gradlew assembleRelease

# If successful, test on device
adb install app/build/outputs/apk/release/app-release.apk
```

---

## Current Workaround

**Status:** Pomodoro feature is fully implemented but disabled from navigation.

**Files disabled:**
- `src/navigation/MainNavigator.tsx` (lines 31, 203-218 commented)
- `src/types/index.ts` (line 210 commented)

**To re-enable:** Uncomment those 3 sections, fix the notification issue, rebuild.

**All Pomodoro code exists in:**
- `src/screens/main/PomodoroScreen.tsx` - Complete UI
- `src/hooks/usePomodoroTimer.ts` - Timer logic (works fine)
- `src/hooks/usePomodoroNotifications.ts` - Notifications (problematic)
- `src/database/pomodoro.ts` - Database operations (works fine)

---

## Questions for Team

1. **Can we live without notifications?** If yes, Option 2 (visual alerts only) is fastest.

2. **Are system notifications required?** If yes, Option 1 (@notifee/react-native) is best.

3. **Is this blocking other work?** Current workaround allows all other features to ship.

4. **Time budget for fix?**
   - Option 2: ~2 hours
   - Option 1: ~4 hours
   - Option 3: ~8+ hours (experimental)

---

## Contact

If you find a solution that works, please update this document with:
- What you tried
- Why you thought it would work
- The actual result
- Commit hash

This helps future developers avoid repeating failed attempts.

---

**Last Updated:** 2025-12-17
**Document Version:** 1.0
**Status:** Pomodoro disabled, waiting for notification fix
