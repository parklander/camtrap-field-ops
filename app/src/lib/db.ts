import Dexie, { Table } from 'dexie';

// Table interfaces
export interface Deployment {
  id: string;
  project_id: string;
  location_id: string;
  start_date: string;
  end_date?: string;
  notes?: string;
}

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  notes?: string;
}

export interface MaintenanceVisit {
  id: string;
  deployment_id: string;
  visit_date: string;
  notes?: string;
}

export interface SyncQueueItem {
  id?: number;
  table: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export interface Project {
  project_id: string;
  project_name: string;
  organization?: string;
  description?: string;
  study_area?: string;
  principal_investigator?: string;
  contact_email?: string;
  website?: string;
  funding_source?: string;
  license?: string;
  created_at?: string;
  updated_at?: string;
}

class CamtrapFieldOpsDB extends Dexie {
  deployments!: Table<Deployment, string>;
  locations!: Table<Location, string>;
  maintenance_visits!: Table<MaintenanceVisit, string>;
  sync_queue!: Table<SyncQueueItem, number>;
  projects!: Table<Project, string>;

  constructor() {
    super('CamtrapFieldOpsDB');
    this.version(2).stores({
      deployments: 'id, project_id, location_id, start_date, end_date',
      locations: 'id, name, latitude, longitude',
      maintenance_visits: 'id, deployment_id, visit_date',
      sync_queue: '++id, table, action, timestamp',
      projects: 'project_id, project_name, organization',
    });
  }
}

export const db = new CamtrapFieldOpsDB(); 