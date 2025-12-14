/**
 * BudgetFormModal Component
 * Modal for creating and editing budgets
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as budgetsDB from '../database/budgets';
import type { Budget, BudgetPeriod } from '../database/budgets';
import { AppButton } from './ui';
import { colors, typography, spacing, borderRadius } from '../theme';

interface BudgetFormModalProps {
  visible: boolean;
  budget: Budget | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const BUDGET_PERIODS: { label: string; value: BudgetPeriod }[] = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Yearly', value: 'yearly' },
];

const ALERT_THRESHOLDS = [
  { label: '50%', value: 0.5 },
  { label: '70%', value: 0.7 },
  { label: '80%', value: 0.8 },
  { label: '90%', value: 0.9 },
  { label: '95%', value: 0.95 },
];

export function BudgetFormModal({
  visible,
  budget,
  onClose,
  onSuccess,
}: BudgetFormModalProps) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState(budget?.category || '');
  const [amount, setAmount] = useState(
    budget ? (budget.amount / 100).toString() : ''
  );
  const [period, setPeriod] = useState<BudgetPeriod>(budget?.period || 'monthly');
  const [startDate, setStartDate] = useState(
    budget?.startDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    budget?.endDate || new Date().toISOString().split('T')[0]
  );
  const [isRecurring, setIsRecurring] = useState(budget?.isRecurring || false);
  const [alertThreshold, setAlertThreshold] = useState(
    budget?.alertThreshold || 0.8
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setCategory(budget?.category || '');
      setAmount(budget ? (budget.amount / 100).toString() : '');
      setPeriod(budget?.period || 'monthly');
      setStartDate(budget?.startDate || new Date().toISOString().split('T')[0]);
      setEndDate(budget?.endDate || new Date().toISOString().split('T')[0]);
      setIsRecurring(budget?.isRecurring || false);
      setAlertThreshold(budget?.alertThreshold || 0.8);
    }
  }, [visible, budget]);

  const handlePeriodChange = (newPeriod: BudgetPeriod) => {
    setPeriod(newPeriod);
    // Auto-calculate dates based on period
    const dates = budgetsDB.getBudgetPeriodDates(newPeriod);
    setStartDate(dates.startDate);
    setEndDate(dates.endDate);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!category.trim()) {
      Alert.alert('Validation Error', 'Category is required');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      const data: budgetsDB.CreateBudgetData = {
        category: category.trim(),
        amount: amountCents,
        period,
        startDate,
        endDate,
        isRecurring,
        alertThreshold,
      };

      if (budget) {
        await budgetsDB.updateBudget(budget.id, data);
      } else {
        await budgetsDB.createBudget(data);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!budget) return;

    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await budgetsDB.deleteBudget(budget.id);
              onSuccess?.();
              onClose();
            } catch (error) {
              console.error('Error deleting budget:', error);
              Alert.alert('Error', 'Failed to delete budget');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(insets.bottom, spacing.base) },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {budget ? 'Edit Budget' : 'New Budget'}
              </Text>
              <IconButton
                icon="close"
                onPress={onClose}
                iconColor={colors.text.tertiary}
              />
            </View>

            {/* Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Category */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  value={category}
                  onChangeText={setCategory}
                  placeholder="e.g., Food, Entertainment, Bills..."
                  placeholderTextColor={colors.text.placeholder}
                  style={styles.input}
                />
              </View>

              {/* Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Budget Amount</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.text.placeholder}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>

              {/* Period */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Period</Text>
                <View style={styles.periodRow}>
                  {BUDGET_PERIODS.map((p) => (
                    <TouchableOpacity
                      key={p.value}
                      style={[
                        styles.periodButton,
                        period === p.value && styles.periodButtonActive,
                      ]}
                      onPress={() => handlePeriodChange(p.value)}
                    >
                      <Text
                        style={[
                          styles.periodButtonText,
                          period === p.value && styles.periodButtonTextActive,
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date Range */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date Range</Text>
                <View style={styles.dateRow}>
                  <View style={styles.dateInput}>
                    <Text style={styles.dateLabel}>From</Text>
                    <TextInput
                      value={startDate}
                      onChangeText={setStartDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.text.placeholder}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.dateInput}>
                    <Text style={styles.dateLabel}>To</Text>
                    <TextInput
                      value={endDate}
                      onChangeText={setEndDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.text.placeholder}
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>

              {/* Alert Threshold */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Alert When Spending Reaches</Text>
                <View style={styles.thresholdRow}>
                  {ALERT_THRESHOLDS.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      style={[
                        styles.thresholdButton,
                        alertThreshold === t.value && styles.thresholdButtonActive,
                      ]}
                      onPress={() => setAlertThreshold(t.value)}
                    >
                      <Text
                        style={[
                          styles.thresholdButtonText,
                          alertThreshold === t.value &&
                            styles.thresholdButtonTextActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Recurring */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setIsRecurring(!isRecurring)}
              >
                <View style={styles.toggleLeft}>
                  <Text style={styles.toggleLabel}>Recurring Budget</Text>
                  <Text style={styles.toggleHelper}>
                    Automatically create budget for next period
                  </Text>
                </View>
                <View
                  style={[
                    styles.toggle,
                    isRecurring && styles.toggleActive,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      isRecurring && styles.toggleThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              {budget && (
                <AppButton
                  title="Delete"
                  onPress={handleDelete}
                  variant="outline"
                  style={styles.deleteButton}
                />
              )}
              <AppButton
                title="Cancel"
                onPress={onClose}
                variant="outline"
                style={styles.modalButton}
              />
              <AppButton
                title={budget ? 'Update' : 'Create'}
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!category || !amount}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  modalBody: {
    padding: spacing.base,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: typography.size.base,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  periodButton: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.md,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  periodButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  thresholdRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  thresholdButton: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  thresholdButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  thresholdButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
  },
  thresholdButtonTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  toggleLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  toggleHelper: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  toggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border.default,
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary.main,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    marginLeft: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  modalButton: {
    flex: 1,
  },
  deleteButton: {
    minWidth: 80,
  },
});

export default BudgetFormModal;
