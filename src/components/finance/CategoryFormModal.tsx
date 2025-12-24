/**
 * Category Form Modal
 * Form for creating and editing custom categories
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
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as categoriesDB from '../../database/categories';
import { AppButton } from '../ui';
import { HIT_SLOP } from '../../constants/ui';
import {
  typography,
  spacing,
  borderRadius,
  getColors,
} from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

interface CategoryFormModalProps {
  visible: boolean;
  category?: categoriesDB.Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Available icons for categories
const AVAILABLE_ICONS = [
  'food', 'car', 'home', 'lightbulb', 'cart', 'medical-bag',
  'shopping', 'wallet', 'cash', 'credit-card', 'briefcase',
  'trending-up', 'trending-down', 'gift', 'heart', 'star',
  'coffee', 'book', 'music', 'tools', 'airplane', 'bike',
  'bus', 'train', 'gamepad', 'theater', 'dumbbell', 'run',
];

// Available color presets
const AVAILABLE_COLORS = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Gray', value: '#64748B' },
];

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  visible,
  category,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('wallet');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [type, setType] = useState<categoriesDB.CategoryType>('expense');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (category) {
        setName(category.name);
        setSelectedIcon(category.icon);
        setSelectedColor(category.color);
        setType(category.type);
      } else {
        setName('');
        setSelectedIcon('wallet');
        setSelectedColor('#3B82F6');
        setType('expense');
      }
    }
  }, [visible, category]);

  const handleSubmit = async () => {
    if (isSubmitting || !name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        type,
      };

      if (category) {
        await categoriesDB.updateCategory(category.id, data);
      } else {
        await categoriesDB.createCategory(data);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('[CategoryFormModal] Error saving category:', error);
      Alert.alert('Error', error.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
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
        style={styles.overlay}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {category ? 'Edit Category' : 'New Category'}
              </Text>
              <IconButton
                icon="close"
                onPress={onClose}
                iconColor={colors.text.tertiary}
              
                hitSlop={HIT_SLOP}/>
            </View>

            {/* Form */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Preview */}
              <View style={styles.previewContainer}>
                <View
                  style={[
                    styles.previewIconCircle,
                    { backgroundColor: `${selectedColor}25` },
                  ]}
                >
                  <Icon name={selectedIcon} size={48} color={selectedColor} />
                </View>
                <Text style={styles.previewName}>
                  {name.trim() || 'Category Name'}
                </Text>
              </View>

              {/* Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Groceries, Gas..."
                  placeholderTextColor={colors.text.placeholder}
                  style={styles.input}
                  maxLength={50}
                />
              </View>

              {/* Type */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Type *</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      type === 'expense' && styles.typeButtonActive,
                    ]}
                    onPress={() => setType('expense')}
                    disabled={!!category} // Can't change type on edit
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === 'expense' && styles.typeButtonTextActive,
                      ]}
                    >
                      Expense
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      type === 'income' && styles.typeButtonActive,
                    ]}
                    onPress={() => setType('income')}
                    disabled={!!category} // Can't change type on edit
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === 'income' && styles.typeButtonTextActive,
                      ]}
                    >
                      Income
                    </Text>
                  </TouchableOpacity>
                </View>
                {category && (
                  <Text style={styles.helperText}>
                    Category type cannot be changed
                  </Text>
                )}
              </View>

              {/* Icon */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Icon *</Text>
                <View style={styles.iconGrid}>
                  {AVAILABLE_ICONS.map((iconName) => (
                    <TouchableOpacity
                      key={iconName}
                      style={[
                        styles.iconOption,
                        selectedIcon === iconName && {
                          backgroundColor: `${selectedColor}25`,
                          borderColor: selectedColor,
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => setSelectedIcon(iconName)}
                    >
                      <Icon
                        name={iconName}
                        size={24}
                        color={selectedIcon === iconName ? selectedColor : colors.text.secondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Color */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Color *</Text>
                <View style={styles.colorGrid}>
                  {AVAILABLE_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color.value}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color.value },
                        selectedColor === color.value && styles.colorOptionSelected,
                      ]}
                      onPress={() => setSelectedColor(color.value)}
                    >
                      {selectedColor === color.value && (
                        <Icon name="check" size={20} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <AppButton
                title="Cancel"
                onPress={onClose}
                variant="outline"
                style={styles.button}
              />
              <AppButton
                title={category ? 'Update' : 'Create'}
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!name.trim()}
                style={styles.button}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '90%',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.base,
  },
  previewIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  previewName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: typography.size.base,
  },
  helperText: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeButton: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.md,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  typeButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.background.secondary,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  button: {
    flex: 1,
  },
});
