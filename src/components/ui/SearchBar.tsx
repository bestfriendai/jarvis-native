/**
 * SearchBar Component
 * Reusable search bar with debouncing, clear button, and result count
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { haptic } from '../../utils/haptics';
import { HIT_SLOP } from '../../constants/ui';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  resultCount?: number;
  showResultCount?: boolean;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  resultCount,
  showResultCount = true,
  autoFocus = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    haptic.light();
    onChangeText('');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
        <Icon
          name="magnify"
          size={20}
          color={isFocused ? colors.primary.main : colors.text.tertiary}
          style={styles.searchIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.placeholder}
          style={styles.input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={HIT_SLOP}
          >
            <Icon name="close-circle" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Result Count */}
      {showResultCount && value.length > 0 && (
        <View style={styles.resultCountContainer}>
          {resultCount !== undefined && (
            <Text style={styles.resultCountText}>
              {resultCount === 0
                ? 'No results found'
                : `${resultCount} result${resultCount !== 1 ? 's' : ''}`}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchBarFocused: {
    borderColor: colors.primary.main,
    backgroundColor: colors.background.primary,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.primary,
    padding: 0,
    margin: 0,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  resultCountContainer: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  resultCountText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    fontWeight: typography.weight.medium,
  },
});
