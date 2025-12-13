/**
 * Settings Screen
 * Production-ready settings with database management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Switch } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import { useAuthStore } from '../../store/authStore';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';

// Import database modules
import { getTasks } from '../../database/tasks';
import { getHabits } from '../../database/habits';
import { getEvents } from '../../database/calendar';
import {
  getTransactions,
  getAssets,
  getLiabilities
} from '../../database/finance';
import { dropAllTables, initDatabase } from '../../database';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  danger = false,
}) => {
  const content = (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
      {onPress && !rightElement && (
        <Text style={styles.chevron}>›</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

interface DatabaseStats {
  tasks: number;
  habits: number;
  events: number;
  transactions: number;
  assets: number;
  liabilities: number;
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [stats, setStats] = useState<DatabaseStats>({
    tasks: 0,
    habits: 0,
    events: 0,
    transactions: 0,
    assets: 0,
    liabilities: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadDatabaseStats();
  }, []);

  const loadDatabaseStats = async () => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error('Failed to load database stats:', error);
      Alert.alert('Error', 'Failed to load database statistics.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllData = () => {
    const totalRecords = Object.values(stats).reduce((sum, val) => sum + val, 0);

    Alert.alert(
      'Clear All Data?',
      `This will permanently delete all ${totalRecords} records (${stats.tasks} tasks, ${stats.habits} habits, ${stats.events} events, ${stats.transactions} transactions, ${stats.assets} assets, ${stats.liabilities} liabilities). This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await dropAllTables();
              await initDatabase();
              await loadDatabaseStats();
              Alert.alert('Success', 'All data has been cleared successfully.');
            } catch (error) {
              console.error('Failed to clear data:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      setExporting(true);

      // Fetch all data
      const [tasks, habits, events, transactions, assets, liabilities] = await Promise.all([
        getTasks(),
        getHabits(),
        getEvents(),
        getTransactions(),
        getAssets(),
        getLiabilities(),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        appVersion: '1.0.0',
        stats: {
          totalRecords: Object.values(stats).reduce((sum, val) => sum + val, 0),
          tasks: tasks.length,
          habits: habits.length,
          events: events.length,
          transactions: transactions.length,
          assets: assets.length,
          liabilities: liabilities.length,
        },
        data: {
          tasks,
          habits,
          events,
          transactions,
          assets,
          liabilities,
        },
      };

      // Copy JSON to clipboard
      const jsonString = JSON.stringify(exportData, null, 2);
      Clipboard.setString(jsonString);

      Alert.alert(
        'Success!',
        'All data copied to clipboard!\n\nYou can paste it into a text file to save your backup.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to export data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const totalRecords = Object.values(stats).reduce((sum, val) => sum + val, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: insets.bottom + spacing['3xl'] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Database Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DATABASE</Text>
        <View style={styles.sectionContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary.main} />
              <Text style={styles.loadingText}>Loading statistics...</Text>
            </View>
          ) : (
            <>
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

              <View style={styles.divider} />

              <SettingItem
                icon="📤"
                title={exporting ? 'Exporting...' : 'Export Data'}
                subtitle="Download all data as JSON file"
                onPress={exporting ? undefined : handleExportData}
              />

              <View style={styles.divider} />

              <SettingItem
                icon="🗑️"
                title="Clear All Data"
                subtitle="Permanently delete all database records"
                onPress={handleClearAllData}
                danger
              />
            </>
          )}
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="👤"
            title={user?.email || 'demo@jarvis.app'}
            subtitle="Email address"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="🌐"
            title={user?.timezone || 'America/Chicago'}
            subtitle="Timezone"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="💵"
            title={user?.currency || 'USD'}
            subtitle="Currency"
          />
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="🔔"
            title="Push Notifications"
            subtitle="Receive notifications for tasks and events"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: colors.background.tertiary,
                  true: `${colors.primary.main}80`,
                }}
                thumbColor={notificationsEnabled ? colors.primary.main : colors.text.disabled}
              />
            }
          />
        </View>
      </View>

      {/* App Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>APP INFO</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="ℹ️"
            title="Version"
            subtitle="1.0.0"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="💾"
            title="Storage"
            subtitle="Local SQLite Database"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="📴"
            title="Mode"
            subtitle="Offline-First Architecture"
          />
        </View>
      </View>

      {/* Privacy Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PRIVACY</Text>
        <View style={styles.sectionContent}>
          <View style={styles.privacyContainer}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>
              All your data is stored locally on your device in an encrypted SQLite database.
              No data is sent to external servers unless you explicitly use AI features or export your data.
            </Text>
          </View>
        </View>
      </View>

      {/* Logout Section */}
      <View style={styles.section}>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="🚪"
            title="Logout"
            onPress={handleLogout}
            danger
          />
        </View>
      </View>

      {/* App Info Footer */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>Jarvis</Text>
        <Text style={styles.appVersion}>Your Personal AI Assistant</Text>
        <Text style={styles.appBuild}>Build 1.0.0</Text>
        <Text style={styles.appCopyright}>
          Last Updated: December 2025
        </Text>
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingIconText: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
  },
  settingSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  chevron: {
    fontSize: 24,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: spacing.base + 40 + spacing.md,
  },
  dangerText: {
    color: colors.error,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginLeft: spacing.md,
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
  privacyContainer: {
    flexDirection: 'row',
    padding: spacing.base,
    alignItems: 'flex-start',
  },
  privacyIcon: {
    fontSize: 24,
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  privacyText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: typography.size.sm * 1.6,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  appName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  appVersion: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  appBuild: {
    fontSize: typography.size.xs,
    color: colors.text.disabled,
    marginBottom: spacing.sm,
  },
  appCopyright: {
    fontSize: typography.size.xs,
    color: colors.text.disabled,
  },
});
