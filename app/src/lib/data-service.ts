import { db, Deployment, Location, MaintenanceVisit, Project } from './db';
import { SyncQueueService } from './sync-queue';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class DataService {
  private static isOnline = navigator.onLine;

  /**
   * Check if the app is online
   */
  static checkOnlineStatus(): boolean {
    this.isOnline = navigator.onLine;
    return this.isOnline;
  }

  /**
   * Create a new deployment
   */
  static async createDeployment(deployment: Omit<Deployment, 'deployment_id' | 'created_at' | 'updated_at'>): Promise<Deployment> {
    // Generate a new deployment_id
    const newDeployment: Deployment = {
      ...deployment,
      deployment_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.checkOnlineStatus()) {
      try {
        // Map to Supabase schema (no changes needed, already matches)
        const { data, error } = await supabase
          .from('deployments')
          .insert([newDeployment])
          .select()
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        // Store locally as well
        await db.deployments.add(data);
        return data;
      } catch (error) {
        console.error('Failed to create deployment online, falling back to offline:', error);
        // Fall back to offline mode
      }
    }

    // Offline mode: store locally and queue for sync
    await db.deployments.add(newDeployment);
    await SyncQueueService.addToQueue({
      table: 'deployments',
      action: 'create',
      data: newDeployment,
    });

    return newDeployment;
  }

  /**
   * Update an existing deployment
   */
  static async updateDeployment(id: string, updates: Partial<Deployment>): Promise<Deployment> {
    const updatedDeployment = { ...updates, id };

    if (this.checkOnlineStatus()) {
      try {
        const { data, error } = await supabase
          .from('deployments')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        // Update local copy
        await db.deployments.update(id, data);
        return data;
      } catch (error) {
        console.error('Failed to update deployment online, falling back to offline:', error);
      }
    }

    // Offline mode: update locally and queue for sync
    await db.deployments.update(id, updatedDeployment);
    await SyncQueueService.addToQueue({
      table: 'deployments',
      action: 'update',
      data: updatedDeployment,
      recordId: id,
    });

    return updatedDeployment as Deployment;
  }

  /**
   * Delete a deployment
   */
  static async deleteDeployment(id: string): Promise<void> {
    if (this.checkOnlineStatus()) {
      try {
        const { error } = await supabase
          .from('deployments')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Remove from local storage
        await db.deployments.delete(id);
        return;
      } catch (error) {
        console.error('Failed to delete deployment online, falling back to offline:', error);
      }
    }

    // Offline mode: remove locally and queue for sync
    await db.deployments.delete(id);
    await SyncQueueService.addToQueue({
      table: 'deployments',
      action: 'delete',
      data: { id },
      recordId: id,
    });
  }

  /**
   * Get all deployments (from local storage)
   */
  static async getDeployments(): Promise<Deployment[]> {
    return await db.deployments.toArray();
  }

  /**
   * Get a specific deployment by ID
   */
  static async getDeployment(id: string): Promise<Deployment | undefined> {
    return await db.deployments.get(id);
  }

  /**
   * Create a new project
   */
  static async createProject(project: Omit<Project, 'created_at' | 'updated_at'>): Promise<Project> {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...project,
      created_at: now,
      updated_at: now,
    };

    if (this.checkOnlineStatus()) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .insert([newProject])
          .select()
          .single();
        if (error) throw error;
        await db.projects.put(data);
        return data;
      } catch (error) {
        console.error('Failed to create project online, falling back to offline:', error);
      }
    }
    await db.projects.put(newProject);
    await SyncQueueService.addToQueue({
      table: 'projects',
      action: 'create',
      data: newProject,
    });
    return newProject;
  }

  /**
   * Update an existing project
   */
  static async updateProject(project_id: string, updates: Partial<Project>): Promise<Project> {
    const updatedProject = { ...updates, project_id, updated_at: new Date().toISOString() };
    if (this.checkOnlineStatus()) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .update(updates)
          .eq('project_id', project_id)
          .select()
          .single();
        if (error) throw error;
        await db.projects.put(data);
        return data;
      } catch (error) {
        console.error('Failed to update project online, falling back to offline:', error);
      }
    }
    await db.projects.put(updatedProject as Project);
    await SyncQueueService.addToQueue({
      table: 'projects',
      action: 'update',
      data: updatedProject,
      recordId: project_id,
    });
    return updatedProject as Project;
  }

  /**
   * Delete a project
   */
  static async deleteProject(project_id: string): Promise<void> {
    if (this.checkOnlineStatus()) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('project_id', project_id);
        if (error) throw error;
        await db.projects.delete(project_id);
        return;
      } catch (error) {
        console.error('Failed to delete project online, falling back to offline:', error);
      }
    }
    await db.projects.delete(project_id);
    await SyncQueueService.addToQueue({
      table: 'projects',
      action: 'delete',
      data: { project_id },
      recordId: project_id,
    });
  }

  /**
   * Get all projects (from local storage)
   */
  static async getProjects(): Promise<Project[]> {
    return await db.projects.toArray();
  }

  /**
   * Get a specific project by ID
   */
  static async getProject(project_id: string): Promise<Project | undefined> {
    return await db.projects.get(project_id);
  }

  /**
   * Sync locations from Supabase to local Dexie
   */
  static async syncLocationsFromSupabase(): Promise<void> {
    if (!this.checkOnlineStatus()) return;
    const { data, error } = await supabase.from('locations').select('*');
    if (error) {
      console.error('Failed to fetch locations from Supabase:', error);
      return;
    }
    if (data) {
      const mapped = data.map((loc: unknown) => ({
        location_id: (loc as any).location_id,
        project_id: (loc as any).project_id,
        location_name: (loc as any).location_name,
        latitude: (loc as any).latitude,
        longitude: (loc as any).longitude,
        notes: (loc as any).location_comments || undefined,
      }));
      await db.locations.bulkPut(mapped);
    }
  }

  /**
   * Sync deployments from Supabase to local Dexie
   */
  static async syncDeploymentsFromSupabase(): Promise<void> {
    if (!this.checkOnlineStatus()) return;
    const { data, error } = await supabase.from('deployments').select('*');
    if (error) {
      console.error('Failed to fetch deployments from Supabase:', error);
      return;
    }
    if (data) {
      // No mapping needed, schema matches
      await db.deployments.bulkPut(data);
    }
  }

  /**
   * Sync projects from Supabase to local Dexie
   */
  static async syncProjectsFromSupabase(): Promise<void> {
    if (!this.checkOnlineStatus()) return;
    const { data, error } = await supabase.from('projects').select('*');
    if (error) {
      console.error('Failed to fetch projects from Supabase:', error);
      return;
    }
    if (data) {
      await db.projects.bulkPut(data);
    }
    // Also sync locations and deployments after projects
    await this.syncLocationsFromSupabase();
    await this.syncDeploymentsFromSupabase();
  }

  /**
   * Get all locations (from local storage)
   */
  static async getLocations(): Promise<Location[]> {
    return await db.locations.toArray();
  }

  /**
   * Create a new location
   */
  static async createLocation(location: Location): Promise<void> {
    if (this.checkOnlineStatus()) {
      try {
        const supabaseLocation = {
          ...location,
          location_comments: location.location_comments,
        };
        const { data, error } = await supabase
          .from('locations')
          .insert([supabaseLocation])
          .select()
          .single();
        if (error) throw error;
        await db.locations.add({ ...data });
        return;
      } catch (error) {
        console.error('Failed to create location online, falling back to offline:', error);
        // Fall back to offline mode
      }
    }
    await db.locations.add(location);
    // Optionally, queue for sync if offline (implement if needed)
  }

  /**
   * Get all maintenance visits (from local storage)
   */
  static async getMaintenanceVisits(): Promise<MaintenanceVisit[]> {
    return await db.maintenance_visits.toArray();
  }

  /**
   * Create a new maintenance visit
   */
  static async createMaintenanceVisit(visit: Omit<MaintenanceVisit, 'visit_id' | 'created_at' | 'updated_at'>): Promise<MaintenanceVisit> {
    const now = new Date().toISOString();
    const newVisit: MaintenanceVisit = {
      ...visit,
      visit_id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    if (this.checkOnlineStatus()) {
      try {
        const { data, error } = await supabase
          .from('maintenance_visits')
          .insert([newVisit])
          .select()
          .single();
        if (error) throw error;
        await db.maintenance_visits.add(data);
        return data;
      } catch (error) {
        console.error('Failed to create maintenance visit online, falling back to offline:', error);
      }
    }
    // Offline mode: store locally and queue for sync
    await db.maintenance_visits.add(newVisit);
    await SyncQueueService.addToQueue({
      table: 'maintenance_visits',
      action: 'create',
      data: newVisit,
    });
    return newVisit;
  }

  // Similar methods for locations and maintenance visits...
  // (I'll add these if you want to see the full implementation)
} 