-- Deployments Table
-- Aligns with both Camtrap DP and Wildlife Insights standards
-- Core table for camera trap deployments with PostGIS spatial support

-- Enable PostGIS extension for spatial queries
create extension if not exists postgis;

create table if not exists deployments (
  -- Primary identifiers
  deployment_id text primary key,
  project_id text not null references projects(project_id),
  location_id text,
  location_name text,
  
  -- Spatial data with PostGIS
  latitude float8 not null check (latitude between -90 and 90),
  longitude float8 not null check (longitude between -180 and 180),
  coordinate_uncertainty int4 check (coordinate_uncertainty > 0),
  geom geometry(point, 4326) generated always as (
    st_point(longitude, latitude)
  ) stored,
  
  -- Temporal data (Wildlife Insights: start_date, end_date)
  deployment_start timestamptz not null,
  deployment_end timestamptz, -- Nullable for ongoing deployments
  
  -- Camera information
  camera_id text,
  camera_model text,
  quiet_period int4 check (quiet_period >= 0), -- Wildlife Insights: quiet_period (seconds)
  
  -- Camera positioning
  camera_height float8 check (camera_height >= 0),
  camera_depth float8 check (camera_depth >= 0),
  camera_tilt int4 check (camera_tilt between -90 and 90),
  camera_heading int4 check (camera_heading between 0 and 360),
  detection_distance float8 check (detection_distance >= 0),
  
  -- Bait and features (Wildlife Insights compatibility)
  bait_type text check (bait_type in ('None', 'Scent', 'Meat', 'Visual', 'Acoustic', 'Other')),
  bait_description text,
  feature_type text check (feature_type in (
    'None', 'Road paved', 'Road dirt', 'Trail hiking', 'Trail game',
    'Road underpass', 'Road overpass', 'Road bridge', 'Culvert',
    'Burrow', 'Nest site', 'Carcass', 'Water source', 'Fruiting tree', 'Other'
  )),
  feature_type_methodology text,
  
  -- Events and grouping (Wildlife Insights: event_name, subproject_name)
  event_name text,
  event_description text,
  event_type text check (event_type in ('None', 'Temporal', 'Spatial', 'Both')),
  subproject_name text,
  subproject_design text,
  
  -- Additional metadata
  setup_by text,
  timestamp_issues boolean default false,
  habitat text,
  deployment_groups text,
  deployment_tags text,
  deployment_comments text,
  
  -- Audit fields
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Constraints
  constraint deployment_dates_check check (
    deployment_end is null or deployment_end > deployment_start
  ),
  constraint camera_positioning_check check (
    (camera_height is not null and camera_depth is null) or 
    (camera_height is null and camera_depth is not null) or 
    (camera_height is null and camera_depth is null)
  )
);

-- Add comments for documentation
comment on table deployments is 'Camera trap deployments table - aligns with Camtrap DP and Wildlife Insights standards';
comment on column deployments.deployment_id is 'Unique deployment identifier (Wildlife Insights: deployment_id)';
comment on column deployments.project_id is 'Reference to projects table (Wildlife Insights: project_id)';
comment on column deployments.location_id is 'Location identifier (Wildlife Insights: placename)';
comment on column deployments.latitude is 'Latitude in decimal degrees WGS84 (Wildlife Insights: latitude)';
comment on column deployments.longitude is 'Longitude in decimal degrees WGS84 (Wildlife Insights: longitude)';
comment on column deployments.geom is 'PostGIS geometry point for spatial queries';
comment on column deployments.deployment_start is 'Deployment start date/time (Wildlife Insights: start_date)';
comment on column deployments.deployment_end is 'Deployment end date/time (Wildlife Insights: end_date) - nullable for ongoing deployments';
comment on column deployments.camera_id is 'Camera identifier';
comment on column deployments.quiet_period is 'Time between triggers in seconds (Wildlife Insights: quiet_period)';
comment on column deployments.bait_type is 'Type of bait used (Wildlife Insights: bait_type)';
comment on column deployments.feature_type is 'Associated feature type (Wildlife Insights: feature_type)';
comment on column deployments.event_name is 'Event grouping (Wildlife Insights: event_name)';

-- Create indexes for performance
create index if not exists deployments_project_idx on deployments(project_id);
create index if not exists deployments_location_idx on deployments(location_id);
create index if not exists deployments_camera_idx on deployments(camera_id);
create index if not exists deployments_event_idx on deployments(event_name);
create index if not exists deployments_dates_idx on deployments(deployment_start, deployment_end);
create index if not exists deployments_geom_idx on deployments using gist(geom);

-- Add RLS (Row Level Security) policies
alter table deployments enable row level security;

-- Policy: Users can view deployments for projects they have access to
create policy "Users can view deployments" on deployments
  for select using (true);

-- Policy: Authenticated users can create deployments
create policy "Authenticated users can create deployments" on deployments
  for insert with check (auth.role() = 'authenticated');

-- Policy: Authenticated users can update deployments
create policy "Authenticated users can update deployments" on deployments
  for update using (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete deployments
create policy "Authenticated users can delete deployments" on deployments
  for delete using (auth.role() = 'authenticated');

-- Insert a sample deployment for testing
insert into deployments (
  deployment_id,
  project_id,
  location_id,
  location_name,
  latitude,
  longitude,
  deployment_start,
  deployment_end,
  camera_id,
  camera_model,
  quiet_period,
  bait_type,
  feature_type,
  setup_by,
  habitat
) values (
  'test-deployment-001',
  'camtrap-field-ops',
  'loc-001',
  'Test Location 1',
  52.70442,
  23.84995,
  '2024-01-01 06:00:00+00',
  '2024-02-01 18:00:00+00',
  'CAM-001',
  'Reconyx-PC800',
  120,
  'None',
  'Trail hiking',
  'Test User',
  'Mixed temperate forest'
) on conflict (deployment_id) do nothing; 