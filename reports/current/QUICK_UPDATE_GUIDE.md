# Quick Update Guide for Remaining Screens

## How to Apply Theme to Any Screen (5-Minute Process)

### Step 1: Add Imports
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, textStyles, cardStyle, inputStyle, shadows } from '../../theme';
```

### Step 2: Add Safe Area Hook
```typescript
export default function YourScreen() {
  const insets = useSafeAreaInsets();
  // ... rest of component
}
```

### Step 3: Update Styles - Search & Replace

**Colors:**
- Replace: `backgroundColor: '#0F172A'` → `backgroundColor: colors.background.primary`
- Replace: `backgroundColor: '#1E293B'` → `backgroundColor: colors.background.secondary`
- Replace: `color: '#FFFFFF'` → `color: colors.text.primary`
- Replace: `color: '#94A3B8'` → `color: colors.text.secondary`
- Replace: `color: '#64748B'` → `color: colors.text.tertiary`
- Replace: `backgroundColor: '#10B981'` → `backgroundColor: colors.accent.primary`
- Replace: `placeholderTextColor="#64748B"` → `placeholderTextColor={colors.text.placeholder}`

**Spacing:**
- Replace: `padding: 20` → `padding: spacing.lg`
- Replace: `padding: 16` → `padding: spacing.base`
- Replace: `padding: 12` → `padding: spacing.md`
- Replace: `gap: 14` → `gap: spacing.md`
- Replace: `marginBottom: 20` → `marginBottom: spacing.lg`

**Border Radius:**
- Replace: `borderRadius: 16` → `borderRadius: borderRadius.xl`
- Replace: `borderRadius: 14` → `borderRadius: borderRadius.lg`
- Replace: `borderRadius: 12` → `borderRadius: borderRadius.md`

**Typography:**
- Title styles: `...textStyles.h2` or `...textStyles.h3`
- Body text: `...textStyles.body`
- Labels: `...textStyles.label`
- Add: `fontWeight: typography.weight.semibold` where needed

**Cards:**
- Replace entire card style with: `...cardStyle`

**Inputs:**
- Replace entire input style with: `...inputStyle`

### Step 4: Apply Safe Areas

**For ScrollViews:**
```typescript
<ScrollView
  contentContainerStyle={{
    paddingBottom: insets.bottom + spacing.xl,
    paddingTop: spacing.sm
  }}
>
```

**For Modals:**
```typescript
<Modal visible={visible} transparent animationType="slide">
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
      {/* Content */}
    </View>
  </KeyboardAvoidingView>
</Modal>
```

## Example: Converting HabitsScreen

### Before:
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  habitCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 20,
  },
});
```

### After:
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  title: {
    ...textStyles.h2,
  },
  habitCard: {
    ...cardStyle,
    padding: spacing.lg,
  },
});
```

## Checklist for Each Screen

- [ ] Import theme + useSafeAreaInsets
- [ ] Add `const insets = useSafeAreaInsets();`
- [ ] Update all colors to theme tokens
- [ ] Update all spacing to theme tokens
- [ ] Update typography with textStyles
- [ ] Apply safe area padding to ScrollView
- [ ] Apply safe area padding to modals
- [ ] Add KeyboardAvoidingView to input modals
- [ ] Test on device with notch

## Time Estimate

- HabitsScreen: ~5 minutes
- CalendarScreen: ~5 minutes
- FinanceScreen: ~5 minutes
- SettingsScreen: ~3 minutes (lighter UI)
- LoginScreen: ~4 minutes
- RegisterScreen: ~4 minutes

**Total: ~26 minutes to complete all remaining screens**

## Priority Order

1. **HabitsScreen** - Has modals with input forms
2. **LoginScreen** - First user interaction
3. **RegisterScreen** - User onboarding
4. **FinanceScreen** - Complex data display
5. **CalendarScreen** - Date inputs
6. **SettingsScreen** - Simple list

## Common Gotchas

1. **Don't forget KeyboardAvoidingView imports:**
   ```typescript
   import { KeyboardAvoidingView, Platform } from 'react-native';
   ```

2. **Modal overlay needs proper z-index:**
   ```typescript
   backgroundColor: 'rgba(0, 0, 0, 0.75)' // Darker overlay
   ```

3. **Input fields need proper line height:**
   ```typescript
   lineHeight: typography.size.base * typography.lineHeight.relaxed
   ```

4. **Placeholder colors must use theme:**
   ```typescript
   placeholderTextColor={colors.text.placeholder}
   ```

Ready to make this app look AMAZING!
