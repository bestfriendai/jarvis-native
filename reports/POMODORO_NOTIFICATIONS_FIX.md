# Pomodoro Notifications Build Fix (Android Release)

**Prepared by:** Madam Claudia  
**Date:** 2025-12-17

## Diagnosis (what the team already found)
- Release builds fail when Pomodoro is imported by `MainNavigator` because the import chain reaches `usePomodoroNotifications` → `expo-notifications` / `expo-haptics`, which execute module-level code during bundling.
- Removing Pomodoro from navigation makes the build pass; all other attempts (moving handlers, commenting imports, uninstalling packages) failed.

## Recommended Solution (do this): Migrate to @notifee/react-native
Notifee avoids the module-level initialization that breaks Metro in release builds.

### Steps
1) Remove Expo notification/haptics packages (and clean install):
   ```bash
   npm uninstall expo-notifications expo-haptics
   npm install @notifee/react-native react-native-sound
   # iOS only: npx pod-install
   ```

2) Refactor notification code to Notifee:
   - File to update: `src/hooks/usePomodoroNotifications.ts`
   - Replace all `expo-notifications` APIs with Notifee equivalents:
     - Permission: `await notifee.requestPermission()`
     - Channel: `await notifee.createChannel({ id: 'pomodoro', name: 'Pomodoro' })`
     - Schedule: `await notifee.createTriggerNotification({ ... }, trigger)`
     - Cancel: `await notifee.cancelNotification(id)` / `cancelAllNotifications()`
   - Replace haptics calls with either:
     - `react-native-sound` for audio cues, or
     - keep simple UI/visual cues (no haptics) to minimize surface area.

3) Remove/replace any remaining imports:
   - `src/services/notifications.ts` (if still present) → switch to Notifee or stub out.
   - Other files that referenced `expo-haptics` (refresh control, swipe, undo) → remove haptics or replace with lightweight alternatives.

4) Re-enable Pomodoro in navigation after refactor:
   - `src/navigation/MainNavigator.tsx`: uncomment import + Tab.Screen.
   - `src/types/index.ts`: uncomment `Pomodoro` route type.

5) Clean build and test:
   ```bash
   npm install  # ensure lock is consistent after package changes
   cd android
   ./gradlew clean
   ./gradlew assembleRelease --stacktrace
   ```

## Why this works
- Notifee does not run heavy module-level code at import time, so Metro’s release bundling won’t fail when Pomodoro is imported by navigation.
- Removing `expo-notifications`/`expo-haptics` eliminates the problematic initialization path identified in bisection.

## If Notifee is too heavy (fallback)
- Remove system notifications entirely for Pomodoro and use in-app alerts only:
  - Use `react-native-sound` for timer end sounds.
  - Use existing UI banners/modals; keep `expo-keep-awake` if desired.
  - Skip background/lock-screen notifications. This path should also bundle cleanly.

## Minimal acceptance test
1) After migration, re-enable Pomodoro in navigation.
2) Run `./gradlew assembleRelease` (no Metro/Node errors).
3) Install APK; start a Pomodoro; verify:
   - Timer runs.
   - End-of-session alert (sound or in-app banner) fires.
   - App does not crash on start or when opening Pomodoro tab.

## Notes
- Avoid lazy/dynamic import hacks; they were unproven and add complexity. Migration is the reliable fix.
- If you encounter a Notifee-specific build error, capture the first stack trace line in the Gradle/Metro log—it will identify missing Android setup, which we can address separately.
