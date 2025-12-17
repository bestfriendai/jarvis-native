/**
 * Calendar Screen
 * Professional calendar events view - Fully offline with SQLite
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as calendarDB from '../../database/calendar';
import { detectConflicts, EventConflict } from '../../database/calendar';
import * as undoService from '../../services/undo';
import { ConflictWarning } from '../../components/calendar/ConflictWarning';
import { ReminderPicker } from '../../components/calendar/ReminderPicker';
import { AppButton, AppChip, EmptyState, LoadingState, LastUpdated, SearchBar } from '../../components/ui';
import { CalendarEventSkeleton } from '../../components/calendar/CalendarEventSkeleton';
import { RecurrencePicker } from '../../components/RecurrencePicker';
import type { RecurrenceRule } from '../../types';
import DayTimelineView from '../../components/calendar/DayTimelineView';
import WeekGridView from '../../components/calendar/WeekGridView';
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import { useDebounce } from '../../hooks/useDebounce';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';

interface CalendarEvent extends calendarDB.CalendarEvent {
  isRecurring?: boolean;
  startAt?: string;
  endAt?: string;
}

export default function CalendarScreen() {
  const [viewMode, setViewMode] = useState<'agenda' | 'day' | 'week'>('agenda');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { updateOptimistically, isPending } = useOptimisticUpdate();
  const [eventConflicts, setEventConflicts] = useState<Map<string, number>>(new Map());

  // Load events from local database
  const loadEvents = useCallback(async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      let loadedEvents: calendarDB.CalendarEvent[] = [];

      // For visual views (day/week), load more events to populate the timeline
      if (viewMode === 'day') {
        const dateStr = selectedDate.toISOString().split('T')[0];
        loadedEvents = await calendarDB.getEventsByDate(dateStr);
      } else if (viewMode === 'week') {
        // Get the whole week of events
        const startOfWeek = new Date(selectedDate);
        const day = startOfWeek.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        startOfWeek.setDate(startOfWeek.getDate() + diff);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        loadedEvents = await calendarDB.getEventsByDateRange(
          startOfWeek.toISOString(),
          endOfWeek.toISOString()
        );
      } else {
        // Agenda view - show upcoming events
        loadedEvents = await calendarDB.getUpcomingEvents(7);
      }

      // Map to include compatible fields
      const mappedEvents = loadedEvents.map((event) => ({
        ...event,
        startAt: event.startTime,
        endAt: event.endTime,
        isRecurring: !!event.recurrence,
      }));

      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, [viewMode, selectedDate]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents, refreshTrigger]);

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

  // Pull-to-refresh with haptics and timestamp
  const { refreshing, handleRefresh, lastUpdated } = useRefreshControl({
    screenName: 'calendar',
    onRefresh: loadEvents,
  });

  const handleDelete = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    try {
      // Optimistically remove from UI
      setEvents(events.filter(e => e.id !== eventId));

      // Delete with undo capability
      await undoService.deleteEvent(
        event,
        // onDeleted callback
        () => {
          console.log('[CalendarScreen] Event deleted successfully');
        },
        // onUndone callback
        async () => {
          console.log('[CalendarScreen] Event undo requested, reloading...');
          await loadEvents();
        }
      );
    } catch (error) {
      console.error('[CalendarScreen] Error deleting event:', error);
      await loadEvents();
      Alert.alert('Error', 'Failed to delete event. Please try again.');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return 'Today';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Apply search filtering
  const filteredEvents = events.filter((event) => {
    if (!debouncedSearchQuery) return true;

    const query = debouncedSearchQuery.toLowerCase();
    const matchesTitle = event.title.toLowerCase().includes(query);
    const matchesDescription = event.description?.toLowerCase().includes(query);
    const matchesLocation = event.location?.toLowerCase().includes(query);

    return matchesTitle || matchesDescription || matchesLocation;
  });

  if (isLoading && events.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Calendar</Text>
          </View>
        </View>
        <ScrollView
          style={styles.content}
          accessible
          accessibilityLabel="Loading calendar events"
          accessibilityRole="progressbar"
        >
          <CalendarEventSkeleton />
          <CalendarEventSkeleton />
          <CalendarEventSkeleton />
          <CalendarEventSkeleton />
          <CalendarEventSkeleton />
          <CalendarEventSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Calendar</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>
              {events.length} event{events.length !== 1 ? 's' : ''}
            </Text>
            {isPending && (
              <View style={styles.savingIndicator}>
                <Text style={styles.savingText}>Saving...</Text>
              </View>
            )}
            <LastUpdated date={lastUpdated} />
          </View>
        </View>
        <AppButton
          title="New Event"
          onPress={() => {
            setSelectedEvent(null);
            setShowCreateModal(true);
          }}
          size="small"
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search events..."
          resultCount={filteredEvents.length}
          showResultCount={searchQuery.length > 0}
        />
      </View>

      {/* View Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {(['agenda', 'day', 'week'] as const).map((mode) => (
          <AppChip
            key={mode}
            label={mode === 'agenda' ? 'Agenda' : mode === 'day' ? 'Day' : 'Week'}
            selected={viewMode === mode}
            onPress={() => setViewMode(mode)}
          />
        ))}
      </ScrollView>

      {/* Content */}
      {viewMode === 'day' ? (
        <View style={styles.content}>
          <DayTimelineView
            events={filteredEvents}
            selectedDate={selectedDate}
            onEventPress={(event) => {
              const fullEvent = filteredEvents.find(e => e.id === event.id);
              if (fullEvent) {
                setSelectedEvent(fullEvent);
                setShowCreateModal(true);
              }
            }}
          />
        </View>
      ) : viewMode === 'week' ? (
        <View style={styles.content}>
          <WeekGridView
            events={filteredEvents}
            selectedDate={selectedDate}
            onEventPress={(event) => {
              const fullEvent = filteredEvents.find(e => e.id === event.id);
              if (fullEvent) {
                setSelectedEvent(fullEvent);
                setShowCreateModal(true);
              }
            }}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary.main]}
              progressBackgroundColor={colors.background.primary}
              tintColor={colors.primary.main}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredEvents.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No events"
              description="No upcoming events scheduled"
              actionLabel="Create Event"
              onAction={() => {
                setSelectedEvent(null);
                setShowCreateModal(true);
              }}
            />
          ) : (
            <View style={styles.eventsList}>
              {filteredEvents.map((event) => {
                const conflictCount = eventConflicts.get(event.id) || 0;
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventCard}
                    activeOpacity={0.9}
                    onPress={() => {
                      setSelectedEvent(event);
                      setShowCreateModal(true);
                    }}
                    onLongPress={() => handleDelete(event.id)}
                  >
                    <View style={styles.eventTimeColumn}>
                      <Text style={styles.eventTimeText}>
                        {formatTime(event.startAt || event.startTime)}
                      </Text>
                      <View style={styles.eventTimeLine} />
                      <Text style={styles.eventTimeText}>
                        {formatTime(event.endAt || event.endTime)}
                      </Text>
                    </View>

                    <View style={styles.eventContent}>
                      <View style={styles.eventHeader}>
                        <View style={styles.eventTitleRow}>
                          <Text style={styles.eventTitle}>{event.title}</Text>
                          {event.recurrence && (
                            <Text style={styles.recurrenceIcon}>♻️</Text>
                          )}
                          {conflictCount > 0 && (
                            <View style={styles.conflictBadge}>
                              <IconButton
                                icon="alert-circle"
                                size={16}
                                iconColor="#EF5350"
                                style={styles.conflictIcon}
                              />
                              <Text style={styles.conflictCount}>{conflictCount}</Text>
                            </View>
                          )}
                        </View>
                        <AppChip
                          label={formatDate(event.startAt || event.startTime)}
                          variant="info"
                          compact
                        />
                      </View>

                      {event.description && (
                        <Text style={styles.eventDescription} numberOfLines={2}>
                          {event.description}
                        </Text>
                      )}

                      {event.location && (
                        <View style={styles.eventLocation}>
                          <Text style={styles.locationIcon}>📍</Text>
                          <Text style={styles.locationText}>{event.location}</Text>
                        </View>
                      )}

                      {conflictCount > 0 && (
                        <View style={styles.conflictWarningBar}>
                          <Text style={styles.conflictWarningText}>
                            {conflictCount} conflict{conflictCount > 1 ? 's' : ''} detected
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Create/Edit Modal */}
      <EventFormModal
        visible={showCreateModal}
        event={selectedEvent}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedEvent(null);
        }}
        onSuccess={() => {
          setRefreshTrigger(prev => prev + 1);
        }}
      />
    </View>
  );
}

// Event Form Modal
interface EventFormModalProps {
  visible: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const EventFormModal: React.FC<EventFormModalProps> = ({
  visible,
  event,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [location, setLocation] = useState(event?.location || '');
  const [startTime, setStartTime] = useState(
    event?.startTime || new Date().toISOString()
  );
  const [endTime, setEndTime] = useState(
    event?.endTime || new Date(Date.now() + 60 * 60 * 1000).toISOString()
  );
  const [recurrence, setRecurrence] = useState<RecurrenceRule | undefined>(event?.recurrence);
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(event?.reminderMinutes ?? null);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [conflicts, setConflicts] = useState<EventConflict[]>([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setTitle(event?.title || '');
      setDescription(event?.description || '');
      setLocation(event?.location || '');
      setStartTime(event?.startTime || new Date().toISOString());
      setEndTime(
        event?.endTime || new Date(Date.now() + 60 * 60 * 1000).toISOString()
      );
      setRecurrence(event?.recurrence);
      setReminderMinutes(event?.reminderMinutes ?? null);
    }
  }, [visible, event]);

  const getRecurrenceSummary = (rule: RecurrenceRule): string => {
    const { frequency, interval } = rule;
    if (interval === 1) {
      return `Repeats ${frequency}`;
    }
    const unit = frequency === 'daily' ? 'days' :
                 frequency === 'weekly' ? 'weeks' :
                 frequency === 'monthly' ? 'months' : 'years';
    return `Repeats every ${interval} ${unit}`;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Check for conflicts before saving (all-day events don't conflict)
      const detectedConflicts = await detectConflicts(
        startTime,
        endTime,
        event?.id, // Pass current event ID if editing
        false // isAllDay parameter - would need to be tracked if implementing all-day events
      );

      if (detectedConflicts.length > 0) {
        setConflicts(detectedConflicts);
        setShowConflictWarning(true);
        setIsSubmitting(false);
        return; // Stop here and show warning
      }

      // No conflicts, proceed with save
      await saveEventToDatabase();
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event');
      setIsSubmitting(false);
    }
  };

  const saveEventToDatabase = async () => {
    const data: calendarDB.CreateEventData = {
      title,
      description: description || undefined,
      startTime,
      endTime,
      location: location || undefined,
      isAllDay: false,
      recurrence,
      reminderMinutes: reminderMinutes ?? undefined,
    };

    if (event) {
      await calendarDB.updateEvent(event.id, data);
    } else {
      await calendarDB.createEvent(data);
    }

    onSuccess?.();
    onClose();
    setIsSubmitting(false);
  };

  const handleProceedDespiteConflict = async () => {
    setShowConflictWarning(false);
    await saveEventToDatabase();
  };

  const handleViewConflict = (eventId: string) => {
    // For now, just close the conflict warning
    // In a full implementation, you could navigate to the conflicting event
    console.log('[CalendarScreen] View conflict event:', eventId);
  };

  const handleDelete = async () => {
    if (!event) return;

    try {
      // Delete with undo capability
      await undoService.deleteEvent(
        event,
        // onDeleted callback
        () => {
          console.log('[CalendarScreen Modal] Event deleted successfully');
          onSuccess?.();
          onClose();
        },
        // onUndone callback
        async () => {
          console.log('[CalendarScreen Modal] Event undo requested');
          onSuccess?.();
        }
      );
    } catch (error) {
      console.error('[CalendarScreen Modal] Error deleting event:', error);
      Alert.alert('Error', 'Failed to delete event. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(insets.bottom, spacing.base) },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {event ? 'Edit Event' : 'New Event'}
              </Text>
              <IconButton
                icon="close"
                onPress={onClose}
                iconColor={colors.text.tertiary}
              />
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Event title..."
                  placeholderTextColor={colors.text.placeholder}
                  style={[styles.input, titleFocused && styles.inputFocused]}
                  onFocus={() => setTitleFocused(true)}
                  onBlur={() => setTitleFocused(false)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Optional description..."
                  placeholderTextColor={colors.text.placeholder}
                  style={[
                    styles.input,
                    styles.textArea,
                    descFocused && styles.inputFocused,
                  ]}
                  multiline
                  numberOfLines={3}
                  onFocus={() => setDescFocused(true)}
                  onBlur={() => setDescFocused(false)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Event location..."
                  placeholderTextColor={colors.text.placeholder}
                  style={[styles.input, locationFocused && styles.inputFocused]}
                  onFocus={() => setLocationFocused(true)}
                  onBlur={() => setLocationFocused(false)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Start Date & Time</Text>
                <View style={styles.dateTimeRow}>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={styles.dateTimeButtonText}>
                      📅 {new Date(startTime).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Text style={styles.dateTimeButtonText}>
                      🕐 {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>End Date & Time</Text>
                <View style={styles.dateTimeRow}>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={styles.dateTimeButtonText}>
                      📅 {new Date(endTime).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Text style={styles.dateTimeButtonText}>
                      🕐 {new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Recurrence</Text>
                <TouchableOpacity
                  style={styles.recurrenceButton}
                  onPress={() => setShowRecurrencePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.recurrenceButtonText}>
                    {recurrence ? getRecurrenceSummary(recurrence) : 'Does not repeat'}
                  </Text>
                  <IconButton
                    icon="chevron-right"
                    size={20}
                    iconColor={colors.text.tertiary}
                  />
                </TouchableOpacity>
              </View>

              <ReminderPicker
                value={reminderMinutes}
                onChange={setReminderMinutes}
              />
            </ScrollView>

            {/* Date/Time Pickers */}
            {showStartDatePicker && (
              <DateTimePicker
                value={new Date(startTime)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartDatePicker(false);
                  if (selectedDate) {
                    const currentTime = new Date(startTime);
                    selectedDate.setHours(currentTime.getHours());
                    selectedDate.setMinutes(currentTime.getMinutes());
                    setStartTime(selectedDate.toISOString());
                  }
                }}
              />
            )}

            {showStartTimePicker && (
              <DateTimePicker
                value={new Date(startTime)}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowStartTimePicker(false);
                  if (selectedTime) {
                    setStartTime(selectedTime.toISOString());
                  }
                }}
              />
            )}

            {showEndDatePicker && (
              <DateTimePicker
                value={new Date(endTime)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndDatePicker(false);
                  if (selectedDate) {
                    const currentTime = new Date(endTime);
                    selectedDate.setHours(currentTime.getHours());
                    selectedDate.setMinutes(currentTime.getMinutes());
                    setEndTime(selectedDate.toISOString());
                  }
                }}
              />
            )}

            {showEndTimePicker && (
              <DateTimePicker
                value={new Date(endTime)}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowEndTimePicker(false);
                  if (selectedTime) {
                    setEndTime(selectedTime.toISOString());
                  }
                }}
              />
            )}

            <View style={styles.modalFooter}>
              {event && (
                <AppButton
                  title="Delete"
                  onPress={handleDelete}
                  variant="outline"
                  style={styles.deleteButton}
                />
              )}
              <AppButton
                title="Cancel"
                onPress={onClose}
                variant="outline"
                style={styles.modalButton}
              />
              <AppButton
                title={event ? 'Update' : 'Create'}
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!title.trim()}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showRecurrencePicker}
        animationType="slide"
        onRequestClose={() => setShowRecurrencePicker(false)}
      >
        <RecurrencePicker
          value={recurrence}
          onChange={setRecurrence}
          onClose={() => setShowRecurrencePicker(false)}
        />
      </Modal>

      {/* Conflict Warning Modal */}
      <Modal
        visible={showConflictWarning}
        presentationStyle="pageSheet"
        animationType="slide"
        onRequestClose={() => setShowConflictWarning(false)}
      >
        <ConflictWarning
          conflicts={conflicts}
          onViewConflict={handleViewConflict}
          onProceed={handleProceedDespiteConflict}
          onCancel={() => setShowConflictWarning(false)}
        />
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  savingIndicator: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  savingText: {
    fontSize: typography.size.xs,
    color: colors.primary.main,
    fontWeight: typography.weight.medium,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  filterContainer: {
    marginBottom: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  eventsList: {
    gap: spacing.md,
  },
  eventCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.sm,
  },
  eventTimeColumn: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.tertiary,
  },
  eventTimeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
  },
  eventTimeLine: {
    width: 1,
    flex: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.xs,
  },
  eventContent: {
    flex: 1,
    padding: spacing.base,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  eventTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  recurrenceIcon: {
    fontSize: typography.size.sm,
  },
  eventDescription: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
    marginBottom: spacing.sm,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  recurringChip: {
    marginTop: spacing.xs,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  modalBody: {
    padding: spacing.base,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: typography.size.base,
  },
  inputFocused: {
    borderColor: colors.primary.main,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.md,
    alignItems: 'center',
  },
  dateTimeButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
  },
  recurrenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
  },
  recurrenceButtonText: {
    fontSize: typography.size.base,
    color: colors.text.primary,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  modalButton: {
    flex: 1,
  },
  deleteButton: {
    borderColor: colors.error,
  },
  conflictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3F3',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  conflictIcon: {
    margin: 0,
    padding: 0,
  },
  conflictCount: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: '#EF5350',
    marginLeft: -4,
  },
  conflictWarningBar: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#FFF3E0',
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  conflictWarningText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: '#F57C00',
  },
});
