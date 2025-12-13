/**
 * Destructive Action Dialog
 * Two-step confirmation for dangerous operations
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AppButton } from './ui/AppButton';
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from '../theme';

interface DestructiveActionDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  confirmationPhrase: string;
  warningMessage: string;
  details?: string[];
}

export const DestructiveActionDialog: React.FC<DestructiveActionDialogProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  confirmationPhrase,
  warningMessage,
  details = [],
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isConfirmationValid = confirmText === confirmationPhrase;

  const handleConfirm = async () => {
    if (!isConfirmationValid) return;

    try {
      setIsProcessing(true);
      await onConfirm();
      setConfirmText('');
      onClose();
    } catch (error) {
      console.error('Destructive action failed:', error);
      Alert.alert('Error', 'Operation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.title}>{title}</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.warningText}>{warningMessage}</Text>

            {details.length > 0 && (
              <View style={styles.detailsContainer}>
                {details.map((detail, index) => (
                  <Text key={index} style={styles.detailText}>
                    • {detail}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.confirmationContainer}>
              <Text style={styles.confirmLabel}>
                To confirm, type:{' '}
                <Text style={styles.confirmPhrase}>{confirmationPhrase}</Text>
              </Text>

              <TextInput
                style={styles.input}
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder={confirmationPhrase}
                placeholderTextColor={colors.text.disabled}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isProcessing}
              />
            </View>

            <Text style={styles.cautionText}>
              This action cannot be undone.
            </Text>
          </View>

          <View style={styles.actions}>
            <View style={styles.buttonContainer}>
              <AppButton
                variant="outline"
                onPress={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </AppButton>
            </View>

            <View style={styles.buttonContainer}>
              <AppButton
                variant="danger"
                onPress={handleConfirm}
                disabled={!isConfirmationValid || isProcessing}
                loading={isProcessing}
              >
                Confirm
              </AppButton>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 500,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.error,
    textAlign: 'center',
  },
  content: {
    padding: spacing.lg,
  },
  warningText: {
    fontSize: typography.size.base,
    color: colors.text.primary,
    lineHeight: typography.size.base * 1.5,
    marginBottom: spacing.md,
  },
  detailsContainer: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  detailText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: typography.size.sm * 1.5,
    marginBottom: spacing.xs,
  },
  confirmationContainer: {
    marginBottom: spacing.lg,
  },
  confirmLabel: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  confirmPhrase: {
    fontWeight: typography.weight.bold,
    color: colors.error,
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    fontSize: typography.size.base,
    color: colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cautionText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  buttonContainer: {
    flex: 1,
  },
});
