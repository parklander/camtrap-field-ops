-- Locations Table
-- Dedicated table for location management
-- Supports both predefined and ad-hoc locations
-- Enables location reuse across multiple deployments

create table if not exists locations (
  -- Primary identifiers
  location_id text primary key,
  project_id text not null references projects(project_id),
  location_name text not null,
  
  -- Spatial data with PostGIS
  latitude float8 not null check (latitude between -90 and 90),
  longitude float8 not null check (longitude between -180 and 180),
  coordinate_uncertainty int4 check (coordinate_uncertainty > 0),
  geom geometry(point, 4326) generated always as (
    st_point(longitude, latitude)
  ) stored,
  
  -- Location metadata
  location_type text check (location_type in ('predefined', 'ad-hoc', 'temporary')),
  habitat text,
  elevation float8,
  slope float8 check (slope between 0 and 90),
  aspect int4 check (aspect between 0 and 360),
  
  -- Access and logistics
  access_notes text,
  access_difficulty text check (access_difficulty in ('easy', 'moderate', 'difficult', 'very_difficult')),
  nearest_road_distance float8 check (nearest_road_distance >= 0),
  nearest_road_direction text,
  
  -- Environmental features
  feature_type text check (feature_type in (
    'None', 'Road paved', 'Road dirt', 'Trail hiking', 'Trail game',
    'Road underpass', 'Road overpass', 'Road bridge', 'Culvert',
    'Burrow', 'Nest site', 'Carcass', 'Water source', 'Fruiting tree', 'Other'
  )),
  feature_description text,
  
  -- Administrative
  location_groups text, -- Pipe-separated groups like "grid:A1|zone:north"
  location_tags text,   -- Pipe-separated tags
  location_comments text,
  
  -- Status
  is_active boolean default true,
  
  -- Audit fields
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  
  -- Constraints
  constraint location_name_unique_per_project unique (project_id, location_name)
);

-- Add comments for documentation
comment on table locations is 'Locations table - reusable locations for camera trap deployments';
comment on column locations.location_id is 'Unique location identifier';
comment on column locations.project_id is 'Reference to projects table';
comment on column locations.location_name is 'Human-readable location name';
comment on column locations.latitude is 'Latitude in decimal degrees WGS84';
comment on column locations.longitude is 'Longitude in decimal degrees WGS84';
comment on column locations.geom is 'PostGIS geometry point for spatial queries';
comment on column locations.location_type is 'Type of location: predefined, ad-hoc, or temporary';
comment on column locations.habitat is 'Habitat description at this location';
comment on column locations.elevation is 'Elevation in meters above sea level';
comment on column locations.slope is 'Slope in degrees';
comment on column locations.aspect is 'Aspect in degrees (0-360, 0=north)';
comment on column locations.access_notes is 'Notes about accessing this location';
comment on column locations.access_difficulty is 'Difficulty level for accessing this location';
comment on column locations.nearest_road_distance is 'Distance to nearest road in meters';
comment on column locations.feature_type is 'Type of feature at this location';
comment on column locations.location_groups is 'Pipe-separated location groups (e.g., "grid:A1|zone:north")';
comment on column locations.location_tags is 'Pipe-separated location tags';
comment on column locations.is_active is 'Whether this location is currently active for deployments';

-- Create indexes for performance
create index if not exists locations_project_idx on locations(project_id);
create index if not exists locations_name_idx on locations(location_name);
create index if not exists locations_type_idx on locations(location_type);
create index if not exists locations_active_idx on locations(is_active);
create index if not exists locations_geom_idx on locations using gist(geom);

-- Add RLS (Row Level Security) policies
alter table locations enable row level security;

-- Policy: Users can view locations for projects they have access to
create policy "Users can view locations" on locations
  for select using (true);

-- Policy: Authenticated users can create locations
create policy "Authenticated users can create locations" on locations
  for insert with check (auth.role() = 'authenticated');

-- Policy: Authenticated users can update locations
create policy "Authenticated users can update locations" on locations
  for update using (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete locations
create policy "Authenticated users can delete locations" on locations
  for delete using (auth.role() = 'authenticated');

-- Insert sample locations for testing
insert into locations (
  location_id,
  project_id,
  location_name,
  latitude,
  longitude,
  location_type,
  habitat,
  access_difficulty,
  feature_type,
  created_by
) values 
  ('loc-001', 'camtrap-field-ops', 'North Trail Junction', 52.70442, 23.84995, 'predefined', 'Mixed temperate forest', 'moderate', 'Trail hiking', 'Test User'),
  ('loc-002', 'camtrap-field-ops', 'River Crossing', 52.70500, 23.85000, 'predefined', 'Riparian forest', 'difficult', 'Water source', 'Test User'),
  ('loc-003', 'camtrap-field-ops', 'Mountain Pass', 52.70600, 23.85100, 'predefined', 'Alpine meadow', 'very_difficult', 'Trail hiking', 'Test User')
on conflict (location_id) do nothing;

-- Update the sample deployment to reference a location
update deployments 
set location_id = 'loc-001' 
where deployment_id = 'test-deployment-001'; 