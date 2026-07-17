CREATE TABLE haki_battle_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL UNIQUE REFERENCES boards(id),
    observation_uses_remaining INT NOT NULL DEFAULT 0,
    observation_uses_consumed INT NOT NULL DEFAULT 0,
    observation_level INT NOT NULL DEFAULT 0,
    conquerors_uses_remaining INT NOT NULL DEFAULT 0,
    haki_used_this_turn BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
