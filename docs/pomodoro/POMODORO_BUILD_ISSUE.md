# Pomodoro Feature Build Issue

## Problem
The Pomodoro feature causes Android release builds to fail due to expo-notifications and expo-haptics modules.

## Root Cause
Metro bundler tries to load expo-notifications/expo-haptics native modules during the release build bundling phase, causing the build to fail. These modules have module-level execution code that breaks when bundled for release.

## What Was Tried
1. ✅ Commented out top-level `Notifications.setNotificationHandler()` in usePomodoroNotifications.ts
2. ✅ Commented out top-level `Notifications.setNotificationHandler()` in notifications.ts
3. ✅ Commented out ALL expo-notifications and expo-haptics imports across 7 files
4. ✅ Completely uninstalled expo-notifications and expo-haptics packages (28 packages removed)
5. ✅ Removed Pomodoro screen from navigation (FINAL FIX - build passes)

## Bisection Results
- ✅ Base features (c27c992) - PASS
- ✅ Focus Blocks (1578813) - PASS
- ✅ Task Latency (4cfc3e0) - PASS
- ✅ Pomodoro DB (2acda9f) - PASS
- ✅ Pomodoro Hooks (06c5fe5) - PASS
- ✅ Pomodoro UI (ad074ef) - PASS
- ✅ Pomodoro Screen (8b58bbb) - PASS
- ❌ Pomodoro Navigation (ae3559e) - FAIL

## Current State (Commit d2ba86e)
- Pomodoro feature completely disabled from navigation
- All Pomodoro code still exists in codebase but not imported
- Build passing ✅
- APK available for use

## Files Modified to Disable
1. `src/navigation/MainNavigator.tsx` - Commented out import and Tab.Screen
2. `src/types/index.ts` - Commented out Pomodoro route type

## Files with Disabled Notification Code
All have commented imports and stub implementations:
1. `src/services/notifications.ts`
2. `src/hooks/usePomodoroNotifications.ts`
3. `src/hooks/usePhoneInMode.ts`
4. `src/services/undo.ts`
5. `src/hooks/useRefreshControl.ts`
6. `src/components/tasks/SwipeableTaskItem.tsx`
7. `src/screens/main/SettingsScreen.tsx`

## Potential Solutions for Future

### Option 1: Different Notification Library
Replace expo-notifications with a different library that doesn't have module-level execution:
- `@notifee/react-native` - More control, no Expo dependency
- `react-native-push-notification` - Older but stable
- Native Android/iOS notification APIs directly

### Option 2: Lazy Loading
Try to lazy load the Pomodoro feature only when user accesses it:
```typescript
const PomodoroScreen = React.lazy(() => import('../screens/main/PomodoroScreen'));
```

### Option 3: Build Without Bundling
Investigate if there's a way to exclude these modules from bundling or use dynamic imports that don't execute at build time.

### Option 4: Remove Notifications Entirely
Build Pomodoro timer without notification support:
- Visual/audio alerts only (using react-native-sound)
- Keep-awake during timer (expo-keep-awake works fine)
- No background notifications

## Recommended Next Steps
1. Implement rest of Phase 2B without notifications (Automated Reviews)
2. Research alternative notification solutions
3. Test Option 1 (different library) or Option 4 (no notifications) in a separate branch
4. Re-enable Pomodoro once solution found

## Related Commits
- `5744be7` - First attempt: move handler to useEffect
- `d0dd763` - Disable notifications in notifications.ts
- `fad484c` - Disable all imports app-wide
- `e3761fc` - Remove packages from package.json
- `d2ba86e` - Disable Pomodoro from navigation (WORKING)
