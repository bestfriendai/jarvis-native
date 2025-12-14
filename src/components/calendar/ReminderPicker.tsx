/**
 * ReminderPicker Component
 * UI component for selecting event reminder times
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface ReminderPickerProps {
  value: number | null;
  onChange: (minutes: number | null) => void;
}

interface ReminderOption {
  label: string;
  value: number | null;
  icon: string;
}

const REMINDER_OPTIONS: ReminderOption[] = [
  { label: 'No Reminder', value: null, icon: 'bell-off-outline' },
  { label: '5 minutes before', value: 5, icon: 'bell-outline' },
  { label: '15 minutes before', value: 15, icon: 'bell-outline' },
  { label: '30 minutes before', value: 30, icon: 'bell-outline' },
  { label: '1 hour before', value: 60, icon: 'bell-ring-outline' },
  { label: '2 hours before', value: 120, icon: 'bell-ring-outline' },
  { label: '1 day before', value: 1440, icon: 'bell-alert-outline' },
];

export function ReminderPicker({ value, onChange }: ReminderPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Reminder</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
      >
        {REMINDER_OPTIONS.map((option) => {
          const isSelected = value === option.value;

          return (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.optionButton,
                isSelected && styles.optionButtonSelected,
              ]}
              onPress={() => onChange(option.value)}
              activeOpacity={0.7}
            >
              <Icon
                name={option.icon}
                size={20}
                color={isSelected ? colors.primary.main : colors.text.secondary}
                style={styles.optionIcon}
              />
              <Text
                style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary.light,
    borderColor: colors.primary.main,
  },
  optionIcon: {
    marginRight: spacing.xs,
  },
  optionLabel: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  optionLabelSelected: {
    color: colors.primary.main,
    fontWeight: '600',
  },
});
