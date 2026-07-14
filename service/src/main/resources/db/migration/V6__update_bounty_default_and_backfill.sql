-- Update bounty default to 1000 (starting Elo) and backfill existing users
ALTER TABLE users ALTER COLUMN bounty SET DEFAULT 1000;

UPDATE users SET bounty = 1000 WHERE bounty = 0;

UPDATE users SET rank = CASE
    WHEN filiation = 'PIRATE' THEN 'SUPER_ROOKIE'
    WHEN filiation = 'MARINE' THEN 'CAPTAIN'
END
WHERE bounty = 1000;
