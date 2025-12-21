/**
 * ProjectDetailScreen
 * Detailed view of a single project with associated tasks
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as projectsDB from '../../database/projects';
import * as tasksDB from '../../database/tasks';
import type { Project } from '../../database/projects';
import type { Task, TaskStatus } from '../../database/tasks';
import { ProjectFormModal } from '../../components/ProjectFormModal';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { HIT_SLOP } from '../../constants/ui';

type RootStackParamList = {
  ProjectDetail: { projectId: string };
  Projects: undefined;
};

type ProjectDetailRouteProp = RouteProp<RootStackParamList, 'ProjectDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProjectDetailScreen() {
  const route = useRoute<ProjectDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { projectId } = route.params;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  useEffect(() => {
    filterTasks();
  }, [statusFilter, tasks]);

  const loadProjectData = async () => {
    try {
      const [loadedProject, loadedTasks] = await Promise.all([
        projectsDB.getProjectWithStats(projectId),
        tasksDB.getTasksByProject(projectId),
      ]);

      if (!loadedProject) {
        Alert.alert('Error', 'Project not found');
        navigation.goBack();
        return;
      }

      setProject(loadedProject);
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading project:', error);
      Alert.alert('Error', 'Failed to load project');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProjectData();
    setRefreshing(false);
  }, [projectId]);

  const filterTasks = () => {
    if (statusFilter === 'all') {
      setFilteredTasks(tasks);
      return;
    }

    const filtered = tasks.filter((task) => task.status === statusFilter);
    setFilteredTasks(filtered);
  };

  const handleEditProject = () => {
    setShowFormModal(true);
  };

  const handleFormClose = () => {
    setShowFormModal(false);
  };

  const handleFormSuccess = () => {
    loadProjectData();
  };

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'in_progress':
        return colors.primary.main;
      case 'todo':
      default:
        return colors.text.tertiary;
    }
  };

  const getStatusLabel = (status: TaskStatus): string => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'todo':
      default:
        return 'To Do';
    }
  };

  if (!project) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading project...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = project.taskStats
    ? project.taskStats.total > 0
      ? (project.taskStats.completed / project.taskStats.total) * 100
      : 0
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} iconColor={colors.text.primary} 
                hitSlop={HIT_SLOP}/>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {project.name}
        </Text>
        <TouchableOpacity onPress={handleEditProject}>
          <IconButton icon="pencil" size={24} iconColor={colors.text.primary} 
                hitSlop={HIT_SLOP}/>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Project Info Card */}
        <View style={[styles.infoCard, { borderLeftColor: project.color || colors.primary.main }]}>
          {project.description && (
            <Text style={styles.description}>{project.description}</Text>
          )}

          {/* Statistics */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{project.taskStats?.total || 0}</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {project.taskStats?.completed || 0}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.primary.main }]}>
                {project.taskStats?.inProgress || 0}
              </Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.text.tertiary }]}>
                {project.taskStats?.todo || 0}
              </Text>
              <Text style={styles.statLabel}>To Do</Text>
            </View>
          </View>

          {/* Progress Bar */}
          {project.taskStats && project.taskStats.total > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: project.color || colors.primary.main,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* Status Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filter Tasks:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
          >
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
              onPress={() => setStatusFilter('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === 'all' && styles.filterChipTextActive,
                ]}
              >
                All ({tasks.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'todo' && styles.filterChipActive]}
              onPress={() => setStatusFilter('todo')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === 'todo' && styles.filterChipTextActive,
                ]}
              >
                To Do ({project.taskStats?.todo || 0})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'in_progress' && styles.filterChipActive]}
              onPress={() => setStatusFilter('in_progress')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === 'in_progress' && styles.filterChipTextActive,
                ]}
              >
                In Progress ({project.taskStats?.inProgress || 0})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'completed' && styles.filterChipActive]}
              onPress={() => setStatusFilter('completed')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === 'completed' && styles.filterChipTextActive,
                ]}
              >
                Completed ({project.taskStats?.completed || 0})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Tasks List */}
        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskTitleRow}>
                    <View
                      style={[
                        styles.taskStatusDot,
                        { backgroundColor: getStatusColor(task.status) },
                      ]}
                    />
                    <Text style={styles.taskTitle} numberOfLines={2}>
                      {task.title}
                    </Text>
                  </View>
                  <View style={styles.taskBadge}>
                    <Text style={[styles.taskBadgeText, { color: getStatusColor(task.status) }]}>
                      {getStatusLabel(task.status)}
                    </Text>
                  </View>
                </View>
                {task.description && (
                  <Text style={styles.taskDescription} numberOfLines={2}>
                    {task.description}
                  </Text>
                )}
                {task.dueDate && (
                  <View style={styles.taskMeta}>
                    <IconButton
                      icon="calendar"
                      size={14}
                      iconColor={colors.text.tertiary}
                      style={styles.taskMetaIcon}
                    
                hitSlop={HIT_SLOP}/>
                    <Text style={styles.taskMetaText}>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {statusFilter === 'all'
                  ? 'No tasks in this project yet'
                  : `No ${statusFilter.replace('_', ' ')} tasks`}
              </Text>
              <Text style={styles.emptySubtext}>
                {statusFilter === 'all'
                  ? 'Create tasks and assign them to this project'
                  : 'Try a different filter'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Project Form Modal */}
      <ProjectFormModal
        visible={showFormModal}
        project={project}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.base,
  },
  infoCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    ...shadows.md,
  },
  description: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
  },
  statValue: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  progressSection: {
    marginTop: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  progressPercentage: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterChipText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.background.primary,
  },
  tasksSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  taskCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  taskTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  taskStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  taskTitle: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
  },
  taskBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  taskBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    textTransform: 'uppercase',
  },
  taskDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
    marginBottom: spacing.sm,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  taskMetaIcon: {
    margin: 0,
  },
  taskMetaText: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
});
