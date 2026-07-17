ALTER TABLE haki_battle_state
    ADD COLUMN armament_level INT NOT NULL DEFAULT 0,
    ADD COLUMN armament_ship1_id UUID REFERENCES ships(id),
    ADD COLUMN armament_ship2_id UUID REFERENCES ships(id),
    ADD COLUMN armament_ship1_hits_absorbed INT NOT NULL DEFAULT 0,
    ADD COLUMN armament_ship2_hits_absorbed INT NOT NULL DEFAULT 0,
    ADD COLUMN opponent_skip_turns INT NOT NULL DEFAULT 0;
