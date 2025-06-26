import { SyncQueueService } from './sync-queue';
import { DataService } from './data-service';

export class ConnectivityService {
  private static isOnline = navigator.onLine;
  private static syncInProgress = false;
  private static listeners: Array<(online: boolean) => void> = [];

  /**
   * Initialize the connectivity service
   */
  static initialize(): void {
    // Set up event listeners for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Initial status check
    this.isOnline = navigator.onLine;
    console.log(`Initial connectivity status: ${this.isOnline ? 'online' : 'offline'}`);
  }

  /**
   * Handle when the app comes online
   */
  private static async handleOnline(): Promise<void> {
    console.log('App is now online');
    this.isOnline = true;
    this.notifyListeners(true);
    
    // Trigger sync if there are pending items
    await this.triggerSync();
  }

  /**
   * Handle when the app goes offline
   */
  private static handleOffline(): void {
    console.log('App is now offline');
    this.isOnline = false;
    this.notifyListeners(false);
  }

  /**
   * Get current online status
   */
  static getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Manually trigger sync (useful for testing or user-initiated sync)
   */
  static async triggerSync(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    if (!this.isOnline) {
      console.log('Cannot sync while offline');
      return;
    }

    const pendingCount = await SyncQueueService.getPendingCount();
    if (pendingCount === 0) {
      console.log('No pending items to sync');
      return;
    }

    console.log(`Starting sync of ${pendingCount} pending items...`);
    this.syncInProgress = true;

    try {
      const pendingItems = await SyncQueueService.getPendingItems();
      
      for (const item of pendingItems) {
        await this.processSyncItem(item);
        await SyncQueueService.removeFromQueue(item.id!);
      }

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      // Don't clear the queue on error - items will be retried on next sync
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process a single sync queue item
   */
  private static async processSyncItem(item: any): Promise<void> {
    try {
      switch (item.table) {
        case 'deployments':
          await this.syncDeployment(item);
          break;
        case 'locations':
          await this.syncLocation(item);
          break;
        case 'maintenance_visits':
          await this.syncMaintenanceVisit(item);
          break;
        default:
          console.warn(`Unknown table type: ${item.table}`);
      }
    } catch (error) {
      console.error(`Failed to sync ${item.table} item:`, error);
      throw error; // Re-throw to stop the sync process
    }
  }

  /**
   * Sync a deployment item
   */
  private static async syncDeployment(item: any): Promise<void> {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (item.action) {
      case 'create':
        await supabase.from('deployments').insert([item.data]);
        break;
      case 'update':
        await supabase.from('deployments').update(item.data).eq('id', item.data.id);
        break;
      case 'delete':
        await supabase.from('deployments').delete().eq('id', item.data.id);
        break;
    }
  }

  /**
   * Sync a location item
   */
  private static async syncLocation(item: any): Promise<void> {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (item.action) {
      case 'create':
        await supabase.from('locations').insert([item.data]);
        break;
      case 'update':
        await supabase.from('locations').update(item.data).eq('id', item.data.id);
        break;
      case 'delete':
        await supabase.from('locations').delete().eq('id', item.data.id);
        break;
    }
  }

  /**
   * Sync a maintenance visit item
   */
  private static async syncMaintenanceVisit(item: any): Promise<void> {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (item.action) {
      case 'create':
        await supabase.from('maintenance_visits').insert([item.data]);
        break;
      case 'update':
        await supabase.from('maintenance_visits').update(item.data).eq('id', item.data.id);
        break;
      case 'delete':
        await supabase.from('maintenance_visits').delete().eq('id', item.data.id);
        break;
    }
  }

  /**
   * Add a listener for connectivity changes
   */
  static addConnectivityListener(listener: (online: boolean) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a connectivity listener
   */
  static removeConnectivityListener(listener: (online: boolean) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of connectivity changes
   */
  private static notifyListeners(online: boolean): void {
    this.listeners.forEach(listener => listener(online));
  }

  /**
   * Get sync status
   */
  static isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
} 