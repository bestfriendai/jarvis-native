/**
 * Error Reporting Service
 * Centralized error logging and reporting
 *
 * In production, this would integrate with services like:
 * - Sentry
 * - Bugsnag
 * - Firebase Crashlytics
 * - Custom logging backend
 */

import { Platform } from 'react-native';

interface ErrorContext {
  userId?: string;
  screen?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface LoggedError {
  timestamp: Date;
  message: string;
  stack?: string;
  context?: ErrorContext;
  platform: typeof Platform.OS;
  version: string;
}

class ErrorReportingService {
  private errors: LoggedError[] = [];
  private maxStoredErrors = 100;
  private enabled = true;

  /**
   * Initialize error reporting service
   * In production, this would initialize Sentry/Bugsnag/etc.
   */
  initialize(config?: { enabled?: boolean; dsn?: string }): void {
    this.enabled = config?.enabled ?? true;

    if (this.enabled) {
      console.log('[ErrorReporting] Service initialized');

      // In production, initialize your error reporting service here:
      // Example with Sentry:
      // Sentry.init({
      //   dsn: config?.dsn,
      //   enableInExpoDevelopment: true,
      //   debug: __DEV__,
      // });
    }
  }

  /**
   * Log an error
   */
  logError(
    error: Error,
    context?: ErrorContext
  ): void {
    if (!this.enabled) return;

    const loggedError: LoggedError = {
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
      context,
      platform: Platform.OS,
      version: '1.0.0', // Should come from app config
    };

    // Store locally for debugging
    this.errors.unshift(loggedError);
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(0, this.maxStoredErrors);
    }

    // Log to console in development
    if (__DEV__) {
      console.error('[ErrorReporting] Error logged:', {
        message: error.message,
        context,
        stack: error.stack,
      });
    }

    // In production, send to error reporting service:
    // Sentry.captureException(error, { contexts: { custom: context } });
  }

  /**
   * Log a non-fatal error (warning)
   */
  logWarning(
    message: string,
    context?: ErrorContext
  ): void {
    if (!this.enabled) return;

    if (__DEV__) {
      console.warn('[ErrorReporting] Warning:', message, context);
    }

    // In production, log to service:
    // Sentry.captureMessage(message, { level: 'warning', contexts: { custom: context } });
  }

  /**
   * Log a handled exception
   */
  logHandledException(
    error: Error,
    context?: ErrorContext
  ): void {
    if (!this.enabled) return;

    this.logError(error, { ...context, action: 'handled_exception' });
  }

  /**
   * Log a React component error
   */
  logComponentError(
    error: Error,
    errorInfo: React.ErrorInfo,
    context?: ErrorContext
  ): void {
    if (!this.enabled) return;

    const enhancedContext = {
      ...context,
      action: 'component_error',
      metadata: {
        ...context?.metadata,
        componentStack: errorInfo.componentStack,
      },
    };

    this.logError(error, enhancedContext);
  }

  /**
   * Log a network error
   */
  logNetworkError(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number
  ): void {
    if (!this.enabled) return;

    const context: ErrorContext = {
      action: 'network_error',
      metadata: {
        endpoint,
        method,
        statusCode,
      },
    };

    this.logError(error, context);
  }

  /**
   * Log a database error
   */
  logDatabaseError(
    error: Error,
    query?: string,
    params?: any[]
  ): void {
    if (!this.enabled) return;

    const context: ErrorContext = {
      action: 'database_error',
      metadata: {
        query,
        params,
      },
    };

    this.logError(error, context);
  }

  /**
   * Set user context for error reports
   */
  setUser(userId: string, userInfo?: Record<string, any>): void {
    if (!this.enabled) return;

    // In production:
    // Sentry.setUser({ id: userId, ...userInfo });

    if (__DEV__) {
      console.log('[ErrorReporting] User context set:', userId, userInfo);
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.enabled) return;

    // In production:
    // Sentry.setUser(null);

    if (__DEV__) {
      console.log('[ErrorReporting] User context cleared');
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, any>
  ): void {
    if (!this.enabled) return;

    // In production:
    // Sentry.addBreadcrumb({ message, category, data });

    if (__DEV__) {
      console.log('[ErrorReporting] Breadcrumb:', { message, category, data });
    }
  }

  /**
   * Get recent errors (for debugging)
   */
  getRecentErrors(count = 10): LoggedError[] {
    return this.errors.slice(0, count);
  }

  /**
   * Clear stored errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Enable/disable error reporting
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`[ErrorReporting] Service ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
export const errorReporting = new ErrorReportingService();

// Export type
export type { ErrorContext, LoggedError };
