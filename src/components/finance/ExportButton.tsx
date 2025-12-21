/**
 * ExportButton Component
 * Button with modal for exporting financial transactions to CSV
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Transaction } from '../../database/finance';
import {
  exportTransactionsToCSV,
  filterTransactionsByDate,
  getDateRangeLabel,
  type DateRangeFilter,
  type ExportFilters,
} from '../../services/export';
import { AppButton } from '../ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { HIT_SLOP } from '../../constants/ui';

interface ExportButtonProps {
  transactions: Transaction[];
  onExportComplete?: () => void;
}

export function ExportButton({ transactions, onExportComplete }: ExportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRangeFilter>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const insets = useSafeAreaInsets();

  const dateRangeOptions: DateRangeFilter[] = [
    'thisMonth',
    'lastMonth',
    'thisYear',
    'lastYear',
    'allTime',
  ];

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const filters: ExportFilters = {
        dateRange: selectedRange,
        customStartDate: selectedRange === 'custom' ? customStartDate : undefined,
        customEndDate: selectedRange === 'custom' ? customEndDate : undefined,
      };

      // Validate custom date range
      if (selectedRange === 'custom') {
        if (!customStartDate || !customEndDate) {
          Alert.alert('Invalid Date Range', 'Please select both start and end dates');
          setIsExporting(false);
          return;
        }
        if (customStartDate > customEndDate) {
          Alert.alert('Invalid Date Range', 'Start date must be before end date');
          setIsExporting(false);
          return;
        }
      }

      // Check if there are transactions to export
      const filteredCount = filterTransactionsByDate(transactions, filters).length;
      if (filteredCount === 0) {
        Alert.alert(
          'No Transactions',
          'There are no transactions in the selected date range to export'
        );
        setIsExporting(false);
        return;
      }

      const result = await exportTransactionsToCSV(transactions, filters);

      if (result.success) {
        setShowModal(false);
        Alert.alert('Export Successful', result.message);
        onExportComplete?.();
      } else {
        Alert.alert('Export Failed', result.message);
      }
    } catch (error) {
      console.error('[ExportButton] Error exporting:', error);
      Alert.alert('Export Failed', 'An unexpected error occurred');
    } finally {
      setIsExporting(false);
    }
  };

  const getTransactionCount = () => {
    const filters: ExportFilters = {
      dateRange: selectedRange,
      customStartDate: selectedRange === 'custom' ? customStartDate : undefined,
      customEndDate: selectedRange === 'custom' ? customEndDate : undefined,
    };

    if (selectedRange === 'custom' && (!customStartDate || !customEndDate)) {
      return 0;
    }

    return filterTransactionsByDate(transactions, filters).length;
  };

  return (
    <>
      <IconButton
        icon="download"
        iconColor={colors.primary.main}
        size={24}
        onPress={() => setShowModal(true)}
                hitSlop={HIT_SLOP}
      />

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
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
              <Text style={styles.modalTitle}>Export Transactions</Text>
              <IconButton
                icon="close"
                onPress={() => setShowModal(false)}
                hitSlop={HIT_SLOP}
                iconColor={colors.text.tertiary}
              />
            </View>

            {/* Body */}
            <View style={styles.modalBody}>
              <Text style={styles.sectionLabel}>SELECT DATE RANGE</Text>

              {/* Date Range Options */}
              <View style={styles.optionsList}>
                {dateRangeOptions.map((range) => {
                  const isSelected = selectedRange === range;
                  return (
                    <TouchableOpacity
                      key={range}
                      style={[styles.optionCard, isSelected && styles.optionCardActive]}
                      onPress={() => setSelectedRange(range)}
                    >
                      <View style={styles.optionContent}>
                        <View style={styles.radioOuter}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextActive,
                          ]}
                        >
                          {getDateRangeLabel(range)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Transaction Count */}
              {selectedRange !== 'custom' && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    {getTransactionCount()} transaction{getTransactionCount() === 1 ? '' : 's'}{' '}
                    will be exported
                  </Text>
                </View>
              )}

              {/* Format Info */}
              <View style={styles.formatInfo}>
                <Text style={styles.formatLabel}>Export Format:</Text>
                <Text style={styles.formatValue}>CSV (Comma Separated Values)</Text>
                <Text style={styles.formatDescription}>
                  Compatible with Excel, Google Sheets, and most financial software
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <AppButton
                title="Cancel"
                onPress={() => setShowModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <AppButton
                title={isExporting ? 'Exporting...' : 'Export'}
                onPress={handleExport}
                loading={isExporting}
                disabled={isExporting || getTransactionCount() === 0}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing.md,
  },
  optionsList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  optionCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.md,
  },
  optionCardActive: {
    backgroundColor: colors.primary.main + '10',
    borderColor: colors.primary.main,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.main,
  },
  optionText: {
    fontSize: typography.size.base,
    color: colors.text.primary,
    fontWeight: typography.weight.medium,
    flex: 1,
  },
  optionTextActive: {
    color: colors.primary.main,
    fontWeight: typography.weight.semibold,
  },
  infoBox: {
    backgroundColor: colors.info + '20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  formatInfo: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  formatLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: spacing.xs,
  },
  formatValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  formatDescription: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
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
});
