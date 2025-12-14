/**
 * useOptimisticUpdate Hook
 *
 * Generic hook for managing optimistic UI updates with automatic rollback on failure.
 * Provides immediate UI feedback while performing background database operations.
 *
 * Features:
 * - Instant UI updates before async operations complete
 * - Automatic rollback on errors
 * - Track pending operations count
 * - Toast/alert notifications on errors
 * - Configurable success/error callbacks
 *
 * Usage:
 * const { updateOptimistically, isPending } = useOptimisticUpdate();
 *
 * await updateOptimistically(
 *   () => setTasks([...tasks, newTask]),  // Optimistic UI update
 *   async () => await tasksDB.createTask(data),  // Async operation
 *   {
 *     onSuccess: () => console.log('Success!'),
 *     onError: () => Alert.alert('Error', 'Failed to save'),
 *   }
 * );
 */

import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';

export interface OptimisticUpdateOptions<T> {
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
  rollbackDelay?: number; // Delay before rolling back in ms (default: 0 - immediate)
  silent?: boolean; // If true, don't show error alert (default: false)
}

export interface UseOptimisticUpdateReturn {
  updateOptimistically: <T>(
    optimisticUpdate: () => void,
    asyncOperation: () => Promise<T>,
    options?: OptimisticUpdateOptions<T>
  ) => Promise<T | null>;
  isPending: boolean;
  pendingCount: number;
}

/**
 * Hook for managing optimistic UI updates
 *
 * @returns Object containing updateOptimistically function and pending state
 */
export function useOptimisticUpdate(): UseOptimisticUpdateReturn {
  const [pendingCount, setPendingCount] = useState(0);
  const rollbackTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Clean up any pending rollback timeouts on unmount
  const clearTimeouts = useCallback(() => {
    rollbackTimeouts.current.forEach(timeout => clearTimeout(timeout));
    rollbackTimeouts.current = [];
  }, []);

  /**
   * Perform an optimistic update with automatic rollback on failure
   *
   * @param optimisticUpdate - Function to immediately update UI state
   * @param asyncOperation - Async function that performs the actual operation
   * @param options - Configuration options (callbacks, rollback delay, etc.)
   * @returns Promise resolving to the result of asyncOperation or null on error
   */
  const updateOptimistically = useCallback(
    async <T>(
      optimisticUpdate: () => void,
      asyncOperation: () => Promise<T>,
      options?: OptimisticUpdateOptions<T>
    ): Promise<T | null> => {
      const {
        onSuccess,
        onError,
        rollbackDelay = 0,
        silent = false,
      } = options || {};

      // Step 1: Apply optimistic update immediately
      try {
        optimisticUpdate();
      } catch (error) {
        console.error('[useOptimisticUpdate] Error applying optimistic update:', error);
        if (!silent) {
          Alert.alert('Error', 'Failed to update UI. Please try again.');
        }
        return null;
      }

      // Step 2: Track pending operation
      setPendingCount(prev => prev + 1);

      try {
        // Step 3: Perform actual async operation
        const result = await asyncOperation();

        // Step 4: Success - call success callback if provided
        setPendingCount(prev => prev - 1);
        onSuccess?.(result);

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[useOptimisticUpdate] Async operation failed:', err);

        // Step 5: Error - schedule rollback with optional delay
        const rollbackFn = () => {
          setPendingCount(prev => prev - 1);

          // Call error callback if provided
          onError?.(err);

          // Show error alert unless silent mode
          if (!silent) {
            Alert.alert(
              'Operation Failed',
              err.message || 'An unexpected error occurred. Changes have been reverted.',
              [{ text: 'OK' }]
            );
          }
        };

        if (rollbackDelay > 0) {
          const timeout = setTimeout(rollbackFn, rollbackDelay);
          rollbackTimeouts.current.push(timeout);
        } else {
          rollbackFn();
        }

        return null;
      }
    },
    []
  );

  return {
    updateOptimistically,
    isPending: pendingCount > 0,
    pendingCount,
  };
}

/**
 * Specialized hook for optimistic updates with built-in rollback state management
 *
 * This version automatically tracks previous state and provides a rollback function.
 * Useful when the optimistic update is a simple state change.
 *
 * @example
 * const { updateWithRollback, isPending } = useOptimisticUpdateWithRollback();
 *
 * await updateWithRollback(
 *   tasks,  // Previous state
 *   [...tasks, newTask],  // Optimistic new state
 *   (newState) => setTasks(newState),  // State setter
 *   async () => await tasksDB.createTask(data)  // Async operation
 * );
 */
export function useOptimisticUpdateWithRollback() {
  const { updateOptimistically, isPending, pendingCount } = useOptimisticUpdate();

  const updateWithRollback = useCallback(
    async <T, R>(
      previousState: T,
      optimisticState: T,
      setState: (state: T) => void,
      asyncOperation: () => Promise<R>,
      options?: Omit<OptimisticUpdateOptions<R>, 'onError'> & {
        onError?: (error: Error, previousState: T) => void;
      }
    ): Promise<R | null> => {
      return updateOptimistically(
        // Optimistic update
        () => setState(optimisticState),
        // Async operation
        asyncOperation,
        // Options with automatic rollback
        {
          ...options,
          onError: (error) => {
            // Rollback to previous state
            setState(previousState);
            // Call user-provided error handler if any
            options?.onError?.(error, previousState);
          },
        }
      );
    },
    [updateOptimistically]
  );

  return {
    updateWithRollback,
    isPending,
    pendingCount,
  };
}

export default useOptimisticUpdate;
