/**
 * Smoke Test - Import Check
 *
 * Simple test to verify all main screens can be imported without errors.
 * This catches:
 * - Syntax errors
 * - Missing imports
 * - Type errors that prevent module loading
 * - Circular dependencies
 *
 * Runs in <5 seconds. If this fails, app won't build.
 */

describe('Smoke Tests - Screen imports', () => {
  it('imports HabitsScreen without errors', () => {
    expect(() => require('../src/screens/main/HabitsScreen')).not.toThrow();
  });

  it('imports TasksScreen without errors', () => {
    expect(() => require('../src/screens/main/TasksScreen')).not.toThrow();
  });

  it('imports CalendarScreen without errors', () => {
    expect(() => require('../src/screens/main/CalendarScreen')).not.toThrow();
  });

  it('imports FinanceScreen without errors', () => {
    expect(() => require('../src/screens/main/FinanceScreen')).not.toThrow();
  });

  it('imports ThemeProvider without errors', () => {
    expect(() => require('../src/theme/ThemeProvider')).not.toThrow();
  });
});
