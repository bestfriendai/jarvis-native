/**
 * ChartCard Component
 * Wrapper for charts with title, actions, and consistent styling
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { IconButton } from 'react-native-paper';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { HIT_SLOP } from '../../constants/ui';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onAction?: () => void;
  actionIcon?: string;
  actionLabel?: string;
  style?: ViewStyle;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  onAction,
  actionIcon = 'chevron-right',
  actionLabel,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {onAction && (
          <TouchableOpacity onPress={onAction} style={styles.action}>
            {actionLabel && <Text style={styles.actionLabel}>{actionLabel}</Text>}
            <IconButton
              icon={actionIcon}
              size={20}
              iconColor={colors.primary.main}
              style={styles.actionIcon}
            
                hitSlop={HIT_SLOP}/>
          </TouchableOpacity>
        )}
      </View>

      {/* Chart Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: typography.size.sm,
    color: colors.primary.main,
    fontWeight: typography.weight.medium,
    marginRight: -spacing.xs,
  },
  actionIcon: {
    margin: 0,
  },
  content: {
    alignItems: 'center',
  },
});

export default ChartCard;
