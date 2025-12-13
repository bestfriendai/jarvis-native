/**
 * Storage Overview Screen
 * Displays detailed database statistics and storage information
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';
import { getTasks } from '../../database/tasks';
import { getHabits } from '../../database/habits';
import { getEvents } from '../../database/calendar';
import {
  getTransactions,
  getAssets,
  getLiabilities,
} from '../../database/finance';

interface DatabaseStats {
  tasks: number;
  habits: number;
  events: number;
  transactions: number;
  assets: number;
  liabilities: number;
}

export default function StorageOverviewScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<DatabaseStats>({
    tasks: 0,
    habits: 0,
    events: 0,
    transactions: 0,
    assets: 0,
    liabilities: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadStats = useCallback(async () => {
    try {
      const [tasks, habits, events, transactions, assets, liabilities] = await Promise.all([
        getTasks(),
        getHabits(),
        getEvents(),
        getTransactions(),
        getAssets(),
        getLiabilities(),
      ]);

      setStats({
        tasks: tasks.length,
        habits: habits.length,
        events: events.length,
        transactions: transactions.length,
        assets: assets.length,
        liabilities: liabilities.length,
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadStats();
      setLoading(false);
    };
    load();
  }, [loadStats]);

  // Reload stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const totalRecords = Object.values(stats).reduce((sum, val) => sum + val, 0);

  const formatLastUpdated = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs} seconds ago`;

    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;

    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: insets.bottom + spacing['3xl'] },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary.main}
          colors={[colors.primary.main]}
        />
      }
    >
      {/* Database Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DATABASE STATISTICS</Text>
        <View style={styles.sectionContent}>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalRecords}</Text>
              <Text style={styles.statLabel}>Total Records</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.tasks}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.habits}</Text>
              <Text style={styles.statLabel}>Habits</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.events}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.transactions}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.assets}</Text>
              <Text style={styles.statLabel}>Assets</Text>
            </View>
          </View>

          <View style={styles.lastUpdated}>
            <Text style={styles.lastUpdatedText}>
              Last updated: {formatLastUpdated()}
            </Text>
          </View>
        </View>
      </View>

      {/* Storage Info */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>STORAGE INFO</Text>
        <View style={styles.sectionContent}>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoIconText}>💾</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Local SQLite Database</Text>
              <Text style={styles.infoSubtitle}>
                All data stored locally on your device
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoIconText}>🔒</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Encrypted Storage</Text>
              <Text style={styles.infoSubtitle}>
                Data protected with device encryption
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoIconText}>📴</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Offline-First</Text>
              <Text style={styles.infoSubtitle}>
                No internet connection required
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    paddingTop: spacing.base,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
  },
  statBox: {
    width: '33.333%',
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  lastUpdated: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: typography.size.xs,
    color: colors.text.disabled,
    fontStyle: 'italic',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoIconText: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
  },
  infoSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: spacing.base + 40 + spacing.md,
  },
});
