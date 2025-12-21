/**
 * Category Management Screen
 * Manage income and expense categories
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { IconButton, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as categoriesDB from '../database/categories';
import { CategoryFormModal } from '../components/finance/CategoryFormModal';
import { EmptyState, LoadingState } from '../components/ui';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../theme';
import { HIT_SLOP } from '../constants/ui';

export default function CategoryManagementScreen() {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<categoriesDB.Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<categoriesDB.Category | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await categoriesDB.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('[CategoryManagement] Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const handleEdit = (category: categoriesDB.Category) => {
    if (!category.isCustom) {
      Alert.alert(
        'Cannot Edit',
        'Default categories cannot be edited. Create a custom category instead.'
      );
      return;
    }
    setSelectedCategory(category);
    setShowFormModal(true);
  };

  const handleDelete = async (category: categoriesDB.Category) => {
    if (!category.isCustom) {
      Alert.alert(
        'Cannot Delete',
        'Default categories cannot be deleted.'
      );
      return;
    }

    try {
      const usageCount = await categoriesDB.getCategoryUsageCount(category.id);

      if (usageCount > 0) {
        Alert.alert(
          'Cannot Delete',
          `This category is used by ${usageCount} transaction${usageCount > 1 ? 's' : ''}. Please reassign or delete those transactions first.`
        );
        return;
      }

      Alert.alert(
        'Delete Category',
        `Are you sure you want to delete "${category.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await categoriesDB.deleteCategory(category.id);
                loadCategories();
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to delete category');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check category usage');
    }
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setShowFormModal(true);
  };

  const expenseCategories = categories.filter((cat) => cat.type === 'expense');
  const incomeCategories = categories.filter((cat) => cat.type === 'income');

  if (isLoading && categories.length === 0) {
    return <LoadingState fullScreen message="Loading categories..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={styles.title}>Categories</Text>
          <Text style={styles.subtitle}>
            {categories.filter((c) => c.isCustom).length} custom,{' '}
            {categories.filter((c) => !c.isCustom).length} default
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {categories.length === 0 ? (
          <EmptyState
            icon="tag-outline"
            title="No categories"
            description="Categories will appear here"
          />
        ) : (
          <>
            {/* Expense Categories */}
            {expenseCategories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>EXPENSE CATEGORIES</Text>
                <View style={styles.categoryList}>
                  {expenseCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Income Categories */}
            {incomeCategories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>INCOME CATEGORIES</Text>
                <View style={styles.categoryList}>
                  {incomeCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        label="Add Category"
        style={[styles.fab, { bottom: insets.bottom + spacing.base }]}
        onPress={handleAddCategory}
        color="#FFFFFF"
      />

      {/* Form Modal */}
      <CategoryFormModal
        visible={showFormModal}
        category={selectedCategory}
        onClose={() => {
          setShowFormModal(false);
          setSelectedCategory(null);
        }}
        onSuccess={() => {
          loadCategories();
        }}
      />
    </View>
  );
}

// Category Card Component
interface CategoryCardProps {
  category: categoriesDB.Category;
  onEdit: (category: categoriesDB.Category) => void;
  onDelete: (category: categoriesDB.Category) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
}) => {
  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryContent}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${category.color}25` },
          ]}
        >
          <Icon name={category.icon} size={24} color={category.color} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <View style={styles.categoryMeta}>
            {!category.isCustom && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={styles.categoryActions}>
        {category.isCustom ? (
          <>
            <IconButton
              icon="pencil"
              size={20}
              iconColor={colors.text.secondary}
              onPress={() => onEdit(category)}
                hitSlop={HIT_SLOP}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor={colors.error}
              onPress={() => onDelete(category)}
                hitSlop={HIT_SLOP}
            />
          </>
        ) : (
          <IconButton
            icon="lock"
            size={20}
            iconColor={colors.text.tertiary}
            disabled
          
                hitSlop={HIT_SLOP}/>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.base,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing.md,
  },
  categoryList: {
    gap: spacing.sm,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  categoryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  defaultBadge: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    backgroundColor: colors.primary.main,
  },
});
