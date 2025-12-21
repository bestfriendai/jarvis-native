/**
 * ProjectFormModal Component
 * Modal for creating and editing projects
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as projectsDB from '../database/projects';
import type { Project } from '../database/projects';
import { AppButton } from './ui';
import { colors, typography, spacing, borderRadius } from '../theme';
import { HIT_SLOP } from '../constants/ui';

interface ProjectFormModalProps {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
  onSuccess?: () => void;
}

// Preset color palette
const PROJECT_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#10B981' },
  { name: 'Teal', value: '#14B8A6' },
];

export function ProjectFormModal({ visible, project, onClose, onSuccess }: ProjectFormModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [selectedColor, setSelectedColor] = useState(project?.color || PROJECT_COLORS[0].value);
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setName(project?.name || '');
      setDescription(project?.description || '');
      setSelectedColor(project?.color || PROJECT_COLORS[0].value);
    }
  }, [visible, project]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!name.trim()) {
      Alert.alert('Validation Error', 'Project name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
        status: project?.status || ('active' as const),
      };

      if (project) {
        await projectsDB.updateProject(project.id, data);
      } else {
        await projectsDB.createProject(data);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      Alert.alert('Error', 'Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? All tasks will be unassigned from this project.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await projectsDB.deleteProject(project.id);
              onSuccess?.();
              onClose();
            } catch (error) {
              console.error('Error deleting project:', error);
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  const handleArchive = async () => {
    if (!project) return;

    const action = project.status === 'archived' ? 'unarchive' : 'archive';

    try {
      if (action === 'archive') {
        await projectsDB.archiveProject(project.id);
      } else {
        await projectsDB.unarchiveProject(project.id);
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(`Error ${action} project:`, error);
      Alert.alert('Error', `Failed to ${action} project`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(insets.bottom, spacing.base) },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {project ? 'Edit Project' : 'New Project'}
              </Text>
              <IconButton
                icon="close"
                onPress={onClose}
                iconColor={colors.text.tertiary}
              
                hitSlop={HIT_SLOP}/>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Project Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Project Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Website Redesign"
                  placeholderTextColor={colors.text.placeholder}
                  style={[styles.input, nameFocused && styles.inputFocused]}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Project description..."
                  placeholderTextColor={colors.text.placeholder}
                  style={[
                    styles.input,
                    styles.textArea,
                    descFocused && styles.inputFocused,
                  ]}
                  multiline
                  numberOfLines={4}
                  onFocus={() => setDescFocused(true)}
                  onBlur={() => setDescFocused(false)}
                />
              </View>

              {/* Color Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Project Color</Text>
                <View style={styles.colorGrid}>
                  {PROJECT_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color.value}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color.value },
                        selectedColor === color.value && styles.colorOptionSelected,
                      ]}
                      onPress={() => setSelectedColor(color.value)}
                      activeOpacity={0.7}
                    >
                      {selectedColor === color.value && (
                        <IconButton
                          icon="check"
                          size={20}
                          iconColor="#FFFFFF"
                          style={styles.checkIcon}
                        
                hitSlop={HIT_SLOP}/>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              {project && (
                <View style={styles.secondaryActions}>
                  <AppButton
                    title={project.status === 'archived' ? 'Unarchive' : 'Archive'}
                    onPress={handleArchive}
                    variant="outline"
                    style={styles.secondaryButton}
                  />
                  <AppButton
                    title="Delete"
                    onPress={handleDelete}
                    variant="outline"
                    style={styles.deleteButton}
                  />
                </View>
              )}

              <View style={styles.primaryActions}>
                <AppButton
                  title="Cancel"
                  onPress={onClose}
                  variant="outline"
                  style={styles.actionButton}
                />
                <AppButton
                  title={project ? 'Update' : 'Create'}
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={!name.trim()}
                  style={styles.actionButton}
                />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
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
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  modalBody: {
    padding: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.size.base,
    color: colors.text.primary,
  },
  inputFocused: {
    borderColor: colors.primary.main,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  checkIcon: {
    margin: 0,
  },
  modalFooter: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
    borderColor: colors.error,
  },
});
