/**
 * MetricCard Component
 * Displays a single metric with label, value, and optional helper text
 * Professional, polished design with proper theming
 * Now supports sparklines and percentage change indicators
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Sparkline, SparklineTrend } from './charts/Sparkline';
import { PercentageChange } from './charts/PercentageChange';

type MetricVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface MetricCardProps {
  label: string;
  value: string | number;
  helper?: string;
  variant?: MetricVariant;
  style?: ViewStyle;
  compact?: boolean;
  trendData?: number[];
  percentageChange?: number;
  onPress?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  helper,
  variant = 'default',
  style,
  compact = false,
  trendData,
  percentageChange,
  onPress,
}) => {
  const getAccentColor = () => {
    switch (variant) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'danger':
        return colors.error;
      case 'info':
        return colors.info;
      default:
        return colors.text.primary;
    }
  };

  const getAccentBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return `${colors.success}15`;
      case 'warning':
        return `${colors.warning}15`;
      case 'danger':
        return `${colors.error}15`;
      case 'info':
        return `${colors.info}15`;
      default:
        return 'transparent';
    }
  };

  const getTrendDirection = (): SparklineTrend => {
    if (percentageChange === undefined) return 'neutral';
    if (percentageChange > 0) return 'positive';
    if (percentageChange < 0) return 'negative';
    return 'neutral';
  };

  const CardContent = (
    <>
      {/* Accent bar */}
      <View
        style={[
          styles.accentBar,
          { backgroundColor: getAccentColor() },
        ]}
      />

      <View style={styles.content}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>

        <View style={styles.valueContainer}>
          <Text
            style={[
              styles.value,
              compact && styles.valueCompact,
              { color: getAccentColor() },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>

          {variant !== 'default' && !percentageChange && (
            <View
              style={[
                styles.badge,
                { backgroundColor: getAccentBackgroundColor() },
              ]}
            >
              <View
                style={[
                  styles.badgeDot,
                  { backgroundColor: getAccentColor() },
                ]}
              />
            </View>
          )}
        </View>

        {/* Sparkline and percentage change */}
        {(trendData || percentageChange !== undefined) && (
          <View style={styles.trendContainer}>
            {trendData && trendData.length > 0 && (
              <Sparkline
                data={trendData}
                width={100}
                height={40}
                trend={getTrendDirection()}
                strokeWidth={2}
                smooth
              />
            )}
            {percentageChange !== undefined && (
              <PercentageChange
                value={percentageChange}
                label="vs last week"
                showIcon
                size="sm"
                variant="inline"
              />
            )}
          </View>
        )}

        {helper && (
          <Text style={styles.helper} numberOfLines={2}>
            {helper}
          </Text>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, compact && styles.cardCompact, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact, style]}>
      {CardContent}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadows.sm,
  },
  cardCompact: {
    borderRadius: borderRadius.md,
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.base,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing.sm,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    letterSpacing: typography.letterSpacing.tight,
  },
  valueCompact: {
    fontSize: typography.size.xl,
  },
  badge: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  helper: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
});

export default MetricCard;
