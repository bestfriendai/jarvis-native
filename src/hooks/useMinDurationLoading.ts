/**
 * useMinDurationLoading Hook
 * Ensures loading states display for a minimum duration to prevent flashing
 * Improves perceived performance and reduces jarring UI changes
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { MIN_LOADING_DURATION } from '../constants/ui';

interface UseMinDurationLoadingOptions {
  minDuration?: number;
}

/**
 * Hook to manage loading state with a minimum duration
 * Prevents loading indicators from flashing on/off too quickly
 *
 * @param initialLoading - Initial loading state
 * @param options - Configuration options
 * @returns [isLoading, setLoading] tuple
 *
 * @example
 * const [isLoading, setLoading] = useMinDurationLoading(false);
 *
 * const fetchData = async () => {
 *   setLoading(true);
 *   try {
 *     const data = await api.fetch();
 *     // ...
 *   } finally {
 *     setLoading(false); // Will stay true for min duration
 *   }
 * };
 */
export function useMinDurationLoading(
  initialLoading = false,
  options: UseMinDurationLoadingOptions = {}
): [boolean, (loading: boolean) => void] {
  const { minDuration = MIN_LOADING_DURATION } = options;

  const [isLoading, setIsLoading] = useState(initialLoading);
  const [actualLoading, setActualLoading] = useState(initialLoading);
  const loadingStartTime = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    setActualLoading(loading);

    if (loading) {
      // Starting to load - record the time
      loadingStartTime.current = Date.now();
      setIsLoading(true);
    } else {
      // Stopping load - check if min duration has elapsed
      if (loadingStartTime.current) {
        const elapsed = Date.now() - loadingStartTime.current;
        const remaining = Math.max(0, minDuration - elapsed);

        if (remaining > 0) {
          // Wait for remaining time before hiding
          timeoutRef.current = setTimeout(() => {
            setIsLoading(false);
            loadingStartTime.current = null;
          }, remaining);
        } else {
          // Min duration already elapsed
          setIsLoading(false);
          loadingStartTime.current = null;
        }
      } else {
        // No start time recorded, just set false
        setIsLoading(false);
      }
    }
  }, [minDuration]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [isLoading, setLoading];
}

export default useMinDurationLoading;
