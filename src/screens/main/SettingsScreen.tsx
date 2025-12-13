/**
 * Settings Screen (Main)
 * Professional settings with navigation to sub-screens
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Switch } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Clipboard from '@react-native-clipboard/clipboard';
import { useAuthStore } from '../../store/authStore';
import type { SettingsStackParamList } from '../../types';
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
  getLiabilities
} from '../../database/finance';
import { useFocusEffect } from '@react-navigation/native';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
  showChevron?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  danger = false,
  showChevron = false,
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
      {showChevron && !rightElement && (
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

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const insets = useSafeAreaInsets();

  const loadTotalRecords = useCallback(async () => {
    try {
      const [tasks, habits, events, transactions, assets, liabilities] = await Promise.all([
        getTasks(),
        getHabits(),
        getEvents(),
        getTransactions(),
        getAssets(),
        getLiabilities(),
      ]);

      const total =
        tasks.length +
        habits.length +
        events.length +
        transactions.length +
        assets.length +
        liabilities.length;

      setTotalRecords(total);
    } catch (error) {
      console.error('Failed to load total records:', error);
    }
  }, []);

  // Reload stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTotalRecords();
    }, [loadTotalRecords])
  );

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
          totalRecords: totalRecords,
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
    Alert.alert('Logout?', 'Are you sure you want to logout?', [
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: insets.bottom + spacing['3xl'] },
      ]}
      showsVerticalScrollIndicator={false}
    >
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

      {/* Data & Storage Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DATA & STORAGE</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="💾"
            title="Storage Overview"
            subtitle={`${totalRecords} total records`}
            onPress={() => navigation.navigate('StorageOverview')}
            showChevron
          />
          <View style={styles.divider} />
          <SettingItem
            icon="📤"
            title={exporting ? 'Exporting...' : 'Export Data'}
            subtitle="Copy all data as JSON to clipboard"
            onPress={exporting ? undefined : handleExportData}
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

      {/* Advanced Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ADVANCED</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="⚙️"
            title="Data Management"
            subtitle="Advanced database options"
            onPress={() => navigation.navigate('DataManagement')}
            showChevron
          />
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ABOUT</Text>
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
