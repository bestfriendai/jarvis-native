/**
 * Calendar Screen
 * Calendar events with Google Calendar sync
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, IconButton } from 'react-native-paper';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { calendarApi } from '../../services/calendar.api';

export default function CalendarScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'all'>('today');

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar', 'events', viewMode],
    queryFn: () => {
      if (viewMode === 'today') {
        return calendarApi.getEvents(today, today);
      } else if (viewMode === 'week') {
        return calendarApi.getEvents(today, weekLater);
      } else {
        return calendarApi.getEvents();
      }
    },
  });

  const { data: syncSettings = [] } = useQuery({
    queryKey: ['calendar', 'sync'],
    queryFn: calendarApi.getSyncSettings,
  });

  // Get the first Google Calendar sync (if any)
  const googleSync = syncSettings.find(s => s.provider === 'google');

  const triggerSyncMutation = useMutation({
    mutationFn: calendarApi.triggerSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['calendar'] });
    setRefreshing(false);
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
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return 'Today';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading && events.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Calendar
        </Text>
        <IconButton
          icon="sync"
          iconColor="#10B981"
          onPress={() => triggerSyncMutation.mutate()}
          disabled={triggerSyncMutation.isPending}
        />
      </View>

      {googleSync && (
        <Card style={styles.syncCard}>
          <Card.Content>
            <View style={styles.syncInfo}>
              <Text variant="bodySmall" style={styles.syncText}>
                Google Calendar: {googleSync.syncEnabled ? 'Connected' : 'Not Connected'}
              </Text>
              {googleSync.lastSyncAt && (
                <Text variant="bodySmall" style={styles.syncText}>
                  Last sync: {new Date(googleSync.lastSyncAt).toLocaleString()}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>
      )}

      <View style={styles.filterRow}>
        {(['today', 'week', 'all'] as const).map((mode) => (
          <Chip
            key={mode}
            selected={viewMode === mode}
            onPress={() => setViewMode(mode)}
            style={styles.filterChip}
          >
            {mode === 'today' ? 'Today' : mode === 'week' ? 'This Week' : 'All'}
          </Chip>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Button
          mode="contained"
          onPress={() => {
            /* TODO: Open create event modal */
          }}
          style={styles.createButton}
        >
          New Event
        </Button>

        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No events found
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              {viewMode === 'today'
                ? 'No events scheduled for today'
                : viewMode === 'week'
                ? 'No events this week'
                : 'Create your first event'}
            </Text>
          </View>
        ) : (
          events.map((event: any) => (
            <Card key={event.id} style={styles.eventCard}>
              <Card.Content>
                <View style={styles.eventHeader}>
                  <Text variant="titleMedium" style={styles.eventTitle}>
                    {event.title}
                  </Text>
                  <Text variant="bodySmall" style={styles.eventDate}>
                    {formatDate(event.startAt)}
                  </Text>
                </View>

                <View style={styles.eventTime}>
                  <Text variant="bodySmall" style={styles.timeText}>
                    {formatTime(event.startAt)} - {formatTime(event.endAt)}
                  </Text>
                </View>

                {event.description && (
                  <Text variant="bodySmall" style={styles.eventDescription}>
                    {event.description}
                  </Text>
                )}

                {event.location && (
                  <Text variant="bodySmall" style={styles.eventLocation}>
                    📍 {event.location}
                  </Text>
                )}

                {event.isRecurring && (
                  <Chip compact style={styles.recurringChip}>
                    Recurring
                  </Chip>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  syncCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  syncInfo: {
    gap: 4,
  },
  syncText: {
    color: '#94A3B8',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    backgroundColor: '#1E293B',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  createButton: {
    backgroundColor: '#10B981',
    marginBottom: 16,
  },
  eventCard: {
    backgroundColor: '#1E293B',
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    flex: 1,
  },
  eventDate: {
    color: '#10B981',
  },
  eventTime: {
    marginBottom: 8,
  },
  timeText: {
    color: '#94A3B8',
  },
  eventDescription: {
    color: '#94A3B8',
    marginBottom: 8,
  },
  eventLocation: {
    color: '#94A3B8',
    marginBottom: 8,
  },
  recurringChip: {
    backgroundColor: '#334155',
    alignSelf: 'flex-start',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#94A3B8',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#64748B',
  },
});
