/**
 * Tooltip Hook
 * Manages tooltip display state and auto-dismiss logic
 */

import { useState, useEffect, useCallback } from 'react';
import { useOnboarding } from './useOnboarding';

export interface TooltipConfig {
  id: string;
  message: string;
  autoDismissMs?: number;
}

export interface TooltipState {
  visible: boolean;
  message: string;
}

export interface TooltipActions {
  showTooltip: (config: TooltipConfig) => void;
  hideTooltip: () => void;
}

export function useTooltip(): TooltipState & TooltipActions {
  const { hasShownTooltip, markTooltipShown } = useOnboarding();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [autoDismissTimer, setAutoDismissTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * Show tooltip if not previously shown
   */
  const showTooltip = useCallback(
    (config: TooltipConfig) => {
      // Don't show if already shown before
      if (hasShownTooltip(config.id)) {
        return;
      }

      setMessage(config.message);
      setVisible(true);

      // Mark as shown
      markTooltipShown(config.id).catch((error) => {
        console.error('[useTooltip] Failed to mark tooltip as shown:', error);
      });

      // Set up auto-dismiss
      const autoDismissMs = config.autoDismissMs ?? 5000; // Default 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, autoDismissMs);

      setAutoDismissTimer(timer);
    },
    [hasShownTooltip, markTooltipShown]
  );

  /**
   * Hide tooltip
   */
  const hideTooltip = useCallback(() => {
    setVisible(false);
    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer);
      setAutoDismissTimer(null);
    }
  }, [autoDismissTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoDismissTimer) {
        clearTimeout(autoDismissTimer);
      }
    };
  }, [autoDismissTimer]);

  return {
    visible,
    message,
    showTooltip,
    hideTooltip,
  };
}
