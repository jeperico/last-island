-- Update bounty default to 100,000,000 (100M — Super Rookie) and recalculate all ranks
ALTER TABLE users ALTER COLUMN bounty SET DEFAULT 100000000;

-- Backfill users still at old starting values
UPDATE users SET bounty = 100000000 WHERE bounty = 50000000;

-- Recalculate all ranks based on new thresholds
UPDATE users SET rank = CASE
    WHEN filiation = 'PIRATE' THEN
        CASE
            WHEN bounty >= 1500000000 THEN 'PIRATE_KING'
            WHEN bounty >= 800000000 THEN 'YONKO'
            WHEN bounty >= 400000000 THEN 'SHICHIBUKAI'
            WHEN bounty >= 200000000 THEN 'SUPERNOVA'
            WHEN bounty >= 100000000 THEN 'SUPER_ROOKIE'
            ELSE 'ROOKIE'
        END
    WHEN filiation = 'MARINE' THEN
        CASE
            WHEN bounty >= 1500000000 THEN 'FLEET_ADMIRAL'
            WHEN bounty >= 800000000 THEN 'ADMIRAL'
            WHEN bounty >= 400000000 THEN 'VICE_ADMIRAL'
            WHEN bounty >= 200000000 THEN 'COMMODORE'
            WHEN bounty >= 100000000 THEN 'CAPTAIN'
            ELSE 'SEAMAN'
        END
END;
