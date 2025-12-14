/**
 * Onboarding Hook
 * Manages onboarding state using AsyncStorage
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETE_KEY = '@jarvis:onboarding_complete';
const SHOWN_TOOLTIPS_KEY = '@jarvis:shown_tooltips';

export interface OnboardingState {
  isOnboardingComplete: boolean;
  shownTooltips: string[];
  isLoading: boolean;
}

export interface OnboardingActions {
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  markTooltipShown: (tooltipId: string) => Promise<void>;
  hasShownTooltip: (tooltipId: string) => boolean;
}

export function useOnboarding(): OnboardingState & OnboardingActions {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [shownTooltips, setShownTooltips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding state on mount
  useEffect(() => {
    loadOnboardingState();
  }, []);

  /**
   * Load onboarding state from AsyncStorage
   */
  const loadOnboardingState = async () => {
    try {
      const [onboardingComplete, tooltipsData] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY),
        AsyncStorage.getItem(SHOWN_TOOLTIPS_KEY),
      ]);

      setIsOnboardingComplete(onboardingComplete === 'true');
      setShownTooltips(tooltipsData ? JSON.parse(tooltipsData) : []);
    } catch (error) {
      console.error('[useOnboarding] Failed to load state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mark onboarding as complete
   */
  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      setIsOnboardingComplete(true);
      console.log('[useOnboarding] Onboarding completed');
    } catch (error) {
      console.error('[useOnboarding] Failed to complete onboarding:', error);
      throw error;
    }
  }, []);

  /**
   * Reset onboarding state (for testing/demo purposes)
   */
  const resetOnboarding = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY),
        AsyncStorage.removeItem(SHOWN_TOOLTIPS_KEY),
      ]);
      setIsOnboardingComplete(false);
      setShownTooltips([]);
      console.log('[useOnboarding] Onboarding reset');
    } catch (error) {
      console.error('[useOnboarding] Failed to reset onboarding:', error);
      throw error;
    }
  }, []);

  /**
   * Mark a tooltip as shown
   */
  const markTooltipShown = useCallback(
    async (tooltipId: string) => {
      try {
        const updatedTooltips = [...shownTooltips, tooltipId];
        await AsyncStorage.setItem(SHOWN_TOOLTIPS_KEY, JSON.stringify(updatedTooltips));
        setShownTooltips(updatedTooltips);
        console.log(`[useOnboarding] Tooltip "${tooltipId}" marked as shown`);
      } catch (error) {
        console.error('[useOnboarding] Failed to mark tooltip as shown:', error);
        throw error;
      }
    },
    [shownTooltips]
  );

  /**
   * Check if a tooltip has been shown
   */
  const hasShownTooltip = useCallback(
    (tooltipId: string) => {
      return shownTooltips.includes(tooltipId);
    },
    [shownTooltips]
  );

  return {
    isOnboardingComplete,
    shownTooltips,
    isLoading,
    completeOnboarding,
    resetOnboarding,
    markTooltipShown,
    hasShownTooltip,
  };
}
