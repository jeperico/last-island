ALTER TABLE haki_battle_state
    ADD COLUMN conquerors_level INT NOT NULL DEFAULT 0,
    ADD COLUMN conquerors_uses_consumed INT NOT NULL DEFAULT 0,
    ADD COLUMN conquerors_cooldown_turns INT NOT NULL DEFAULT 0;
