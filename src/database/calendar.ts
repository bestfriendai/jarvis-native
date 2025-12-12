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

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  isAllDay: boolean;
  recurring?: string;
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
  recurring?: string;
}

export interface UpdateEventData extends Partial<CreateEventData> {}

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
    recurring: row.recurring,
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

  const sql = `
    INSERT INTO calendar_events (
      id, title, description, start_time, end_time, location,
      attendees, is_all_day, recurring, created_at, updated_at, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
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
    data.recurring || null,
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

  if (data.recurring !== undefined) {
    updates.push('recurring = ?');
    params.push(data.recurring || null);
  }

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
};
