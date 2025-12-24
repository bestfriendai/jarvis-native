/**
 * Skeleton Components - Loading placeholders with animations
 * Features: Base skeleton, circle, text with shimmer/pulse animations
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, borderRadius, getColors } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'pulse' | 'shimmer';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: radius = 8,
  style,
  variant = 'shimmer',
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (variant === 'pulse') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 0.6,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      const animation = Animated.loop(
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [pulseAnimation, shimmerAnimation, variant]);

  const shimmerOpacity = shimmerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const shimmerTranslateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  if (variant === 'shimmer') {
    return (
      <View
        style={[
          styles.skeleton,
          {
            width,
            height,
            borderRadius: radius,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        <Animated.View
          style={[
            styles.shimmerContainer,
            {
              transform: [{ translateX: shimmerTranslateX }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.0)',
              'rgba(255, 255, 255, 0.15)',
              'rgba(255, 255, 255, 0.0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius,
          opacity: pulseAnimation,
        },
        style,
      ]}
    />
  );
};

interface SkeletonCircleProps {
  size?: number;
  style?: ViewStyle;
}

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
  size = 48,
  style
}) => {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
};

interface SkeletonTextProps {
  width?: DimensionValue;
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  style?: ViewStyle;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  width = '100%',
  lines = 1,
  lineHeight = 16,
  spacing: lineSpacing = 8,
  style,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (lines === 1) {
    return <Skeleton width={width} height={lineHeight} style={style} />;
  }

  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '80%' : width}
          height={lineHeight}
          style={{ marginBottom: index < lines - 1 ? lineSpacing : 0 }}
        />
      ))}
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  skeleton: {
    backgroundColor: colors.background.tertiary,
  },
  textContainer: {
    width: '100%',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: '-100%',
    right: 0,
    bottom: 0,
    width: '300%',
  },
  shimmerGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
