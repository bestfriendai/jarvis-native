/**
 * Pomodoro Screen
 * Main screen for pomodoro timer feature with timer, stats, and history
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { IconButton, SegmentedButtons, FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { usePomodoroTimer } from '../../hooks/usePomodoroTimer';
import { usePomodoroNotifications } from '../../hooks/usePomodoroNotifications';
import * as pomodoroDB from '../../database/pomodoro';
import * as tasksDB from '../../database/tasks';
import { PomodoroSession, PomodoroStats, DayStats } from '../../database/pomodoro';
import { Task } from '../../database/tasks';
import { PomodoroTimer } from '../../components/pomodoro/PomodoroTimer';
import { PomodoroControls } from '../../components/pomodoro/PomodoroControls';
import { PomodoroStats as StatsComponent } from '../../components/pomodoro/PomodoroStats';
import { PomodoroHistory } from '../../components/pomodoro/PomodoroHistory';
import { PomodoroSettingsModal } from '../../components/pomodoro/PomodoroSettings';
import { TaskPickerModal } from '../../components/pomodoro/TaskPickerModal';
import { typography, spacing, shadows } from '../../theme';
import {
  makeButton,
  makeHeader,
  makeRadio,
  announceForAccessibility,
} from '../../utils/accessibility';
import { HIT_SLOP } from '../../constants/ui';

type ViewMode = 'timer' | 'stats' | 'history';

export default function PomodoroScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { state, settings, startWork, pause, resume, stop, skip, loadSettings, setTaskId } =
    usePomodoroTimer();

  const {
    schedulePhaseNotification,
    playHapticFeedback,
  } = usePomodoroNotifications({
    enabled: settings?.notificationSound === 1,
    soundEnabled: settings?.notificationSound === 1,
  });

  const [viewMode, setViewMode] = useState<ViewMode>('timer');
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [linkedTask, setLinkedTask] = useState<Task | null>(null);

  // Stats data
  const [todayStats, setTodayStats] = useState<PomodoroStats>({
    completedCount: 0,
    totalMinutes: 0,
    avgSessionMinutes: 0,
  });
  const [weeklyStats, setWeeklyStats] = useState<PomodoroStats>({
    completedCount: 0,
    totalMinutes: 0,
    avgSessionMinutes: 0,
  });
  const [streak, setStreak] = useState(0);
  const [sevenDayHistory, setSevenDayHistory] = useState<DayStats[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: number; count: number }[]>([]);

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [
        loadedSessions,
        loadedTasks,
        todayData,
        weeklyData,
        streakData,
        sevenDayData,
        hourlyDataResult,
      ] = await Promise.all([
        pomodoroDB.getPomodoroSessions({ limit: 50 }),
        tasksDB.getTasks({
          statuses: ['todo', 'in_progress'],
          sortField: 'dueDate',
          sortDirection: 'asc',
        }),
        pomodoroDB.getTodayPomodoroStats(),
        pomodoroDB.getWeeklyPomodoroStats(),
        pomodoroDB.getPomodoroStreak(),
        pomodoroDB.getSevenDayPomodoroHistory(),
        pomodoroDB.getPomodorosByHour(),
      ]);

      setSessions(loadedSessions);
      setTasks(loadedTasks);
      setTodayStats(todayData);
      setWeeklyStats(weeklyData);
      setStreak(streakData);
      setSevenDayHistory(sevenDayData);
      setHourlyData(hourlyDataResult);
    } catch (error) {
      console.error('Error loading pomodoro data:', error);
      Alert.alert('Error', 'Failed to load pomodoro data');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load linked task details when taskId changes
  useEffect(() => {
    const loadLinkedTask = async () => {
      if (state.taskId) {
        try {
          const task = await tasksDB.getTask(state.taskId);
          setLinkedTask(task);
        } catch (error) {
          console.error('Error loading linked task:', error);
          setLinkedTask(null);
        }
      } else {
        setLinkedTask(null);
      }
    };
    loadLinkedTask();
  }, [state.taskId]);

  // Refresh on phase change
  useEffect(() => {
    if (!state.isActive && !state.isPaused) {
      loadData();
    }
  }, [state.isActive, state.isPaused, loadData]);

  // Send notifications on phase change
  useEffect(() => {
    if (state.isActive && state.timeRemaining === state.totalDuration) {
      schedulePhaseNotification(state.phase);
    }
  }, [state.phase, state.isActive, state.timeRemaining, state.totalDuration]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleStart = async () => {
    if (!settings) {
      Alert.alert('Error', 'Settings not loaded. Please try again.');
      return;
    }

    await startWork(state.taskId);
    await playHapticFeedback('warning');
  };

  const handlePause = () => {
    pause();
    playHapticFeedback('warning');
  };

  const handleResume = () => {
    resume();
    playHapticFeedback('warning');
  };

  const handleStop = async () => {
    Alert.alert(
      'Stop Pomodoro',
      'Are you sure you want to stop this pomodoro session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            await stop();
            await playHapticFeedback('error');
            await loadData();
          },
        },
      ]
    );
  };

  const handleSkip = async () => {
    await skip();
    await playHapticFeedback('warning');
    await loadData();
  };

  const handleSelectTask = () => {
    setShowTaskPicker(true);
  };

  const handleTaskSelected = (task: Task | null) => {
    // Just link the task, don't auto-start timer
    setTaskId(task?.id);
    playHapticFeedback('success');
  };

  const handleSaveSettings = async (newSettings: Partial<pomodoroDB.PomodoroSettings>) => {
    try {
      await pomodoroDB.updatePomodoroSettings(newSettings);
      await loadSettings();
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await pomodoroDB.deletePomodoroSession(sessionId);
              await loadData();
            } catch (error) {
              console.error('Error deleting session:', error);
              Alert.alert('Error', 'Failed to delete session');
            }
          },
        },
      ]
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'timer':
        return (
          <View style={styles.timerContent}>
            <PomodoroTimer state={state} />
            <PomodoroControls
              state={state}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              onSkip={handleSkip}
              onSelectTask={handleSelectTask}
              linkedTaskTitle={linkedTask?.title}
            />
          </View>
        );

      case 'stats':
        return (
          <StatsComponent
            todayStats={todayStats}
            weeklyStats={weeklyStats}
            streak={streak}
            sevenDayHistory={sevenDayHistory}
            hourlyData={hourlyData}
          />
        );

      case 'history':
        return (
          <PomodoroHistory
            sessions={sessions}
            onDeleteSession={handleDeleteSession}
          />
        );

      default:
        return null;
    }
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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]} {...makeHeader('Pomodoro', 1)}>
          Pomodoro
        </Text>
        <IconButton
          icon="cog-outline"
          iconColor={colors.text.secondary}
          size={24}
          onPress={() => setShowSettings(true)}
                hitSlop={HIT_SLOP}
          {...makeButton('Settings', 'Double tap to open pomodoro settings')}
        />
      </View>

      {/* View Mode Selector */}
      <View style={styles.viewModeContainer} accessible accessibilityLabel="Pomodoro view mode" accessibilityHint="Select between timer, statistics, or history view">
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          buttons={[
            {
              value: 'timer',
              label: 'Timer',
              icon: 'timer-outline',
              accessibilityLabel: 'Timer view',
            },
            {
              value: 'stats',
              label: 'Stats',
              icon: 'chart-bar',
              accessibilityLabel: 'Statistics view',
            },
            {
              value: 'history',
              label: 'History',
              icon: 'history',
              accessibilityLabel: 'History view',
            },
          ]}
          style={{ backgroundColor: colors.background.primary }}
        />
      </View>

      {/* Content */}
      {renderContent()}

      {/* Settings Modal */}
      <PomodoroSettingsModal
        visible={showSettings}
        settings={settings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
      />

      {/* Task Picker Modal */}
      <TaskPickerModal
        visible={showTaskPicker}
        onClose={() => setShowTaskPicker(false)}
        onSelect={handleTaskSelected}
        currentTaskId={state.taskId}
      />
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
  viewModeContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  timerContent: {
    flex: 1,
    justifyContent: 'center',
  },
});
