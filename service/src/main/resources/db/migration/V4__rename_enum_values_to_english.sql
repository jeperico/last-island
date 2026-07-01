-- Filiation (users.filiation column)
UPDATE users SET filiation = 'PIRATE' WHERE filiation = 'PIRATA';
UPDATE users SET filiation = 'MARINE' WHERE filiation = 'MARINHA';

-- PirateRank (users.rank column)
UPDATE users SET rank = 'YONKO' WHERE rank = 'YONKOU';
UPDATE users SET rank = 'PIRATE_KING' WHERE rank = 'REI_DOS_PIRATAS';

-- MarineRank (users.rank column) — all 7 old values mapped to 6 new values
UPDATE users SET rank = 'SEAMAN' WHERE rank = 'MARINHEIRO';
UPDATE users SET rank = 'CAPTAIN' WHERE rank = 'CABO';
UPDATE users SET rank = 'COMMODORE' WHERE rank = 'SARGENTO';
UPDATE users SET rank = 'VICE_ADMIRAL' WHERE rank = 'TENENTE';
UPDATE users SET rank = 'ADMIRAL' WHERE rank = 'VICE_ALMIRANTE';
UPDATE users SET rank = 'FLEET_ADMIRAL' WHERE rank = 'ALMIRANTE';
UPDATE users SET rank = 'FLEET_ADMIRAL' WHERE rank = 'ALMIRANTE_DE_FROTA';

-- ShipType (ships.type column)
UPDATE ships SET type = 'STRIKER' WHERE type = 'GOING_MERRY';
UPDATE ships SET type = 'WARSHIP' WHERE type = 'COURACADO';
UPDATE ships SET type = 'BATTLESHIP' WHERE type = 'FRAGATA';
UPDATE ships SET type = 'CRUISER' WHERE type = 'DESTROYER';
UPDATE ships SET type = 'CUTTER' WHERE type = 'PATRULHA';
