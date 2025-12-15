/**
 * Focus Block Form Component
 * Create/edit focus block modal form
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { FocusBlock, CreateFocusBlockData } from '../../database/focusBlocks';
import { Task } from '../../database/tasks';
import { typography, spacing, borderRadius, shadows, inputStyle, inputFocusStyle } from '../../theme';

interface FocusBlockFormProps {
  visible: boolean;
  focusBlock?: FocusBlock | null;
  tasks?: Task[];
  onClose: () => void;
  onSave: (data: CreateFocusBlockData) => Promise<void>;
}

const QUICK_DURATIONS = [
  { label: '25 min', value: 25, icon: 'timer-sand' },
  { label: '50 min', value: 50, icon: 'clock-outline' },
  { label: '90 min', value: 90, icon: 'clock-time-four' },
];

export const FocusBlockForm: React.FC<FocusBlockFormProps> = ({
  visible,
  focusBlock,
  tasks = [],
  onClose,
  onSave,
}) => {
  const { colors } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [customDuration, setCustomDuration] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [phoneInMode, setPhoneInMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

  // Initialize form when focusBlock changes
  useEffect(() => {
    if (focusBlock) {
      setTitle(focusBlock.title);
      setDescription(focusBlock.description || '');
      setDurationMinutes(focusBlock.durationMinutes);
      setSelectedTaskId(focusBlock.taskId);
      setPhoneInMode(focusBlock.phoneInMode);
    } else {
      setTitle('');
      setDescription('');
      setDurationMinutes(25);
      setCustomDuration('');
      setSelectedTaskId(undefined);
      setPhoneInMode(false);
    }
  }, [focusBlock, visible]);

  const handleDurationSelect = (minutes: number) => {
    setDurationMinutes(minutes);
    setCustomDuration('');
  };

  const handleCustomDurationChange = (text: string) => {
    setCustomDuration(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 300) {
      setDurationMinutes(parsed);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateFocusBlockData = {
        title: title.trim(),
        description: description.trim() || undefined,
        durationMinutes,
        taskId: selectedTaskId,
        phoneInMode,
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error('Failed to save focus block:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border.subtle }]}>
          <IconButton
            icon="close"
            iconColor={colors.text.secondary}
            size={24}
            onPress={onClose}
          />
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {focusBlock ? 'Edit Focus Block' : 'New Focus Block'}
          </Text>
          <TouchableOpacity
            style={[
              styles.saveButton,
              !title.trim() && styles.saveButtonDisabled,
              { backgroundColor: title.trim() ? colors.primary.main : colors.background.tertiary },
            ]}
            onPress={handleSave}
            disabled={!title.trim() || isSubmitting}
          >
            <Text
              style={[
                styles.saveButtonText,
                {
                  color: title.trim() ? colors.primary.contrast : colors.text.disabled,
                },
              ]}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text.tertiary }]}>
              Title
            </Text>
            <TextInput
              style={[
                styles.input,
                inputStyle,
                titleFocused && inputFocusStyle,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: titleFocused ? colors.primary.main : colors.border.default,
                  color: colors.text.primary,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="What are you focusing on?"
              placeholderTextColor={colors.text.placeholder}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
              autoFocus
            />
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text.tertiary }]}>
              Description (Optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                inputStyle,
                descFocused && inputFocusStyle,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: descFocused ? colors.primary.main : colors.border.default,
                  color: colors.text.primary,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add notes or goals for this session"
              placeholderTextColor={colors.text.placeholder}
              multiline
              numberOfLines={3}
              onFocus={() => setDescFocused(true)}
              onBlur={() => setDescFocused(false)}
            />
          </View>

          {/* Duration Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text.tertiary }]}>
              Duration
            </Text>
            <View style={styles.durationButtons}>
              {QUICK_DURATIONS.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.durationButton,
                    {
                      backgroundColor:
                        durationMinutes === item.value && !customDuration
                          ? colors.primary.main
                          : colors.background.secondary,
                      borderColor:
                        durationMinutes === item.value && !customDuration
                          ? colors.primary.main
                          : colors.border.default,
                    },
                  ]}
                  onPress={() => handleDurationSelect(item.value)}
                >
                  <IconButton
                    icon={item.icon}
                    size={20}
                    iconColor={
                      durationMinutes === item.value && !customDuration
                        ? colors.primary.contrast
                        : colors.text.secondary
                    }
                    style={styles.durationIcon}
                  />
                  <Text
                    style={[
                      styles.durationText,
                      {
                        color:
                          durationMinutes === item.value && !customDuration
                            ? colors.primary.contrast
                            : colors.text.primary,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Duration */}
            <View style={styles.customDuration}>
              <Text style={[styles.customLabel, { color: colors.text.secondary }]}>
                Custom:
              </Text>
              <TextInput
                style={[
                  styles.customInput,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: customDuration ? colors.primary.main : colors.border.default,
                    color: colors.text.primary,
                  },
                ]}
                value={customDuration}
                onChangeText={handleCustomDurationChange}
                placeholder="0"
                placeholderTextColor={colors.text.placeholder}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={[styles.customLabel, { color: colors.text.secondary }]}>
                minutes
              </Text>
            </View>
          </View>

          {/* Task Selection */}
          {tasks.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text.tertiary }]}>
                Link to Task (Optional)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.taskChip,
                    {
                      backgroundColor: !selectedTaskId
                        ? colors.primary.main
                        : colors.background.secondary,
                      borderColor: !selectedTaskId ? colors.primary.main : colors.border.default,
                    },
                  ]}
                  onPress={() => setSelectedTaskId(undefined)}
                >
                  <Text
                    style={[
                      styles.taskChipText,
                      {
                        color: !selectedTaskId ? colors.primary.contrast : colors.text.secondary,
                      },
                    ]}
                  >
                    No Task
                  </Text>
                </TouchableOpacity>
                {tasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.taskChip,
                      {
                        backgroundColor:
                          selectedTaskId === task.id
                            ? colors.primary.main
                            : colors.background.secondary,
                        borderColor:
                          selectedTaskId === task.id ? colors.primary.main : colors.border.default,
                      },
                    ]}
                    onPress={() => setSelectedTaskId(task.id)}
                  >
                    <Text
                      style={[
                        styles.taskChipText,
                        {
                          color:
                            selectedTaskId === task.id
                              ? colors.primary.contrast
                              : colors.text.secondary,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Phone-in Mode Toggle */}
          <View style={styles.section}>
            <View
              style={[
                styles.toggleRow,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <View style={styles.toggleLeft}>
                <IconButton
                  icon="cellphone-off"
                  size={24}
                  iconColor={phoneInMode ? colors.primary.main : colors.text.tertiary}
                  style={styles.toggleIcon}
                />
                <View style={styles.toggleText}>
                  <Text style={[styles.toggleTitle, { color: colors.text.primary }]}>
                    Phone-in Mode
                  </Text>
                  <Text style={[styles.toggleDescription, { color: colors.text.tertiary }]}>
                    Full-screen focus with DND
                  </Text>
                </View>
              </View>
              <Switch
                value={phoneInMode}
                onValueChange={setPhoneInMode}
                trackColor={{
                  false: colors.background.tertiary,
                  true: colors.primary.light,
                }}
                thumbColor={phoneInMode ? colors.primary.main : colors.text.disabled}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing.sm,
  },
  input: {
    fontSize: typography.size.base,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  durationButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    ...shadows.xs,
  },
  durationIcon: {
    margin: 0,
    marginBottom: spacing.xs,
  },
  durationText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  customDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customLabel: {
    fontSize: typography.size.base,
  },
  customInput: {
    width: 80,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    fontSize: typography.size.base,
    textAlign: 'center',
  },
  taskChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    marginRight: spacing.sm,
    maxWidth: 200,
  },
  taskChipText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIcon: {
    margin: 0,
    marginRight: spacing.sm,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: typography.size.sm,
  },
});
