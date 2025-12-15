/**
 * Pomodoro Settings Component
 * Modal for configuring pomodoro timer settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { IconButton, Switch } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { PomodoroSettings } from '../../database/pomodoro';
import { validatePomodoroSettings } from '../../utils/pomodoroHelpers';
import { typography, spacing, borderRadius, shadows } from '../../theme';

interface PomodoroSettingsProps {
  visible: boolean;
  settings: PomodoroSettings | null;
  onClose: () => void;
  onSave: (settings: Partial<PomodoroSettings>) => Promise<void>;
}

export function PomodoroSettingsModal({
  visible,
  settings,
  onClose,
  onSave,
}: PomodoroSettingsProps) {
  const { colors } = useTheme();

  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(4);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false);
  const [notificationSound, setNotificationSound] = useState(true);

  useEffect(() => {
    if (settings) {
      setWorkDuration(settings.workDuration);
      setShortBreak(settings.shortBreak);
      setLongBreak(settings.longBreak);
      setSessionsUntilLongBreak(settings.sessionsUntilLongBreak);
      setAutoStartBreaks(settings.autoStartBreaks === 1);
      setAutoStartPomodoros(settings.autoStartPomodoros === 1);
      setNotificationSound(settings.notificationSound === 1);
    }
  }, [settings]);

  const handleSave = async () => {
    const newSettings = {
      workDuration,
      shortBreak,
      longBreak,
      sessionsUntilLongBreak,
      autoStartBreaks: autoStartBreaks ? 1 : 0,
      autoStartPomodoros: autoStartPomodoros ? 1 : 0,
      notificationSound: notificationSound ? 1 : 0,
    };

    const validation = validatePomodoroSettings(newSettings);
    if (!validation.valid) {
      Alert.alert('Invalid Settings', validation.errors.join('\n'));
      return;
    }

    try {
      await onSave(newSettings);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setWorkDuration(25);
            setShortBreak(5);
            setLongBreak(15);
            setSessionsUntilLongBreak(4);
            setAutoStartBreaks(false);
            setAutoStartPomodoros(false);
            setNotificationSound(true);
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.background.secondary },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: colors.border.subtle },
            ]}
          >
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Pomodoro Settings
            </Text>
            <IconButton
              icon="close"
              iconColor={colors.text.secondary}
              size={24}
              onPress={onClose}
            />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Work Duration */}
            <View style={styles.settingSection}>
              <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                Work Duration
              </Text>
              <View style={styles.valueControl}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.background.tertiary }]}
                  onPress={() => setWorkDuration(Math.max(5, workDuration - 5))}
                >
                  <IconButton icon="minus" iconColor={colors.text.primary} size={20} />
                </TouchableOpacity>
                <Text style={[styles.valueText, { color: colors.primary.main }]}>
                  {workDuration} min
                </Text>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.background.tertiary }]}
                  onPress={() => setWorkDuration(Math.min(60, workDuration + 5))}
                >
                  <IconButton icon="plus" iconColor={colors.text.primary} size={20} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Short Break */}
            <View style={styles.settingSection}>
              <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                Short Break
              </Text>
              <View style={styles.valueControl}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.background.tertiary }]}
                  onPress={() => setShortBreak(Math.max(1, shortBreak - 1))}
                >
                  <IconButton icon="minus" iconColor={colors.text.primary} size={20} />
                </TouchableOpacity>
                <Text style={[styles.valueText, { color: colors.info }]}>
                  {shortBreak} min
                </Text>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.background.tertiary }]}
                  onPress={() => setShortBreak(Math.min(15, shortBreak + 1))}
                >
                  <IconButton icon="plus" iconColor={colors.text.primary} size={20} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Long Break */}
            <View style={styles.settingSection}>
              <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                Long Break
              </Text>
              <View style={styles.valueControl}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.background.tertiary }]}
                  onPress={() => setLongBreak(Math.max(5, longBreak - 5))}
                >
                  <IconButton icon="minus" iconColor={colors.text.primary} size={20} />
                </TouchableOpacity>
                <Text style={[styles.valueText, { color: colors.warning }]}>
                  {longBreak} min
                </Text>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.background.tertiary }]}
                  onPress={() => setLongBreak(Math.min(30, longBreak + 5))}
                >
                  <IconButton icon="plus" iconColor={colors.text.primary} size={20} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sessions Until Long Break */}
            <View style={styles.settingSection}>
              <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                Sessions Until Long Break
              </Text>
              <View style={styles.valueControl}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.background.tertiary }]}
                  onPress={() => setSessionsUntilLongBreak(Math.max(2, sessionsUntilLongBreak - 1))}
                >
                  <IconButton icon="minus" iconColor={colors.text.primary} size={20} />
                </TouchableOpacity>
                <Text style={[styles.valueText, { color: colors.primary.main }]}>
                  {sessionsUntilLongBreak}
                </Text>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.background.tertiary }]}
                  onPress={() => setSessionsUntilLongBreak(Math.min(8, sessionsUntilLongBreak + 1))}
                >
                  <IconButton icon="plus" iconColor={colors.text.primary} size={20} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Toggle Settings */}
            <View
              style={[
                styles.toggleSection,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <View style={styles.toggleItem}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: colors.text.primary }]}>
                    Auto-start Breaks
                  </Text>
                  <Text style={[styles.toggleDescription, { color: colors.text.tertiary }]}>
                    Automatically start break timer after work session
                  </Text>
                </View>
                <Switch
                  value={autoStartBreaks}
                  onValueChange={setAutoStartBreaks}
                  color={colors.primary.main}
                />
              </View>

              <View style={styles.toggleItem}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: colors.text.primary }]}>
                    Auto-start Pomodoros
                  </Text>
                  <Text style={[styles.toggleDescription, { color: colors.text.tertiary }]}>
                    Automatically start work session after break
                  </Text>
                </View>
                <Switch
                  value={autoStartPomodoros}
                  onValueChange={setAutoStartPomodoros}
                  color={colors.primary.main}
                />
              </View>

              <View style={styles.toggleItem}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: colors.text.primary }]}>
                    Notification Sound
                  </Text>
                  <Text style={[styles.toggleDescription, { color: colors.text.tertiary }]}>
                    Play sound when phase transitions occur
                  </Text>
                </View>
                <Switch
                  value={notificationSound}
                  onValueChange={setNotificationSound}
                  color={colors.primary.main}
                />
              </View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[
                styles.resetButton,
                {
                  borderColor: colors.border.default,
                  backgroundColor: colors.background.primary,
                },
              ]}
              onPress={handleReset}
            >
              <IconButton icon="restore" iconColor={colors.text.secondary} size={20} />
              <Text style={[styles.resetButtonText, { color: colors.text.secondary }]}>
                Reset to Defaults
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              { borderTopColor: colors.border.subtle },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  borderColor: colors.border.default,
                  backgroundColor: colors.background.primary,
                },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text.secondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary.main },
              ]}
              onPress={handleSave}
            >
              <Text style={[styles.saveButtonText, { color: colors.primary.contrast }]}>
                Save Changes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  settingSection: {
    marginBottom: spacing.lg,
  },
  settingLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  valueControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButton: {
    borderRadius: borderRadius.md,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    minWidth: 100,
    textAlign: 'center',
  },
  toggleSection: {
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  toggleDescription: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
  resetButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginLeft: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  saveButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
});
