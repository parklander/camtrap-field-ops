-- Projects Table
-- Aligns with Wildlife Insights project_id standard
-- Foundation table for all camera trap deployments

create table if not exists projects (
  project_id text primary key,
  project_name text not null,
  organization text,
  description text,
  study_area text,
  principal_investigator text,
  contact_email text,
  website text,
  funding_source text,
  license text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add comments for documentation
comment on table projects is 'Projects table - foundation for all camera trap deployments. Aligns with Wildlife Insights project_id standard.';
comment on column projects.project_id is 'Unique project identifier (Wildlife Insights: project_id)';
comment on column projects.project_name is 'Human-readable project name';
comment on column projects.organization is 'Organization responsible for the project';
comment on column projects.description is 'Detailed project description';
comment on column projects.study_area is 'Geographic description of study area';
comment on column projects.principal_investigator is 'Primary researcher or PI';
comment on column projects.contact_email is 'Primary contact email';
comment on column projects.website is 'Project website URL';
comment on column projects.funding_source is 'Source of funding';
comment on column projects.license is 'Data license information';

-- Create indexes for performance
create index if not exists projects_organization_idx on projects(organization);
create index if not exists projects_created_at_idx on projects(created_at);

-- Add RLS (Row Level Security) policies
alter table projects enable row level security;

-- Policy: Users can view projects they have access to
create policy "Users can view projects" on projects
  for select using (true);

-- Policy: Authenticated users can create projects
create policy "Authenticated users can create projects" on projects
  for insert with check (auth.role() = 'authenticated');

-- Policy: Project owners can update their projects
create policy "Project owners can update projects" on projects
  for update using (auth.role() = 'authenticated');

-- Insert a default project for testing
insert into projects (project_id, project_name, organization, description)
values (
  'camtrap-field-ops',
  'CamTrap Field Operations',
  'ParkLander',
  'Camera trap field operations management system for wildlife monitoring and data collection.'
) on conflict (project_id) do nothing; 