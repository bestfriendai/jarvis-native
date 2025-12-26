/**
 * Date Utilities Unit Tests
 *
 * IMPROVEMENT: Added comprehensive unit tests for critical utility functions
 */

import {
  formatDueDate,
  getDaysUntil,
  isOverdue,
  getDateUrgency,
  isToday,
  isThisWeek,
  getQuickDate,
  formatDateWithDay,
  getRelativeTime,
} from '../dateUtils';

describe('dateUtils', () => {
  // Use fixed date for consistent testing
  const NOW = new Date('2025-12-26T12:00:00.000Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('isOverdue', () => {
    it('returns true for past dates', () => {
      const yesterday = new Date(NOW);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isOverdue(yesterday.toISOString())).toBe(true);
    });

    it('returns false for future dates', () => {
      const tomorrow = new Date(NOW);
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isOverdue(tomorrow.toISOString())).toBe(false);
    });

    it('returns false for today', () => {
      expect(isOverdue(NOW.toISOString())).toBe(false);
    });
  });

  describe('getDaysUntil', () => {
    it('returns 0 for today', () => {
      expect(getDaysUntil(NOW.toISOString())).toBe(0);
    });

    it('returns positive number for future dates', () => {
      const nextWeek = new Date(NOW);
      nextWeek.setDate(nextWeek.getDate() + 7);
      expect(getDaysUntil(nextWeek.toISOString())).toBe(7);
    });

    it('returns negative number for past dates', () => {
      const lastWeek = new Date(NOW);
      lastWeek.setDate(lastWeek.getDate() - 7);
      expect(getDaysUntil(lastWeek.toISOString())).toBe(-7);
    });
  });

  describe('getDateUrgency', () => {
    it('returns "overdue" for past dates', () => {
      const yesterday = new Date(NOW);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getDateUrgency(yesterday.toISOString())).toBe('overdue');
    });

    it('returns "today" for today', () => {
      expect(getDateUrgency(NOW.toISOString())).toBe('today');
    });

    it('returns "this-week" for dates within 7 days', () => {
      const inFiveDays = new Date(NOW);
      inFiveDays.setDate(inFiveDays.getDate() + 5);
      expect(getDateUrgency(inFiveDays.toISOString())).toBe('this-week');
    });

    it('returns "future" for dates beyond 7 days', () => {
      const nextMonth = new Date(NOW);
      nextMonth.setDate(nextMonth.getDate() + 30);
      expect(getDateUrgency(nextMonth.toISOString())).toBe('future');
    });
  });

  describe('isToday', () => {
    it('returns true for today', () => {
      expect(isToday(NOW.toISOString())).toBe(true);
    });

    it('returns false for tomorrow', () => {
      const tomorrow = new Date(NOW);
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow.toISOString())).toBe(false);
    });

    it('returns false for yesterday', () => {
      const yesterday = new Date(NOW);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday.toISOString())).toBe(false);
    });
  });

  describe('isThisWeek', () => {
    it('returns true for today', () => {
      expect(isThisWeek(NOW.toISOString())).toBe(true);
    });

    it('returns true for dates within 7 days', () => {
      const inFiveDays = new Date(NOW);
      inFiveDays.setDate(inFiveDays.getDate() + 5);
      expect(isThisWeek(inFiveDays.toISOString())).toBe(true);
    });

    it('returns false for dates beyond 7 days', () => {
      const inTenDays = new Date(NOW);
      inTenDays.setDate(inTenDays.getDate() + 10);
      expect(isThisWeek(inTenDays.toISOString())).toBe(false);
    });

    it('returns false for past dates', () => {
      const yesterday = new Date(NOW);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isThisWeek(yesterday.toISOString())).toBe(false);
    });
  });

  describe('formatDueDate', () => {
    it('returns "Today" for today', () => {
      const result = formatDueDate(NOW.toISOString());
      expect(result).toBe('Today');
    });

    it('returns "Tomorrow" for tomorrow', () => {
      const tomorrow = new Date(NOW);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const result = formatDueDate(tomorrow.toISOString());
      expect(result).toBe('Tomorrow');
    });

    it('returns "Yesterday" for yesterday', () => {
      const yesterday = new Date(NOW);
      yesterday.setDate(yesterday.getDate() - 1);
      const result = formatDueDate(yesterday.toISOString());
      expect(result).toBe('Yesterday');
    });
  });

  describe('getQuickDate', () => {
    it('returns today for "today"', () => {
      const result = getQuickDate('today');
      expect(result).toBeDefined();
      expect(new Date(result).toDateString()).toBe(NOW.toDateString());
    });

    it('returns tomorrow for "tomorrow"', () => {
      const result = getQuickDate('tomorrow');
      const tomorrow = new Date(NOW);
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(new Date(result).toDateString()).toBe(tomorrow.toDateString());
    });

    it('returns a future date for "next-week"', () => {
      const result = getQuickDate('next-week');
      const nextWeek = new Date(NOW);
      nextWeek.setDate(nextWeek.getDate() + 7);
      expect(new Date(result).toDateString()).toBe(nextWeek.toDateString());
    });
  });

  describe('formatDateWithDay', () => {
    it('includes day name for today', () => {
      const result = formatDateWithDay(NOW.toISOString());
      expect(result).toContain('Today');
    });

    it('includes day name for tomorrow', () => {
      const tomorrow = new Date(NOW);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const result = formatDateWithDay(tomorrow.toISOString());
      expect(result).toContain('Tomorrow');
    });
  });

  describe('getRelativeTime', () => {
    it('returns "Just now" for very recent dates', () => {
      const fiveSecondsAgo = new Date(NOW);
      fiveSecondsAgo.setSeconds(fiveSecondsAgo.getSeconds() - 5);
      expect(getRelativeTime(fiveSecondsAgo)).toBe('Just now');
    });

    it('returns minutes for recent dates', () => {
      const tenMinutesAgo = new Date(NOW);
      tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
      expect(getRelativeTime(tenMinutesAgo)).toContain('minutes ago');
    });

    it('returns hours for same-day dates', () => {
      const threeHoursAgo = new Date(NOW);
      threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);
      expect(getRelativeTime(threeHoursAgo)).toContain('hours ago');
    });
  });
});
