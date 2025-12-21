/**
 * Bulk Action Bar Component
 * Floating action bar with bulk operations for tasks
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { TaskStatus, TaskPriority } from '../../database/tasks';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { HIT_SLOP } from '../../constants/ui';

interface BulkActionBarProps {
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onChangeStatus: (status: TaskStatus) => void;
  onChangePriority: (priority: TaskPriority) => void;
  onMoveToProject: (projectId: string | null) => void;
  availableProjects?: Array<{ id: string; name: string; color?: string }>;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; label: string }> = {
  low: { color: '#64748B', label: 'Low' },
  medium: { color: '#F59E0B', label: 'Medium' },
  high: { color: '#F97316', label: 'High' },
  urgent: { color: '#EF4444', label: 'Urgent' },
};

export function BulkActionBar({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onComplete,
  onDelete,
  onChangeStatus,
  onChangePriority,
  onMoveToProject,
  availableProjects = [],
}: BulkActionBarProps) {
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Delete Tasks',
      `Are you sure you want to delete ${selectedCount} task(s)? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  const isDisabled = selectedCount === 0;

  return (
    <>
      <View style={styles.container}>
        {/* Selection Actions */}
        <View style={styles.selectionActions}>
          <TouchableOpacity onPress={onSelectAll} style={styles.selectButton}>
            <Text style={styles.selectButtonText}>Select All</Text>
          </TouchableOpacity>
          <Text style={styles.selectedCountText}>
            {selectedCount} selected
          </Text>
          <TouchableOpacity onPress={onDeselectAll} style={styles.selectButton}>
            <Text style={styles.selectButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Bulk Operations */}
        <View style={styles.operations}>
          <TouchableOpacity
            style={[
              styles.operationButton,
              isDisabled && styles.operationButtonDisabled,
            ]}
            onPress={onComplete}
            disabled={isDisabled}
          >
            <Icon
              name="check-circle"
              size={24}
              color={isDisabled ? '#CCC' : '#4CAF50'}
            />
            <Text
              style={[
                styles.operationLabel,
                isDisabled && styles.operationLabelDisabled,
              ]}
            >
              Complete
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.operationButton,
              isDisabled && styles.operationButtonDisabled,
            ]}
            onPress={() => setShowStatusPicker(true)}
            disabled={isDisabled}
          >
            <Icon
              name="format-list-bulleted"
              size={24}
              color={isDisabled ? '#CCC' : '#4A90E2'}
            />
            <Text
              style={[
                styles.operationLabel,
                isDisabled && styles.operationLabelDisabled,
              ]}
            >
              Status
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.operationButton,
              isDisabled && styles.operationButtonDisabled,
            ]}
            onPress={() => setShowPriorityPicker(true)}
            disabled={isDisabled}
          >
            <Icon
              name="flag"
              size={24}
              color={isDisabled ? '#CCC' : '#F97316'}
            />
            <Text
              style={[
                styles.operationLabel,
                isDisabled && styles.operationLabelDisabled,
              ]}
            >
              Priority
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.operationButton,
              isDisabled && styles.operationButtonDisabled,
            ]}
            onPress={() => setShowProjectPicker(true)}
            disabled={isDisabled}
          >
            <Icon
              name="folder-move"
              size={24}
              color={isDisabled ? '#CCC' : '#FF9800'}
            />
            <Text
              style={[
                styles.operationLabel,
                isDisabled && styles.operationLabelDisabled,
              ]}
            >
              Move
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.operationButton,
              isDisabled && styles.operationButtonDisabled,
            ]}
            onPress={handleDelete}
            disabled={isDisabled}
          >
            <Icon
              name="delete"
              size={24}
              color={isDisabled ? '#CCC' : '#EF5350'}
            />
            <Text
              style={[
                styles.operationLabel,
                isDisabled && styles.operationLabelDisabled,
              ]}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Picker Modal */}
      <Modal
        visible={showStatusPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Change Status</Text>
            <ScrollView style={styles.pickerScroll}>
              {(['todo', 'in_progress', 'blocked', 'completed', 'cancelled'] as TaskStatus[]).map(
                (status) => (
                  <TouchableOpacity
                    key={status}
                    style={styles.pickerOption}
                    onPress={() => {
                      onChangeStatus(status);
                      setShowStatusPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>
                      {STATUS_LABELS[status]}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerCancelButton}
              onPress={() => setShowStatusPicker(false)}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Priority Picker Modal */}
      <Modal
        visible={showPriorityPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPriorityPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Change Priority</Text>
            <ScrollView style={styles.pickerScroll}>
              {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map(
                (priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={styles.pickerOption}
                    onPress={() => {
                      onChangePriority(priority);
                      setShowPriorityPicker(false);
                    }}
                  >
                    <View style={styles.priorityOption}>
                      <View
                        style={[
                          styles.priorityDot,
                          { backgroundColor: PRIORITY_CONFIG[priority].color },
                        ]}
                      />
                      <Text style={styles.pickerOptionText}>
                        {PRIORITY_CONFIG[priority].label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerCancelButton}
              onPress={() => setShowPriorityPicker(false)}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Project Picker Modal */}
      <Modal
        visible={showProjectPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProjectPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Move to Project</Text>
            <ScrollView style={styles.pickerScroll}>
              <TouchableOpacity
                style={styles.pickerOption}
                onPress={() => {
                  onMoveToProject(null);
                  setShowProjectPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>No Project</Text>
              </TouchableOpacity>

              {availableProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.pickerOption}
                  onPress={() => {
                    onMoveToProject(project.id);
                    setShowProjectPicker(false);
                  }}
                >
                  <View style={styles.projectOption}>
                    {project.color && (
                      <View
                        style={[
                          styles.projectDot,
                          { backgroundColor: project.color },
                        ]}
                      />
                    )}
                    <Text style={styles.pickerOptionText}>{project.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerCancelButton}
              onPress={() => setShowProjectPicker(false)}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    ...shadows.sm,
  },
  selectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  selectButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.md,
  },
  selectButtonText: {
    fontSize: typography.size.sm,
    color: colors.primary.main,
    fontWeight: typography.weight.medium,
  },
  selectedCountText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    fontWeight: typography.weight.semibold,
  },
  operations: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  operationButton: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  operationButtonDisabled: {
    opacity: 0.4,
  },
  operationLabel: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  operationLabelDisabled: {
    color: colors.text.disabled,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.lg,
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  pickerScroll: {
    maxHeight: 400,
  },
  pickerOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  pickerOptionText: {
    fontSize: typography.size.base,
    color: colors.text.primary,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  projectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  projectDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pickerCancelButton: {
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  pickerCancelText: {
    fontSize: typography.size.base,
    color: colors.error,
    fontWeight: typography.weight.semibold,
  },
});
