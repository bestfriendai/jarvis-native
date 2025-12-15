/**
 * Week Grid View Component
 * Displays events in a 7-day grid format
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { detectConflicts } from '../../database/calendar';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isAllDay: boolean;
}

interface WeekGridViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onEventPress: (event: CalendarEvent) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_WIDTH = Math.max((SCREEN_WIDTH - spacing.lg * 2) / 7, 45);

export default function WeekGridView({
  events,
  selectedDate,
  onEventPress,
}: WeekGridViewProps) {
  const [eventConflicts, setEventConflicts] = useState<Map<string, number>>(new Map());

  // Check for conflicts after events are loaded
  useEffect(() => {
    const checkAllConflicts = async () => {
      const conflictMap = new Map<string, number>();

      for (const event of events) {
        // Skip all-day events
        if (event.isAllDay) continue;

        try {
          const conflicts = await detectConflicts(
            event.startTime,
            event.endTime,
            event.id,
            event.isAllDay
          );
          conflictMap.set(event.id, conflicts.length);
        } catch (error) {
          console.error(`Error checking conflicts for event ${event.id}:`, error);
        }
      }

      setEventConflicts(conflictMap);
    };

    if (events.length > 0) {
      checkAllConflicts();
    }
  }, [events]);

  // Get the week dates (Monday to Sunday)
  const weekDates = useMemo(() => {
    const dates = [];
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday
    startOfWeek.setDate(startOfWeek.getDate() + diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }

    return dates;
  }, [selectedDate]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped: { [key: string]: CalendarEvent[] } = {};

    weekDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      grouped[dateStr] = [];
    });

    events.forEach(event => {
      const eventDate = new Date(event.startTime).toISOString().split('T')[0];
      if (grouped[eventDate]) {
        grouped[eventDate].push(event);
      }
    });

    // Sort events by start time within each day
    Object.keys(grouped).forEach(dateStr => {
      grouped[dateStr].sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return grouped;
  }, [events, weekDates]);

  const formatDayHeader = (date: Date) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayIndex = date.getDay();
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return days[adjustedIndex];
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.horizontalContent}
      >
        <View style={styles.gridContainer}>
          {/* Day headers */}
          <View style={styles.headerRow}>
            {weekDates.map(date => {
              const today = isToday(date);
              return (
                <View
                  key={date.toISOString()}
                  style={[styles.dayHeader, { width: DAY_WIDTH }]}
                >
                  <Text style={styles.dayName}>{formatDayHeader(date)}</Text>
                  <View
                    style={[
                      styles.dayNumber,
                      today && styles.todayNumber,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        today && styles.todayNumberText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Day columns with events */}
          <ScrollView
            style={styles.verticalScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.verticalContent}
          >
            <View style={styles.daysRow}>
              {weekDates.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const dayEvents = eventsByDay[dateStr] || [];
                const today = isToday(date);

                return (
                  <View
                    key={date.toISOString()}
                    style={[
                      styles.dayColumn,
                      { width: DAY_WIDTH },
                      today && styles.todayColumn,
                    ]}
                  >
                    {dayEvents.length === 0 ? (
                      <View style={styles.emptyDay}>
                        <Text style={styles.emptyDayText}>-</Text>
                      </View>
                    ) : (
                      dayEvents.map((event, index) => {
                        const conflictCount = eventConflicts.get(event.id) || 0;
                        return (
                          <TouchableOpacity
                            key={event.id}
                            style={[
                              styles.eventCard,
                              index > 0 && styles.eventCardSpacing,
                              conflictCount > 0 && styles.eventCardWithConflict,
                            ]}
                            activeOpacity={0.8}
                            onPress={() => onEventPress(event)}
                          >
                            <View style={styles.eventCardHeader}>
                              <Text style={styles.eventTime}>
                                {formatTime(event.startTime)}
                              </Text>
                              {conflictCount > 0 && (
                                <View style={styles.conflictBadge}>
                                  <Icon name="alert-circle" size={10} color="#EF5350" />
                                </View>
                              )}
                            </View>
                            <Text style={styles.eventTitle} numberOfLines={2}>
                              {event.title}
                            </Text>
                            {event.location && (
                              <Text style={styles.eventLocation} numberOfLines={1}>
                                📍
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
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
  horizontalScroll: {
    flex: 1,
  },
  horizontalContent: {
    paddingHorizontal: spacing.lg,
  },
  gridContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  dayHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  dayName: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayNumber: {
    backgroundColor: colors.primary.main,
  },
  dayNumberText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  todayNumberText: {
    color: colors.primary.contrast,
  },
  verticalScroll: {
    flex: 1,
  },
  verticalContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dayColumn: {
    paddingHorizontal: spacing.xs,
    minHeight: 100,
  },
  todayColumn: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
  },
  emptyDay: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  emptyDayText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    opacity: 0.5,
  },
  eventCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    ...shadows.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },
  eventCardWithConflict: {
    borderLeftColor: '#EF5350',
    borderRightWidth: 2,
    borderRightColor: '#EF5350',
  },
  eventCardSpacing: {
    marginTop: spacing.sm,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  eventTime: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
    flex: 1,
  },
  eventTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    lineHeight: typography.size.xs * 1.4,
  },
  eventLocation: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  conflictBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFF3F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
