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
import * as calendarDB from '../../database/calendar';
import { AppButton, AppChip, EmptyState, LoadingState } from '../../components/ui';
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
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'all'>('today');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load events from local database
  const loadEvents = useCallback(async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      let loadedEvents: calendarDB.CalendarEvent[] = [];

      if (viewMode === 'today') {
        loadedEvents = await calendarDB.getEventsByDate(today);
      } else if (viewMode === 'week') {
        loadedEvents = await calendarDB.getUpcomingEvents(7);
      } else {
        loadedEvents = await calendarDB.getEvents();
      }

      // Map to include compatible fields
      const mappedEvents = loadedEvents.map((event) => ({
        ...event,
        startAt: event.startTime,
        endAt: event.endTime,
        isRecurring: !!event.recurring,
      }));

      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents, refreshTrigger]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleDelete = (eventId: string) => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await calendarDB.deleteEvent(eventId);
            await loadEvents();
          } catch (error) {
            console.error('Error deleting event:', error);
            Alert.alert('Error', 'Failed to delete event');
          }
        },
      },
    ]);
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

  if (isLoading && events.length === 0) {
    return <LoadingState fullScreen message="Loading calendar..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>
            {events.length} event{events.length !== 1 ? 's' : ''}
          </Text>
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

      {/* View Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {(['today', 'week', 'all'] as const).map((mode) => (
          <AppChip
            key={mode}
            label={mode === 'today' ? 'Today' : mode === 'week' ? 'This Week' : 'All'}
            selected={viewMode === mode}
            onPress={() => setViewMode(mode)}
          />
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {events.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No events"
            description={
              viewMode === 'today'
                ? 'Your schedule is clear for today'
                : viewMode === 'week'
                ? 'No events scheduled this week'
                : 'Create events to keep track of your schedule'
            }
            actionLabel="Create Event"
            onAction={() => {
              setSelectedEvent(null);
              setShowCreateModal(true);
            }}
          />
        ) : (
          <View style={styles.eventsList}>
            {events.map((event) => (
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
                    <Text style={styles.eventTitle}>{event.title}</Text>
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

                  {event.isRecurring && (
                    <AppChip label="Recurring" compact style={styles.recurringChip} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

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
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setTitle(event?.title || '');
      setDescription(event?.description || '');
      setLocation(event?.location || '');
      setStartTime(event?.startTime || new Date().toISOString());
      setEndTime(
        event?.endTime || new Date(Date.now() + 60 * 60 * 1000).toISOString()
      );
    }
  }, [visible, event]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data: calendarDB.CreateEventData = {
        title,
        description: description || undefined,
        startTime,
        endTime,
        location: location || undefined,
        isAllDay: false,
      };

      if (event) {
        await calendarDB.updateEvent(event.id, data);
      } else {
        await calendarDB.createEvent(data);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await calendarDB.deleteEvent(event.id);
            onSuccess?.();
            onClose();
          } catch (error) {
            console.error('Error deleting event:', error);
            Alert.alert('Error', 'Failed to delete event');
          }
        },
      },
    ]);
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
                <Text style={styles.label}>Start Time</Text>
                <Text style={styles.timeDisplay}>
                  {new Date(startTime).toLocaleString()}
                </Text>
                <Text style={styles.hint}>
                  Tap to change (Date/time picker coming soon)
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>End Time</Text>
                <Text style={styles.timeDisplay}>
                  {new Date(endTime).toLocaleString()}
                </Text>
                <Text style={styles.hint}>
                  Tap to change (Date/time picker coming soon)
                </Text>
              </View>
            </ScrollView>

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
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
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
  eventTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
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
  timeDisplay: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: typography.size.base,
  },
  hint: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
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
});
