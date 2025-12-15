# Low Priority Improvements

Items that would be nice to have but aren't critical for daily use.

---

## Settings Screen - Split into Sub-Screens

**Current State:** Settings screen works but is long; uses a single page for all controls.

**Improvement:** Move sections to dedicated sub-screens for cleaner organization:

**Main Settings Screen** (navigation only):
- ⚙️ Account Settings → `AccountSettingsScreen`
- 🎨 Appearance → `AppearanceScreen` (add Theme selector: Default/Whoop/Light)
- 🔔 Notifications → `NotificationsScreen`
  - Bind toggle to permission state; request permissions on toggle; show “Not allowed” if denied
- 💾 Data & Storage → `StorageOverview` (already exists)
- ⚙️ Data Management → (already exists)
- ℹ️ About → `AboutScreen`
  - Version/build pulled dynamically from app config
  - Privacy statement, storage mode
- 🚪 Logout (keep at bottom)

**Benefits:**
- Cleaner main Settings with just navigation
- Less scrolling; better focus per topic
- Safer placement for destructive actions

**Tasks:**
1) Create new screen files (AppearanceScreen, AccountSettingsScreen, NotificationsScreen, AboutScreen)  
2) Update SettingsNavigator with new routes  
3) Move existing sections to dedicated screens; main shows only navigation items  
4) Add Theme selector (Default/Whoop/Light) in Appearance; apply instantly and persist  
5) Add stronger friction for “Clear All Data” (double-confirm/type DELETE) and place in Data Management  
6) Export UX: add Share/Save, show size/record count before export  
7) Hook notifications toggle to real permission state  
8) Populate version/build dynamically from app config  

**Date Added:** December 13, 2025  
**Author:** Madam Claudia
