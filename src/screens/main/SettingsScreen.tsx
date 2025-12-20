/**
 * Settings Screen (Main)
 * Professional settings with navigation to sub-screens
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { Switch } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Clipboard from '../../services/clipboard-wrapper';
import notifee, { AuthorizationStatus } from '../../services/notifee-wrapper';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useTheme } from '../../hooks/useTheme';
import type { SettingsStackParamList } from '../../types';
import {
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';
import * as storage from '../../services/storage';
import { getTasks } from '../../database/tasks';
import { getHabits } from '../../database/habits';
import { getEvents } from '../../database/calendar';
import {
  getTransactions,
  getAssets,
  getLiabilities
} from '../../database/finance';
import { useFocusEffect } from '@react-navigation/native';
import * as notificationService from '../../services/notifications';
import { haptic } from '../../utils/haptics';
import { confirmations, alertSuccess, alertError } from '../../utils/dialogs';

// Import version from package.json
const packageJson = require('../../../package.json');

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
  showChevron?: boolean;
  styles: any;
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore();
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsPermissionStatus, setNotificationsPermissionStatus] = useState<string>('undetermined');
  const [habitNotesPrompt, setHabitNotesPrompt] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const insets = useSafeAreaInsets();

  // Check notification permission and load preferences on mount
  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    try {
      const settings = await notifee.requestPermission();
      const authorized =
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

      setNotificationsEnabled(authorized);
      setNotificationsPermissionStatus(
        authorized ? 'granted' : settings.authorizationStatus === AuthorizationStatus.DENIED ? 'denied' : 'undetermined'
      );

      // Load habit notes prompt preference
      const notesPromptPref = await storage.getItem('habit_notes_prompt_enabled');
      setHabitNotesPrompt(notesPromptPref === 'true');
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      setNotificationsEnabled(false);
      setNotificationsPermissionStatus('denied');
    }
  };

  // Refresh notification status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkNotificationPermissions();
    }, [])
  );

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
        version: packageJson.version,
        appVersion: packageJson.version,
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

      alertSuccess(
        'Success!',
        'All data copied to clipboard!\n\nYou can paste it into a text file to save your backup.'
      );
    } catch (error) {
      console.error('Failed to export data:', error);
      alertError('Error', 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    try {
      if (value) {
        // Request permissions
        const granted = await notificationService.requestPermissions();

        if (granted) {
          setNotificationsEnabled(true);
          setNotificationsPermissionStatus('granted');
          alertSuccess(
            'Notifications Enabled',
            'You will now receive reminders for habits and calendar events.'
          );
        } else {
          setNotificationsEnabled(false);
          const settings = await notifee.requestPermission();
          if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
            setNotificationsPermissionStatus('denied');
            // Permissions permanently denied - direct to settings
            Alert.alert(
              'Permission Denied',
              'Notifications are blocked. Please enable them in your device settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => {
                    if (Platform.OS === 'ios') {
                      Linking.openURL('app-settings:');
                    } else {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (notifee as any).openNotificationSettings();
                    }
                  },
                },
              ]
            );
          }
        }
      } else {
        // User wants to disable notifications
        setNotificationsEnabled(false);
        Alert.alert(
          'Notifications Disabled',
          'You can re-enable notifications anytime from Settings.',
          [
            {
              text: 'Open Settings to Fully Disable',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (notifee as any).openNotificationSettings();
                }
              },
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      alertError('Error', 'Failed to update notification settings. Please try again.');
      setNotificationsEnabled(false);
    }
  };

  const handleHabitNotesPromptToggle = async (value: boolean) => {
    setHabitNotesPrompt(value);
    await storage.setItem('habit_notes_prompt_enabled', value ? 'true' : 'false');
  };

  const handleLogout = () => {
    confirmations.logout(async () => {
      await logout();
    });
  };

  const styles = createStyles(colors);

  const SettingItem: React.FC<SettingItemProps> = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    danger = false,
    showChevron = false,
    styles,
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
            styles={styles}
            icon="👤"
            title={user?.email || 'demo@jarvis.app'}
            subtitle="Email address"
          />
          <View style={styles.divider} />
          <SettingItem
            styles={styles}
            icon="🌐"
            title={user?.timezone || 'America/Chicago'}
            subtitle="Timezone"
          />
          <View style={styles.divider} />
          <SettingItem
            styles={styles}
            icon="💵"
            title={user?.currency || 'USD'}
            subtitle="Currency"
          />
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.sectionContent}>
          <TouchableOpacity
            style={styles.themeOption}
            onPress={() => setThemeMode('dark')}
            activeOpacity={0.7}
          >
            <View style={styles.themeInfo}>
              <Text style={styles.themeIcon}>🌙</Text>
              <View style={styles.themeText}>
                <Text style={styles.themeTitle}>Dark Mode</Text>
                <Text style={styles.themeSubtitle}>Deep blacks with emerald accents</Text>
              </View>
            </View>
            <View style={[
              styles.radioButton,
              themeMode === 'dark' && styles.radioButtonSelected
            ]}>
              {themeMode === 'dark' && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.themeOption}
            onPress={() => setThemeMode('light')}
            activeOpacity={0.7}
          >
            <View style={styles.themeInfo}>
              <Text style={styles.themeIcon}>☀️</Text>
              <View style={styles.themeText}>
                <Text style={styles.themeTitle}>Light Mode</Text>
                <Text style={styles.themeSubtitle}>Clean whites with vibrant colors</Text>
              </View>
            </View>
            <View style={[
              styles.radioButton,
              themeMode === 'light' && styles.radioButtonSelected
            ]}>
              {themeMode === 'light' && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.sectionContent}>
          <SettingItem styles={styles}
            icon="🔔"
            title="Push Notifications"
            subtitle={
              notificationsPermissionStatus === 'denied'
                ? 'Permission denied - Enable in device settings'
                : notificationsEnabled
                ? 'Enabled'
                : 'Disabled'
            }
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
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

      {/* Habits Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>HABITS</Text>
        <View style={styles.sectionContent}>
          <SettingItem styles={styles}
            icon="📝"
            title="Prompt for Notes on Completion"
            subtitle={
              habitNotesPrompt
                ? 'Show notes input when completing habits'
                : 'Complete habits quickly without notes prompt'
            }
            rightElement={
              <Switch
                value={habitNotesPrompt}
                onValueChange={handleHabitNotesPromptToggle}
                trackColor={{
                  false: colors.background.tertiary,
                  true: `${colors.primary.main}80`,
                }}
                thumbColor={habitNotesPrompt ? colors.primary.main : colors.text.disabled}
              />
            }
          />
        </View>
      </View>

      {/* Data & Storage Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DATA & STORAGE</Text>
        <View style={styles.sectionContent}>
          <SettingItem styles={styles}
            icon="💾"
            title="Storage Overview"
            subtitle={`${totalRecords} total records`}
            onPress={() => navigation.navigate('StorageOverview')}
            showChevron
          />
          <View style={styles.divider} />
          <SettingItem styles={styles}
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
          <SettingItem styles={styles}
            icon="💰"
            title="Category Management"
            subtitle="Manage income and expense categories"
            onPress={() => navigation.navigate('CategoryManagement')}
            showChevron
          />
          <SettingItem styles={styles}
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
          <SettingItem styles={styles}
            icon="ℹ️"
            title="Version"
            subtitle={packageJson.version}
          />
          <View style={styles.divider} />
          <SettingItem styles={styles}
            icon="💾"
            title="Storage"
            subtitle="Local SQLite Database"
          />
          <View style={styles.divider} />
          <SettingItem styles={styles}
            icon="📴"
            title="Mode"
            subtitle="Offline-First Architecture"
          />
        </View>
      </View>

      {/* Logout Section */}
      <View style={styles.section}>
        <View style={styles.sectionContent}>
          <SettingItem styles={styles}
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
        <Text style={styles.appBuild}>Build {packageJson.version}</Text>
        <Text style={styles.appCopyright}>
          Last Updated: December 2025
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof import('../../theme').getColors>) => StyleSheet.create({
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
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  themeText: {
    flex: 1,
  },
  themeTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  themeSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary.main,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.main,
  },
});
