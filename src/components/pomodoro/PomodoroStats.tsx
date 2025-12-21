/**
 * Pomodoro Stats Component
 * Display today's stats, weekly stats, and productivity insights
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import type { PomodoroStats as PomodoroStatsType, DayStats } from '../../database/pomodoro';
import { formatDuration } from '../../utils/pomodoroHelpers';
import { typography, spacing, borderRadius, shadows } from '../../theme';
import { HIT_SLOP } from '../../constants/ui';

interface PomodoroStatsProps {
  todayStats: PomodoroStatsType;
  weeklyStats: PomodoroStatsType;
  streak: number;
  sevenDayHistory: DayStats[];
  hourlyData: { hour: number; count: number }[];
}

export function PomodoroStats({
  todayStats,
  weeklyStats,
  streak,
  sevenDayHistory,
  hourlyData,
}: PomodoroStatsProps) {
  const { colors } = useTheme();

  // Find most productive hours
  const topHours = hourlyData
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Today's Stats */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          Today
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary.main }]}>
              {todayStats.completedCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
              Pomodoros
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary.main }]}>
              {formatDuration(todayStats.totalMinutes)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
              Focus Time
            </Text>
          </View>
        </View>
      </View>

      {/* This Week */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          This Week
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.info }]}>
              {weeklyStats.completedCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
              Pomodoros
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.info }]}>
              {formatDuration(weeklyStats.totalMinutes)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
              Total Time
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.info }]}>
              {weeklyStats.avgSessionMinutes > 0
                ? Math.round(weeklyStats.avgSessionMinutes)
                : 0}
              m
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
              Avg Session
            </Text>
          </View>
        </View>
      </View>

      {/* Streak */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        <View style={styles.streakHeader}>
          <IconButton icon="fire" iconColor={colors.warning} size={32} 
                hitSlop={HIT_SLOP}/>
          <View>
            <Text style={[styles.streakValue, { color: colors.text.primary }]}>
              {streak} {streak === 1 ? 'Day' : 'Days'}
            </Text>
            <Text style={[styles.streakLabel, { color: colors.text.tertiary }]}>
              Current Streak
            </Text>
          </View>
        </View>
      </View>

      {/* 7-Day Trend */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          7-Day Trend
        </Text>
        <View style={styles.trendContainer}>
          {sevenDayHistory.map((day, index) => {
            const maxCount = Math.max(...sevenDayHistory.map((d) => d.count), 1);
            const barHeight = (day.count / maxCount) * 100;
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            return (
              <View key={index} style={styles.trendBar}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${barHeight}%`,
                        backgroundColor: colors.primary.main,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.dayLabel, { color: colors.text.tertiary }]}>
                  {dayName}
                </Text>
                <Text style={[styles.countLabel, { color: colors.text.secondary }]}>
                  {day.count}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Most Productive Hours */}
      {topHours.length > 0 && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
            Most Productive Hours
          </Text>
          <View style={styles.hoursContainer}>
            {topHours.map((hour, index) => {
              const hourDisplay =
                hour.hour === 0
                  ? '12 AM'
                  : hour.hour < 12
                  ? `${hour.hour} AM`
                  : hour.hour === 12
                  ? '12 PM'
                  : `${hour.hour - 12} PM`;

              return (
                <View key={index} style={styles.hourItem}>
                  <View
                    style={[
                      styles.rankBadge,
                      {
                        backgroundColor:
                          index === 0
                            ? colors.warning
                            : index === 1
                            ? colors.text.tertiary
                            : colors.text.disabled,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankText,
                        { color: index < 2 ? colors.text.inverse : colors.text.primary },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[styles.hourText, { color: colors.text.primary }]}>
                    {hourDisplay}
                  </Text>
                  <Text style={[styles.hourCount, { color: colors.text.secondary }]}>
                    {hour.count} {hour.count === 1 ? 'session' : 'sessions'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...shadows.xs,
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  streakValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  streakLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  trendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  trendBar: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    width: '70%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: borderRadius.xs,
    borderTopRightRadius: borderRadius.xs,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    marginTop: spacing.xs,
  },
  countLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  hoursContainer: {
    gap: spacing.md,
  },
  hourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  hourText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    flex: 1,
  },
  hourCount: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
});
