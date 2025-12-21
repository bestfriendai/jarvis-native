/**
 * RecurrencePicker Component
 * UI for configuring recurrence rules for tasks and calendar events
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import type { RecurrenceRule, RecurrenceFrequency, RecurrenceEndType } from '../types';
import { colors, typography, spacing, borderRadius } from '../theme';
import { HIT_SLOP } from '../constants/ui';

interface RecurrencePickerProps {
  value?: RecurrenceRule;
  onChange: (recurrence: RecurrenceRule | undefined) => void;
  onClose?: () => void;
}

const WEEKDAYS = [
  { label: 'S', value: 0, name: 'Sunday' },
  { label: 'M', value: 1, name: 'Monday' },
  { label: 'T', value: 2, name: 'Tuesday' },
  { label: 'W', value: 3, name: 'Wednesday' },
  { label: 'T', value: 4, name: 'Thursday' },
  { label: 'F', value: 5, name: 'Friday' },
  { label: 'S', value: 6, name: 'Saturday' },
];

export function RecurrencePicker({ value, onChange, onClose }: RecurrencePickerProps) {
  const [enabled, setEnabled] = useState(!!value);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(value?.frequency || 'daily');
  const [interval, setInterval] = useState<string>(value?.interval.toString() || '1');
  const [endType, setEndType] = useState<RecurrenceEndType>(value?.endType || 'never');
  const [endDate, setEndDate] = useState<string>(value?.endDate || '');
  const [count, setCount] = useState<string>(value?.count?.toString() || '');
  const [weekdays, setWeekdays] = useState<number[]>(value?.weekdays || []);

  const handleSave = () => {
    if (!enabled) {
      onChange(undefined);
      onClose?.();
      return;
    }

    const rule: RecurrenceRule = {
      frequency,
      interval: parseInt(interval) || 1,
      endType,
    };

    if (endType === 'until' && endDate) {
      rule.endDate = endDate;
    }

    if (endType === 'count' && count) {
      rule.count = parseInt(count);
    }

    if (frequency === 'weekly' && weekdays.length > 0) {
      rule.weekdays = weekdays;
    }

    onChange(rule);
    onClose?.();
  };

  const toggleWeekday = (day: number) => {
    if (weekdays.includes(day)) {
      setWeekdays(weekdays.filter((d) => d !== day));
    } else {
      setWeekdays([...weekdays, day].sort());
    }
  };

  const getFrequencyLabel = () => {
    const intervalNum = parseInt(interval) || 1;
    switch (frequency) {
      case 'daily':
        return intervalNum === 1 ? 'day' : 'days';
      case 'weekly':
        return intervalNum === 1 ? 'week' : 'weeks';
      case 'monthly':
        return intervalNum === 1 ? 'month' : 'months';
      case 'yearly':
        return intervalNum === 1 ? 'year' : 'years';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Enable/Disable Toggle */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setEnabled(!enabled)}
          activeOpacity={0.7}
        >
          <View>
            <Text style={styles.sectionTitle}>Repeat</Text>
            <Text style={styles.sectionSubtitle}>
              {enabled ? 'Recurring item' : 'Does not repeat'}
            </Text>
          </View>
          <View
            style={[
              styles.toggle,
              enabled && styles.toggleActive,
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                enabled && styles.toggleThumbActive,
              ]}
            />
          </View>
        </TouchableOpacity>
      </View>

      {enabled && (
        <>
          {/* Frequency Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequency</Text>
            <View style={styles.frequencyGrid}>
              {(['daily', 'weekly', 'monthly', 'yearly'] as RecurrenceFrequency[]).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.frequencyButton,
                    frequency === freq && styles.frequencyButtonActive,
                  ]}
                  onPress={() => setFrequency(freq)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.frequencyButtonText,
                      frequency === freq && styles.frequencyButtonTextActive,
                    ]}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Interval */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Every</Text>
            <View style={styles.intervalRow}>
              <TextInput
                value={interval}
                onChangeText={(text) => {
                  if (/^\d*$/.test(text)) {
                    setInterval(text);
                  }
                }}
                keyboardType="number-pad"
                style={styles.intervalInput}
                placeholder="1"
                placeholderTextColor={colors.text.placeholder}
              />
              <Text style={styles.intervalLabel}>{getFrequencyLabel()}</Text>
            </View>
          </View>

          {/* Weekly: Weekday Selection */}
          {frequency === 'weekly' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Repeat on</Text>
              <View style={styles.weekdaysRow}>
                {WEEKDAYS.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.weekdayButton,
                      weekdays.includes(day.value) && styles.weekdayButtonActive,
                    ]}
                    onPress={() => toggleWeekday(day.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.weekdayButtonText,
                        weekdays.includes(day.value) && styles.weekdayButtonTextActive,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* End Condition */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ends</Text>
            <View style={styles.endTypeGrid}>
              <TouchableOpacity
                style={[
                  styles.endTypeButton,
                  endType === 'never' && styles.endTypeButtonActive,
                ]}
                onPress={() => setEndType('never')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.endTypeButtonText,
                    endType === 'never' && styles.endTypeButtonTextActive,
                  ]}
                >
                  Never
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.endTypeButton,
                  endType === 'until' && styles.endTypeButtonActive,
                ]}
                onPress={() => setEndType('until')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.endTypeButtonText,
                    endType === 'until' && styles.endTypeButtonTextActive,
                  ]}
                >
                  On Date
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.endTypeButton,
                  endType === 'count' && styles.endTypeButtonActive,
                ]}
                onPress={() => setEndType('count')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.endTypeButtonText,
                    endType === 'count' && styles.endTypeButtonTextActive,
                  ]}
                >
                  After
                </Text>
              </TouchableOpacity>
            </View>

            {endType === 'until' && (
              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.placeholder}
                style={styles.endInput}
              />
            )}

            {endType === 'count' && (
              <View style={styles.countRow}>
                <TextInput
                  value={count}
                  onChangeText={(text) => {
                    if (/^\d*$/.test(text)) {
                      setCount(text);
                    }
                  }}
                  keyboardType="number-pad"
                  placeholder="10"
                  placeholderTextColor={colors.text.placeholder}
                  style={styles.countInput}
                />
                <Text style={styles.countLabel}>occurrences</Text>
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.7}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </>
      )}

      {!enabled && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.7}>
          <Text style={styles.saveButtonText}>Done</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  sectionSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primary.main,
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  frequencyButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  frequencyButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
  },
  frequencyButtonTextActive: {
    color: '#FFFFFF',
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  intervalInput: {
    width: 80,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    fontSize: typography.size.base,
    color: colors.text.primary,
    textAlign: 'center',
  },
  intervalLabel: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
  },
  weekdaysRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  weekdayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  weekdayButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  weekdayButtonTextActive: {
    color: '#FFFFFF',
  },
  endTypeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  endTypeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  endTypeButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  endTypeButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
  },
  endTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  endInput: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    fontSize: typography.size.base,
    color: colors.text.primary,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  countInput: {
    width: 80,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    fontSize: typography.size.base,
    color: colors.text.primary,
    textAlign: 'center',
  },
  countLabel: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
  },
  saveButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: '#FFFFFF',
  },
});
