/**
 * useHighlight Hook
 * Provides pulsing highlight animation for deep-linked items
 */

import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface UseHighlightOptions {
  /**
   * ID of the item to highlight
   */
  highlightId?: string;
  /**
   * Current item ID to check against
   */
  itemId: string;
  /**
   * Duration of the highlight animation in milliseconds
   */
  duration?: number;
  /**
   * Number of times to pulse
   */
  pulseCount?: number;
  /**
   * Callback when highlight animation completes
   */
  onComplete?: () => void;
}

interface UseHighlightResult {
  /**
   * Whether this item should be highlighted
   */
  shouldHighlight: boolean;
  /**
   * Animated opacity value for the highlight effect
   */
  highlightOpacity: Animated.Value;
  /**
   * Animated scale value for the pulse effect
   */
  highlightScale: Animated.Value;
}

/**
 * Hook to create a pulsing highlight effect for an item
 *
 * @example
 * ```tsx
 * const { shouldHighlight, highlightOpacity, highlightScale } = useHighlight({
 *   highlightId: route.params?.highlightId,
 *   itemId: task.id,
 *   onComplete: () => {
 *     // Clear the highlight ID from navigation params
 *     navigation.setParams({ highlightId: undefined });
 *   },
 * });
 *
 * return (
 *   <Animated.View
 *     style={[
 *       styles.taskCard,
 *       shouldHighlight && {
 *         opacity: highlightOpacity,
 *         transform: [{ scale: highlightScale }],
 *         backgroundColor: colors.primary.light,
 *       },
 *     ]}
 *   >
 *     {children}
 *   </Animated.View>
 * );
 * ```
 */
export function useHighlight({
  highlightId,
  itemId,
  duration = 1000,
  pulseCount = 3,
  onComplete,
}: UseHighlightOptions): UseHighlightResult {
  const highlightOpacity = useRef(new Animated.Value(1)).current;
  const highlightScale = useRef(new Animated.Value(1)).current;
  const shouldHighlight = highlightId === itemId;

  useEffect(() => {
    if (!shouldHighlight) {
      return;
    }

    // Create pulse animation sequence
    const pulseAnimation = Animated.sequence([
      // Pulse in
      Animated.parallel([
        Animated.timing(highlightOpacity, {
          toValue: 0.7,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(highlightScale, {
          toValue: 1.02,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]),
      // Pulse out
      Animated.parallel([
        Animated.timing(highlightOpacity, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(highlightScale, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]),
    ]);

    // Loop the pulse animation
    Animated.loop(pulseAnimation, { iterations: pulseCount }).start(() => {
      // Reset to normal state
      highlightOpacity.setValue(1);
      highlightScale.setValue(1);
      onComplete?.();
    });

    // Cleanup
    return () => {
      highlightOpacity.setValue(1);
      highlightScale.setValue(1);
    };
  }, [shouldHighlight, highlightOpacity, highlightScale, duration, pulseCount, onComplete]);

  return {
    shouldHighlight,
    highlightOpacity,
    highlightScale,
  };
}

export default useHighlight;
