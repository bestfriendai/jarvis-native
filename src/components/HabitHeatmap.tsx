/**
 * HabitHeatmap Component
 * Visual calendar heatmap for habit completion history
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { getHeatmapDescription, getChartDataTable } from '../utils/chartAccessibility';

interface HabitHeatmapProps {
  habitId: string;
  completions: string[]; // Array of ISO date strings
  weeks?: number;
  habitName?: string;
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({
  habitId,
  completions,
  weeks = 12,
  habitName,
}) => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - weeks * 7);

  const days: { date: Date; completed: boolean }[] = [];
  const current = new Date(startDate);

  while (current <= today) {
    const dateStr = current.toISOString().split('T')[0];
    days.push({
      date: new Date(current),
      completed: completions.includes(dateStr),
    });
    current.setDate(current.getDate() + 1);
  }

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Group days by week
  const weekGroups: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weekGroups.push(days.slice(i, i + 7));
  }

  // Generate accessibility description
  const accessibilityDescription = getHeatmapDescription(completions, weeks, habitName);

  // Generate data table for screen readers
  const dataTable = days
    .filter(d => d.completed)
    .map(d => ({
      label: d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: 1,
    }));

  const tableText = getChartDataTable(dataTable, { title: 'Completed days' });

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={accessibilityDescription}
      accessibilityRole="image"
      accessibilityHint="Heatmap showing habit completion over time"
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Week day labels */}
          <View style={styles.weekDaysRow}>
            <View style={styles.weekDayLabelSpacer} />
            {weekDays.map((day, i) => (
              <Text
                key={i}
                variant="labelSmall"
                style={styles.weekDayLabel}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                {day}
              </Text>
            ))}
          </View>

          {/* Heatmap grid */}
          <View
            style={styles.grid}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          >
            {weekGroups.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekColumn}>
                {week.map((day, dayIndex) => (
                  <View
                    key={dayIndex}
                    style={[
                      styles.dayCell,
                      day.completed && styles.dayCellCompleted,
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Hidden text alternative for screen readers */}
      <Text
        style={styles.hiddenText}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        {tableText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDayLabelSpacer: {
    width: 24,
  },
  weekDayLabel: {
    width: 16,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 10,
  },
  grid: {
    flexDirection: 'row',
    gap: 2,
  },
  weekColumn: {
    gap: 2,
  },
  dayCell: {
    width: 16,
    height: 16,
    backgroundColor: '#334155',
    borderRadius: 2,
  },
  dayCellCompleted: {
    backgroundColor: '#10B981',
  },
  hiddenText: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});
