import { db, SyncQueueItem } from './db';

export interface SyncAction {
  table: string;
  action: 'create' | 'update' | 'delete';
  data: unknown;
  recordId?: string;
}

export class SyncQueueService {
  /**
   * Add an action to the sync queue
   */
  static async addToQueue(syncAction: SyncAction): Promise<void> {
    try {
      const queueItem: Omit<SyncQueueItem, 'id'> = {
        table: syncAction.table,
        action: syncAction.action,
        data: syncAction.data,
        timestamp: Date.now(),
      };

      await db.sync_queue.add(queueItem);
      console.log(`Added ${syncAction.action} action to sync queue for ${syncAction.table}`);
    } catch (error) {
      console.error('Failed to add action to sync queue:', error);
      throw error;
    }
  }

  /**
   * Get all pending sync queue items
   */
  static async getPendingItems(): Promise<SyncQueueItem[]> {
    try {
      return await db.sync_queue.toArray();
    } catch (error) {
      console.error('Failed to get pending sync items:', error);
      throw error;
    }
  }

  /**
   * Remove a specific item from the sync queue
   */
  static async removeFromQueue(itemId: number): Promise<void> {
    try {
      await db.sync_queue.delete(itemId);
    } catch (error) {
      console.error('Failed to remove item from sync queue:', error);
      throw error;
    }
  }

  /**
   * Clear all items from the sync queue
   */
  static async clearQueue(): Promise<void> {
    try {
      await db.sync_queue.clear();
      console.log('Sync queue cleared');
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
      throw error;
    }
  }

  /**
   * Get the count of pending sync items
   */
  static async getPendingCount(): Promise<number> {
    try {
      return await db.sync_queue.count();
    } catch (error) {
      console.error('Failed to get pending count:', error);
      throw error;
    }
  }
} 