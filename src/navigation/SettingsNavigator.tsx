/**
 * Settings Navigator
 * Stack navigation for settings and sub-screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../types';
import SettingsScreen from '../screens/main/SettingsScreen';
import StorageOverviewScreen from '../screens/settings/StorageOverviewScreen';
import DataManagementScreen from '../screens/settings/DataManagementScreen';
import { colors, typography } from '../theme';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.secondary,
        },
        headerTintColor: colors.primary.main,
        headerTitleStyle: {
          fontWeight: typography.weight.bold,
          fontSize: typography.size.lg,
          color: colors.text.primary,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background.primary,
        },
      }}
    >
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StorageOverview"
        component={StorageOverviewScreen}
        options={{
          title: 'Storage Overview',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="DataManagement"
        component={DataManagementScreen}
        options={{
          title: 'Data Management',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}
