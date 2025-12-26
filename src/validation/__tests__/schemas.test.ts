/**
 * Zod Validation Schemas Unit Tests
 *
 * IMPROVEMENT: Tests for input validation schemas
 */

import {
  createTaskSchema,
  updateTaskSchema,
  createHabitSchema,
  createTransactionSchema,
  createEventSchema,
  loginSchema,
  registerSchema,
  validateSafe,
  formatZodErrors,
} from '../schemas';

describe('Validation Schemas', () => {
  describe('createTaskSchema', () => {
    it('validates a valid task', () => {
      const validTask = {
        title: 'Test Task',
        description: 'A test description',
        priority: 'high',
        status: 'todo',
        tags: ['work', 'urgent'],
      };

      const result = createTaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Task');
        expect(result.data.priority).toBe('high');
      }
    });

    it('rejects empty title', () => {
      const invalidTask = {
        title: '',
        priority: 'medium',
      };

      const result = createTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('trims and normalizes whitespace in title', () => {
      const taskWithWhitespace = {
        title: '  Multiple   spaces   here  ',
      };

      const result = createTaskSchema.safeParse(taskWithWhitespace);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Multiple spaces here');
      }
    });

    it('rejects title over 200 characters', () => {
      const longTitle = {
        title: 'a'.repeat(201),
      };

      const result = createTaskSchema.safeParse(longTitle);
      expect(result.success).toBe(false);
    });

    it('rejects invalid priority', () => {
      const invalidPriority = {
        title: 'Test',
        priority: 'super-urgent', // Not a valid priority
      };

      const result = createTaskSchema.safeParse(invalidPriority);
      expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
      const invalidStatus = {
        title: 'Test',
        status: 'pending', // Not a valid status
      };

      const result = createTaskSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it('applies default values', () => {
      const minimalTask = {
        title: 'Minimal Task',
      };

      const result = createTaskSchema.safeParse(minimalTask);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('todo');
        expect(result.data.priority).toBe('medium');
        expect(result.data.tags).toEqual([]);
      }
    });

    it('validates effort and impact in range', () => {
      const taskWithEffort = {
        title: 'Test',
        effort: 5,
        impact: 8,
      };

      const result = createTaskSchema.safeParse(taskWithEffort);
      expect(result.success).toBe(true);
    });

    it('rejects effort out of range', () => {
      const invalidEffort = {
        title: 'Test',
        effort: 15, // Max is 10
      };

      const result = createTaskSchema.safeParse(invalidEffort);
      expect(result.success).toBe(false);
    });
  });

  describe('updateTaskSchema', () => {
    it('allows partial updates', () => {
      const partialUpdate = {
        priority: 'urgent',
      };

      const result = updateTaskSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('validates completedAt as ISO date', () => {
      const withCompletedAt = {
        status: 'completed',
        completedAt: '2025-12-26T12:00:00.000Z',
      };

      const result = updateTaskSchema.safeParse(withCompletedAt);
      expect(result.success).toBe(true);
    });
  });

  describe('createHabitSchema', () => {
    it('validates a valid habit', () => {
      const validHabit = {
        title: 'Morning Exercise',
        cadence: 'daily',
        targetCount: 1,
        color: '#10E87F',
      };

      const result = createHabitSchema.safeParse(validHabit);
      expect(result.success).toBe(true);
    });

    it('rejects invalid color format', () => {
      const invalidColor = {
        title: 'Test Habit',
        color: 'not-a-color',
      };

      const result = createHabitSchema.safeParse(invalidColor);
      expect(result.success).toBe(false);
    });

    it('validates reminder time format', () => {
      const withReminder = {
        title: 'Test Habit',
        reminderTime: '09:30',
      };

      const result = createHabitSchema.safeParse(withReminder);
      expect(result.success).toBe(true);
    });

    it('rejects invalid reminder time format', () => {
      const invalidTime = {
        title: 'Test Habit',
        reminderTime: '9:30 AM', // Wrong format
      };

      const result = createHabitSchema.safeParse(invalidTime);
      expect(result.success).toBe(false);
    });
  });

  describe('createTransactionSchema', () => {
    it('validates a valid transaction', () => {
      const validTransaction = {
        type: 'expense',
        amount: 50.25,
        description: 'Lunch',
        category: 'Food & Dining',
        date: '2025-12-26T12:00:00.000Z',
      };

      const result = createTransactionSchema.safeParse(validTransaction);
      expect(result.success).toBe(true);
    });

    it('rounds amount to 2 decimal places', () => {
      const transaction = {
        type: 'expense',
        amount: 50.256789,
        description: 'Test',
        category: 'Other',
        date: '2025-12-26T12:00:00.000Z',
      };

      const result = createTransactionSchema.safeParse(transaction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(50.26);
      }
    });

    it('rejects negative amount', () => {
      const negativeAmount = {
        type: 'expense',
        amount: -50,
        description: 'Test',
        category: 'Other',
        date: '2025-12-26T12:00:00.000Z',
      };

      const result = createTransactionSchema.safeParse(negativeAmount);
      expect(result.success).toBe(false);
    });

    it('rejects invalid transaction type', () => {
      const invalidType = {
        type: 'transfer', // Not valid
        amount: 50,
        description: 'Test',
        category: 'Other',
        date: '2025-12-26T12:00:00.000Z',
      };

      const result = createTransactionSchema.safeParse(invalidType);
      expect(result.success).toBe(false);
    });
  });

  describe('createEventSchema', () => {
    it('validates a valid event', () => {
      const validEvent = {
        title: 'Team Meeting',
        startDate: '2025-12-26T10:00:00.000Z',
        endDate: '2025-12-26T11:00:00.000Z',
        isAllDay: false,
      };

      const result = createEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('rejects end date before start date', () => {
      const invalidEvent = {
        title: 'Invalid Event',
        startDate: '2025-12-26T11:00:00.000Z',
        endDate: '2025-12-26T10:00:00.000Z', // Before start
      };

      const result = createEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('endDate');
      }
    });

    it('validates reminder minutes in range', () => {
      const withReminder = {
        title: 'Event',
        startDate: '2025-12-26T10:00:00.000Z',
        endDate: '2025-12-26T11:00:00.000Z',
        reminderMinutes: 30,
      };

      const result = createEventSchema.safeParse(withReminder);
      expect(result.success).toBe(true);
    });

    it('rejects reminder minutes over 1 week', () => {
      const invalidReminder = {
        title: 'Event',
        startDate: '2025-12-26T10:00:00.000Z',
        endDate: '2025-12-26T11:00:00.000Z',
        reminderMinutes: 20000, // Over 10080 (1 week)
      };

      const result = createEventSchema.safeParse(invalidReminder);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('validates valid credentials', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'securePassword123',
      };

      const result = loginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('normalizes email to lowercase', () => {
      const upperEmail = {
        email: 'USER@EXAMPLE.COM',
        password: 'securePassword123',
      };

      const result = loginSchema.safeParse(upperEmail);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('rejects invalid email', () => {
      const invalidEmail = {
        email: 'not-an-email',
        password: 'securePassword123',
      };

      const result = loginSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const shortPassword = {
        email: 'user@example.com',
        password: 'short',
      };

      const result = loginSchema.safeParse(shortPassword);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('validates valid registration', () => {
      const validRegister = {
        email: 'newuser@example.com',
        password: 'securePassword123',
        name: 'John Doe',
      };

      const result = registerSchema.safeParse(validRegister);
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const emptyName = {
        email: 'user@example.com',
        password: 'securePassword123',
        name: '',
      };

      const result = registerSchema.safeParse(emptyName);
      expect(result.success).toBe(false);
    });
  });

  describe('validateSafe helper', () => {
    it('returns success with data for valid input', () => {
      const result = validateSafe(createTaskSchema, { title: 'Test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test');
      }
    });

    it('returns error message for invalid input', () => {
      const result = validateSafe(createTaskSchema, { title: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('formatZodErrors helper', () => {
    it('formats errors as field-message pairs', () => {
      const result = createTaskSchema.safeParse({
        title: '',
        priority: 'invalid',
      });

      if (!result.success) {
        const formatted = formatZodErrors(result.error);
        expect(formatted).toHaveProperty('title');
        expect(formatted).toHaveProperty('priority');
      }
    });
  });
});
