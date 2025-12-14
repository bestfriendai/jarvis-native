/**
 * Undo Queue Service
 * Manages temporary storage of deleted items for undo functionality
 * Items are stored in-memory and automatically cleared after timeout
 */

export type UndoActionType = 'task' | 'habit' | 'event' | 'transaction';

export interface UndoAction<T = any> {
  id: string;
  type: UndoActionType;
  data: T;
  timestamp: number;
}

type ExpireCallback = () => void;

interface QueueEntry<T = any> {
  action: UndoAction<T>;
  timeout: NodeJS.Timeout;
  onExpire: ExpireCallback;
}

/**
 * UndoQueue manages a temporary queue of deleted items
 * Each item has a timeout after which it's permanently deleted
 */
class UndoQueue {
  private queue: Map<string, QueueEntry> = new Map();
  private readonly DEFAULT_TIMEOUT_MS = 4000; // 4 seconds

  /**
   * Add an item to the undo queue with automatic expiration
   * @param action - The undo action containing item data
   * @param onExpire - Callback to run when timeout expires (for permanent deletion)
   * @param timeoutMs - Optional timeout in milliseconds (default: 4000ms)
   */
  add<T>(
    action: UndoAction<T>,
    onExpire: ExpireCallback,
    timeoutMs: number = this.DEFAULT_TIMEOUT_MS
  ): void {
    // Clear existing timeout if this ID is already queued
    if (this.queue.has(action.id)) {
      this.cancel(action.id);
    }

    // Create timeout for automatic expiration
    const timeout = setTimeout(() => {
      console.log(`[UndoQueue] Item ${action.id} expired, executing permanent deletion`);
      const entry = this.queue.get(action.id);
      if (entry) {
        entry.onExpire();
        this.queue.delete(action.id);
      }
    }, timeoutMs);

    // Add to queue
    this.queue.set(action.id, {
      action,
      timeout,
      onExpire,
    });

    console.log(
      `[UndoQueue] Added ${action.type} ${action.id} to queue (expires in ${timeoutMs}ms)`
    );
  }

  /**
   * Undo a deletion by restoring the item and canceling the timeout
   * @param id - The ID of the item to undo
   * @returns The restored data or null if not found
   */
  undo<T>(id: string): T | null {
    const entry = this.queue.get(id);
    if (!entry) {
      console.warn(`[UndoQueue] Cannot undo: item ${id} not found in queue`);
      return null;
    }

    // Clear timeout to prevent permanent deletion
    clearTimeout(entry.timeout);

    // Get data before removing from queue
    const data = entry.action.data as T;

    // Remove from queue
    this.queue.delete(id);

    console.log(`[UndoQueue] Undone ${entry.action.type} ${id}`);

    return data;
  }

  /**
   * Cancel a queued deletion without undoing it
   * (Used internally when re-adding an item)
   * @param id - The ID of the item to cancel
   */
  private cancel(id: string): void {
    const entry = this.queue.get(id);
    if (entry) {
      clearTimeout(entry.timeout);
      this.queue.delete(id);
      console.log(`[UndoQueue] Cancelled ${entry.action.type} ${id}`);
    }
  }

  /**
   * Get an action from the queue without removing it
   * @param id - The ID of the item
   * @returns The action or null if not found
   */
  get<T>(id: string): UndoAction<T> | null {
    const entry = this.queue.get(id);
    return entry ? (entry.action as UndoAction<T>) : null;
  }

  /**
   * Check if an item is in the queue
   * @param id - The ID of the item
   * @returns True if the item is queued for undo
   */
  has(id: string): boolean {
    return this.queue.has(id);
  }

  /**
   * Clear all queued items and cancel all timeouts
   * (Called on app restart or when needed)
   */
  clear(): void {
    console.log(`[UndoQueue] Clearing ${this.queue.size} queued item(s)`);

    // Clear all timeouts
    this.queue.forEach((entry) => {
      clearTimeout(entry.timeout);
    });

    // Clear queue
    this.queue.clear();
  }

  /**
   * Get the current size of the queue
   * @returns Number of items in queue
   */
  size(): number {
    return this.queue.size;
  }

  /**
   * Get all queued action IDs
   * @returns Array of item IDs currently in queue
   */
  getQueuedIds(): string[] {
    return Array.from(this.queue.keys());
  }
}

// Export singleton instance
export const undoQueue = new UndoQueue();

// Clear queue on app restart (optional, but good practice)
if (__DEV__) {
  console.log('[UndoQueue] Initialized (development mode)');
}
