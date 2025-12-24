/**
 * QuickCaptureSheet Component
 * Bottom sheet modal for quick capture actions from dashboard
 * Provides quick access to: Task creation, Expense logging, Focus start
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { IconButton, ActivityIndicator } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { makeButton, makeTextInput, announceForAccessibility } from '../../utils/accessibility';
import { HIT_SLOP } from '../../constants/ui';
import { Task } from '../../database/tasks';
import { Habit } from '../../database/habits';
import DateTimePicker from '@react-native-community/datetimepicker';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 520;

interface QuickCaptureSheetProps {
  visible: boolean;
  onClose: () => void;
  onQuickTask: (title: string) => Promise<void>;
  onLogExpense: (amount: string) => Promise<void>;
  onStartFocus: (taskId?: string) => Promise<void>;
  onLogHabit?: (habitId: string) => Promise<void>;
  onCreateEvent?: (title: string, startTime: Date, endTime: Date) => Promise<void>;
  tasks?: Task[];
  habits?: Habit[];
}

type CaptureMode = 'menu' | 'task' | 'expense' | 'focus' | 'habit' | 'event';

export const QuickCaptureSheet: React.FC<QuickCaptureSheetProps> = ({
  visible,
  onClose,
  onQuickTask,
  onLogExpense,
  onStartFocus,
  onLogHabit,
  onCreateEvent,
  tasks = [],
  habits = [],
}) => {
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [mode, setMode] = useState<CaptureMode>('menu');
  const [taskTitle, setTaskTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [selectedHabitId, setSelectedHabitId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventStartTime, setEventStartTime] = useState(new Date());
  const [eventEndTime, setEventEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour later
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setMode('menu');
      setTaskTitle('');
      setExpenseAmount('');
      setSelectedTaskId(undefined);
      setSelectedHabitId(undefined);
      setEventTitle('');
      setEventStartTime(new Date());
      setEventEndTime(new Date(Date.now() + 60 * 60 * 1000));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: SCREEN_HEIGHT - SHEET_HEIGHT,
          useNativeDriver: true,
          speed: 20,
          bounciness: 4,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleTaskSubmit = async () => {
    if (!taskTitle.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onQuickTask(taskTitle.trim());
      announceForAccessibility('Task created successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleClose();
    } catch (error) {
      console.error('Error creating task:', error);
      announceForAccessibility('Failed to create task');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExpenseSubmit = async () => {
    if (!expenseAmount.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onLogExpense(expenseAmount.trim());
      announceForAccessibility('Expense logged successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleClose();
    } catch (error) {
      console.error('Error logging expense:', error);
      announceForAccessibility('Failed to log expense');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartFocus = async () => {
    setIsSaving(true);
    try {
      await onStartFocus(selectedTaskId);
      announceForAccessibility('Focus session started');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleClose();
    } catch (error) {
      console.error('Error starting focus:', error);
      announceForAccessibility('Failed to start focus session');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleHabitSubmit = async () => {
    if (!selectedHabitId || !onLogHabit || isSaving) return;

    setIsSaving(true);
    try {
      await onLogHabit(selectedHabitId);
      announceForAccessibility('Habit logged successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleClose();
    } catch (error) {
      console.error('Error logging habit:', error);
      announceForAccessibility('Failed to log habit');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEventSubmit = async () => {
    if (!eventTitle.trim() || !onCreateEvent || isSaving) return;

    setIsSaving(true);
    try {
      await onCreateEvent(eventTitle.trim(), eventStartTime, eventEndTime);
      announceForAccessibility('Event created successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleClose();
    } catch (error) {
      console.error('Error creating event:', error);
      announceForAccessibility('Failed to create event');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderMenu = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Capture</Text>
        <TouchableOpacity onPress={handleClose} {...makeButton('Close', 'Double tap to close quick capture')}>
          <IconButton icon="close" size={24} iconColor={colors.text.secondary} style={styles.closeButton} 
                hitSlop={HIT_SLOP}/>
        </TouchableOpacity>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMode('task');
          }}
          activeOpacity={0.7}
          {...makeButton('Quick Task', 'Double tap to create a quick task')}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.primary.main + '20' }]}>
            <IconButton icon="checkbox-marked-circle-outline" size={28} iconColor={colors.primary.main} style={styles.iconButton} 
                hitSlop={HIT_SLOP}/>
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Quick Task</Text>
            <Text style={styles.menuDescription}>Add a task to your list</Text>
          </View>
          <IconButton icon="chevron-right" size={20} iconColor={colors.text.tertiary} style={styles.chevron} 
                hitSlop={HIT_SLOP}/>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMode('expense');
          }}
          activeOpacity={0.7}
          {...makeButton('Log Expense', 'Double tap to log an expense')}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.warning + '20' }]}>
            <IconButton icon="cash-minus" size={28} iconColor={colors.warning} style={styles.iconButton} 
                hitSlop={HIT_SLOP}/>
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Log Expense</Text>
            <Text style={styles.menuDescription}>Record a quick transaction</Text>
          </View>
          <IconButton icon="chevron-right" size={20} iconColor={colors.text.tertiary} style={styles.chevron} 
                hitSlop={HIT_SLOP}/>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMode('focus');
          }}
          activeOpacity={0.7}
          {...makeButton('Start Focus', 'Double tap to start a focus session')}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.info + '20' }]}>
            <IconButton icon="timer-outline" size={28} iconColor={colors.info} style={styles.iconButton}
                hitSlop={HIT_SLOP}/>
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Start Focus</Text>
            <Text style={styles.menuDescription}>Begin a focus session</Text>
          </View>
          <IconButton icon="chevron-right" size={20} iconColor={colors.text.tertiary} style={styles.chevron}
                hitSlop={HIT_SLOP}/>
        </TouchableOpacity>

        {onLogHabit && habits.length > 0 && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode('habit');
            }}
            activeOpacity={0.7}
            {...makeButton('Log Habit', 'Double tap to log a habit completion')}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.success + '20' }]}>
              <IconButton icon="check-circle-outline" size={28} iconColor={colors.success} style={styles.iconButton}
                  hitSlop={HIT_SLOP}/>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Log Habit</Text>
              <Text style={styles.menuDescription}>Record a habit completion</Text>
            </View>
            <IconButton icon="chevron-right" size={20} iconColor={colors.text.tertiary} style={styles.chevron}
                hitSlop={HIT_SLOP}/>
          </TouchableOpacity>
        )}

        {onCreateEvent && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode('event');
            }}
            activeOpacity={0.7}
            {...makeButton('Quick Event', 'Double tap to create a quick event')}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.accent.orange + '20' }]}>
              <IconButton icon="calendar-plus" size={28} iconColor={colors.accent.orange} style={styles.iconButton}
                  hitSlop={HIT_SLOP}/>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Quick Event</Text>
              <Text style={styles.menuDescription}>Schedule a calendar event</Text>
            </View>
            <IconButton icon="chevron-right" size={20} iconColor={colors.text.tertiary} style={styles.chevron}
                hitSlop={HIT_SLOP}/>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  const renderTaskForm = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMode('menu');
          }}
          {...makeButton('Back', 'Double tap to go back')}
        >
          <IconButton icon="arrow-left" size={24} iconColor={colors.text.secondary} style={styles.closeButton} 
                hitSlop={HIT_SLOP}/>
        </TouchableOpacity>
        <Text style={styles.title}>Quick Task</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Task Title</Text>
        <TextInput
          value={taskTitle}
          onChangeText={setTaskTitle}
          placeholder="What needs to be done?"
          placeholderTextColor={colors.text.placeholder}
          style={styles.input}
          autoFocus
          multiline
          numberOfLines={3}
          returnKeyType="done"
          onSubmitEditing={handleTaskSubmit}
          {...makeTextInput('Task title', taskTitle, 'What needs to be done?')}
        />

        <View style={styles.formActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode('menu');
            }}
            {...makeButton('Cancel', 'Double tap to cancel')}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, (!taskTitle.trim() || isSaving) && styles.submitButtonDisabled]}
            onPress={handleTaskSubmit}
            disabled={!taskTitle.trim() || isSaving}
            {...makeButton('Create Task', 'Double tap to create task', !taskTitle.trim() || isSaving)}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <Text style={styles.submitButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderExpenseForm = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMode('menu');
          }}
          {...makeButton('Back', 'Double tap to go back')}
        >
          <IconButton icon="arrow-left" size={24} iconColor={colors.text.secondary} style={styles.closeButton} 
                hitSlop={HIT_SLOP}/>
        </TouchableOpacity>
        <Text style={styles.title}>Log Expense</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          value={expenseAmount}
          onChangeText={setExpenseAmount}
          placeholder="e.g., 50 or -20"
          placeholderTextColor={colors.text.placeholder}
          style={styles.input}
          autoFocus
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={handleExpenseSubmit}
          {...makeTextInput('Expense amount', expenseAmount, 'e.g., 50 or -20')}
        />

        <Text style={styles.helperText}>
          Use negative numbers for expenses (e.g., -20) or positive for income (e.g., 50)
        </Text>

        <View style={styles.formActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode('menu');
            }}
            {...makeButton('Cancel', 'Double tap to cancel')}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, (!expenseAmount.trim() || isSaving) && styles.submitButtonDisabled]}
            onPress={handleExpenseSubmit}
            disabled={!expenseAmount.trim() || isSaving}
            {...makeButton('Log Expense', 'Double tap to log expense', !expenseAmount.trim() || isSaving)}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <Text style={styles.submitButtonText}>Log</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderFocusForm = () => {
    const activeTasks = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress');

    return (
      <>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode('menu');
            }}
            {...makeButton('Back', 'Double tap to go back')}
          >
            <IconButton icon="arrow-left" size={24} iconColor={colors.text.secondary} style={styles.closeButton}
                hitSlop={HIT_SLOP}/>
          </TouchableOpacity>
          <Text style={styles.title}>Start Focus</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Link to Task (Optional)</Text>
          <Text style={styles.helperText}>
            Select a task to track focus time, or start without a task
          </Text>

          <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
            {/* No Task Option */}
            <TouchableOpacity
              style={[
                styles.taskOption,
                !selectedTaskId && styles.taskOptionSelected,
                {
                  backgroundColor: !selectedTaskId
                    ? colors.primary.main + '20'
                    : colors.background.primary,
                  borderColor: !selectedTaskId ? colors.primary.main : colors.border.default,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedTaskId(undefined);
              }}
              {...makeButton('No task', 'Double tap to start focus without a task')}
            >
              <View style={styles.taskOptionIcon}>
                <IconButton
                  icon="timer-outline"
                  size={24}
                  iconColor={!selectedTaskId ? colors.primary.main : colors.text.tertiary}
                  style={styles.iconButton}
                  hitSlop={HIT_SLOP}/>
              </View>
              <View style={styles.taskOptionContent}>
                <Text
                  style={[
                    styles.taskOptionTitle,
                    { color: !selectedTaskId ? colors.primary.main : colors.text.primary },
                  ]}
                >
                  No Task
                </Text>
                <Text style={[styles.taskOptionDescription, { color: colors.text.tertiary }]}>
                  General focus session
                </Text>
              </View>
              {!selectedTaskId && (
                <IconButton
                  icon="check-circle"
                  size={24}
                  iconColor={colors.primary.main}
                  style={styles.iconButton}
                  hitSlop={HIT_SLOP}/>
              )}
            </TouchableOpacity>

            {/* Active Tasks */}
            {activeTasks.length > 0 ? (
              activeTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskOption,
                    selectedTaskId === task.id && styles.taskOptionSelected,
                    {
                      backgroundColor:
                        selectedTaskId === task.id
                          ? colors.primary.main + '20'
                          : colors.background.primary,
                      borderColor:
                        selectedTaskId === task.id ? colors.primary.main : colors.border.default,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTaskId(task.id);
                  }}
                  {...makeButton(
                    `Task: ${task.title}`,
                    'Double tap to link this task to your focus session'
                  )}
                >
                  <View style={styles.taskOptionIcon}>
                    <IconButton
                      icon={task.status === 'in_progress' ? 'play-circle' : 'checkbox-marked-circle-outline'}
                      size={24}
                      iconColor={
                        selectedTaskId === task.id ? colors.primary.main : colors.text.tertiary
                      }
                      style={styles.iconButton}
                      hitSlop={HIT_SLOP}/>
                  </View>
                  <View style={styles.taskOptionContent}>
                    <Text
                      style={[
                        styles.taskOptionTitle,
                        {
                          color:
                            selectedTaskId === task.id ? colors.primary.main : colors.text.primary,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {task.title}
                    </Text>
                    {task.tags && task.tags.length > 0 && (
                      <Text
                        style={[styles.taskOptionDescription, { color: colors.text.tertiary }]}
                        numberOfLines={1}
                      >
                        {task.tags.join(', ')}
                      </Text>
                    )}
                  </View>
                  {selectedTaskId === task.id && (
                    <IconButton
                      icon="check-circle"
                      size={24}
                      iconColor={colors.primary.main}
                      style={styles.iconButton}
                      hitSlop={HIT_SLOP}/>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyTasks}>
                <Text style={[styles.emptyTasksText, { color: colors.text.tertiary }]}>
                  No active tasks. Focus session will start without a task.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode('menu');
              }}
              {...makeButton('Cancel', 'Double tap to cancel')}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
              onPress={handleStartFocus}
              disabled={isSaving}
              {...makeButton('Start Focus', 'Double tap to start focus session', isSaving)}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                <Text style={styles.submitButtonText}>Start</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  const renderHabitForm = () => {
    // All habits from getHabits() are active (no status field in Habit type)
    const activeHabits = habits;

    return (
      <>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode('menu');
            }}
            {...makeButton('Back', 'Double tap to go back')}
          >
            <IconButton icon="arrow-left" size={24} iconColor={colors.text.secondary} style={styles.closeButton}
                hitSlop={HIT_SLOP}/>
          </TouchableOpacity>
          <Text style={styles.title}>Log Habit</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Select Habit</Text>
          <Text style={styles.helperText}>
            Choose a habit to log for today
          </Text>

          <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
            {activeHabits.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.taskOption,
                  selectedHabitId === habit.id && styles.taskOptionSelected,
                  {
                    backgroundColor:
                      selectedHabitId === habit.id
                        ? colors.success + '20'
                        : colors.background.primary,
                    borderColor:
                      selectedHabitId === habit.id ? colors.success : colors.border.default,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedHabitId(habit.id);
                }}
                {...makeButton(
                  `Habit: ${habit.name}`,
                  'Double tap to select this habit'
                )}
              >
                <View style={styles.taskOptionIcon}>
                  <IconButton
                    icon="refresh"
                    size={24}
                    iconColor={
                      selectedHabitId === habit.id ? colors.success : colors.text.tertiary
                    }
                    style={styles.iconButton}
                    hitSlop={HIT_SLOP}
                  />
                </View>
                <View style={styles.taskOptionContent}>
                  <Text
                    style={[
                      styles.taskOptionTitle,
                      {
                        color:
                          selectedHabitId === habit.id ? colors.success : colors.text.primary,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {habit.name}
                  </Text>
                  {habit.cadence && (
                    <Text
                      style={[styles.taskOptionDescription, { color: colors.text.tertiary }]}
                      numberOfLines={1}
                    >
                      {habit.cadence}
                    </Text>
                  )}
                </View>
                {selectedHabitId === habit.id && (
                  <IconButton
                    icon="check-circle"
                    size={24}
                    iconColor={colors.success}
                    style={styles.iconButton}
                    hitSlop={HIT_SLOP}
                  />
                )}
              </TouchableOpacity>
            ))}

            {activeHabits.length === 0 && (
              <View style={styles.emptyTasks}>
                <Text style={[styles.emptyTasksText, { color: colors.text.tertiary }]}>
                  No active habits found.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode('menu');
              }}
              {...makeButton('Cancel', 'Double tap to cancel')}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.success }, (!selectedHabitId || isSaving) && styles.submitButtonDisabled]}
              onPress={handleHabitSubmit}
              disabled={!selectedHabitId || isSaving}
              {...makeButton('Log Habit', 'Double tap to log habit', !selectedHabitId || isSaving)}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                <Text style={styles.submitButtonText}>Log</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  const renderEventForm = () => {
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    return (
      <>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode('menu');
            }}
            {...makeButton('Back', 'Double tap to go back')}
          >
            <IconButton icon="arrow-left" size={24} iconColor={colors.text.secondary} style={styles.closeButton}
                hitSlop={HIT_SLOP}/>
          </TouchableOpacity>
          <Text style={styles.title}>Quick Event</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Event Title</Text>
          <TextInput
            value={eventTitle}
            onChangeText={setEventTitle}
            placeholder="What's the event?"
            placeholderTextColor={colors.text.placeholder}
            style={styles.input}
            autoFocus
            returnKeyType="done"
            {...makeTextInput('Event title', eventTitle, "What's the event?")}
          />

          <Text style={[styles.label, { marginTop: spacing.base }]}>Start Time</Text>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowStartPicker(true);
            }}
            {...makeButton('Start time', 'Double tap to select start time')}
          >
            <IconButton icon="clock-outline" size={20} iconColor={colors.text.tertiary} style={styles.iconButton}
                hitSlop={HIT_SLOP}/>
            <Text style={styles.dateTimeText}>
              {formatDate(eventStartTime)} at {formatTime(eventStartTime)}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: spacing.base }]}>End Time</Text>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowEndPicker(true);
            }}
            {...makeButton('End time', 'Double tap to select end time')}
          >
            <IconButton icon="clock-outline" size={20} iconColor={colors.text.tertiary} style={styles.iconButton}
                hitSlop={HIT_SLOP}/>
            <Text style={styles.dateTimeText}>
              {formatDate(eventEndTime)} at {formatTime(eventEndTime)}
            </Text>
          </TouchableOpacity>

          {showStartPicker && (
            <DateTimePicker
              value={eventStartTime}
              mode="datetime"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartPicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setEventStartTime(selectedDate);
                  // Auto-adjust end time if it's before start time
                  if (selectedDate >= eventEndTime) {
                    setEventEndTime(new Date(selectedDate.getTime() + 60 * 60 * 1000));
                  }
                }
              }}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={eventEndTime}
              mode="datetime"
              display="default"
              minimumDate={eventStartTime}
              onChange={(event, selectedDate) => {
                setShowEndPicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setEventEndTime(selectedDate);
                }
              }}
            />
          )}

          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode('menu');
              }}
              {...makeButton('Cancel', 'Double tap to cancel')}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.accent.orange },
                (!eventTitle.trim() || isSaving) && styles.submitButtonDisabled
              ]}
              onPress={handleEventSubmit}
              disabled={!eventTitle.trim() || isSaving}
              {...makeButton('Create Event', 'Double tap to create event', !eventTitle.trim() || isSaving)}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                <Text style={styles.submitButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: overlayOpacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />

          {mode === 'menu' && renderMenu()}
          {mode === 'task' && renderTaskForm()}
          {mode === 'expense' && renderExpenseForm()}
          {mode === 'focus' && renderFocusForm()}
          {mode === 'habit' && renderHabitForm()}
          {mode === 'event' && renderEventForm()}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    ...shadows.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.default,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    margin: 0,
  },
  menu: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  iconButton: {
    margin: 0,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  menuDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  chevron: {
    margin: 0,
  },
  form: {
    padding: spacing.lg,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.base,
    color: colors.text.primary,
    fontSize: typography.size.base,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  helperText: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    lineHeight: typography.size.xs * 1.5,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  cancelButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
  },
  submitButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.background.tertiary,
  },
  submitButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  taskList: {
    maxHeight: 280,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  taskOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  taskOptionSelected: {
    borderWidth: 2,
  },
  taskOptionIcon: {
    marginRight: spacing.sm,
  },
  taskOptionContent: {
    flex: 1,
  },
  taskOptionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  taskOptionDescription: {
    fontSize: typography.size.sm,
  },
  emptyTasks: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTasksText: {
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.base,
    gap: spacing.sm,
  },
  dateTimeText: {
    fontSize: typography.size.base,
    color: colors.text.primary,
    flex: 1,
  },
});

export default QuickCaptureSheet;
