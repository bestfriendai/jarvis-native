/**
 * TaskFilterBar Component
 * Bottom sheet modal for advanced task filtering and sorting
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { IconButton, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as filterStore from '../store/taskFilterStore';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { HIT_SLOP } from '../constants/ui';

// Debounce delay for search input (milliseconds)
const SEARCH_DEBOUNCE_DELAY = 300;

interface TaskFilterBarProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: filterStore.TaskFilters) => void;
  availableProjects?: Array<{ id: string; name: string; color?: string }>;
  availableTags?: string[];
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  visible,
  onClose,
  onApply,
  availableProjects = [],
  availableTags = [],
}) => {
  const [filters, setFilters] = useState<filterStore.TaskFilters>(filterStore.getFilters());
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      const currentFilters = filterStore.getFilters();
      setFilters(currentFilters);
      setSearchInput(currentFilters.search || '');
    }
  }, [visible]);

  // Debounced search handler
  const handleSearchChange = useCallback((text: string) => {
    setSearchInput(text);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced update
    searchTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: text || undefined }));
    }, SEARCH_DEBOUNCE_DELAY);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleApply = async () => {
    await filterStore.updateFilters(filters);
    onApply(filters);
    onClose();
  };

  const handleClear = async () => {
    const cleared = await filterStore.clearFilters();
    setFilters(cleared);
    setSearchInput('');
    onApply(cleared);
    onClose();
  };

  const clearSearch = () => {
    setSearchInput('');
    setFilters((prev) => ({ ...prev, search: undefined }));
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  const togglePriority = (priority: filterStore.TaskPriority) => {
    const current = filters.priorities || [];
    const updated = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority];
    setFilters({ ...filters, priorities: updated.length > 0 ? updated : undefined });
  };

  const toggleStatus = (status: filterStore.TaskStatus) => {
    const current = filters.statuses || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    setFilters({ ...filters, statuses: updated.length > 0 ? updated : undefined });
  };

  const toggleProject = (projectId: string) => {
    const current = filters.projects || [];
    const updated = current.includes(projectId)
      ? current.filter((p) => p !== projectId)
      : [...current, projectId];
    setFilters({ ...filters, projects: updated.length > 0 ? updated : undefined });
  };

  const toggleTag = (tag: string) => {
    const current = filters.tags || [];
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    setFilters({ ...filters, tags: updated.length > 0 ? updated : undefined });
  };

  const activeCount = filterStore.countActiveFilters(filters);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter & Sort Tasks</Text>
            <View style={styles.headerActions}>
              {activeCount > 0 && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{activeCount}</Text>
                </View>
              )}
              <IconButton
                icon="close"
                size={24}
                onPress={onClose}
                iconColor={colors.text.secondary}
              
                hitSlop={HIT_SLOP}/>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Search */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SEARCH</Text>
              <View style={styles.searchContainer}>
                <Icon
                  name="magnify"
                  size={20}
                  color={colors.text.tertiary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search tasks by title or description..."
                  placeholderTextColor={colors.text.disabled}
                  value={searchInput}
                  onChangeText={handleSearchChange}
                  returnKeyType="search"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchInput.length > 0 && (
                  <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
                    <Icon name="close-circle" size={20} color={colors.text.tertiary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Sort */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SORT BY</Text>
              <View style={styles.chipGroup}>
                {(['priority', 'dueDate', 'createdAt', 'title', 'status'] as const).map(
                  (field) => (
                    <Chip
                      key={field}
                      selected={filters.sortField === field}
                      onPress={() => setFilters({ ...filters, sortField: field })}
                      style={styles.chip}
                      textStyle={styles.chipText}
                    >
                      {field === 'dueDate'
                        ? 'Due Date'
                        : field === 'createdAt'
                        ? 'Created'
                        : field.charAt(0).toUpperCase() + field.slice(1)}
                    </Chip>
                  )
                )}
              </View>
              <View style={styles.chipGroup}>
                <Chip
                  selected={filters.sortDirection === 'asc'}
                  onPress={() => setFilters({ ...filters, sortDirection: 'asc' })}
                  style={styles.chip}
                  textStyle={styles.chipText}
                  icon="arrow-up"
                >
                  Ascending
                </Chip>
                <Chip
                  selected={filters.sortDirection === 'desc'}
                  onPress={() => setFilters({ ...filters, sortDirection: 'desc' })}
                  style={styles.chip}
                  textStyle={styles.chipText}
                  icon="arrow-down"
                >
                  Descending
                </Chip>
              </View>
            </View>

            {/* Priority */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PRIORITY</Text>
              <View style={styles.chipGroup}>
                {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                  <Chip
                    key={priority}
                    selected={filters.priorities?.includes(priority)}
                    onPress={() => togglePriority(priority)}
                    style={styles.chip}
                    textStyle={styles.chipText}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Status */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>STATUS</Text>
              <View style={styles.chipGroup}>
                {(['todo', 'in_progress', 'blocked', 'completed', 'cancelled'] as const).map(
                  (status) => (
                    <Chip
                      key={status}
                      selected={filters.statuses?.includes(status)}
                      onPress={() => toggleStatus(status)}
                      style={styles.chip}
                      textStyle={styles.chipText}
                    >
                      {status === 'in_progress'
                        ? 'In Progress'
                        : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Chip>
                  )
                )}
              </View>
            </View>

            {/* Projects */}
            {availableProjects.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>PROJECTS</Text>
                <View style={styles.chipGroup}>
                  {availableProjects.map((project) => (
                    <Chip
                      key={project.id}
                      selected={filters.projects?.includes(project.id)}
                      onPress={() => toggleProject(project.id)}
                      style={styles.chip}
                      textStyle={styles.chipText}
                    >
                      {project.name}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {/* Tags */}
            {availableTags.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>TAGS</Text>
                <View style={styles.chipGroup}>
                  {availableTags.map((tag) => (
                    <Chip
                      key={tag}
                      selected={filters.tags?.includes(tag)}
                      onPress={() => toggleTag(tag)}
                      style={styles.chip}
                      textStyle={styles.chipText}
                    >
                      #{tag}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '85%',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.full,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  activeBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  content: {
    padding: spacing.base,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    padding: spacing.md,
    paddingLeft: 0,
    color: colors.text.primary,
    fontSize: typography.size.base,
  },
  clearSearchButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    marginRight: 0,
  },
  chipText: {
    fontSize: typography.size.sm,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.base,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  clearButton: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.default,
  },
  clearButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  applyButton: {
    flex: 2,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
});

export default TaskFilterBar;
