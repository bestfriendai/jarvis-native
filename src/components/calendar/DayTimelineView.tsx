/**
 * Day Timeline View Component
 * Displays events in a hourly timeline format
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isAllDay: boolean;
}

interface DayTimelineViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onEventPress: (event: CalendarEvent) => void;
}

const HOUR_HEIGHT = 60; // Height per hour slot
const START_HOUR = 6; // Start at 6 AM
const END_HOUR = 23; // End at 11 PM
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

export default function DayTimelineView({
  events,
  selectedDate,
  onEventPress,
}: DayTimelineViewProps) {
  // Get current time for indicator
  const currentTime = useMemo(() => new Date(), []);
  const isToday = useMemo(() => {
    return selectedDate.toDateString() === currentTime.toDateString();
  }, [selectedDate, currentTime]);

  // Calculate position for current time indicator
  const currentTimePosition = useMemo(() => {
    if (!isToday) return null;
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    if (hours < START_HOUR || hours > END_HOUR) return null;

    const totalMinutes = (hours - START_HOUR) * 60 + minutes;
    return (totalMinutes / 60) * HOUR_HEIGHT;
  }, [isToday, currentTime]);

  // Filter events for selected date and calculate positions
  const positionedEvents = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];

    return events
      .filter(event => {
        const eventDate = new Date(event.startTime).toISOString().split('T')[0];
        return eventDate === dateStr;
      })
      .map(event => {
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);

        const startHours = startDate.getHours();
        const startMinutes = startDate.getMinutes();
        const endHours = endDate.getHours();
        const endMinutes = endDate.getMinutes();

        // Calculate top position (in minutes from START_HOUR)
        const startTotalMinutes = (startHours - START_HOUR) * 60 + startMinutes;
        const endTotalMinutes = (endHours - START_HOUR) * 60 + endMinutes;

        // Calculate duration in minutes
        const durationMinutes = endTotalMinutes - startTotalMinutes;

        // Calculate pixel positions
        const top = (startTotalMinutes / 60) * HOUR_HEIGHT;
        const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 30); // Min height 30px

        return {
          ...event,
          top,
          height,
          startHours,
          startMinutes,
          endHours,
          endMinutes,
        };
      })
      .sort((a, b) => a.top - b.top);
  }, [events, selectedDate]);

  const formatTime = (hours: number, minutes: number) => {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.timelineContainer}>
          {/* Hour labels and grid lines */}
          {HOURS.map(hour => (
            <View key={hour} style={[styles.hourRow, { height: HOUR_HEIGHT }]}>
              <View style={styles.timeLabel}>
                <Text style={styles.timeLabelText}>{formatHour(hour)}</Text>
              </View>
              <View style={styles.hourLine} />
            </View>
          ))}

          {/* Current time indicator */}
          {currentTimePosition !== null && (
            <View
              style={[
                styles.currentTimeIndicator,
                { top: currentTimePosition },
              ]}
            >
              <View style={styles.currentTimeDot} />
              <View style={styles.currentTimeLine} />
            </View>
          )}

          {/* Event blocks */}
          <View style={styles.eventsContainer}>
            {positionedEvents.map(event => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.eventBlock,
                  {
                    top: event.top,
                    height: event.height,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => onEventPress(event)}
              >
                <Text style={styles.eventTime}>
                  {formatTime(event.startHours, event.startMinutes)} -{' '}
                  {formatTime(event.endHours, event.endMinutes)}
                </Text>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {event.title}
                </Text>
                {event.location && (
                  <Text style={styles.eventLocation} numberOfLines={1}>
                    📍 {event.location}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 60,
    paddingRight: spacing.base,
  },
  hourRow: {
    position: 'relative',
    width: '100%',
  },
  timeLabel: {
    position: 'absolute',
    left: -60,
    top: -8,
    width: 50,
    alignItems: 'flex-end',
    paddingRight: spacing.sm,
  },
  timeLabelText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
  },
  hourLine: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: spacing.sm,
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    marginLeft: 55,
    marginRight: spacing.xs,
  },
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.error,
    marginRight: spacing.base,
  },
  eventsContainer: {
    position: 'absolute',
    top: 0,
    left: 60 + spacing.md,
    right: spacing.base,
    bottom: 0,
  },
  eventBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...shadows.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.dark,
  },
  eventTime: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.primary.contrast,
    marginBottom: spacing.xs,
    opacity: 0.9,
  },
  eventTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary.contrast,
    marginBottom: spacing.xs,
  },
  eventLocation: {
    fontSize: typography.size.xs,
    color: colors.primary.contrast,
    opacity: 0.9,
  },
});
