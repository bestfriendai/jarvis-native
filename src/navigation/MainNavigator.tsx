/**
 * Main Navigator
 * Professional dark-themed bottom tab navigation
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../types';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../theme';

// Icons (using simple text for now - in production use react-native-vector-icons)
import { IconButton } from 'react-native-paper';

// Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import AIChatScreen from '../screens/main/AIChatScreen';
import TasksScreen from '../screens/main/TasksScreen';
import HabitsScreen from '../screens/main/HabitsScreen';
import CalendarScreen from '../screens/main/CalendarScreen';
import FinanceScreen from '../screens/main/FinanceScreen';
import SettingsNavigator from './SettingsNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab bar icon component
interface TabIconProps {
  icon: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, focused }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
    <IconButton
      icon={icon}
      iconColor={focused ? colors.primary.main : colors.text.tertiary}
      size={22}
      style={styles.iconButton}
    />
    {focused && <View style={styles.focusIndicator} />}
  </View>
);

export default function MainNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.subtle,
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: 60 + Math.max(insets.bottom, 0),
          ...shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: typography.size.xs,
          fontWeight: typography.weight.medium,
          marginTop: -4,
        },
        headerStyle: {
          backgroundColor: colors.background.primary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        },
        headerTitleStyle: {
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
          color: colors.text.primary,
        },
        headerTintColor: colors.text.primary,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="view-dashboard" focused={focused} />
          ),
          tabBarLabel: 'Home',
          headerShown: false, // Dashboard has its own header
        }}
      />

      <Tab.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="robot" focused={focused} />
          ),
          tabBarLabel: 'AI',
          title: 'AI Assistant',
        }}
      />

      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="checkbox-marked-circle-outline" focused={focused} />
          ),
          tabBarLabel: 'Tasks',
          headerShown: false, // Tasks has its own header
        }}
      />

      <Tab.Screen
        name="Habits"
        component={HabitsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="chart-line" focused={focused} />
          ),
          tabBarLabel: 'Habits',
          headerShown: false, // Habits has its own header
        }}
      />

      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="calendar" focused={focused} />
          ),
          tabBarLabel: 'Calendar',
          headerShown: false, // Calendar has its own header
        }}
      />

      <Tab.Screen
        name="Finance"
        component={FinanceScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="wallet" focused={focused} />
          ),
          tabBarLabel: 'Finance',
          headerShown: false, // Finance has its own header
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="cog" focused={focused} />
          ),
          tabBarLabel: 'Settings',
          title: 'Settings',
          headerShown: false, // SettingsNavigator has its own headers
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainerFocused: {
    // Optional: add slight background when focused
  },
  iconButton: {
    margin: 0,
    padding: 0,
  },
  focusIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary.main,
  },
});
