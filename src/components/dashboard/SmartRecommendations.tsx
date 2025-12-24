/**
 * SmartRecommendations Component
 * Pattern-based contextual suggestions based on user's historical data
 * NO AI/LLM - just local data analysis
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing, borderRadius, shadows, typography, getColors } from '../../theme';
import { makeButton } from '../../utils/accessibility';
import { HIT_SLOP } from '../../constants/ui';
import type { Task } from '../../database/tasks';
import type { Habit } from '../../database/habits';
import type { BudgetWithSpending } from '../../database/budgets';
import type { FocusSession } from '../../database/focusSessions';

// ============================================================================
// TYPES
// ============================================================================

export type RecommendationType =
  | 'focus_time'
  | 'overdue_tasks'
  | 'budget_alert'
  | 'habit_streak'
  | 'productivity_momentum'
  | 'productivity_start';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  icon: string;
  message: string;
  actionLabel: string;
  priority: number; // Higher = more important
  onAction: () => void;
}

interface SmartRecommendationsProps {
  tasks: Task[];
  habits: Habit[];
  budgets: BudgetWithSpending[];
  focusSessions: FocusSession[];
  completedTasksToday: number;
  onStartFocus: () => void;
  onNavigateToTasks: () => void;
  onNavigateToBudgets: () => void;
  onLogHabit: (habitId: string) => void;
}

const STORAGE_KEY_PREFIX = 'dismissed_recommendations_';
const MAX_RECOMMENDATIONS = 2;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayKey(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Mark a recommendation as dismissed for today
 */
async function dismissRecommendation(type: RecommendationType): Promise<void> {
  try {
    const key = `${STORAGE_KEY_PREFIX}${getTodayKey()}`;
    const dismissed = await AsyncStorage.getItem(key);
    const dismissedList = dismissed ? JSON.parse(dismissed) : [];
    if (!dismissedList.includes(type)) {
      dismissedList.push(type);
      await AsyncStorage.setItem(key, JSON.stringify(dismissedList));
    }
  } catch (error) {
    console.error('[SmartRecommendations] Error dismissing recommendation:', error);
  }
}

/**
 * Get user's typical focus time based on historical sessions
 */
function getTypicalFocusHour(sessions: FocusSession[]): number | null {
  if (sessions.length === 0) return null;

  // Get hours when focus sessions started
  const hours = sessions
    .filter(s => s.startTime)
    .map(s => new Date(s.startTime!).getHours());

  if (hours.length === 0) return null;

  // Find most common hour (mode)
  const hourCounts: Record<number, number> = {};
  hours.forEach(h => {
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });

  const mostCommonHour = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])[0];

  return parseInt(mostCommonHour[0], 10);
}

/**
 * Check if current time is within 1 hour of the typical focus time
 */
function isNearFocusTime(typicalHour: number): boolean {
  const currentHour = new Date().getHours();
  return Math.abs(currentHour - typicalHour) <= 1;
}

/**
 * Get habits that haven't been logged today and are at risk
 */
function getHabitsAtRisk(habits: Habit[]): Habit[] {
  return habits.filter(h => h.currentStreak > 0 && h.currentStreak >= 3);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  tasks,
  habits,
  budgets,
  focusSessions,
  completedTasksToday,
  onStartFocus,
  onNavigateToTasks,
  onNavigateToBudgets,
  onLogHabit,
}) => {
  const { colors } = useTheme();
  const [dismissedTypes, setDismissedTypes] = useState<Set<RecommendationType>>(new Set());

  // Load dismissed recommendations on mount
  useEffect(() => {
    async function loadDismissed() {
      try {
        const key = `${STORAGE_KEY_PREFIX}${getTodayKey()}`;
        const dismissed = await AsyncStorage.getItem(key);
        if (dismissed) {
          setDismissedTypes(new Set(JSON.parse(dismissed)));
        }
      } catch (error) {
        console.error('[SmartRecommendations] Error loading dismissed:', error);
      }
    }
    loadDismissed();
  }, []);

  const recommendations = useMemo<Recommendation[]>(() => {
    const recs: Recommendation[] = [];

    // 1. Focus Time Suggestion
    const completedFocusSessions = focusSessions.filter(s => s.status === 'completed');
    const typicalHour = getTypicalFocusHour(completedFocusSessions);
    if (typicalHour !== null && isNearFocusTime(typicalHour)) {
      const hourStr = typicalHour === 0 ? '12 AM' : typicalHour > 12 ? `${typicalHour - 12} PM` : `${typicalHour} AM`;
      recs.push({
        id: 'focus_time',
        type: 'focus_time',
        icon: 'timer-outline',
        message: `You usually focus around ${hourStr} - start a session?`,
        actionLabel: 'Start Focus',
        priority: 7,
        onAction: onStartFocus,
      });
    }

    // 2. Overdue Task Alert
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter(t =>
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      t.dueDate &&
      t.dueDate < today
    );
    if (overdueTasks.length > 0) {
      recs.push({
        id: 'overdue_tasks',
        type: 'overdue_tasks',
        icon: 'alert-circle-outline',
        message: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} overdue - review priorities?`,
        actionLabel: 'Review',
        priority: 9,
        onAction: onNavigateToTasks,
      });
    }

    // 3. Budget Alert (highest usage first)
    const criticalBudgets = budgets
      .filter(b => b.status === 'exceeded' || b.status === 'warning')
      .sort((a, b) => b.percentUsed - a.percentUsed);

    if (criticalBudgets.length > 0) {
      const budget = criticalBudgets[0];
      const percentRounded = Math.round(budget.percentUsed);
      recs.push({
        id: `budget_${budget.id}`,
        type: 'budget_alert',
        icon: budget.status === 'exceeded' ? 'alert-octagon' : 'alert',
        message: `Budget alert: ${budget.category} at ${percentRounded}% used`,
        actionLabel: 'View Budget',
        priority: budget.status === 'exceeded' ? 10 : 8,
        onAction: onNavigateToBudgets,
      });
    }

    // 4. Habit Streak Risk
    const habitsAtRisk = getHabitsAtRisk(habits);
    if (habitsAtRisk.length > 0) {
      const habit = habitsAtRisk[0]; // Highest streak first
      recs.push({
        id: `habit_${habit.id}`,
        type: 'habit_streak',
        icon: 'fire',
        message: `${habit.name} streak at risk - log now?`,
        actionLabel: 'Log Habit',
        priority: 6,
        onAction: () => onLogHabit(habit.id),
      });
    }

    // 5. Productivity Patterns
    if (completedTasksToday >= 5) {
      recs.push({
        id: 'productivity_momentum',
        type: 'productivity_momentum',
        icon: 'trending-up',
        message: `You've completed ${completedTasksToday} tasks today - great momentum!`,
        actionLabel: 'Keep Going',
        priority: 3,
        onAction: onNavigateToTasks,
      });
    } else if (completedTasksToday === 0) {
      const currentHour = new Date().getHours();
      if (currentHour >= 9) { // Only show after 9 AM
        recs.push({
          id: 'productivity_start',
          type: 'productivity_start',
          icon: 'run-fast',
          message: 'No tasks completed yet today - want to start?',
          actionLabel: 'View Tasks',
          priority: 5,
          onAction: onNavigateToTasks,
        });
      }
    }

    // Sort by priority (highest first) and limit
    return recs
      .sort((a, b) => b.priority - a.priority)
      .slice(0, MAX_RECOMMENDATIONS);
  }, [tasks, habits, budgets, focusSessions, completedTasksToday, onStartFocus, onNavigateToTasks, onNavigateToBudgets, onLogHabit]);

  // Filter out dismissed recommendations
  const visibleRecommendations = recommendations.filter(
    rec => !dismissedTypes.has(rec.type)
  );

  const handleDismiss = async (rec: Recommendation) => {
    await dismissRecommendation(rec.type);
    setDismissedTypes(prev => new Set([...prev, rec.type]));
  };

  if (visibleRecommendations.length === 0) {
    return null;
  }

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {visibleRecommendations.map((rec) => (
        <RecommendationCard
          key={rec.id}
          recommendation={rec}
          onDismiss={() => handleDismiss(rec)}
          colors={colors}
        />
      ))}
    </View>
  );
};

// ============================================================================
// RECOMMENDATION CARD SUB-COMPONENT
// ============================================================================

interface RecommendationCardProps {
  recommendation: Recommendation;
  onDismiss: () => void;
  colors: ReturnType<typeof getColors>;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onDismiss,
  colors,
}) => {
  const getIconColor = () => {
    switch (recommendation.type) {
      case 'overdue_tasks':
        return colors.error;
      case 'budget_alert':
        return colors.warning;
      case 'habit_streak':
        return colors.error;
      case 'productivity_momentum':
        return colors.success;
      case 'focus_time':
        return colors.primary.main;
      default:
        return colors.text.secondary;
    }
  };

  const getGradientColors = () => {
    switch (recommendation.type) {
      case 'overdue_tasks':
        return [`${colors.error}15`, `${colors.error}05`];
      case 'budget_alert':
        return [`${colors.warning}15`, `${colors.warning}05`];
      case 'habit_streak':
        return [`${colors.error}15`, `${colors.error}05`];
      case 'productivity_momentum':
        return [`${colors.success}15`, `${colors.success}05`];
      case 'focus_time':
        return [`${colors.primary.main}15`, `${colors.primary.main}05`];
      default:
        return [colors.background.secondary, colors.background.primary];
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={getGradientColors() as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <IconButton
              icon={recommendation.icon}
              size={20}
              iconColor={getIconColor()}
              style={styles.icon}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.message}>{recommendation.message}</Text>
          </View>
          <TouchableOpacity
            onPress={recommendation.onAction}
            style={styles.actionButton}
            {...makeButton(
              recommendation.actionLabel,
              `Double tap to ${recommendation.actionLabel.toLowerCase()}`
            )}
          >
            <Text style={styles.actionButtonText}>{recommendation.actionLabel}</Text>
          </TouchableOpacity>
          <IconButton
            icon="close"
            size={16}
            iconColor={colors.text.tertiary}
            onPress={onDismiss}
            style={styles.dismissButton}
            hitSlop={HIT_SLOP}
            accessibilityLabel="Dismiss recommendation"
          />
        </View>
      </LinearGradient>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardGradient: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    margin: 0,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    lineHeight: typography.size.sm * typography.lineHeight.snug,
  },
  actionButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minHeight: 36,
    justifyContent: 'center',
    ...shadows.xs,
  },
  actionButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary.contrast,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
  },
  dismissButton: {
    margin: 0,
  },
});
