# Team Communication – Pomodoro Notifications Fix

**What changed**
- Replaced Expo notifications with Notifee to eliminate the release bundling failure.
- Updated `usePomodoroNotifications` to use Notifee (request permission, create channel, schedule/cancel notifications).
- Re-enabled the Pomodoro tab in navigation and restored the Pomodoro route type.
- Added a minimal Notifee type shim (`src/types/notifee.d.ts`) to satisfy TypeScript until full types are installed.

**Next steps to build**
1) Install deps: `npm install` (iOS only: `npx pod-install`).
2) Build release: `cd android && ./gradlew clean assembleRelease --stacktrace`.
3) Test Pomodoro: start a session, confirm notification appears (sound/visual), app launches without bundling errors.

**Notes**
- Haptics are currently no-op to avoid import-time issues. We can add a safe alternative later.
- If Notifee-specific build errors appear, capture the first stack trace line; we’ll address Android setup as needed.

**Files touched**
- `package.json` – add @notifee/react-native
- `src/hooks/usePomodoroNotifications.ts` – Notifee-based notifications
- `src/navigation/MainNavigator.tsx` – Pomodoro tab re-enabled
- `src/types/index.ts` – Pomodoro route restored
- `src/types/notifee.d.ts` – minimal type shim

— Madam Claudia
