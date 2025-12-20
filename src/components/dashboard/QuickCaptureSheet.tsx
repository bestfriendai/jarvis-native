/**
 * QuickCaptureSheet Component
 * Bottom sheet modal for quick capture actions from dashboard
 * Provides quick access to: Task creation, Expense logging, Focus start
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { IconButton, ActivityIndicator } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { makeButton, makeTextInput, announceForAccessibility } from '../../utils/accessibility';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 380;

interface QuickCaptureSheetProps {
  visible: boolean;
  onClose: () => void;
  onQuickTask: (title: string) => Promise<void>;
  onLogExpense: (amount: string) => Promise<void>;
  onStartFocus: () => Promise<void>;
}

type CaptureMode = 'menu' | 'task' | 'expense';

export const QuickCaptureSheet: React.FC<QuickCaptureSheetProps> = ({
  visible,
  onClose,
  onQuickTask,
  onLogExpense,
  onStartFocus,
}) => {
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [mode, setMode] = useState<CaptureMode>('menu');
  const [taskTitle, setTaskTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setMode('menu');
      setTaskTitle('');
      setExpenseAmount('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: SCREEN_HEIGHT - SHEET_HEIGHT,
          useNativeDriver: true,
          speed: 20,
          bounciness: 4,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleTaskSubmit = async () => {
    if (!taskTitle.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onQuickTask(taskTitle.trim());
      announceForAccessibility('Task created successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleClose();
    } catch (error) {
      console.error('Error creating task:', error);
      announceForAccessibility('Failed to create task');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExpenseSubmit = async () => {
    if (!expenseAmount.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onLogExpense(expenseAmount.trim());
      announceForAccessibility('Expense logged successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleClose();
    } catch (error) {
      console.error('Error logging expense:', error);
      announceForAccessibility('Failed to log expense');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartFocus = async () => {
    setIsSaving(true);
    try {
      await onStartFocus();
      announceForAccessibility('Focus session started');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleClose();
    } catch (error) {
      console.error('Error starting focus:', error);
      announceForAccessibility('Failed to start focus session');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderMenu = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Capture</Text>
        <TouchableOpacity onPress={handleClose} {...makeButton('Close', 'Double tap to close quick capture')}>
          <IconButton icon="close" size={24} iconColor={colors.text.secondary} style={styles.closeButton} />
        </TouchableOpacity>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMode('task');
          }}
          activeOpacity={0.7}
          {...makeButton('Quick Task', 'Double tap to create a quick task')}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.primary.main + '20' }]}>
            <IconButton icon="checkbox-marked-circle-outline" size={28} iconColor={colors.primary.main} style={styles.iconButton} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Quick Task</Text>
            <Text style={styles.menuDescription}>Add a task to your list</Text>
          </View>
          <IconButton icon="chevron-right" size={20} iconColor={colors.text.tertiary} style={styles.chevron} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMode('expense');
          }}
          activeOpacity={0.7}
          {...makeButton('Log Expense', 'Double tap to log an expense')}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.warning + '20' }]}>
            <IconButton icon="cash-minus" size={28} iconColor={colors.warning} style={styles.iconButton} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Log Expense</Text>
            <Text style={styles.menuDescription}>Record a quick transaction</Text>
          </View>
          <IconButton icon="chevron-right" size={20} iconColor={colors.text.tertiary} style={styles.chevron} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleStartFocus}
          activeOpacity={0.7}
          disabled={isSaving}
          {...makeButton('Start Focus', 'Double tap to start a focus session')}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.info + '20' }]}>
            <IconButton icon="timer-outline" size={28} iconColor={colors.info} style={styles.iconButton} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Start Focus</Text>
            <Text style={styles.menuDescription}>Begin a focus session</Text>
          </View>
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary.main} />
          ) : (
            <IconButton icon="chevron-right" size={20} iconColor={colors.text.tertiary} style={styles.chevron} />
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderTaskForm = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMode('menu');
          }}
          {...makeButton('Back', 'Double tap to go back')}
        >
          <IconButton icon="arrow-left" size={24} iconColor={colors.text.secondary} style={styles.closeButton} />
        </TouchableOpacity>
        <Text style={styles.title}>Quick Task</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Task Title</Text>
        <TextInput
          value={taskTitle}
          onChangeText={setTaskTitle}
          placeholder="What needs to be done?"
          placeholderTextColor={colors.text.placeholder}
          style={styles.input}
          autoFocus
          multiline
          numberOfLines={3}
          returnKeyType="done"
          onSubmitEditing={handleTaskSubmit}
          {...makeTextInput('Task title', taskTitle, 'What needs to be done?')}
        />

        <View style={styles.formActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode('menu');
            }}
            {...makeButton('Cancel', 'Double tap to cancel')}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, (!taskTitle.trim() || isSaving) && styles.submitButtonDisabled]}
            onPress={handleTaskSubmit}
            disabled={!taskTitle.trim() || isSaving}
            {...makeButton('Create Task', 'Double tap to create task', !taskTitle.trim() || isSaving)}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <Text style={styles.submitButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderExpenseForm = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMode('menu');
          }}
          {...makeButton('Back', 'Double tap to go back')}
        >
          <IconButton icon="arrow-left" size={24} iconColor={colors.text.secondary} style={styles.closeButton} />
        </TouchableOpacity>
        <Text style={styles.title}>Log Expense</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          value={expenseAmount}
          onChangeText={setExpenseAmount}
          placeholder="e.g., 50 or -20"
          placeholderTextColor={colors.text.placeholder}
          style={styles.input}
          autoFocus
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={handleExpenseSubmit}
          {...makeTextInput('Expense amount', expenseAmount, 'e.g., 50 or -20')}
        />

        <Text style={styles.helperText}>
          Use negative numbers for expenses (e.g., -20) or positive for income (e.g., 50)
        </Text>

        <View style={styles.formActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode('menu');
            }}
            {...makeButton('Cancel', 'Double tap to cancel')}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, (!expenseAmount.trim() || isSaving) && styles.submitButtonDisabled]}
            onPress={handleExpenseSubmit}
            disabled={!expenseAmount.trim() || isSaving}
            {...makeButton('Log Expense', 'Double tap to log expense', !expenseAmount.trim() || isSaving)}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <Text style={styles.submitButtonText}>Log</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: overlayOpacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />

          {mode === 'menu' && renderMenu()}
          {mode === 'task' && renderTaskForm()}
          {mode === 'expense' && renderExpenseForm()}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    ...shadows.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.default,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    margin: 0,
  },
  menu: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  iconButton: {
    margin: 0,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  menuDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  chevron: {
    margin: 0,
  },
  form: {
    padding: spacing.lg,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.base,
    color: colors.text.primary,
    fontSize: typography.size.base,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  helperText: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    lineHeight: typography.size.xs * 1.5,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  cancelButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
  },
  submitButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.background.tertiary,
  },
  submitButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
});

export default QuickCaptureSheet;
