/**
 * LastUpdated Component
 * Displays relative timestamp for last data refresh
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { typography, spacing, getColors } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';
import { getRelativeTime } from '../../utils/dateUtils';

interface LastUpdatedProps {
  date: Date | null;
  style?: any;
}

/**
 * Display last updated timestamp with auto-refresh
 */
export function LastUpdated({ date, style }: LastUpdatedProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [relativeTime, setRelativeTime] = useState<string>('');

  // Update relative time display
  useEffect(() => {
    if (!date) {
      setRelativeTime('');
      return;
    }

    // Initial update
    setRelativeTime(getRelativeTime(date));

    // Update every minute to keep "X minutes ago" accurate
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(date));
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [date]);

  if (!date || !relativeTime) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Icon name="update" size={14} color={colors.text.tertiary} />
      <Text style={styles.text}>Last updated: {relativeTime}</Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  text: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    fontWeight: typography.weight.regular,
  },
});
