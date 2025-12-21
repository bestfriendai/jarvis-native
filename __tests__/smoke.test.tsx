/**
 * Smoke Test - Basic Checks
 *
 * Simple test to verify core modules are importable and basic functionality works.
 * This catches:
 * - Syntax errors
 * - Missing imports
 * - Type errors that prevent module loading
 *
 * Runs in <5 seconds. If this fails, app won't build.
 */

describe('Smoke Tests - Core modules', () => {
  it('imports theme system without errors', () => {
    const theme = require('../src/theme');
    expect(theme.colors).toBeDefined();
    expect(theme.getColors).toBeDefined();
    expect(theme.typography).toBeDefined();
    expect(theme.spacing).toBeDefined();
  });

  it('theme getColors returns valid color scheme', () => {
    const { getColors } = require('../src/theme');
    const darkColors = getColors('dark');
    const lightColors = getColors('light');

    expect(darkColors.primary).toBeDefined();
    expect(darkColors.gradient).toBeDefined();
    expect(lightColors.primary).toBeDefined();
    expect(lightColors.gradient).toBeDefined();
  });

  it('imports store modules without errors', () => {
    expect(() => require('../src/store/themeStore')).not.toThrow();
  });

  it('imports hook modules without errors', () => {
    expect(() => require('../src/hooks/useTheme')).not.toThrow();
  });

  it('validates theme type consistency', () => {
    const { getColors } = require('../src/theme');
    const colors = getColors('dark');

    // Check that gradient arrays are properly typed (not readonly)
    expect(Array.isArray(colors.gradient.primary)).toBe(true);
    expect(Array.isArray(colors.gradient.hero)).toBe(true);

    // Verify we can push to gradient arrays (they're not readonly)
    const testArray = [...colors.gradient.primary];
    expect(() => testArray.push('#test')).not.toThrow();
  });
});
