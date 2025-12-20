/**
 * Jarvis Mobile - Main App Entry Point
 * Offline-first React Native personal assistant
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainerRef } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import RootNavigator from './src/navigation/RootNavigator';
import { initDatabase } from './src/database';
import { needsSeeding, seedDatabase } from './src/database/seed';
import { useThemeStore } from './src/store/themeStore';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { getColors, spacing, typography } from './src/theme';
import * as notificationService from './src/services/notifications';
import { toastConfig } from './src/components/ui/UndoToast';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    },
  },
});

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const loadTheme = useThemeStore((state) => state.loadTheme);
  const themeMode = useThemeStore((state) => state.mode);
  const navigationRef = useRef<NavigationContainerRef<any> | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('[App] Initializing...');

        // Load theme preference
        await loadTheme();
        console.log('[App] Theme loaded');

        // Initialize database
        await initDatabase();
        console.log('[App] Database initialized');

        // NOTE: Sample data seeding is DISABLED for production use
        // Users start with a clean, empty database
        // To enable demo data, uncomment the lines below:
        //
        // const shouldSeed = await needsSeeding();
        // if (shouldSeed) {
        //   console.log('[App] Seeding database with sample data...');
        //   await seedDatabase();
        //   console.log('[App] Database seeded successfully');
        // }

        setIsReady(true);
      } catch (error) {
        console.error('[App] Failed to initialize:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize app');
        setIsReady(true); // Still show app, but with error state
      }
    }

    prepare();
  }, [loadTheme]);

  // Set up notification tap handler
  useEffect(() => {
    const unsubscribe = notificationService.addNotificationResponseListener((data) => {
      console.log('[App] Notification tapped:', data);

      // Handle habit reminders
      if (data.type === 'habit' && navigationRef.current) {
        // Navigate to Habits tab
        navigationRef.current.navigate('Main', {
          screen: 'Habits',
        });
      }

      // Handle event reminders
      if (data.type === 'event' && navigationRef.current) {
        // Navigate to Calendar tab
        navigationRef.current.navigate('Main', {
          screen: 'Calendar',
        });
      }
    });

    return unsubscribe;
  }, []);

  if (!isReady) {
    const colors = getColors(themeMode);
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Initializing Jarvis...</Text>
      </View>
    );
  }

  if (initError) {
    const colors = getColors(themeMode);
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Initialization Error</Text>
        <Text style={[styles.errorMessage, { color: colors.text.secondary }]}>{initError}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <PaperProvider>
              <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
              <RootNavigator navigationRef={navigationRef} />
              <Toast config={toastConfig} />
          </PaperProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.base,
    fontSize: typography.size.base,
  },
  errorText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    paddingHorizontal: spacing['2xl'],
  },
});
