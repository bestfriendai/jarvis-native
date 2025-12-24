/**
 * More Screen
 * Organized menu for secondary features and app settings
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../hooks/useTheme';
import { typography, spacing, borderRadius, shadows } from '../../theme';
import type { MoreStackParamList } from '../../navigation/MoreNavigator';

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  subtitle: string;
  screen: keyof MoreStackParamList;
}

interface MenuSection {
  id: string;
  title?: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    id: 'features',
    title: 'Features',
    items: [
      {
        id: 'finance',
        icon: 'wallet',
        label: 'Finance',
        subtitle: 'Budgets & expenses',
        screen: 'Finance',
      },
      {
        id: 'ai',
        icon: 'robot',
        label: 'AI Assistant',
        subtitle: 'Smart productivity help',
        screen: 'AIChat',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    items: [
      {
        id: 'settings',
        icon: 'cog',
        label: 'Preferences',
        subtitle: 'Account, theme & notifications',
        screen: 'Settings',
      },
    ],
  },
];

type NavigationProp = NativeStackNavigationProp<MoreStackParamList, 'MoreMenu'>;

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const handleMenuPress = (screen: keyof MoreStackParamList) => {
    navigation.navigate(screen);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            backgroundColor: colors.background.primary,
            borderBottomColor: colors.border.subtle,
          },
        ]}
      >
        <Text
          style={[styles.headerTitle, { color: colors.text.primary }]}
        >
          More
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {menuSections.map((section) => (
          <View key={section.id} style={styles.section}>
            {section.title && (
              <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
                {section.title.toUpperCase()}
              </Text>
            )}
            {section.items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleMenuPress(item.screen)}
                style={({ pressed }) => [
                  styles.menuItem,
                  {
                    backgroundColor: pressed
                      ? colors.background.tertiary
                      : colors.background.secondary,
                    borderColor: colors.border.subtle,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.primary.main + '20' },
                  ]}
                >
                  <IconButton
                    icon={item.icon}
                    iconColor={colors.primary.main}
                    size={24}
                    style={styles.icon}
                  />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuLabel, { color: colors.text.primary }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>
                    {item.subtitle}
                  </Text>
                </View>
                <IconButton
                  icon="chevron-right"
                  iconColor={colors.text.tertiary}
                  size={24}
                  style={styles.chevron}
                />
              </Pressable>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text.tertiary }]}>
            Jarvis v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    margin: 0,
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  menuSubtitle: {
    fontSize: typography.size.sm,
    marginTop: spacing.xs,
    lineHeight: typography.size.sm * 1.4,
  },
  chevron: {
    margin: 0,
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.size.sm,
  },
});
