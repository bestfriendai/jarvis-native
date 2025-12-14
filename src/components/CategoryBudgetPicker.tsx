/**
 * CategoryBudgetPicker Component
 * Category picker with existing budget context
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as budgetsDB from '../database/budgets';
import * as financeDB from '../database/finance';
import { AppButton } from './ui';
import { colors, typography, spacing, borderRadius } from '../theme';

interface CategoryBudgetPickerProps {
  visible: boolean;
  selectedCategory?: string;
  onSelect: (category: string) => void;
  onClose: () => void;
  showBudgetInfo?: boolean;
}

interface CategoryWithBudget {
  name: string;
  hasBudget: boolean;
  budgetAmount?: number;
  spent?: number;
}

export function CategoryBudgetPicker({
  visible,
  selectedCategory,
  onSelect,
  onClose,
  showBudgetInfo = true,
}: CategoryBudgetPickerProps) {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<CategoryWithBudget[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible]);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      // Get all transaction categories
      const transactions = await financeDB.getTransactions();
      const transactionCategories = Array.from(
        new Set(transactions.map((t) => t.category))
      );

      // Get active budgets
      const activeBudgets = await budgetsDB.getActiveBudgets();

      // Combine and create category list with budget info
      const allCategories = new Set([
        ...transactionCategories,
        ...activeBudgets.map((b) => b.category),
      ]);

      const categoriesWithBudget: CategoryWithBudget[] = Array.from(
        allCategories
      ).map((cat) => {
        const budget = activeBudgets.find((b) => b.category === cat);
        return {
          name: cat,
          hasBudget: !!budget,
          budgetAmount: budget?.amount,
          spent: budget?.spent,
        };
      });

      // Sort: categories with budgets first, then alphabetically
      categoriesWithBudget.sort((a, b) => {
        if (a.hasBudget && !b.hasBudget) return -1;
        if (!a.hasBudget && b.hasBudget) return 1;
        return a.name.localeCompare(b.name);
      });

      setCategories(categoriesWithBudget);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCategory = (category: string) => {
    onSelect(category);
    onClose();
  };

  const handleCustomCategory = () => {
    const trimmed = customCategory.trim();
    if (trimmed) {
      handleSelectCategory(trimmed);
      setCustomCategory('');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
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
            <Text style={styles.modalTitle}>Select Category</Text>
            <IconButton
              icon="close"
              onPress={onClose}
              iconColor={colors.text.tertiary}
            />
          </View>

          {/* Custom Category Input */}
          <View style={styles.customInputSection}>
            <TextInput
              value={customCategory}
              onChangeText={setCustomCategory}
              placeholder="Enter custom category..."
              placeholderTextColor={colors.text.placeholder}
              style={styles.customInput}
              onSubmitEditing={handleCustomCategory}
              returnKeyType="done"
            />
            <AppButton
              title="Add"
              onPress={handleCustomCategory}
              disabled={!customCategory.trim()}
              style={styles.addButton}
            />
          </View>

          {/* Categories List */}
          <ScrollView
            style={styles.categoriesList}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading categories...</Text>
              </View>
            ) : categories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No categories yet</Text>
                <Text style={styles.emptyHelper}>
                  Enter a custom category above to get started
                </Text>
              </View>
            ) : (
              <>
                {categories.some((c) => c.hasBudget) && (
                  <Text style={styles.sectionLabel}>WITH BUDGETS</Text>
                )}
                {categories
                  .filter((c) => c.hasBudget)
                  .map((cat) => (
                    <CategoryItem
                      key={cat.name}
                      category={cat}
                      isSelected={selectedCategory === cat.name}
                      onSelect={handleSelectCategory}
                      showBudgetInfo={showBudgetInfo}
                      formatCurrency={formatCurrency}
                    />
                  ))}

                {categories.some((c) => !c.hasBudget) && (
                  <Text style={styles.sectionLabel}>OTHER CATEGORIES</Text>
                )}
                {categories
                  .filter((c) => !c.hasBudget)
                  .map((cat) => (
                    <CategoryItem
                      key={cat.name}
                      category={cat}
                      isSelected={selectedCategory === cat.name}
                      onSelect={handleSelectCategory}
                      showBudgetInfo={showBudgetInfo}
                      formatCurrency={formatCurrency}
                    />
                  ))}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface CategoryItemProps {
  category: CategoryWithBudget;
  isSelected: boolean;
  onSelect: (category: string) => void;
  showBudgetInfo: boolean;
  formatCurrency: (value: number) => string;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  isSelected,
  onSelect,
  showBudgetInfo,
  formatCurrency,
}) => {
  return (
    <TouchableOpacity
      style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
      onPress={() => onSelect(category.name)}
    >
      <View style={styles.categoryLeft}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryName}>{category.name}</Text>
          {category.hasBudget && (
            <View style={styles.budgetBadge}>
              <IconButton
                icon="wallet"
                size={12}
                iconColor={colors.primary.main}
                style={styles.budgetBadgeIcon}
              />
            </View>
          )}
        </View>

        {showBudgetInfo && category.hasBudget && category.budgetAmount && (
          <View style={styles.budgetInfo}>
            <Text style={styles.budgetText}>
              {formatCurrency(category.spent || 0)} of{' '}
              {formatCurrency(category.budgetAmount)}
            </Text>
            <View style={styles.miniProgress}>
              <View
                style={[
                  styles.miniProgressFill,
                  {
                    width: `${Math.min(
                      ((category.spent || 0) / category.budgetAmount) * 100,
                      100
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {isSelected && (
        <IconButton
          icon="check-circle"
          size={24}
          iconColor={colors.primary.main}
          style={styles.checkIcon}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
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
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  customInputSection: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  customInput: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: typography.size.base,
  },
  addButton: {
    minWidth: 80,
  },
  categoriesList: {
    flex: 1,
    padding: spacing.base,
  },
  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  categoryItem: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.default,
  },
  categoryItemSelected: {
    borderColor: colors.primary.main,
    backgroundColor: `${colors.primary.main}10`,
  },
  categoryLeft: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
  },
  budgetBadge: {
    marginLeft: spacing.sm,
  },
  budgetBadgeIcon: {
    margin: 0,
    padding: 0,
  },
  budgetInfo: {
    marginTop: spacing.xs,
  },
  budgetText: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  miniProgress: {
    height: 4,
    backgroundColor: colors.border.subtle,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
  },
  checkIcon: {
    margin: 0,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  emptyHelper: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

export default CategoryBudgetPicker;
