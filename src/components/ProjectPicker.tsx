/**
 * ProjectPicker Component
 * Searchable project selector for assigning tasks to projects
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as projectsDB from '../database/projects';
import type { Project } from '../database/projects';
import { AppButton } from './ui';
import { colors, typography, spacing, borderRadius } from '../theme';
import { HIT_SLOP } from '../constants/ui';

interface ProjectPickerProps {
  value?: Project | null;
  onChange: (project: Project | null) => void;
  placeholder?: string;
}

export function ProjectPicker({ value, onChange, placeholder = 'Select Project' }: ProjectPickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (showModal) {
      loadProjects();
    }
  }, [showModal]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredProjects(
        projects.filter(
          (project) =>
            project.name.toLowerCase().includes(query) ||
            project.description?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredProjects(projects);
    }
  }, [searchQuery, projects]);

  const loadProjects = async () => {
    try {
      const loadedProjects = await projectsDB.getActiveProjects();
      setProjects(loadedProjects);
      setFilteredProjects(loadedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleSelect = (project: Project) => {
    onChange(project);
    setShowModal(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <>
      {/* Picker Button */}
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <View style={styles.pickerContent}>
          {value ? (
            <>
              {value.color && (
                <View style={[styles.colorDot, { backgroundColor: value.color }]} />
              )}
              <Text style={styles.selectedText} numberOfLines={1}>
                {value.name}
              </Text>
            </>
          ) : (
            <Text style={styles.placeholderText}>{placeholder}</Text>
          )}
        </View>

        <View style={styles.pickerActions}>
          {value && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <IconButton icon="close-circle" size={20} iconColor={colors.text.tertiary} 
                hitSlop={HIT_SLOP}/>
            </TouchableOpacity>
          )}
          <IconButton icon="chevron-down" size={20} iconColor={colors.text.tertiary} 
                hitSlop={HIT_SLOP}/>
        </View>
      </TouchableOpacity>

      {/* Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
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
                <Text style={styles.modalTitle}>Select Project</Text>
                <IconButton
                  icon="close"
                  onPress={() => setShowModal(false)}
                hitSlop={HIT_SLOP}
                  iconColor={colors.text.tertiary}
                />
              </View>

              {/* Search */}
              <View style={styles.searchContainer}>
                <IconButton icon="magnify" size={20} iconColor={colors.text.tertiary} 
                hitSlop={HIT_SLOP}/>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search projects..."
                  placeholderTextColor={colors.text.placeholder}
                  style={styles.searchInput}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <IconButton icon="close-circle" size={20} iconColor={colors.text.tertiary} 
                hitSlop={HIT_SLOP}/>
                  </TouchableOpacity>
                )}
              </View>

              {/* Project List */}
              <ScrollView style={styles.projectList}>
                {/* None Option */}
                <TouchableOpacity
                  style={[styles.projectItem, !value && styles.projectItemSelected]}
                  onPress={() => {
                    onChange(null);
                    setShowModal(false);
                    setSearchQuery('');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.projectItemContent}>
                    <Text style={styles.projectItemName}>No Project</Text>
                    <Text style={styles.projectItemDesc}>Task is not assigned to a project</Text>
                  </View>
                  {!value && (
                    <IconButton icon="check" size={20} iconColor={colors.primary.main} 
                hitSlop={HIT_SLOP}/>
                  )}
                </TouchableOpacity>

                {/* Project Options */}
                {filteredProjects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.projectItem,
                      value?.id === project.id && styles.projectItemSelected,
                    ]}
                    onPress={() => handleSelect(project)}
                    activeOpacity={0.7}
                  >
                    {project.color && (
                      <View style={[styles.projectColor, { backgroundColor: project.color }]} />
                    )}

                    <View style={styles.projectItemContent}>
                      <Text style={styles.projectItemName} numberOfLines={1}>
                        {project.name}
                      </Text>
                      {project.description && (
                        <Text style={styles.projectItemDesc} numberOfLines={1}>
                          {project.description}
                        </Text>
                      )}
                    </View>

                    {value?.id === project.id && (
                      <IconButton icon="check" size={20} iconColor={colors.primary.main} 
                hitSlop={HIT_SLOP}/>
                    )}
                  </TouchableOpacity>
                ))}

                {filteredProjects.length === 0 && searchQuery && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No projects found</Text>
                    <Text style={styles.emptySubtext}>
                      Try adjusting your search
                    </Text>
                  </View>
                )}

                {filteredProjects.length === 0 && !searchQuery && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No active projects</Text>
                    <Text style={styles.emptySubtext}>
                      Create a project from the Projects tab
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  pickerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pickerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  clearButton: {
    marginRight: -spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  selectedText: {
    fontSize: typography.size.base,
    color: colors.text.primary,
    flex: 1,
  },
  placeholderText: {
    fontSize: typography.size.base,
    color: colors.text.placeholder,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  projectList: {
    flex: 1,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  projectItemSelected: {
    backgroundColor: colors.background.secondary,
  },
  projectColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  projectItemContent: {
    flex: 1,
  },
  projectItemName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  projectItemDesc: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
