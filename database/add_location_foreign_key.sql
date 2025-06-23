-- Add Foreign Key Constraint: deployments.location_id -> locations.location_id
-- This ensures data integrity and proper relationships between deployments and locations

-- Add the foreign key constraint
alter table deployments 
add constraint deployments_location_id_fkey 
foreign key (location_id) references locations(location_id) 
on delete set null; -- If a location is deleted, set deployment.location_id to null

-- Add comment explaining the relationship
comment on column deployments.location_id is 'Reference to locations table - foreign key to locations(location_id)';

-- Create index on the foreign key for better performance
create index if not exists deployments_location_fk_idx on deployments(location_id);

-- Verify the constraint was added
-- You can check this in Supabase by looking at the table relationships 