## Settings Screen Review & Recommendations

**Scope:** UX/UI assessment of `SettingsScreen.tsx` against project goals (polished offline-first personal app).

### Strengths
- Clear sections (Database, Account, Notifications, App Info, Privacy, Logout) with consistent tokens/colors/spacing. @src/screens/main/SettingsScreen.tsx#240-415
- Database stats, export, and clear flows with confirmation. @src/screens/main/SettingsScreen.tsx#250-305
- Privacy messaging emphasizes local/offline data. @src/screens/main/SettingsScreen.tsx#382-393
- Theme tokens used (no hardcoded colors). @src/screens/main/SettingsScreen.tsx#420-562

### Gaps / Risks
- No theme selector despite theme system (can’t choose Whoop/Light themes).
- “Clear All Data” is near other items and uses a single confirm.
- Export copies JSON to clipboard only; no share/save options.
- Notifications toggle doesn’t reflect real permission state.
- Long scroll with no quick navigation/anchors.
- Version/build hardcoded (1.0.0) may drift from actual build.

### Recommendations (prioritized)
1) **Theme selector (Appearance section):** List Default/Whoop/Light with radio + preview; persist and apply instantly.
2) **Stronger friction for destructive actions:** Move “Clear All Data” to bottom; require second confirm (type “DELETE” or double confirm).
3) **Better export UX:** Add “Share JSON” (Share API) and “Save to file” if allowed; show file size and record count before export.
4) **Accurate notifications toggle:** Reflect permission state; prompt request on toggle; show “Not allowed” if denied.
5) **Navigation/structure:** Add quick links or sticky section headers; optionally collapse low-use sections (App Info, Privacy).
6) **Auto-fill version/build:** Read from app config instead of hardcoding.
