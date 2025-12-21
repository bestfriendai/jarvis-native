/**
 * Category Picker Modal
 * Modal for selecting a category when creating/editing transactions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as categoriesDB from '../../database/categories';
import { HIT_SLOP } from '../../constants/ui';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';

interface CategoryPickerProps {
  visible: boolean;
  type: 'income' | 'expense';
  selectedCategoryName?: string;
  onSelect: (categoryName: string, categoryIcon: string, categoryColor: string) => void;
  onClose: () => void;
  onManageCategories?: () => void;
}

const { width } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const CARD_PADDING = spacing.md;
const CARD_GAP = spacing.sm;
const CARD_WIDTH = (width - (spacing.lg * 2) - (CARD_GAP * (GRID_COLUMNS - 1))) / GRID_COLUMNS;

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  visible,
  type,
  selectedCategoryName,
  onSelect,
  onClose,
  onManageCategories,
}) => {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<categoriesDB.Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<categoriesDB.Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadCategories();
      setSearchQuery('');
    }
  }, [visible, type]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const cats = await categoriesDB.getCategories(type);
      setCategories(cats);
      setFilteredCategories(cats);
    } catch (error) {
      console.error('[CategoryPicker] Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (category: categoriesDB.Category) => {
    onSelect(category.name, category.icon, category.color);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Select {type === 'income' ? 'Income' : 'Expense'} Category
            </Text>
            <IconButton
              icon="close"
              onPress={onClose}
              iconColor={colors.text.tertiary}
            
                hitSlop={HIT_SLOP}/>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="magnify" size={20} color={colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search categories..."
              placeholderTextColor={colors.text.placeholder}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Grid */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading categories...</Text>
              </View>
            ) : filteredCategories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No categories found' : 'No categories available'}
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {filteredCategories.map((category) => {
                  const isSelected = category.name === selectedCategoryName;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryCard,
                        { width: CARD_WIDTH },
                        isSelected && {
                          borderColor: category.color,
                          borderWidth: 2,
                          backgroundColor: `${category.color}15`,
                        },
                      ]}
                      onPress={() => handleSelect(category)}
                    >
                      <View
                        style={[
                          styles.iconCircle,
                          { backgroundColor: `${category.color}25` },
                        ]}
                      >
                        <Icon
                          name={category.icon}
                          size={24}
                          color={category.color}
                        />
                      </View>
                      <Text
                        style={styles.categoryName}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {category.name}
                      </Text>
                      {category.isCustom && (
                        <View style={styles.customBadge}>
                          <Text style={styles.customBadgeText}>Custom</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Manage Categories Link */}
          {onManageCategories && (
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => {
                onManageCategories();
                onClose();
              }}
            >
              <Icon name="cog" size={20} color={colors.primary.main} />
              <Text style={styles.manageButtonText}>Manage Categories</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    margin: spacing.base,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.size.base,
    paddingVertical: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
  },
  loadingContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.size.base,
    color: colors.text.tertiary,
  },
  emptyContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.size.base,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  categoryCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: CARD_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  categoryName: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    textAlign: 'center',
  },
  customBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  customBadgeText: {
    fontSize: 9,
    fontWeight: typography.weight.semibold,
    color: '#FFFFFF',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    gap: spacing.sm,
  },
  manageButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.primary.main,
  },
});
