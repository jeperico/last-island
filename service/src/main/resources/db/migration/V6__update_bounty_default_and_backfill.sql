-- Update bounty default to 50,000,000 (50M — East Blue Super Rookie) and backfill existing users
ALTER TABLE users ALTER COLUMN bounty SET DEFAULT 50000000;

UPDATE users SET bounty = 50000000 WHERE bounty = 0 OR bounty = 1000;

UPDATE users SET rank = CASE
    WHEN filiation = 'PIRATE' THEN 'SUPER_ROOKIE'
    WHEN filiation = 'MARINE' THEN 'CAPTAIN'
END
WHERE bounty = 50000000;
