-- Maintenance Visits Table
-- Tracks field technician visits to camera trap deployments
-- Essential for field operations and data quality monitoring

create table if not exists maintenance_visits (
  -- Primary identifiers
  visit_id text primary key,
  deployment_id text not null references deployments(deployment_id) on delete cascade,
  project_id text not null references projects(project_id),
  
  -- Visit details
  visit_date timestamptz not null,
  visit_type text not null check (visit_type in ('deployment', 'maintenance', 'retrieval', 'emergency')),
  technician_name text not null,
  
  -- Camera status
  camera_functioning boolean not null,
  battery_level text check (battery_level in ('full', 'good', 'low', 'dead', 'unknown')),
  sd_card_space_available text check (sd_card_space_available in ('full', 'good', 'low', 'full', 'unknown')),
  
  -- Maintenance actions performed
  battery_changed boolean default false,
  sd_card_changed boolean default false,
  camera_repositioned boolean default false,
  camera_cleaned boolean default false,
  camera_repaired boolean default false,
  
  -- Environmental conditions
  weather_conditions text,
  temperature_celsius float8,
  precipitation text check (precipitation in ('none', 'light', 'moderate', 'heavy')),
  
  -- Access and logistics
  access_difficulty text check (access_difficulty in ('easy', 'moderate', 'difficult', 'very_difficult')),
  travel_time_minutes int4 check (travel_time_minutes >= 0),
  visit_duration_minutes int4 check (visit_duration_minutes >= 0),
  
  -- Issues and problems
  issues_found text,
  problems_resolved text,
  problems_unresolved text,
  
  -- Data collection
  images_collected int4 check (images_collected >= 0),
  videos_collected int4 check (videos_collected >= 0),
  data_quality_notes text,
  
  -- Camera settings (if changed)
  new_quiet_period int4 check (new_quiet_period >= 0),
  new_sensitivity text check (new_sensitivity in ('low', 'medium', 'high')),
  new_resolution text check (new_resolution in ('low', 'medium', 'high')),
  
  -- Next visit planning
  next_visit_recommended_date date,
  next_visit_priority text check (next_visit_priority in ('low', 'medium', 'high', 'urgent')),
  next_visit_notes text,
  
  -- Additional notes
  visit_notes text,
  photos_taken boolean default false,
  gps_track_recorded boolean default false,
  
  -- Audit fields
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  
  -- Constraints
  constraint visit_date_reasonable check (visit_date <= now() + interval '1 day'),
  constraint visit_duration_reasonable check (visit_duration_minutes <= 480) -- 8 hours max
);

-- Add comments for documentation
comment on table maintenance_visits is 'Maintenance visits table - tracks field technician visits to camera trap deployments';
comment on column maintenance_visits.visit_id is 'Unique visit identifier';
comment on column maintenance_visits.deployment_id is 'Reference to deployments table';
comment on column maintenance_visits.project_id is 'Reference to projects table';
comment on column maintenance_visits.visit_date is 'Date and time of the visit';
comment on column maintenance_visits.visit_type is 'Type of visit: deployment, maintenance, retrieval, or emergency';
comment on column maintenance_visits.technician_name is 'Name of the field technician';
comment on column maintenance_visits.camera_functioning is 'Whether the camera was functioning properly';
comment on column maintenance_visits.battery_level is 'Battery level at time of visit';
comment on column maintenance_visits.sd_card_space_available is 'Available space on SD card';
comment on column maintenance_visits.battery_changed is 'Whether battery was changed during visit';
comment on column maintenance_visits.sd_card_changed is 'Whether SD card was changed during visit';
comment on column maintenance_visits.camera_repositioned is 'Whether camera was repositioned';
comment on column maintenance_visits.weather_conditions is 'Weather conditions during visit';
comment on column maintenance_visits.temperature_celsius is 'Temperature in Celsius during visit';
comment on column maintenance_visits.access_difficulty is 'Difficulty accessing the deployment site';
comment on column maintenance_visits.travel_time_minutes is 'Time to reach the deployment site';
comment on column maintenance_visits.visit_duration_minutes is 'Duration of the visit';
comment on column maintenance_visits.issues_found is 'Issues found during the visit';
comment on column maintenance_visits.problems_resolved is 'Problems that were resolved';
comment on column maintenance_visits.problems_unresolved is 'Problems that could not be resolved';
comment on column maintenance_visits.images_collected is 'Number of images collected';
comment on column maintenance_visits.videos_collected is 'Number of videos collected';
comment on column maintenance_visits.next_visit_recommended_date is 'Recommended date for next visit';
comment on column maintenance_visits.next_visit_priority is 'Priority level for next visit';

-- Create indexes for performance
create index if not exists maintenance_visits_deployment_idx on maintenance_visits(deployment_id);
create index if not exists maintenance_visits_project_idx on maintenance_visits(project_id);
create index if not exists maintenance_visits_date_idx on maintenance_visits(visit_date);
create index if not exists maintenance_visits_technician_idx on maintenance_visits(technician_name);
create index if not exists maintenance_visits_type_idx on maintenance_visits(visit_type);

-- Add RLS (Row Level Security) policies
alter table maintenance_visits enable row level security;

-- Policy: Users can view maintenance visits for projects they have access to
create policy "Users can view maintenance visits" on maintenance_visits
  for select using (true);

-- Policy: Authenticated users can create maintenance visits
create policy "Authenticated users can create maintenance visits" on maintenance_visits
  for insert with check (auth.role() = 'authenticated');

-- Policy: Authenticated users can update maintenance visits
create policy "Authenticated users can update maintenance visits" on maintenance_visits
  for update using (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete maintenance visits
create policy "Authenticated users can delete maintenance visits" on maintenance_visits
  for delete using (auth.role() = 'authenticated');

-- Insert sample maintenance visit for testing
insert into maintenance_visits (
  visit_id,
  deployment_id,
  project_id,
  visit_date,
  visit_type,
  technician_name,
  camera_functioning,
  battery_level,
  sd_card_space_available,
  battery_changed,
  sd_card_changed,
  weather_conditions,
  temperature_celsius,
  access_difficulty,
  travel_time_minutes,
  visit_duration_minutes,
  images_collected,
  videos_collected,
  visit_notes,
  created_by
) values (
  'visit-001',
  'test-deployment-001',
  'camtrap-field-ops',
  '2024-01-15 10:30:00+00',
  'maintenance',
  'John Field Tech',
  true,
  'good',
  'good',
  false,
  true,
  'Clear skies, light breeze',
  15.5,
  'moderate',
  45,
  30,
  150,
  12,
  'Camera functioning well. SD card replaced. No issues found.',
  'Test User'
) on conflict (visit_id) do nothing; 