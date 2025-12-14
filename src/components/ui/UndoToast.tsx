/**
 * Custom Undo Toast Configuration
 * Defines custom toast types for undo/redo functionality
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BaseToast, BaseToastProps } from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * Custom Undo Toast Component
 * Shows a toast with an "Undo" action button
 */
export function UndoToast(props: BaseToastProps & { props?: { onUndo?: () => Promise<void> } }) {
  const { text1 } = props;
  const onUndo = props.props?.onUndo;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Icon name="delete-outline" size={20} color="#FFFFFF" style={styles.icon} />
        <Text style={styles.text}>{text1}</Text>
      </View>
      {onUndo && (
        <TouchableOpacity
          style={styles.undoButton}
          onPress={async () => {
            await onUndo();
            // Toast will auto-dismiss after undo
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.undoButtonText}>UNDO</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Success Toast Component
 * Shows a success message (e.g., "Task restored")
 */
export function SuccessToast(props: BaseToastProps) {
  return (
    <BaseToast
      {...props}
      style={styles.successToast}
      contentContainerStyle={styles.successContentContainer}
      text1Style={styles.successText}
      text1NumberOfLines={2}
    />
  );
}

/**
 * Toast Configuration for react-native-toast-message
 * Export this to use in App.tsx
 */
export const toastConfig = {
  undo: UndoToast,
  success: SuccessToast,
};

const styles = StyleSheet.create({
  // Undo Toast Styles
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 56,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  undoButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 12,
  },
  undoButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Success Toast Styles
  successToast: {
    borderLeftColor: '#34C759',
    borderLeftWidth: 5,
    backgroundColor: '#FFFFFF',
  },
  successContentContainer: {
    paddingHorizontal: 15,
  },
  successText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
});
