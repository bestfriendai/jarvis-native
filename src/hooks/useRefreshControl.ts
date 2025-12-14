/**
 * useRefreshControl Hook
 * Standardized pull-to-refresh behavior with haptics and timestamp tracking
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface UseRefreshControlOptions {
  screenName: string;
  onRefresh: () => Promise<void>;
}

interface UseRefreshControlReturn {
  refreshing: boolean;
  handleRefresh: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Hook to manage pull-to-refresh state with consistent behavior
 * - Haptic feedback on refresh start
 * - AsyncStorage persistence of last updated timestamp
 * - Consistent refresh control props
 */
export function useRefreshControl({
  screenName,
  onRefresh,
}: UseRefreshControlOptions): UseRefreshControlReturn {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Storage key for this screen's last refresh timestamp
  const storageKey = `@jarvis:last_refresh:${screenName}`;

  /**
   * Load last updated timestamp from AsyncStorage
   */
  const loadLastUpdated = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        setLastUpdated(new Date(stored));
      }
    } catch (error) {
      console.warn(`[useRefreshControl] Failed to load last updated for ${screenName}:`, error);
    }
  }, [storageKey, screenName]);

  /**
   * Handle refresh with haptic feedback and timestamp update
   */
  const handleRefresh = useCallback(async () => {
    // Prevent multiple simultaneous refreshes
    if (refreshing) return;

    setRefreshing(true);

    // Trigger haptic feedback on refresh start
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('[useRefreshControl] Haptic feedback failed:', error);
    }

    try {
      // Execute the actual refresh logic
      await onRefresh();

      // Update last refreshed timestamp
      const now = new Date();
      setLastUpdated(now);

      // Persist to AsyncStorage
      await AsyncStorage.setItem(storageKey, now.toISOString());
    } catch (error) {
      console.error(`[useRefreshControl] Refresh failed for ${screenName}:`, error);
      // Don't throw - let the screen handle errors
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, onRefresh, storageKey, screenName]);

  // Load last updated timestamp on mount
  useEffect(() => {
    loadLastUpdated();
  }, [loadLastUpdated]);

  return {
    refreshing,
    handleRefresh,
    lastUpdated,
  };
}
