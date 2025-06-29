import Dexie, { Table } from 'dexie';

// Table interfaces
export interface Deployment {
  deployment_id: string;
  project_id: string;
  location_id?: string;
  location_name?: string;
  latitude: number;
  longitude: number;
  coordinate_uncertainty?: number;
  geom?: string;
  deployment_start: string;
  deployment_end?: string;
  camera_id?: string;
  camera_model?: string;
  quiet_period?: number;
  camera_height?: number;
  camera_depth?: number;
  camera_tilt?: number;
  camera_heading?: number;
  detection_distance?: number;
  bait_type?: string;
  bait_description?: string;
  feature_type?: string;
  feature_type_methodology?: string;
  event_name?: string;
  event_description?: string;
  event_type?: string;
  subproject_name?: string;
  subproject_design?: string;
  setup_by?: string;
  timestamp_issues?: boolean;
  habitat?: string;
  deployment_groups?: string;
  deployment_tags?: string;
  deployment_comments?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Location {
  location_id: string;
  project_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  location_comments?: string;
}

export interface MaintenanceVisit {
  visit_id: string;
  deployment_id: string;
  project_id: string;
  visit_date: string; // ISO string
  visit_type: 'deployment' | 'maintenance' | 'retrieval' | 'emergency';
  technician_name: string;
  camera_functioning: boolean;
  battery_level?: 'full' | 'good' | 'low' | 'dead' | 'unknown';
  sd_card_space_available?: 'full' | 'good' | 'low' | 'unknown';
  battery_changed?: boolean;
  sd_card_changed?: boolean;
  camera_repositioned?: boolean;
  camera_cleaned?: boolean;
  camera_repaired?: boolean;
  weather_conditions?: string;
  temperature_celsius?: number;
  precipitation?: 'none' | 'light' | 'moderate' | 'heavy';
  access_difficulty?: 'easy' | 'moderate' | 'difficult' | 'very_difficult';
  travel_time_minutes?: number;
  visit_duration_minutes?: number;
  issues_found?: string;
  problems_resolved?: string;
  problems_unresolved?: string;
  images_collected?: number;
  videos_collected?: number;
  data_quality_notes?: string;
  new_quiet_period?: number;
  new_sensitivity?: 'low' | 'medium' | 'high';
  new_resolution?: 'low' | 'medium' | 'high';
  next_visit_recommended_date?: string; // date string
  next_visit_priority?: 'low' | 'medium' | 'high' | 'urgent';
  next_visit_notes?: string;
  visit_notes?: string;
  photos_taken?: boolean;
  gps_track_recorded?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
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
    this.version(3).stores({
      deployments: 'deployment_id, project_id, location_id, deployment_start, deployment_end, camera_id',
      locations: 'location_id, project_id, location_name, latitude, longitude, location_comments',
      maintenance_visits: 'visit_id, deployment_id, project_id, visit_date, visit_type, technician_name',
      sync_queue: '++id, table, action, timestamp',
      projects: 'project_id, project_name, organization',
    });
  }
}

export const db = new CamtrapFieldOpsDB(); 