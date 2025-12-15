/**
 * Calendar Database Operations
 * CRUD operations for calendar events with offline-first support
 */

import {
  generateId,
  getCurrentTimestamp,
  executeQuery,
  executeQuerySingle,
  executeWrite,
} from './index';
import type { RecurrenceRule } from '../types';
import * as notificationService from '../services/notifications';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  isAllDay: boolean;
  recurrence?: RecurrenceRule;
  reminderMinutes?: number | null;
  notificationId?: string | null;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

interface CalendarEventRow {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string;
  is_all_day: number;
  recurring?: string;
  reminder_minutes?: number;
  notification_id?: string;
  created_at: string;
  updated_at: string;
  synced: number;
}

export interface CreateEventData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
  recurrence?: RecurrenceRule;
  reminderMinutes?: number | null;
}

export interface UpdateEventData extends Partial<CreateEventData> {}

/**
 * Represents an event conflict with overlap information
 */
export interface EventConflict {
  event: CalendarEvent;
  overlapMinutes: number;
  overlapStart: string;  // ISO timestamp
  overlapEnd: string;    // ISO timestamp
}

/**
 * Convert database row to CalendarEvent object
 */
function rowToEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    attendees: row.attendees ? JSON.parse(row.attendees) : [],
    isAllDay: row.is_all_day === 1,
    recurrence: row.recurring ? JSON.parse(row.recurring) : undefined,
    reminderMinutes: row.reminder_minutes ?? null,
    notificationId: row.notification_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    synced: row.synced === 1,
  };
}

/**
 * Get all events
 */
export async function getEvents(): Promise<CalendarEvent[]> {
  const sql = 'SELECT * FROM calendar_events ORDER BY start_time ASC';
  const rows = await executeQuery<CalendarEventRow>(sql);
  return rows.map(rowToEvent);
}

/**
 * Get events for a date range
 */
export async function getEventsByDateRange(
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  const sql = `
    SELECT * FROM calendar_events
    WHERE start_time >= ? AND start_time <= ?
    ORDER BY start_time ASC
  `;
  const rows = await executeQuery<CalendarEventRow>(sql, [startDate, endDate]);
  return rows.map(rowToEvent);
}

/**
 * Get events for a specific date
 */
export async function getEventsByDate(date: string): Promise<CalendarEvent[]> {
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;
  return getEventsByDateRange(startOfDay, endOfDay);
}

/**
 * Get upcoming events (next N days)
 */
export async function getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
  const now = new Date().toISOString();
  const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const sql = `
    SELECT * FROM calendar_events
    WHERE start_time >= ? AND start_time <= ?
    ORDER BY start_time ASC
    LIMIT 20
  `;

  const rows = await executeQuery<CalendarEventRow>(sql, [now, endDate]);
  return rows.map(rowToEvent);
}

/**
 * Get a single event by ID
 */
export async function getEvent(id: string): Promise<CalendarEvent | null> {
  const sql = 'SELECT * FROM calendar_events WHERE id = ?';
  const row = await executeQuerySingle<CalendarEventRow>(sql, [id]);
  return row ? rowToEvent(row) : null;
}

/**
 * Create a new event
 */
export async function createEvent(data: CreateEventData): Promise<CalendarEvent> {
  const id = generateId();
  const now = getCurrentTimestamp();

  // Schedule notification if reminder is set
  let notificationId: string | null = null;

  if (data.reminderMinutes && data.startTime) {
    try {
      const eventStart = new Date(data.startTime);
      const reminderTime = new Date(
        eventStart.getTime() - (data.reminderMinutes * 60 * 1000)
      );

      if (reminderTime > new Date()) {
        notificationId = await notificationService.scheduleEventNotification({
          title: 'Event Reminder',
          body: `${data.title} starts in ${notificationService.formatReminderTime(data.reminderMinutes)}`,
          data: {
            eventId: id,
            type: 'event_reminder',
            eventTitle: data.title,
          },
          triggerDate: reminderTime,
        });
      }
    } catch (error) {
      console.error('[Calendar] Failed to schedule notification:', error);
      // Continue creating event even if notification fails
    }
  }

  const sql = `
    INSERT INTO calendar_events (
      id, title, description, start_time, end_time, location,
      attendees, is_all_day, recurring, reminder_minutes, notification_id,
      created_at, updated_at, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `;

  const params = [
    id,
    data.title,
    data.description || null,
    data.startTime,
    data.endTime,
    data.location || null,
    JSON.stringify(data.attendees || []),
    data.isAllDay ? 1 : 0,
    data.recurrence ? JSON.stringify(data.recurrence) : null,
    data.reminderMinutes ?? null,
    notificationId,
    now,
    now,
  ];

  await executeWrite(sql, params);

  const event = await getEvent(id);
  if (!event) {
    throw new Error('Failed to create event');
  }

  return event;
}

/**
 * Update an event
 */
export async function updateEvent(id: string, data: UpdateEventData): Promise<CalendarEvent> {
  const now = getCurrentTimestamp();

  // Get existing event for notification handling
  const existingEvent = await getEvent(id);
  if (!existingEvent) {
    throw new Error('Event not found');
  }

  // Cancel existing notification if present
  if (existingEvent.notificationId) {
    try {
      await notificationService.cancelNotification(existingEvent.notificationId);
    } catch (error) {
      console.error('[Calendar] Failed to cancel notification:', error);
    }
  }

  // Schedule new notification if reminder is set
  let notificationId: string | null = null;
  const startTime = data.startTime || existingEvent.startTime;
  const reminderMinutes = data.reminderMinutes !== undefined
    ? data.reminderMinutes
    : existingEvent.reminderMinutes;

  if (reminderMinutes && startTime) {
    try {
      const eventStart = new Date(startTime);
      const reminderTime = new Date(
        eventStart.getTime() - (reminderMinutes * 60 * 1000)
      );

      if (reminderTime > new Date()) {
        const title = data.title || existingEvent.title;
        notificationId = await notificationService.scheduleEventNotification({
          title: 'Event Reminder',
          body: `${title} starts in ${notificationService.formatReminderTime(reminderMinutes)}`,
          data: {
            eventId: id,
            type: 'event_reminder',
            eventTitle: title,
          },
          triggerDate: reminderTime,
        });
      }
    } catch (error) {
      console.error('[Calendar] Failed to schedule notification:', error);
    }
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    params.push(data.title);
  }

  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description || null);
  }

  if (data.startTime !== undefined) {
    updates.push('start_time = ?');
    params.push(data.startTime);
  }

  if (data.endTime !== undefined) {
    updates.push('end_time = ?');
    params.push(data.endTime);
  }

  if (data.location !== undefined) {
    updates.push('location = ?');
    params.push(data.location || null);
  }

  if (data.attendees !== undefined) {
    updates.push('attendees = ?');
    params.push(JSON.stringify(data.attendees));
  }

  if (data.isAllDay !== undefined) {
    updates.push('is_all_day = ?');
    params.push(data.isAllDay ? 1 : 0);
  }

  if (data.recurrence !== undefined) {
    updates.push('recurring = ?');
    params.push(data.recurrence ? JSON.stringify(data.recurrence) : null);
  }

  if (data.reminderMinutes !== undefined) {
    updates.push('reminder_minutes = ?');
    params.push(data.reminderMinutes);
  }

  // Update notification ID regardless of whether a new one was scheduled
  updates.push('notification_id = ?');
  params.push(notificationId);

  updates.push('updated_at = ?');
  params.push(now);

  updates.push('synced = 0');

  params.push(id);

  const sql = `UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ?`;
  await executeWrite(sql, params);

  const event = await getEvent(id);
  if (!event) {
    throw new Error('Event not found after update');
  }

  return event;
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string): Promise<void> {
  // Get event to cancel notification if present
  const event = await getEvent(id);

  if (event?.notificationId) {
    try {
      await notificationService.cancelNotification(event.notificationId);
    } catch (error) {
      console.error('[Calendar] Failed to cancel notification:', error);
    }
  }

  const sql = 'DELETE FROM calendar_events WHERE id = ?';
  await executeWrite(sql, [id]);
}

/**
 * Get events count for today
 */
export async function getTodayEventsCount(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const events = await getEventsByDate(today);
  return events.length;
}

/**
 * Search events by title
 */
export async function searchEvents(query: string): Promise<CalendarEvent[]> {
  const sql = `
    SELECT * FROM calendar_events
    WHERE title LIKE ? OR description LIKE ?
    ORDER BY start_time DESC
    LIMIT 20
  `;
  const searchParam = `%${query}%`;
  const rows = await executeQuery<CalendarEventRow>(sql, [searchParam, searchParam]);
  return rows.map(rowToEvent);
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Detect calendar event conflicts for a given time range
 * @param startTime - Event start time (ISO string)
 * @param endTime - Event end time (ISO string)
 * @param excludeEventId - Optional event ID to exclude (for editing)
 * @param isAllDay - Whether the event being checked is all-day (defaults to false)
 * @returns Array of conflicting events with overlap details
 */
export async function detectConflicts(
  startTime: string,
  endTime: string,
  excludeEventId?: string,
  isAllDay: boolean = false
): Promise<EventConflict[]> {
  // All-day events don't conflict with anything
  if (isAllDay) {
    return [];
  }

  // Query for overlapping events
  // Events overlap if:
  // 1. Event wraps our timeframe (starts before, ends after)
  // 2. Event starts during our timeframe
  // 3. Event ends during our timeframe
  // Note: Only timed events (is_all_day = 0) can conflict

  const query = `
    SELECT * FROM calendar_events
    WHERE id != ?
    AND is_all_day = 0
    AND (
      (start_time < ? AND end_time > ?) OR
      (start_time >= ? AND start_time < ?) OR
      (end_time > ? AND end_time <= ?)
    )
    ORDER BY start_time ASC
  `;

  const params = [
    excludeEventId || '',
    endTime, startTime,  // Event wraps our timeframe
    startTime, endTime,  // Event starts during our timeframe
    startTime, endTime   // Event ends during our timeframe
  ];

  const overlappingEvents = await executeQuery<CalendarEventRow>(query, params);

  // Calculate overlap duration for each conflict
  const conflicts: EventConflict[] = overlappingEvents.map(eventRow => {
    const event = rowToEvent(eventRow);

    // Calculate actual overlap window
    const overlapStart = new Date(Math.max(
      new Date(startTime).getTime(),
      new Date(event.startTime).getTime()
    ));

    const overlapEnd = new Date(Math.min(
      new Date(endTime).getTime(),
      new Date(event.endTime).getTime()
    ));

    const overlapMinutes = Math.round(
      (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60)
    );

    return {
      event,
      overlapMinutes,
      overlapStart: overlapStart.toISOString(),
      overlapEnd: overlapEnd.toISOString(),
    };
  });

  return conflicts;
}

/**
 * Format time range for display (e.g., "2:00 PM - 3:30 PM")
 */
export function formatEventTimeRange(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  return `${formatTime(start)} - ${formatTime(end)}`;
}

export default {
  getEvents,
  getEventsByDateRange,
  getEventsByDate,
  getUpcomingEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getTodayEventsCount,
  searchEvents,
  detectConflicts,
  formatEventTimeRange,
};
