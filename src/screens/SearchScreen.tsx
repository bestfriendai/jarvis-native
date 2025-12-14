/**
 * Global Search Screen
 * Search across all modules: Tasks, Habits, Calendar, Finance
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as tasksDB from '../database/tasks';
import * as habitsDB from '../database/habits';
import * as calendarDB from '../database/calendar';
import * as financeDB from '../database/finance';
import { AppCard, EmptyState } from '../components/ui';
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from '../theme';

interface SearchResult {
  id: string;
  type: 'task' | 'habit' | 'event' | 'transaction';
  title: string;
  subtitle?: string;
  date?: string;
  category?: string;
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const lowerQuery = searchQuery.toLowerCase();
      const allResults: SearchResult[] = [];

      // Search Tasks
      const tasks = await tasksDB.getTasks();
      const taskResults = tasks
        .filter(
          (task) =>
            task.title.toLowerCase().includes(lowerQuery) ||
            task.description?.toLowerCase().includes(lowerQuery) ||
            task.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
        )
        .map((task) => ({
          id: task.id,
          type: 'task' as const,
          title: task.title,
          subtitle: task.description,
          category: task.status,
        }));
      allResults.push(...taskResults);

      // Search Habits
      const habits = await habitsDB.getHabits();
      const habitResults = habits
        .filter(
          (habit) =>
            habit.name.toLowerCase().includes(lowerQuery) ||
            habit.description?.toLowerCase().includes(lowerQuery)
        )
        .map((habit) => ({
          id: habit.id,
          type: 'habit' as const,
          title: habit.name,
          subtitle: habit.description,
          category: `${habit.currentStreak} day streak`,
        }));
      allResults.push(...habitResults);

      // Search Calendar Events
      const events = await calendarDB.getEvents();
      const eventResults = events
        .filter(
          (event) =>
            event.title.toLowerCase().includes(lowerQuery) ||
            event.description?.toLowerCase().includes(lowerQuery) ||
            event.location?.toLowerCase().includes(lowerQuery)
        )
        .map((event) => ({
          id: event.id,
          type: 'event' as const,
          title: event.title,
          subtitle: event.description,
          date: new Date(event.startTime).toLocaleDateString(),
          category: event.location,
        }));
      allResults.push(...eventResults);

      // Search Finance Transactions
      const transactions = await financeDB.getTransactions();
      const transactionResults = transactions
        .filter(
          (transaction) =>
            transaction.category.toLowerCase().includes(lowerQuery) ||
            transaction.description?.toLowerCase().includes(lowerQuery)
        )
        .map((transaction) => ({
          id: transaction.id,
          type: 'transaction' as const,
          title: transaction.category,
          subtitle: transaction.description,
          date: new Date(transaction.date).toLocaleDateString(),
          category: `$${(transaction.amount / 100).toFixed(2)}`,
        }));
      allResults.push(...transactionResults);

      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    // Debounce search
    const timeoutId = setTimeout(() => {
      performSearch(text);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'task':
        return '✓';
      case 'habit':
        return '🔥';
      case 'event':
        return '📅';
      case 'transaction':
        return '💰';
    }
  };

  const getResultTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'task':
        return 'Task';
      case 'habit':
        return 'Habit';
      case 'event':
        return 'Event';
      case 'transaction':
        return 'Transaction';
    }
  };

  const handleResultPress = (result: SearchResult) => {
    // Navigate to appropriate screen based on result type
    switch (result.type) {
      case 'task':
        navigation.navigate('Tasks' as never);
        break;
      case 'habit':
        navigation.navigate('Habits' as never);
        break;
      case 'event':
        navigation.navigate('Calendar' as never);
        break;
      case 'transaction':
        navigation.navigate('Finance' as never);
        break;
    }
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<SearchResult['type'], SearchResult[]>);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search tasks, habits, events, transactions..."
            placeholderTextColor={colors.text.placeholder}
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setResults([]);
                setHasSearched(false);
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      <ScrollView
        style={styles.resultsContainer}
        contentContainerStyle={styles.resultsContent}
        keyboardShouldPersistTaps="handled"
      >
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : hasSearched && results.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No results found"
            description={`No matches for "${query}"`}
          />
        ) : !hasSearched ? (
          <EmptyState
            icon="🔍"
            title="Search everything"
            description="Search across tasks, habits, calendar events, and transactions"
          />
        ) : (
          <View style={styles.groupedResults}>
            {Object.entries(groupedResults).map(([type, items]) => (
              <View key={type} style={styles.resultGroup}>
                <Text style={styles.groupTitle}>
                  {getResultIcon(type as SearchResult['type'])}{' '}
                  {getResultTypeLabel(type as SearchResult['type'])}s ({items.length})
                </Text>
                {items.map((result) => (
                  <TouchableOpacity
                    key={result.id}
                    style={styles.resultCard}
                    onPress={() => handleResultPress(result)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.resultContent}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {result.title}
                      </Text>
                      {result.subtitle && (
                        <Text style={styles.resultSubtitle} numberOfLines={2}>
                          {result.subtitle}
                        </Text>
                      )}
                      <View style={styles.resultMeta}>
                        {result.category && (
                          <Text style={styles.resultCategory}>{result.category}</Text>
                        )}
                        {result.date && (
                          <Text style={styles.resultDate}>{result.date}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  searchHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.size.base,
    color: colors.text.primary,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearButtonText: {
    fontSize: 20,
    color: colors.text.tertiary,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    padding: spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.base,
    color: colors.text.tertiary,
  },
  groupedResults: {
    gap: spacing.xl,
  },
  resultGroup: {
    gap: spacing.md,
  },
  groupTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  resultCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.base,
  },
  resultContent: {
    gap: spacing.xs,
  },
  resultTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  resultSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  resultCategory: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.primary.main,
  },
  resultDate: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
});
