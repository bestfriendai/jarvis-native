/**
 * LoadingState - Professional loading indicator
 * Features: spinner, skeleton, text
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { typography, spacing, getColors } from '../../theme';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  size = 'large',
  style,
  fullScreen = false,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <ActivityIndicator size={size} color={colors.primary.main} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

// Skeleton component for loading placeholders
interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
      ]}
    />
  );
};

// Card skeleton for loading card placeholders
interface CardSkeletonProps {
  style?: ViewStyle;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ style }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.cardSkeleton, style]}>
      <View style={styles.cardSkeletonHeader}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.cardSkeletonText}>
          <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <Skeleton width="100%" height={14} style={{ marginTop: 16 }} />
      <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  message: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  skeleton: {
    backgroundColor: colors.background.tertiary,
    opacity: 0.5,
  },
  cardSkeleton: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  cardSkeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSkeletonText: {
    flex: 1,
    marginLeft: spacing.md,
  },
});

export { LoadingState as default };
