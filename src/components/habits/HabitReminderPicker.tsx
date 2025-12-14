/**
 * Habit Reminder Picker Component
 * Time picker for setting daily habit reminders
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Switch } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface HabitReminderPickerProps {
  reminderTime?: string;
  onReminderChange: (time: string | undefined) => void;
}

export const HabitReminderPicker: React.FC<HabitReminderPickerProps> = ({
  reminderTime,
  onReminderChange,
}) => {
  const [enabled, setEnabled] = useState(!!reminderTime);
  const [showPicker, setShowPicker] = useState(false);

  // Parse existing time or use default (9:00 AM)
  const getTimeFromString = (timeString?: string): Date => {
    if (!timeString) {
      const date = new Date();
      date.setHours(9, 0, 0, 0);
      return date;
    }

    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const [selectedTime, setSelectedTime] = useState<Date>(getTimeFromString(reminderTime));

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDisplayTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleToggle = (value: boolean) => {
    setEnabled(value);
    if (value) {
      // Enable reminder with current selected time
      onReminderChange(formatTime(selectedTime));
    } else {
      // Disable reminder
      onReminderChange(undefined);
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (date) {
      setSelectedTime(date);
      if (enabled) {
        onReminderChange(formatTime(date));
      }
    }
  };

  const handleShowPicker = () => {
    if (!enabled) {
      // Auto-enable when user wants to pick time
      setEnabled(true);
      onReminderChange(formatTime(selectedTime));
    }
    setShowPicker(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Daily Reminder</Text>
          <Text style={styles.description}>
            Get notified at a specific time each day
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{
            false: colors.background.tertiary,
            true: `${colors.primary.main}80`,
          }}
          thumbColor={enabled ? colors.primary.main : colors.text.disabled}
        />
      </View>

      {enabled && (
        <View style={styles.timePickerContainer}>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={handleShowPicker}
            activeOpacity={0.7}
          >
            <Text style={styles.timeIcon}>🔔</Text>
            <View style={styles.timeTextContainer}>
              <Text style={styles.timeLabel}>Reminder Time</Text>
              <Text style={styles.timeValue}>{formatDisplayTime(selectedTime)}</Text>
            </View>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              style={styles.picker}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    lineHeight: typography.size.xs * typography.lineHeight.relaxed,
  },
  timePickerContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  timeIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  timeTextContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  timeValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary.main,
  },
  picker: {
    marginTop: spacing.md,
  },
});
