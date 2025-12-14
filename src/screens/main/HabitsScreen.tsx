/**
 * Habits Screen
 * Professional habit tracking with streaks and heatmap visualization
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Text,
  TouchableOpacity,
  Animated,
  Vibration,
} from 'react-native';
import { IconButton, Switch } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as habitsDB from '../../database/habits';
import { getHabitInsights, HabitInsights } from '../../database/habits';
import { HabitHeatmap } from '../../components/HabitHeatmap';
import { HabitInsightsCard } from '../../components/habits/HabitInsightsCard';
import { HabitReminderPicker } from '../../components/habits/HabitReminderPicker';
import { HabitNotesModal } from '../../components/habits/HabitNotesModal';
import { HabitLogsView } from '../../components/habits/HabitLogsView';
import { AppButton, AppChip, EmptyState, LoadingState } from '../../components/ui';
import * as storage from '../../services/storage';
import { WeeklyCompletionChart, HabitsComparisonChart } from '../../components/charts';
import * as notificationService from '../../services/notifications';
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';

type HabitCadence = 'daily' | 'weekly' | 'monthly';

interface Habit extends habitsDB.Habit {
  isActive: boolean;
  completionsToday?: number;
  completionRate30Days?: number;
  stats?: {
    totalDays: number;
    completedDays: number;
    completionRate: number;
  };
}

export default function HabitsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapHabit, setHeatmapHabit] = useState<Habit | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [celebratingHabitId, setCelebratingHabitId] = useState<string | null>(null);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [selectedHabitInsights, setSelectedHabitInsights] = useState<HabitInsights | null>(null);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insightsHabitName, setInsightsHabitName] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesHabitId, setNotesHabitId] = useState<string | null>(null);
  const [notesHabitName, setNotesHabitName] = useState('');
  const [promptForNotes, setPromptForNotes] = useState(false);
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [historyHabitId, setHistoryHabitId] = useState<string | null>(null);
  const [historyHabitName, setHistoryHabitName] = useState('');
  const insets = useSafeAreaInsets();
  const { updateOptimistically, isPending } = useOptimisticUpdate();

  // Load habits from local database
  const loadHabits = useCallback(async () => {
    try {
      const loadedHabits = await habitsDB.getHabits();

      // Check completion status and get stats for each habit
      const today = new Date().toISOString().split('T')[0];
      const habitsWithStatus = await Promise.all(
        loadedHabits.map(async (habit) => {
          const isCompleted = await habitsDB.isHabitCompletedToday(habit.id);
          const stats = await habitsDB.getHabitStats(habit.id);

          // Calculate 30-day completion rate
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const startDate = thirtyDaysAgo.toISOString().split('T')[0];
          const logs = await habitsDB.getHabitLogs(habit.id, startDate, today);
          const completedLast30 = logs.filter(l => l.completed).length;
          const completionRate30Days = (completedLast30 / 30) * 100;

          return {
            ...habit,
            isActive: true, // All habits are active by default
            completionsToday: isCompleted ? 1 : 0,
            completionRate30Days,
            stats,
          };
        })
      );

      setHabits(habitsWithStatus);
    } catch (error) {
      console.error('Error loading habits:', error);
      Alert.alert('Error', 'Failed to load habits');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
    loadNotesPreference();
  }, [loadHabits, refreshTrigger]);

  const loadNotesPreference = async () => {
    try {
      const preference = await storage.getItem('habit_notes_prompt_enabled');
      setPromptForNotes(preference === 'true');
    } catch (error) {
      console.error('[HabitsScreen] Error loading notes preference:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  };

  const handleLogToday = async (habitId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const isCompleted = (habit.completionsToday || 0) > 0;

      if (!isCompleted) {
        // Completing habit - check if we should prompt for notes
        if (promptForNotes) {
          setNotesHabitId(habitId);
          setNotesHabitName(habit.name);
          setShowNotesModal(true);
          return;
        }

        // Complete without notes - optimistic update
        await completeHabitOptimistic(habitId, undefined);
      } else {
        // Uncompleting habit - optimistic update
        const previousHabits = [...habits];
        const updatedHabits = habits.map(h =>
          h.id === habitId
            ? { ...h, completionsToday: 0 }
            : h
        );

        await updateOptimistically(
          () => setHabits(updatedHabits),
          async () => {
            await habitsDB.logHabitCompletion(habitId, today, false);
            await loadHabits();
          },
          {
            onError: (error) => {
              console.error('[HabitsScreen] Error uncompleting habit:', error);
              setHabits(previousHabits);
            },
          }
        );
      }
    } catch (error) {
      console.error('Error logging habit:', error);
      Alert.alert('Error', 'Failed to log habit completion');
    }
  };

  const completeHabitOptimistic = async (habitId: string, notes?: string) => {
    const previousHabits = [...habits];
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // Optimistic update - mark as completed
    const updatedHabits = habits.map(h =>
      h.id === habitId
        ? { ...h, completionsToday: 1, currentStreak: (h.currentStreak || 0) + 1 }
        : h
    );

    await updateOptimistically(
      () => {
        setHabits(updatedHabits);
        Vibration.vibrate(50); // Haptic feedback
      },
      async () => {
        const today = new Date().toISOString().split('T')[0];
        await habitsDB.logHabitCompletion(habitId, today, true, notes);
        await loadHabits(); // Reload to get accurate streak

        // Check for milestones after completion
        const updatedHabit = await habitsDB.getHabit(habitId);
        if (updatedHabit) {
          const streak = updatedHabit.currentStreak;
          let message = '';

          if (streak === 7) {
            message = '7 day streak! Keep going!';
          } else if (streak === 30) {
            message = '30 days! You are unstoppable!';
          } else if (streak === 100) {
            message = '100 DAYS! LEGEND STATUS!';
          } else if (streak % 10 === 0 && streak > 0) {
            message = `${streak} day streak!`;
          }

          if (message) {
            setCelebratingHabitId(habitId);
            setCelebrationMessage(message);
            Vibration.vibrate([100, 50, 100]);
            setTimeout(() => setCelebratingHabitId(null), 3000);
          }
        }
      },
      {
        onError: (error) => {
          console.error('[HabitsScreen] Error completing habit:', error);
          setHabits(previousHabits);
        },
      }
    );
  };

  const completeHabit = completeHabitOptimistic;

  const handleSaveNotes = async (notes: string) => {
    if (!notesHabitId) return;

    await completeHabit(notesHabitId, notes);
    setShowNotesModal(false);
    setNotesHabitId(null);
    setNotesHabitName('');
  };

  const handleSkipNotes = async () => {
    if (!notesHabitId) return;

    await completeHabit(notesHabitId, undefined);
    setShowNotesModal(false);
    setNotesHabitId(null);
    setNotesHabitName('');
  };

  const handleViewHistory = (habitId: string, habitName: string) => {
    setHistoryHabitId(habitId);
    setHistoryHabitName(habitName);
    setShowHistoryView(true);
  };

  const handleDelete = (habitId: string) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure? All completion history will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get habit to check for notification ID
              const habit = await habitsDB.getHabit(habitId);

              // Cancel notification if it exists
              if (habit?.notificationId) {
                try {
                  await notificationService.cancelNotification(habit.notificationId);
                } catch (error) {
                  console.warn('[HabitsScreen] Error canceling notification:', error);
                }
              }

              await habitsDB.deleteHabit(habitId);
              await loadHabits();
            } catch (error) {
              console.error('Error deleting habit:', error);
              Alert.alert('Error', 'Failed to delete habit');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (habitId: string, isActive: boolean) => {
    // For now, we'll just use the isActive flag in memory
    // In a full implementation, you'd add an is_active column to the habits table
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, isActive: !isActive } : h))
    );
  };

  const handleViewHeatmap = (habit: Habit) => {
    setHeatmapHabit(habit);
    setShowHeatmap(true);
  };

  const loadInsights = async (habitId: string, habitName: string) => {
    try {
      const insights = await getHabitInsights(habitId);
      setSelectedHabitInsights(insights);
      setInsightsHabitName(habitName);
      setShowInsightsModal(true);
    } catch (error) {
      console.error('[HabitsScreen] Error loading insights:', error);
      Alert.alert('Error', 'Failed to load habit insights. Please try again.');
    }
  };

  const getMilestoneBadges = (currentStreak: number, longestStreak: number) => {
    const badges: string[] = [];
    if (longestStreak >= 7) badges.push('🥉 7 Day');
    if (longestStreak >= 30) badges.push('🥈 30 Day');
    if (longestStreak >= 100) badges.push('🥇 100 Day');
    return badges;
  };

  const activeHabits = habits.filter((h) => h.isActive);
  const inactiveHabits = habits.filter((h) => !h.isActive);

  if (isLoading && habits.length === 0) {
    return <LoadingState fullScreen message="Loading habits..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Habits</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>
              {activeHabits.length} active habit{activeHabits.length !== 1 ? 's' : ''}
            </Text>
            {isPending && (
              <View style={styles.savingIndicator}>
                <Text style={styles.savingText}>Saving...</Text>
              </View>
            )}
          </View>
        </View>
        <AppButton
          title="New Habit"
          onPress={() => {
            setSelectedHabit(null);
            setShowCreateModal(true);
          }}
          size="small"
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeHabits.length === 0 && inactiveHabits.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="No habits yet"
            description="Start building consistent habits to track your progress and build momentum"
            actionLabel="Create Habit"
            onAction={() => {
              setSelectedHabit(null);
              setShowCreateModal(true);
            }}
          />
        ) : (
          <>
            {/* Habits Comparison Chart */}
            {activeHabits.length >= 2 && (
              <View style={styles.section}>
                <HabitsComparisonChart
                  habitIds={activeHabits.slice(0, 5).map((h) => h.id)}
                />
              </View>
            )}

            {/* Active Habits */}
            {activeHabits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>ACTIVE</Text>
                {activeHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onLogToday={handleLogToday}
                    onViewHeatmap={handleViewHeatmap}
                    onViewInsights={loadInsights}
                    onViewHistory={handleViewHistory}
                    onEdit={(h) => {
                      setSelectedHabit(h);
                      setShowCreateModal(true);
                    }}
                    onDelete={handleDelete}
                    onToggleActive={() =>
                      handleToggleActive(habit.id, habit.isActive)
                    }
                    getMilestoneBadges={getMilestoneBadges}
                  />
                ))}
              </View>
            )}

            {/* Inactive Habits */}
            {inactiveHabits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>INACTIVE</Text>
                {inactiveHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onLogToday={handleLogToday}
                    onViewHeatmap={handleViewHeatmap}
                    onViewInsights={loadInsights}
                    onViewHistory={handleViewHistory}
                    onEdit={(h) => {
                      setSelectedHabit(h);
                      setShowCreateModal(true);
                    }}
                    onDelete={handleDelete}
                    onToggleActive={() =>
                      handleToggleActive(habit.id, habit.isActive)
                    }
                    getMilestoneBadges={getMilestoneBadges}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <HabitFormModal
        visible={showCreateModal}
        habit={selectedHabit}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedHabit(null);
        }}
        onSuccess={() => {
          setRefreshTrigger(prev => prev + 1);
        }}
      />

      {/* Heatmap Modal */}
      <Modal
        visible={showHeatmap}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHeatmap(false)}
      >
        <View style={styles.heatmapOverlay}>
          <View style={styles.heatmapContent}>
            <View style={styles.heatmapHeader}>
              <View>
                <Text style={styles.heatmapTitle}>{heatmapHabit?.name}</Text>
                <Text style={styles.heatmapSubtitle}>
                  Last 12 weeks of activity
                </Text>
              </View>
              <IconButton
                icon="close"
                onPress={() => setShowHeatmap(false)}
                iconColor={colors.text.tertiary}
              />
            </View>
            {heatmapHabit && (
              <HabitHeatmap
                habitId={heatmapHabit.id}
                completions={[]}
                weeks={12}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Celebration Modal */}
      {celebratingHabitId && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setCelebratingHabitId(null)}
        >
          <View style={styles.celebrationOverlay}>
            <Animated.View style={styles.celebrationContent}>
              <Text style={styles.celebrationEmoji}>🎉</Text>
              <Text style={styles.celebrationText}>{celebrationMessage}</Text>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Insights Modal */}
      <Modal
        visible={showInsightsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInsightsModal(false)}
      >
        <View style={styles.insightsModalContainer}>
          <View style={styles.insightsModalHeader}>
            <Text style={styles.insightsModalTitle}>Habit Insights</Text>
            <IconButton
              icon="close"
              onPress={() => setShowInsightsModal(false)}
              iconColor={colors.text.tertiary}
            />
          </View>

          {selectedHabitInsights && (
            <HabitInsightsCard
              insights={selectedHabitInsights}
              habitName={insightsHabitName}
            />
          )}
        </View>
      </Modal>

      {/* Notes Modal */}
      {notesHabitId && (
        <HabitNotesModal
          visible={showNotesModal}
          habitName={notesHabitName}
          onSave={handleSaveNotes}
          onSkip={handleSkipNotes}
          onClose={() => {
            setShowNotesModal(false);
            setNotesHabitId(null);
            setNotesHabitName('');
          }}
        />
      )}

      {/* History View Modal */}
      <Modal
        visible={showHistoryView}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistoryView(false)}
      >
        {historyHabitId && (
          <HabitLogsView
            habitId={historyHabitId}
            habitName={historyHabitName}
            onClose={() => {
              setShowHistoryView(false);
              setHistoryHabitId(null);
              setHistoryHabitName('');
              loadHabits(); // Reload habits in case notes were edited
            }}
          />
        )}
      </Modal>
    </View>
  );
}

// Habit Card Component
interface HabitCardProps {
  habit: Habit;
  onLogToday: (id: string) => void;
  onViewHeatmap: (habit: Habit) => void;
  onViewInsights: (habitId: string, habitName: string) => void;
  onViewHistory: (habitId: string, habitName: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onToggleActive: () => void;
  getMilestoneBadges: (currentStreak: number, longestStreak: number) => string[];
}

const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onLogToday,
  onViewHeatmap,
  onViewInsights,
  onViewHistory,
  onEdit,
  onDelete,
  onToggleActive,
  getMilestoneBadges,
}) => {
  const [scaleValue] = useState(new Animated.Value(1));
  const isCompletedToday = (habit.completionsToday || 0) > 0;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        onPress={() => onEdit(habit)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[styles.habitCard, !habit.isActive && styles.habitCardInactive]}
      >
        <View style={styles.habitContent}>
          <View style={styles.habitHeader}>
            <View style={styles.habitInfo}>
              <Text style={styles.habitName}>{habit.name}</Text>
              {habit.description && (
                <Text style={styles.habitDescription} numberOfLines={2}>
                  {habit.description}
                </Text>
              )}

              {/* Meta row with enhanced stats */}
              <View style={styles.habitMeta}>
                <AppChip label={habit.cadence} compact />

                {/* Current Streak */}
                <View style={styles.streakContainer}>
                  <Text style={styles.streakIcon}>🔥</Text>
                  <Text style={styles.streakText}>
                    {habit.currentStreak || 0} day
                    {(habit.currentStreak || 0) !== 1 ? 's' : ''}
                  </Text>
                </View>

                {/* Best Streak */}
                {habit.longestStreak > 0 && habit.longestStreak > habit.currentStreak && (
                  <View style={styles.bestStreakContainer}>
                    <Text style={styles.bestStreakLabel}>Best:</Text>
                    <Text style={styles.bestStreakValue}>{habit.longestStreak}</Text>
                  </View>
                )}
              </View>

              {/* 30-day completion rate */}
              {habit.completionRate30Days !== undefined && (
                <View style={styles.completionRateRow}>
                  <View style={styles.completionRateBar}>
                    <View
                      style={[
                        styles.completionRateFill,
                        { width: `${Math.min(100, habit.completionRate30Days)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.completionRateText}>
                    {Math.round(habit.completionRate30Days)}% (30 days)
                  </Text>
                </View>
              )}

              {/* Weekly Activity Chart */}
              <View style={styles.chartContainer}>
                <WeeklyCompletionChart habitId={habit.id} compact />
              </View>

              {/* Milestone Badges */}
              {(() => {
                const badges = getMilestoneBadges(habit.currentStreak, habit.longestStreak);
                return badges.length > 0 ? (
                  <View style={styles.badgesRow}>
                    {badges.map((badge, index) => (
                      <View key={index} style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                ) : null;
              })()}
            </View>

            {/* Log Button */}
            {habit.isActive && (
              <TouchableOpacity
                onPress={() => onLogToday(habit.id)}
                style={[
                  styles.logButton,
                  isCompletedToday && styles.logButtonCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.logButtonText,
                    isCompletedToday && styles.logButtonTextCompleted,
                  ]}
                >
                  {isCompletedToday ? '✓ Done' : '+ Log'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Actions */}
          <View style={styles.habitActions}>
            <TouchableOpacity
              onPress={() => onViewHistory(habit.id, habit.name)}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onViewInsights(habit.id, habit.name)}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>Insights</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onViewHeatmap(habit)}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>Heatmap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onEdit(habit)}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(habit.id)}
              style={styles.actionButton}
            >
              <Text style={[styles.actionButtonText, styles.deleteText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>

          {/* Active Toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Active</Text>
            <Switch
              value={habit.isActive}
              onValueChange={onToggleActive}
              trackColor={{
                false: colors.background.tertiary,
                true: `${colors.primary.main}80`,
              }}
              thumbColor={habit.isActive ? colors.primary.main : colors.text.disabled}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Habit Form Modal
interface HabitFormModalProps {
  visible: boolean;
  habit: Habit | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const HabitFormModal: React.FC<HabitFormModalProps> = ({
  visible,
  habit,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [cadence, setCadence] = useState<HabitCadence>(habit?.cadence || 'daily');
  const [reminderTime, setReminderTime] = useState<string | undefined>(habit?.reminderTime);
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setName(habit?.name || '');
      setDescription(habit?.description || '');
      setCadence(habit?.cadence || 'daily');
      setReminderTime(habit?.reminderTime);
    }
  }, [visible, habit]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = {
        name,
        description: description || undefined,
        cadence,
        reminderTime: reminderTime || undefined,
      };

      let savedHabit: habitsDB.Habit;

      if (habit) {
        // Update existing habit
        savedHabit = await habitsDB.updateHabit(habit.id, data);

        // Handle notification scheduling
        // Cancel old notification if it exists
        if (habit.notificationId) {
          try {
            await notificationService.cancelNotification(habit.notificationId);
          } catch (error) {
            console.warn('[HabitsScreen] Error canceling old notification:', error);
          }
        }

        // Schedule new notification if reminder time is set
        if (reminderTime) {
          try {
            const notificationId = await notificationService.scheduleHabitReminder(
              savedHabit.id,
              savedHabit.name,
              reminderTime
            );
            await habitsDB.updateHabit(savedHabit.id, { notificationId });
          } catch (error) {
            console.warn('[HabitsScreen] Error scheduling notification:', error);
            Alert.alert(
              'Reminder Not Set',
              'Failed to schedule reminder notification. Please check notification permissions.',
              [{ text: 'OK' }]
            );
          }
        } else {
          // Clear notification ID if reminder was removed
          await habitsDB.updateHabit(savedHabit.id, { notificationId: undefined });
        }
      } else {
        // Create new habit
        savedHabit = await habitsDB.createHabit(data);

        // Schedule notification if reminder time is set
        if (reminderTime) {
          try {
            const notificationId = await notificationService.scheduleHabitReminder(
              savedHabit.id,
              savedHabit.name,
              reminderTime
            );
            await habitsDB.updateHabit(savedHabit.id, { notificationId });
          } catch (error) {
            console.warn('[HabitsScreen] Error scheduling notification:', error);
            Alert.alert(
              'Reminder Not Set',
              'Failed to schedule reminder notification. Please check notification permissions.',
              [{ text: 'OK' }]
            );
          }
        }
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving habit:', error);
      Alert.alert('Error', 'Failed to save habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { paddingBottom: Math.max(insets.bottom, spacing.base) },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {habit ? 'Edit Habit' : 'New Habit'}
            </Text>
            <IconButton
              icon="close"
              onPress={onClose}
              iconColor={colors.text.tertiary}
            />
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Habit name..."
                placeholderTextColor={colors.text.placeholder}
                style={[styles.input, nameFocused && styles.inputFocused]}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Optional description..."
                placeholderTextColor={colors.text.placeholder}
                style={[
                  styles.input,
                  styles.textArea,
                  descFocused && styles.inputFocused,
                ]}
                multiline
                numberOfLines={3}
                onFocus={() => setDescFocused(true)}
                onBlur={() => setDescFocused(false)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.frequencyButtons}>
                {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                  <AppChip
                    key={freq}
                    label={freq.charAt(0).toUpperCase() + freq.slice(1)}
                    selected={cadence === freq}
                    onPress={() => setCadence(freq)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <HabitReminderPicker
                reminderTime={reminderTime}
                onReminderChange={setReminderTime}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <AppButton
              title="Cancel"
              onPress={onClose}
              variant="outline"
              style={styles.modalButton}
            />
            <AppButton
              title={habit ? 'Update' : 'Create'}
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={!name.trim()}
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  savingIndicator: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  savingText: {
    fontSize: typography.size.xs,
    color: colors.primary.main,
    fontWeight: typography.weight.medium,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing.md,
  },
  // Habit Card styles
  habitCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  habitCardInactive: {
    opacity: 0.6,
  },
  habitContent: {
    padding: spacing.base,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  habitInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  habitName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  habitDescription: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
    marginBottom: spacing.sm,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakIcon: {
    fontSize: 14,
  },
  streakText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.primary.main,
  },
  logButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  logButtonCompleted: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary.main,
  },
  logButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: '#FFFFFF',
  },
  logButtonTextCompleted: {
    color: colors.primary.main,
  },
  habitActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.primary.main,
  },
  deleteText: {
    color: colors.error,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  toggleLabel: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  // Heatmap Modal
  heatmapOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  heatmapContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 600,
    ...shadows.lg,
  },
  heatmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  heatmapTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  heatmapSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  // Modal styles
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
  inputFocused: {
    borderColor: colors.primary.main,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  // Best streak styles
  bestStreakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
  },
  bestStreakLabel: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  bestStreakValue: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primary.main,
  },
  // Completion rate styles
  completionRateRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  completionRateBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  completionRateFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.full,
  },
  completionRateText: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    minWidth: 80,
  },
  chartContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  // Badge styles
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  badge: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  badgeText: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  // Celebration modal styles
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    minWidth: 250,
    ...shadows.lg,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: spacing.base,
  },
  celebrationText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.primary.main,
    textAlign: 'center',
  },
  // Insights modal styles
  insightsModalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  insightsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.background.secondary,
  },
  insightsModalTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
});
