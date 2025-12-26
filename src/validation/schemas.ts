/**
 * Zod Validation Schemas
 * Centralized input validation for all data models
 *
 * IMPROVEMENT: Added Zod for runtime type validation and input sanitization
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const idSchema = z.string().min(1, 'ID is required');

export const timestampSchema = z.string().datetime({ message: 'Invalid date format' });

export const optionalTimestampSchema = z.string().datetime().optional().or(z.literal(''));

// ============================================================================
// Task Schemas
// ============================================================================

export const taskStatusSchema = z.enum(['todo', 'in_progress', 'blocked', 'completed', 'cancelled'], {
  errorMap: () => ({ message: 'Invalid task status' }),
});

export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'], {
  errorMap: () => ({ message: 'Invalid priority level' }),
});

export const recurrenceFrequencySchema = z.enum(['daily', 'weekly', 'monthly', 'yearly']);

export const recurrenceRuleSchema = z.object({
  frequency: recurrenceFrequencySchema,
  interval: z.number().int().positive().max(365, 'Interval too large'),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  endDate: optionalTimestampSchema,
  count: z.number().int().positive().max(1000).optional(),
}).optional();

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim()
    .transform((val) => val.replace(/\s+/g, ' ')), // Normalize whitespace
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .trim()
    .optional()
    .transform((val) => val || undefined),
  status: taskStatusSchema.optional().default('todo'),
  priority: taskPrioritySchema.optional().default('medium'),
  effort: z.number().int().min(1).max(10).optional(),
  impact: z.number().int().min(1).max(10).optional(),
  dueDate: optionalTimestampSchema.transform((val) => val || undefined),
  projectId: z.string().optional().transform((val) => val || undefined),
  tags: z.array(z.string().max(50)).max(20, 'Too many tags').optional().default([]),
  recurrence: recurrenceRuleSchema,
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  completedAt: optionalTimestampSchema.transform((val) => val || undefined),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// ============================================================================
// Habit Schemas
// ============================================================================

export const habitCadenceSchema = z.enum(['daily', 'weekly', 'monthly']);

export const createHabitSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .trim()
    .optional(),
  cadence: habitCadenceSchema.default('daily'),
  targetCount: z.number().int().positive().max(100).default(1),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
  icon: z.string().max(50).optional(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional(),
  isArchived: z.boolean().optional().default(false),
});

export const updateHabitSchema = createHabitSchema.partial();

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

// ============================================================================
// Finance Schemas
// ============================================================================

export const transactionTypeSchema = z.enum(['income', 'expense']);

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(999999999, 'Amount too large')
    .transform((val) => Math.round(val * 100) / 100), // Round to 2 decimal places
  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description must be 200 characters or less')
    .trim(),
  category: z.string().min(1, 'Category is required').max(100),
  date: timestampSchema,
  notes: z.string().max(500).optional(),
  isRecurring: z.boolean().optional().default(false),
  recurringFrequency: recurrenceFrequencySchema.optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const createBudgetSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100),
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(999999999, 'Amount too large'),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  startDate: timestampSchema,
  endDate: timestampSchema,
  isRecurring: z.boolean().optional().default(false),
  alertThreshold: z.number().min(0).max(1).optional().default(0.8),
  currency: z.string().length(3).optional().default('USD'),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

// ============================================================================
// Calendar Event Schemas
// ============================================================================

// Base event schema without refinement (for partial updates)
const createEventBaseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),
  description: z.string().max(2000).trim().optional(),
  startDate: timestampSchema,
  endDate: timestampSchema,
  isAllDay: z.boolean().optional().default(false),
  location: z.string().max(300).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  reminderMinutes: z.number().int().min(0).max(10080).optional(), // Max 1 week
  recurrence: recurrenceRuleSchema,
});

// Full create schema with date validation
export const createEventSchema = createEventBaseSchema.refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
);

// Update schema uses base without refinement (partial updates may not have both dates)
export const updateEventSchema = createEventBaseSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

// ============================================================================
// Project Schemas
// ============================================================================

export const projectStatusSchema = z.enum(['active', 'on_hold', 'completed', 'archived']);

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  description: z.string().max(500).trim().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(50).optional(),
  status: projectStatusSchema.optional().default('active'),
  dueDate: optionalTimestampSchema,
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ============================================================================
// Focus Session Schemas
// ============================================================================

export const focusSessionStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']);

export const createFocusSessionSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less')
    .trim(),
  description: z.string().max(500).trim().optional(),
  durationMinutes: z.number().int().min(1).max(480, 'Maximum 8 hours'), // Max 8 hours
  taskId: z.string().optional(),
  isPomodoro: z.boolean().optional().default(false),
  sessionNumber: z.number().int().positive().max(100).optional(),
  breakMinutes: z.number().int().min(0).max(60).optional(),
  phoneInMode: z.boolean().optional().default(false),
});

export const updateFocusSessionSchema = createFocusSessionSchema.partial().extend({
  actualMinutes: z.number().int().min(0).optional(),
  status: focusSessionStatusSchema.optional(),
  startTime: optionalTimestampSchema,
  endTime: optionalTimestampSchema,
  notes: z.string().max(1000).optional(),
});

export type CreateFocusSessionInput = z.infer<typeof createFocusSessionSchema>;
export type UpdateFocusSessionInput = z.infer<typeof updateFocusSessionSchema>;

// ============================================================================
// Auth Schemas
// ============================================================================

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email too long')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Safely validate data and return result with typed error messages
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; errors: z.ZodError['errors'] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Get the first error message for display
  const firstError = result.error.errors[0];
  const errorMessage = firstError?.message || 'Validation failed';

  return {
    success: false,
    error: errorMessage,
    errors: result.error.errors,
  };
}

/**
 * Validate and throw on error - use in contexts where you want to fail fast
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Format Zod errors for display
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  for (const issue of error.errors) {
    const path = issue.path.join('.');
    if (!formatted[path]) {
      formatted[path] = issue.message;
    }
  }

  return formatted;
}

export default {
  // Task
  createTaskSchema,
  updateTaskSchema,
  // Habit
  createHabitSchema,
  updateHabitSchema,
  // Finance
  createTransactionSchema,
  updateTransactionSchema,
  createBudgetSchema,
  // Calendar
  createEventSchema,
  updateEventSchema,
  // Project
  createProjectSchema,
  updateProjectSchema,
  // Focus
  createFocusSessionSchema,
  updateFocusSessionSchema,
  // Auth
  loginSchema,
  registerSchema,
  // Helpers
  validateSafe,
  validateOrThrow,
  formatZodErrors,
};
