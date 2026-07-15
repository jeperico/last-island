-- Migrate marine ranks to pirate equivalents
UPDATE users SET rank = CASE rank
    WHEN 'SEAMAN' THEN 'ROOKIE'
    WHEN 'CAPTAIN' THEN 'SUPER_ROOKIE'
    WHEN 'COMMODORE' THEN 'SUPERNOVA'
    WHEN 'VICE_ADMIRAL' THEN 'SHICHIBUKAI'
    WHEN 'ADMIRAL' THEN 'YONKO'
    WHEN 'FLEET_ADMIRAL' THEN 'PIRATE_KING'
    ELSE rank
END;

-- Drop filiation column
ALTER TABLE users DROP COLUMN filiation;
