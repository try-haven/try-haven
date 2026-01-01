-- Add location fields to manager profiles
-- These represent the location of the apartment complex the manager represents

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT;

COMMENT ON COLUMN profiles.city IS 'City where the apartment complex is located (for managers)';
COMMENT ON COLUMN profiles.state IS 'State where the apartment complex is located (for managers)';
COMMENT ON COLUMN profiles.neighborhood IS 'Neighborhood where the apartment complex is located (for managers)';

-- For demo-manager, set default values
UPDATE profiles
SET city = 'New York',
    state = 'NY',
    neighborhood = 'Manhattan'
WHERE username = 'demo-manager' AND (city IS NULL OR city = '');
