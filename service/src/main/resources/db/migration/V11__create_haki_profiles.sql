CREATE TABLE haki_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    haki_points INT NOT NULL DEFAULT 0,
    haki_points_available INT NOT NULL DEFAULT 0,
    observation_level INT NOT NULL DEFAULT 0 CHECK (observation_level BETWEEN 0 AND 3),
    armament_level INT NOT NULL DEFAULT 0 CHECK (armament_level BETWEEN 0 AND 3),
    conquerors_level INT NOT NULL DEFAULT 0 CHECK (conquerors_level BETWEEN 0 AND 3),
    bounty_milestones_reached INT NOT NULL DEFAULT 0 CHECK (bounty_milestones_reached BETWEEN 0 AND 16),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create profiles for all existing users
INSERT INTO haki_profiles (user_id)
SELECT id FROM users;
