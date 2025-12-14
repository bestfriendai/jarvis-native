/**
 * Tooltip Component
 * Floating tooltip with arrow pointer and auto-dismiss
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TOOLTIP_WIDTH = SCREEN_WIDTH - 48; // 24px padding on each side

export interface TooltipProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  position?: 'top' | 'bottom' | 'center';
}

export default function Tooltip({
  visible,
  message,
  onDismiss,
  position = 'bottom',
}: TooltipProps) {
  const { colors, isDark } = useTheme();

  const containerStyle = [
    styles.container,
    position === 'top' && styles.containerTop,
    position === 'center' && styles.containerCenter,
    position === 'bottom' && styles.containerBottom,
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={containerStyle}>
          <View
            style={[
              styles.tooltip,
              {
                backgroundColor: isDark ? colors.background.secondary : '#2C2C2E',
                shadowColor: colors.text.primary,
              },
            ]}
          >
            {/* Arrow */}
            {position === 'bottom' && (
              <View
                style={[
                  styles.arrow,
                  styles.arrowTop,
                  {
                    borderBottomColor: isDark ? colors.background.secondary : '#2C2C2E',
                  },
                ]}
              />
            )}

            {/* Content */}
            <Text
              style={[
                styles.message,
                { color: isDark ? colors.text.primary : '#FFFFFF' },
              ]}
            >
              {message}
            </Text>

            {/* Dismiss Button */}
            <TouchableOpacity
              style={[styles.dismissButton, { backgroundColor: colors.primary.main }]}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissButtonText}>Got it</Text>
            </TouchableOpacity>

            {/* Arrow */}
            {position === 'top' && (
              <View
                style={[
                  styles.arrow,
                  styles.arrowBottom,
                  {
                    borderTopColor: isDark ? colors.background.secondary : '#2C2C2E',
                  },
                ]}
              />
            )}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  containerTop: {
    top: 100,
  },
  containerCenter: {
    top: '40%',
  },
  containerBottom: {
    bottom: 100,
  },
  tooltip: {
    maxWidth: TOOLTIP_WIDTH,
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    alignSelf: 'center',
  },
  arrowTop: {
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -16,
    marginTop: -26,
  },
  arrowBottom: {
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -16,
    marginBottom: -26,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  dismissButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  dismissButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
