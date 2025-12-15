/**
 * Focus Block Card Component
 * Display a focus block with status, timer, and actions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { FocusBlock } from '../../database/focusBlocks';
import { formatDuration, calculateEfficiency } from '../../utils/focusAnalytics';
import { typography, spacing, borderRadius, shadows } from '../../theme';

interface FocusBlockCardProps {
  block: FocusBlock;
  onPress?: () => void;
  onStart?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const FocusBlockCard: React.FC<FocusBlockCardProps> = ({
  block,
  onPress,
  onStart,
  onEdit,
  onDelete,
}) => {
  const { colors } = useTheme();

  const getStatusColor = () => {
    switch (block.status) {
      case 'in_progress':
        return colors.primary.main;
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.text.tertiary;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusIcon = () => {
    switch (block.status) {
      case 'in_progress':
        return 'play-circle';
      case 'completed':
        return 'check-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'clock-outline';
    }
  };

  const getStatusLabel = () => {
    switch (block.status) {
      case 'scheduled':
        return 'Scheduled';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const efficiency = block.status === 'completed' ? calculateEfficiency(block) : null;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.subtle,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon={getStatusIcon()}
            iconColor={getStatusColor()}
            size={20}
            style={styles.statusIcon}
          />
          <View style={styles.titleContainer}>
            <Text
              style={[styles.title, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {block.title}
            </Text>
            <Text style={[styles.status, { color: getStatusColor() }]}>
              {getStatusLabel()}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {block.status === 'scheduled' && onStart && (
            <IconButton
              icon="play"
              iconColor={colors.primary.main}
              size={20}
              onPress={onStart}
            />
          )}
          {block.status === 'scheduled' && onEdit && (
            <IconButton
              icon="pencil"
              iconColor={colors.text.tertiary}
              size={20}
              onPress={onEdit}
            />
          )}
          {onDelete && (
            <IconButton
              icon="delete"
              iconColor={colors.error}
              size={20}
              onPress={onDelete}
            />
          )}
        </View>
      </View>

      {/* Description */}
      {block.description && (
        <Text
          style={[styles.description, { color: colors.text.secondary }]}
          numberOfLines={2}
        >
          {block.description}
        </Text>
      )}

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <IconButton icon="timer" size={16} iconColor={colors.text.tertiary} style={styles.detailIcon} />
          <Text style={[styles.detailText, { color: colors.text.secondary }]}>
            {formatDuration(block.durationMinutes)}
            {block.actualMinutes && block.status === 'completed' && (
              <Text style={{ color: colors.text.tertiary }}>
                {' '}
                (actual: {formatDuration(block.actualMinutes)})
              </Text>
            )}
          </Text>
        </View>

        {block.startTime && (
          <View style={styles.detailRow}>
            <IconButton icon="clock-outline" size={16} iconColor={colors.text.tertiary} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: colors.text.secondary }]}>
              {formatTime(block.startTime)}
              {block.endTime && ` - ${formatTime(block.endTime)}`}
            </Text>
          </View>
        )}

        {block.task && (
          <View style={styles.detailRow}>
            <IconButton icon="checkbox-marked-circle-outline" size={16} iconColor={colors.text.tertiary} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: colors.text.secondary }]} numberOfLines={1}>
              {block.task.title}
            </Text>
          </View>
        )}

        {block.phoneInMode && (
          <View style={styles.detailRow}>
            <IconButton icon="cellphone-off" size={16} iconColor={colors.warning} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: colors.warning }]}>
              Phone-in mode
            </Text>
          </View>
        )}
      </View>

      {/* Efficiency badge */}
      {efficiency !== null && (
        <View
          style={[
            styles.efficiencyBadge,
            {
              backgroundColor:
                efficiency >= 90 && efficiency <= 110
                  ? colors.success
                  : efficiency > 110
                  ? colors.warning
                  : colors.info,
            },
          ]}
        >
          <Text style={[styles.efficiencyText, { color: colors.text.inverse }]}>
            {efficiency}% efficient
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    margin: 0,
    marginRight: spacing.xs,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: 2,
  },
  status: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  description: {
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
    marginBottom: spacing.sm,
  },
  details: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    margin: 0,
    marginRight: spacing.xs,
  },
  detailText: {
    fontSize: typography.size.sm,
    flex: 1,
  },
  efficiencyBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  efficiencyText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
});
