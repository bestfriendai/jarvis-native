## Jarvis Native UI/UX Improvement Report (from Cody High)

### Top Priorities
1. **Navigation clarity**  
   - Ensure bottom tabs and key screens are reachable in ≤2 taps.  
   - Add consistent headers with clear titles and back buttons.
2. **Visual hierarchy & typography**  
   - Pick one font pair and use a consistent type scale (H1/H2/H3/body/small).  
   - Increase contrast for titles and primary actions; lighten secondary text.
3. **Spacing & layout**  
   - Apply consistent spacing tokens (e.g., 8/12/16/24) and stick to them.  
   - Add breathing room around cards and lists; avoid edge-to-edge text.
4. **Buttons & states**  
   - Primary CTA color consistent across app.  
   - Distinct states: default, pressed, disabled, loading.
5. **Empty, loading, error states**  
   - Empty: friendly icon + short guidance + primary action.  
   - Loading: skeletons/spinners with short copy (e.g., “Fetching your schedule…”).  
   - Errors: inline messages + retry; avoid generic toasts for critical flows.
6. **Forms & inputs**  
   - Label + helper/error text; never rely only on placeholder.  
   - Larger touch targets (min 44px height) and clear focus/active states.
7. **Feedback & toasts**  
   - Use toasts sparingly; prefer inline success/error for critical actions.  
   - For destructive actions, show confirm sheet/modal.
8. **Accessibility**  
   - Contrast meets WCAG AA for text/icons.  
   - Touch targets ≥44x44; proper hit slop on icons.  
   - Respect system font scaling.
9. **Performance & polish**  
   - Use image placeholders; defer non-critical fetches until after first paint.  
   - Keep lists smooth: FlatList with proper keys; avoid heavy renders.
10. **Design system**  
    - Define tokens: colors, typography scale, spacing, radius, shadows, z-index.  
    - Component library: Button, Card, Chip, Input, Toast, Modal, ListItem.  
    - Create a simple theme file and use it everywhere (light now; add dark later).

### Quick Wins (this week)
- Standardize CTA color (e.g., `#10B981`) and apply to all primary buttons.  
- Increase body text size to 15–16px; raise contrast on secondary text.  
- Add consistent padding to screens (e.g., 16–20px) and cards.  
- Add empty/loading/error patterns to Calendar, Tasks, Habits, and Finance lists.  
- Add pressed/disabled states to IconButtons and Chips.  
- Ensure all icons + hit areas are ≥44px.

### Near-term (next sprint)
- Build a theme file (colors/spacing/type) and wrap components with it.  
- Create reusable components: `AppButton`, `AppInput`, `Card`, `Toast`, `EmptyState`, `ErrorState`, `Skeleton`.  
- Introduce a layout grid (e.g., 4pt/8pt base) and standard margins.

### Longer-term
- Add dark mode via theme toggle.  
- Create a UI documentation page for the team (tokens + component examples).  
- Run a quick usability pass on key flows (auth, creating tasks/events, settings).

### Recommended first implementation step
Codify a theme file and small component set (Button/Input/Card/EmptyState) to give the team a solid foundation; apply tokens app-wide.
