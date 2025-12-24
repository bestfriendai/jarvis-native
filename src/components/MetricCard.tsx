/**
 * MetricCard Component
 * Displays a single metric with label, value, and optional helper text
 * Professional, polished design with proper theming
 * Now supports sparklines and percentage change indicators
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { typography, spacing, borderRadius, shadows, getColors } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
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
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
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
  accessible,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

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
        accessible={accessible}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole as any}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[styles.card, compact && styles.cardCompact, style]}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole as any}
    >
      {CardContent}
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,      // More rounded (was lg)
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1.5,                   // Add border
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...shadows.md,                      // Stronger shadow (was sm)
  },
  cardCompact: {
    borderRadius: borderRadius.lg,      // More rounded (was md)
  },
  accentBar: {
    width: 6,                           // THICKER! (was 4)
  },
  content: {
    flex: 1,
    padding: spacing.lg,                // More generous (was base)
  },
  label: {
    fontSize: typography.size.sm,       // BIGGER (was xs)
    fontWeight: typography.weight.bold, // Bolder (was semibold)
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing.md,           // More space (was sm)
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,           // More space (was xs)
  },
  value: {
    fontSize: typography.size['4xl'],   // MUCH BIGGER! (was 2xl)
    fontWeight: typography.weight.bold,
    letterSpacing: typography.letterSpacing.tighter, // Tighter (was tight)
  },
  valueCompact: {
    fontSize: typography.size['3xl'],   // BIGGER (was xl)
  },
  badge: {
    marginLeft: spacing.md,             // More space (was sm)
    padding: spacing.sm,                // More padding (was xs)
    borderRadius: borderRadius.full,
  },
  badgeDot: {
    width: 10,                          // BIGGER (was 8)
    height: 10,                         // BIGGER (was 8)
    borderRadius: 5,
  },
  helper: {
    fontSize: typography.size.base,     // BIGGER (was sm)
    color: colors.text.secondary,       // Brighter (was tertiary)
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
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
