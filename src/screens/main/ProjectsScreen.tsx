/**
 * ProjectsScreen
 * Main screen for viewing and managing projects
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as projectsDB from '../../database/projects';
import type { Project } from '../../database/projects';
import { ProjectCard } from '../../components/ProjectCard';
import { ProjectFormModal } from '../../components/ProjectFormModal';
import { colors, typography, spacing, borderRadius } from '../../theme';

type RootStackParamList = {
  ProjectDetail: { projectId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProjectsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, [showArchived]);

  useEffect(() => {
    filterProjects();
  }, [searchQuery, projects]);

  const loadProjects = async () => {
    try {
      const loadedProjects = await projectsDB.getProjectsWithStats(showArchived);
      setProjects(loadedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  }, [showArchived]);

  const filterProjects = () => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query)
    );
    setFilteredProjects(filtered);
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setShowFormModal(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowFormModal(true);
  };

  const handleProjectPress = (project: Project) => {
    navigation.navigate('ProjectDetail', { projectId: project.id });
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    setSelectedProject(null);
  };

  const handleFormSuccess = () => {
    loadProjects();
  };

  const toggleArchived = () => {
    setShowArchived(!showArchived);
  };

  const activeProjects = filteredProjects.filter((p) => p.status === 'active');
  const archivedProjects = filteredProjects.filter((p) => p.status === 'archived');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleArchived} style={styles.archiveToggle}>
            <IconButton
              icon={showArchived ? 'archive' : 'archive-outline'}
              size={24}
              iconColor={showArchived ? colors.primary.main : colors.text.tertiary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconButton icon="magnify" size={20} iconColor={colors.text.tertiary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search projects..."
          placeholderTextColor={colors.text.placeholder}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconButton icon="close-circle" size={20} iconColor={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Project List */}
      <FlatList
        data={showArchived ? archivedProjects : activeProjects}
        renderItem={({ item: project }) => (
          <ProjectCard
            project={project}
            onPress={() => handleProjectPress(project)}
            onEdit={() => handleEditProject(project)}
          />
        )}
        keyExtractor={(item) => item.id}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          showArchived && archivedProjects.length > 0 ? (
            <Text style={styles.sectionTitle}>Archived Projects</Text>
          ) : null
        }
        ListEmptyComponent={() => {
          if (showArchived) {
            return (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No archived projects</Text>
                <Text style={styles.emptySubtext}>
                  Archive projects to hide them from your active list
                </Text>
              </View>
            );
          }

          if (searchQuery) {
            return (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>No projects found</Text>
                <Text style={styles.emptySubtext}>
                  Try adjusting your search terms
                </Text>
              </View>
            );
          }

          return (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📁</Text>
              <Text style={styles.emptyText}>No projects yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first project to organize your tasks
              </Text>
            </View>
          );
        }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        initialNumToRender={10}
      />

      {/* FAB - Create Project */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateProject}
        color={colors.background.primary}
      />

      {/* Project Form Modal */}
      <ProjectFormModal
        visible={showFormModal}
        project={selectedProject}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  archiveToggle: {
    marginRight: -spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.base,
    paddingBottom: 80, // Space for FAB
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'] * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.base,
  },
  emptyText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.size.base,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: spacing.base,
    backgroundColor: colors.primary.main,
  },
});
