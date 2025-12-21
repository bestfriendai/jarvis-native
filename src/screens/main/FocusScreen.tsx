/**
 * Focus Screen
 * Focus blocks management with timer, analytics, and phone-in mode
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Text,
  SectionList,
} from 'react-native';
import { IconButton, SegmentedButtons, FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { usePhoneInMode } from '../../hooks/usePhoneInMode';
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate';
import * as focusBlocksDB from '../../database/focusBlocks';
import * as tasksDB from '../../database/tasks';
import { FocusBlock, CreateFocusBlockData } from '../../database/focusBlocks';
import { Task } from '../../database/tasks';
import { FocusBlockCard } from '../../components/focus/FocusBlockCard';
import { FocusTimer } from '../../components/focus/FocusTimer';
import { ImmersiveTimer } from '../../components/focus/ImmersiveTimer';
import { SessionCompleteOverlay } from '../../components/focus/SessionCompleteOverlay';
import { PhoneInModal } from '../../components/focus/PhoneInModal';
import { FocusBlockForm } from '../../components/focus/FocusBlockForm';
import { FocusAnalytics } from '../../components/focus/FocusAnalytics';
import { EmptyState, LoadingState } from '../../components/ui';
import { typography, spacing, borderRadius, shadows } from '../../theme';
import { haptic } from '../../utils/haptics';
import { HIT_SLOP } from '../../constants/ui';

type ViewMode = 'current' | 'list' | 'analytics';

interface SectionData {
  title: string;
  data: FocusBlock[];
}

export default function FocusScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { enable: enablePhoneIn, disable: disablePhoneIn } = usePhoneInMode();
  const { updateOptimistically, isPending } = useOptimisticUpdate();

  const [viewMode, setViewMode] = useState<ViewMode>('current');
  const [blocks, setBlocks] = useState<FocusBlock[]>([]);
  const [activeBlock, setActiveBlock] = useState<FocusBlock | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPhoneInModal, setShowPhoneInModal] = useState(false);
  const [showImmersiveTimer, setShowImmersiveTimer] = useState(false);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState<{
    minutes: number;
    title: string;
  } | null>(null);
  const [editingBlock, setEditingBlock] = useState<FocusBlock | null>(null);

  // Analytics data
  const [stats, setStats] = useState({
    totalFocusMinutes: 0,
    avgSessionMinutes: 0,
    completionRate: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [hourlyData, setHourlyData] = useState<
    Array<{ hour: number; minutes: number; sessions: number }>
  >([]);

  // Load focus blocks and tasks
  const loadData = useCallback(async () => {
    try {
      const [loadedBlocks, loadedTasks, blockStats, hourlyStats, completionRate, streak] =
        await Promise.all([
          focusBlocksDB.getFocusBlocks(),
          tasksDB.getTasks({ statuses: ['todo', 'in_progress'], sortField: 'dueDate', sortDirection: 'asc' }),
          focusBlocksDB.getFocusBlockStats(),
          focusBlocksDB.getFocusTimeByHour(),
          focusBlocksDB.getFocusCompletionRate(),
          focusBlocksDB.getFocusStreak(),
        ]);

      setBlocks(loadedBlocks);
      setTasks(loadedTasks);

      // Find active block
      const active = loadedBlocks.find((b) => b.status === 'in_progress');
      setActiveBlock(active || null);

      // Set analytics stats
      setStats({
        totalFocusMinutes: blockStats.totalFocusMinutes,
        avgSessionMinutes: blockStats.avgSessionMinutes,
        completionRate: completionRate.rate,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
      });
      setHourlyData(hourlyStats);
    } catch (error) {
      console.error('Error loading focus blocks:', error);
      Alert.alert('Error', 'Failed to load focus blocks');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Create focus block
  const handleCreate = async (data: CreateFocusBlockData) => {
    try {
      await focusBlocksDB.createFocusBlock(data);
      await loadData();
      Alert.alert('Success', 'Focus block created');
    } catch (error) {
      console.error('Error creating focus block:', error);
      Alert.alert('Error', 'Failed to create focus block');
    }
  };

  // Update focus block
  const handleUpdate = async (data: CreateFocusBlockData) => {
    if (!editingBlock) return;

    try {
      await focusBlocksDB.updateFocusBlock(editingBlock.id, data);
      await loadData();
      setEditingBlock(null);
      Alert.alert('Success', 'Focus block updated');
    } catch (error) {
      console.error('Error updating focus block:', error);
      Alert.alert('Error', 'Failed to update focus block');
    }
  };

  // Start focus block
  const handleStart = async (blockId: string) => {
    try {
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;

      // Check if there's already an active block
      if (activeBlock) {
        Alert.alert(
          'Active Session',
          'There is already an active focus session. Stop it first?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Stop Current',
              style: 'destructive',
              onPress: async () => {
                await handleStop(activeBlock.id);
                await startBlock(blockId, block);
              },
            },
          ]
        );
        return;
      }

      await startBlock(blockId, block);
    } catch (error) {
      console.error('Error starting focus block:', error);
      Alert.alert('Error', 'Failed to start focus block');
    }
  };

  const startBlock = async (blockId: string, block: FocusBlock) => {
    await updateOptimistically(
      () => {
        const updated = blocks.map((b) =>
          b.id === blockId ? { ...b, status: 'in_progress' as const } : b
        );
        setBlocks(updated);
        setActiveBlock(
          updated.find((b) => b.id === blockId) || null
        );
      },
      async () => {
        await focusBlocksDB.startFocusBlock(blockId);
        await loadData();

        // Enable phone-in mode if requested
        if (block.phoneInMode) {
          await enablePhoneIn();
          setShowPhoneInModal(true);
        }
      },
      {
        onError: async () => {
          await loadData();
        },
      }
    );
  };

  // Pause/Resume handled by FocusTimer component

  // Stop focus block
  const handleStop = async (blockId: string) => {
    Alert.alert(
      'Stop Focus Block',
      'Are you sure you want to stop this focus session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              await focusBlocksDB.cancelFocusBlock(blockId);
              setActiveBlock(null);
              setShowPhoneInModal(false);
              await disablePhoneIn();
              await loadData();
            } catch (error) {
              console.error('Error stopping focus block:', error);
              Alert.alert('Error', 'Failed to stop focus block');
            }
          },
        },
      ]
    );
  };

  // Complete focus block
  const handleComplete = async () => {
    if (!activeBlock) return;

    try {
      const now = new Date();
      const startTime = new Date(activeBlock.startTime!);
      const actualMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);

      await focusBlocksDB.completeFocusBlock(activeBlock.id, actualMinutes);

      // Store session data for celebration overlay
      setCompletedSessionData({
        minutes: actualMinutes,
        title: activeBlock.title,
      });

      setActiveBlock(null);
      setShowPhoneInModal(false);
      setShowImmersiveTimer(false);
      await disablePhoneIn();
      await loadData();

      // Show celebration instead of alert
      setShowSessionComplete(true);
    } catch (error) {
      console.error('Error completing focus block:', error);
      Alert.alert('Error', 'Failed to complete focus block');
    }
  };

  // Delete focus block
  const handleDelete = async (blockId: string) => {
    Alert.alert(
      'Delete Focus Block',
      'Are you sure you want to delete this focus block?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await focusBlocksDB.deleteFocusBlock(blockId);
              await loadData();
            } catch (error) {
              console.error('Error deleting focus block:', error);
              Alert.alert('Error', 'Failed to delete focus block');
            }
          },
        },
      ]
    );
  };

  // Edit focus block
  const handleEdit = (block: FocusBlock) => {
    setEditingBlock(block);
    setShowCreateModal(true);
  };

  // Prepare section data for list view
  const getSectionedData = (): SectionData[] => {
    const scheduled = blocks.filter((b) => b.status === 'scheduled');
    const completed = blocks.filter((b) => b.status === 'completed');
    const cancelled = blocks.filter((b) => b.status === 'cancelled');

    const sections: SectionData[] = [];

    if (scheduled.length > 0) {
      sections.push({ title: 'Scheduled', data: scheduled });
    }
    if (completed.length > 0) {
      sections.push({ title: 'Completed', data: completed });
    }
    if (cancelled.length > 0) {
      sections.push({ title: 'Cancelled', data: cancelled });
    }

    return sections;
  };

  // Render content based on view mode
  const renderContent = () => {
    if (isLoading) {
      return <LoadingState message="Loading focus blocks..." />;
    }

    if (viewMode === 'current') {
      if (activeBlock) {
        return (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary.main}
              />
            }
          >
            {/* Streak display */}
            {stats.currentStreak > 0 && (
              <View
                style={[
                  styles.streakCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.primary.main,
                  },
                ]}
              >
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={[styles.streakMessage, { color: colors.text.primary }]}>
                  Day {stats.currentStreak} of focusing!
                </Text>
                <Text style={[styles.streakSubtext, { color: colors.text.tertiary }]}>
                  Keep your streak alive
                </Text>
              </View>
            )}

            <FocusTimer
              focusBlock={activeBlock}
              onPause={() => {}}
              onResume={() => {}}
              onStop={() => handleStop(activeBlock.id)}
              onComplete={handleComplete}
            />
          </ScrollView>
        );
      }

      // No active block
      const upcomingBlocks = blocks.filter((b) => b.status === 'scheduled').slice(0, 3);

      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary.main}
            />
          }
        >
          <EmptyState
            icon="⏳"
            title="No Active Focus Block"
            description="Start a focus session to begin tracking your time"
          />

          {upcomingBlocks.length > 0 && (
            <View style={styles.upcomingSection}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Upcoming Sessions
              </Text>
              {upcomingBlocks.map((block) => (
                <FocusBlockCard
                  key={block.id}
                  block={block}
                  onStart={() => handleStart(block.id)}
                  onEdit={() => handleEdit(block)}
                  onDelete={() => handleDelete(block.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      );
    }

    if (viewMode === 'list') {
      const sections = getSectionedData();

      if (sections.length === 0) {
        return (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, styles.emptyContainer]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary.main}
              />
            }
          >
            <EmptyState
              icon="📅"
              title="No Focus Blocks Yet"
              description="Create your first focus block to start tracking your productivity"
            />
          </ScrollView>
        );
      }

      return (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FocusBlockCard
              block={item}
              onPress={() => {}}
              onStart={() => handleStart(item.id)}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: colors.text.primary }]}>
              {section.title}
            </Text>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary.main}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (viewMode === 'analytics') {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary.main}
            />
          }
        >
          <FocusAnalytics blocks={blocks} hourlyData={hourlyData} stats={stats} />
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            backgroundColor: colors.background.primary,
            borderBottomColor: colors.border.subtle,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Focus
        </Text>
        <View style={styles.headerActions}>
          {activeBlock && (
            <>
              <IconButton
                icon="fullscreen"
                iconColor={colors.primary.main}
                size={24}
                onPress={() => {
                  haptic.buttonPress();
                  setShowImmersiveTimer(true);
                }}
                hitSlop={HIT_SLOP}
              />
              <IconButton
                icon="cellphone-off"
                iconColor={colors.primary.main}
                size={24}
                onPress={() => setShowPhoneInModal(true)}
                hitSlop={HIT_SLOP}
              />
            </>
          )}
        </View>
      </View>

      {/* View Mode Selector */}
      <View style={styles.viewModeContainer}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          buttons={[
            {
              value: 'current',
              label: 'Current',
              icon: 'play-circle',
            },
            {
              value: 'list',
              label: 'All',
              icon: 'format-list-bulleted',
            },
            {
              value: 'analytics',
              label: 'Analytics',
              icon: 'chart-line',
            },
          ]}
          style={{ backgroundColor: colors.background.primary }}
        />
      </View>

      {/* Content */}
      {renderContent()}

      {/* FAB */}
      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary.main,
            bottom: insets.bottom + 16,
          },
        ]}
        color={colors.primary.contrast}
        onPress={() => {
          setEditingBlock(null);
          setShowCreateModal(true);
        }}
      />

      {/* Modals */}
      <FocusBlockForm
        visible={showCreateModal}
        focusBlock={editingBlock}
        tasks={tasks}
        onClose={() => {
          setShowCreateModal(false);
          setEditingBlock(null);
        }}
        onSave={editingBlock ? handleUpdate : handleCreate}
      />

      {activeBlock && (
        <PhoneInModal
          visible={showPhoneInModal}
          focusBlock={activeBlock}
          onComplete={handleComplete}
          onEmergencyExit={() => handleStop(activeBlock.id)}
        />
      )}

      {/* Immersive Timer Modal */}
      {activeBlock && showImmersiveTimer && (
        <View style={styles.immersiveContainer}>
          <ImmersiveTimer
            focusBlock={activeBlock}
            streak={stats.currentStreak}
            onExit={() => {
              haptic.light();
              setShowImmersiveTimer(false);
            }}
            onPause={() => {}}
            onResume={() => {}}
            onStop={() => {
              setShowImmersiveTimer(false);
              handleStop(activeBlock.id);
            }}
            onComplete={handleComplete}
          />
        </View>
      )}

      {/* Session Complete Celebration */}
      {completedSessionData && (
        <SessionCompleteOverlay
          visible={showSessionComplete}
          sessionMinutes={completedSessionData.minutes}
          sessionTitle={completedSessionData.title}
          streak={stats.currentStreak}
          onStartAnother={() => {
            setShowCreateModal(true);
          }}
          onTakeBreak={() => {
            // Just dismiss - user can relax
          }}
          onDismiss={() => {
            setShowSessionComplete(false);
            setCompletedSessionData(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModeContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.lg,
  },
  sectionHeader: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  upcomingSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: 16,
    ...shadows.lg,
  },
  immersiveContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  streakCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  streakEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  streakMessage: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  streakSubtext: {
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
});
