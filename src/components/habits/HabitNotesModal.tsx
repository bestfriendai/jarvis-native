/**
 * HabitNotesModal Component
 * Modal for adding/editing notes when completing habits
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { HIT_SLOP } from '../../constants/ui';

interface HabitNotesModalProps {
  visible: boolean;
  habitName: string;
  initialNotes?: string;
  onSave: (notes: string) => void;
  onSkip: () => void;
  onClose: () => void;
  isEditing?: boolean;
}

const MAX_NOTES_LENGTH = 200;

export const HabitNotesModal: React.FC<HabitNotesModalProps> = ({
  visible,
  habitName,
  initialNotes = '',
  onSave,
  onSkip,
  onClose,
  isEditing = false,
}) => {
  const [notes, setNotes] = useState(initialNotes);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (visible) {
      setNotes(initialNotes);
    }
  }, [visible, initialNotes]);

  const handleSave = () => {
    onSave(notes.trim());
  };

  const handleSkip = () => {
    setNotes('');
    onSkip();
  };

  const remainingChars = MAX_NOTES_LENGTH - notes.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {isEditing ? 'Edit Notes' : 'Add Notes'}
              </Text>
              <Text style={styles.habitName}>{habitName}</Text>
            </View>
            <IconButton
              icon="close"
              onPress={onClose}
              iconColor={colors.text.tertiary}
              size={20}
            
                hitSlop={HIT_SLOP}/>
          </View>

          <View style={styles.body}>
            <Text style={styles.label}>
              How did it go? Any observations or feelings?
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="E.g., Felt great! Morning workouts are easier."
              placeholderTextColor={colors.text.placeholder}
              style={[styles.input, isFocused && styles.inputFocused]}
              multiline
              numberOfLines={4}
              maxLength={MAX_NOTES_LENGTH}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoFocus={!isEditing}
            />
            <Text
              style={[
                styles.charCount,
                remainingChars < 20 && styles.charCountWarning,
              ]}
            >
              {remainingChars} characters remaining
            </Text>

            {/* Quick note templates */}
            {!isEditing && notes.trim().length === 0 && (
              <View style={styles.templates}>
                <Text style={styles.templatesLabel}>Quick notes:</Text>
                <View style={styles.templateButtons}>
                  {[
                    'Felt great!',
                    'Challenging today',
                    'Easy win',
                    'Needed motivation',
                  ].map((template) => (
                    <TouchableOpacity
                      key={template}
                      onPress={() => setNotes(template)}
                      style={styles.templateButton}
                    >
                      <Text style={styles.templateButtonText}>{template}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            {!isEditing && (
              <TouchableOpacity
                onPress={handleSkip}
                style={[styles.button, styles.skipButton]}
              >
                <Text style={styles.skipButtonText}>Complete without notes</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.button, styles.saveButton]}
              disabled={notes.trim().length === 0 && isEditing}
            >
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update' : 'Complete with notes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 500,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.base,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  habitName: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  body: {
    padding: spacing.base,
  },
  label: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: typography.size.base,
    textAlignVertical: 'top',
    minHeight: 100,
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
  },
  inputFocused: {
    borderColor: colors.primary.main,
  },
  charCount: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  charCountWarning: {
    color: colors.warning,
  },
  templates: {
    marginTop: spacing.lg,
  },
  templatesLabel: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  templateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  templateButton: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  templateButtonText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  footer: {
    gap: spacing.sm,
    padding: spacing.base,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border.default,
  },
  skipButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },
  saveButton: {
    backgroundColor: colors.primary.main,
  },
  saveButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: '#FFFFFF',
  },
});
