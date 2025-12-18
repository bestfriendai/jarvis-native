# For Later – Notifications Finishing Touches

## Goals
- Give users custom notification controls in Settings (per-feature toggles and sounds).
- Add haptics/sound cues safely (no import-time crashes) and keep builds stable.
- Remove temporary Notifee type shim once official types are in deps.

## Proposed tasks
1) **Settings: Custom notification controls**
   - Add Settings UI to toggle Pomodoro notification sound on/off and select a sound variant.
   - Persist preferences (existing settings store) and feed them into `usePomodoroNotifications`.
   - Optionally add a “Test notification” button to verify.

2) **Haptics/Sound implementation**
   - Wire a safe haptic helper (non-Expo, guard import-time) for start/pause/stop.
   - Optionally add `react-native-sound` playback for phase-change cues, keyed off user preference.

3) **Type cleanup**
   - Replace `src/types/notifee.d.ts` shim with official Notifee types once available in dependencies.

4) **QA checklist (when picked up)**
   - Android: foreground/background Pomodoro phase notifications respect settings; no crashes on launch/import.
   - iOS (if supported): same scenarios, ensure permission prompt flow is clean.
   - Verify Settings changes persist and immediately affect new notifications.

## Current state (reference)
- Notifee migration done; Android release build passes.
- Pomodoro tab/routes enabled; notifications work with default settings.
- Haptics currently no-op by design.

Owner: open
