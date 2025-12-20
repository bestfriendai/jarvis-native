/**
 * Clipboard Wrapper for Expo Go Compatibility
 * Uses Expo's clipboard when available, falls back to mock
 */

import * as ExpoClipboard from 'expo-clipboard';

// Expo Go has expo-clipboard built-in, so we can use it
export default {
  setString: async (text: string) => {
    try {
      await ExpoClipboard.setStringAsync(text);
    } catch (e) {
      console.log('[Clipboard] Failed to copy:', e);
    }
  },
  getString: async () => {
    try {
      return await ExpoClipboard.getStringAsync();
    } catch (e) {
      console.log('[Clipboard] Failed to get clipboard:', e);
      return '';
    }
  },
};
