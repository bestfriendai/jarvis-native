# Finance Form Ghosting / Duplicate Form Bug

**Reported by:** Madam Claudia
**Date:** December 18, 2025
**Status:** Needs investigation

## Summary
After entering data in the Finance liability form and dismissing the keyboard, a duplicate version of the form reportedly appears (not just duplicate text). A similar occurrence was seen once on the Tasks page. No code changes have been applied per request; this document captures the issue for follow-up.

## Reproduction (as reported)
1. Open Finance page.
2. Add a liability and enter data.
3. Dismiss the keyboard.
4. Observe that the form duplicates or overlays itself ("duplicate form"), rather than duplicating input text.

## Scope Observed
- Primary: Finance liability form modal.
- Secondary (one-off): Tasks modal.

## Suspected Areas (hypotheses)
- Modal duplication or double-render triggered by state toggles when keyboard hides.
- KeyboardAvoidingView / ScrollView layout causing an extra render that overlays an existing modal.
- Possibly multiple modal instances keyed on the same visibility state without stable keys.
- Autofocus or `keyboardShouldPersistTaps` side-effects when dismissing keyboard could trigger a re-mount.

## Next Steps
- Instrument Finance and Tasks modals: add a temporary console log with modal instance IDs to confirm duplicate mounts.
- Verify modal `visible` state transitions and ensure only one instance is rendered.
- Check for nested modals or conditionally rendered components that might re-render the same form twice when keyboard dismisses.
- Reproduce on the device where it occurred (note platform/device details).
- If confirmed, stabilize by ensuring a single modal instance with stable keys and guarding against repeated `setShow*Modal(true)` calls during onBlur/keyboard events.

## Notes
- The liabilities amount display bug (extra zeros) is already fixed in code (`formatCurrency` normalizes cents to dollars). No additional UI/input changes were made in this pass per request.
