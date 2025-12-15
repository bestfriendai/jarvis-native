/**
 * Focus Analytics Component
 * Display focus insights, charts, and statistics
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { FocusBlock } from '../../database/focusBlocks';
import {
  formatDuration,
  generateInsights,
  getMostProductiveHours,
  getTodayFocusTime,
  getWeekFocusTime,
  getMonthFocusTime,
  get7DayTrend,
} from '../../utils/focusAnalytics';
import { typography, spacing, borderRadius, shadows } from '../../theme';

interface FocusAnalyticsProps {
  blocks: FocusBlock[];
  hourlyData: Array<{ hour: number; minutes: number; sessions: number }>;
  stats: {
    totalFocusMinutes: number;
    avgSessionMinutes: number;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
  };
}

export const FocusAnalytics: React.FC<FocusAnalyticsProps> = ({
  blocks,
  hourlyData,
  stats,
}) => {
  const { colors } = useTheme();

  const todayMinutes = getTodayFocusTime(blocks);
  const weekMinutes = getWeekFocusTime(blocks);
  const monthMinutes = getMonthFocusTime(blocks);
  const productiveHours = getMostProductiveHours(hourlyData, 3);
  const trend = get7DayTrend(blocks);
  const insights = generateInsights(blocks, {
    currentStreak: stats.currentStreak,
    completionRate: stats.completionRate,
    avgSessionMinutes: stats.avgSessionMinutes,
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Time Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Focus Time
        </Text>
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <IconButton icon="calendar-today" size={24} iconColor={colors.primary.main} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {formatDuration(todayMinutes)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
              Today
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <IconButton icon="calendar-week" size={24} iconColor={colors.info} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {formatDuration(weekMinutes)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
              This Week
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <IconButton icon="calendar-month" size={24} iconColor={colors.success} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {formatDuration(monthMinutes)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
              This Month
            </Text>
          </View>
        </View>
      </View>

      {/* Performance Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Performance
        </Text>
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <IconButton icon="fire" size={24} iconColor={colors.warning} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {stats.currentStreak}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
              Day Streak
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <IconButton icon="check-circle" size={24} iconColor={colors.success} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {stats.completionRate.toFixed(0)}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
              Completion
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <IconButton icon="timer" size={24} iconColor={colors.info} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {stats.avgSessionMinutes}m
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
              Avg Session
            </Text>
          </View>
        </View>
      </View>

      {/* 7-Day Trend Sparkline */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          7-Day Trend
        </Text>
        <View
          style={[
            styles.trendCard,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <View style={styles.sparkline}>
            {trend.map((minutes, index) => {
              const maxMinutes = Math.max(...trend, 1);
              const height = (minutes / maxMinutes) * 100;
              return (
                <View key={index} style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${height}%`,
                        backgroundColor:
                          index === trend.length - 1
                            ? colors.primary.main
                            : colors.background.tertiary,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
          <View style={styles.trendLabels}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <Text
                key={index}
                style={[
                  styles.trendLabel,
                  {
                    color:
                      index === trend.length - 1
                        ? colors.primary.main
                        : colors.text.tertiary,
                  },
                ]}
              >
                {day}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Most Productive Hours */}
      {productiveHours.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Most Productive Hours
          </Text>
          <View style={styles.hoursContainer}>
            {productiveHours.map((hour, index) => (
              <View
                key={hour.hour}
                style={[
                  styles.hourCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.subtle,
                  },
                ]}
              >
                <View style={styles.hourRank}>
                  <Text style={[styles.hourRankText, { color: colors.primary.main }]}>
                    #{index + 1}
                  </Text>
                </View>
                <View style={styles.hourInfo}>
                  <Text style={[styles.hourTime, { color: colors.text.primary }]}>
                    {hour.label}
                  </Text>
                  <Text style={[styles.hourStats, { color: colors.text.secondary }]}>
                    {formatDuration(hour.minutes)} • {hour.sessions} sessions
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Insights
          </Text>
          <View style={styles.insightsContainer}>
            {insights.map((insight, index) => (
              <View
                key={index}
                style={[
                  styles.insightCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor:
                      insight.type === 'success'
                        ? colors.success
                        : insight.type === 'warning'
                        ? colors.warning
                        : colors.info,
                  },
                ]}
              >
                <IconButton
                  icon={insight.icon}
                  size={20}
                  iconColor={
                    insight.type === 'success'
                      ? colors.success
                      : insight.type === 'warning'
                      ? colors.warning
                      : colors.info
                  }
                  style={styles.insightIcon}
                />
                <View style={styles.insightText}>
                  <Text style={[styles.insightTitle, { color: colors.text.primary }]}>
                    {insight.title}
                  </Text>
                  <Text style={[styles.insightDescription, { color: colors.text.secondary }]}>
                    {insight.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Streak Info */}
      <View style={styles.section}>
        <View
          style={[
            styles.streakCard,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <View style={styles.streakHeader}>
            <IconButton icon="trophy" size={32} iconColor={colors.warning} />
            <View style={styles.streakInfo}>
              <Text style={[styles.streakTitle, { color: colors.text.primary }]}>
                Focus Streak
              </Text>
              <Text style={[styles.streakSubtitle, { color: colors.text.tertiary }]}>
                Keep the momentum going
              </Text>
            </View>
          </View>
          <View style={styles.streakStats}>
            <View style={styles.streakStat}>
              <Text style={[styles.streakValue, { color: colors.primary.main }]}>
                {stats.currentStreak}
              </Text>
              <Text style={[styles.streakLabel, { color: colors.text.tertiary }]}>
                Current
              </Text>
            </View>
            <View style={[styles.streakDivider, { backgroundColor: colors.border.subtle }]} />
            <View style={styles.streakStat}>
              <Text style={[styles.streakValue, { color: colors.warning }]}>
                {stats.longestStreak}
              </Text>
              <Text style={[styles.streakLabel, { color: colors.text.tertiary }]}>
                Longest
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...shadows.xs,
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
  },
  trendCard: {
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...shadows.xs,
  },
  sparkline: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'flex-end',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  barContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 4,
  },
  trendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trendLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  hoursContainer: {
    gap: spacing.sm,
  },
  hourCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...shadows.xs,
  },
  hourRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  hourRankText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  hourInfo: {
    flex: 1,
  },
  hourTime: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: 2,
  },
  hourStats: {
    fontSize: typography.size.sm,
  },
  insightsContainer: {
    gap: spacing.sm,
  },
  insightCard: {
    flexDirection: 'row',
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    ...shadows.xs,
  },
  insightIcon: {
    margin: 0,
    marginRight: spacing.sm,
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  insightDescription: {
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  streakCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    ...shadows.md,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  streakSubtitle: {
    fontSize: typography.size.sm,
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  streakStat: {
    alignItems: 'center',
    flex: 1,
  },
  streakValue: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  streakLabel: {
    fontSize: typography.size.sm,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
  },
  streakDivider: {
    width: 1,
    height: 60,
  },
});
