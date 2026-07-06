// ─── Union-type enums ────────────────────────────────────────────────────────

export type Filiation = "PIRATE" | "MARINE";

export type PirateRank =
  | "CAPTAIN"
  | "FIRST_MATE"
  | "NAVIGATOR"
  | "SNIPER"
  | "COOK"
  | "DOCTOR"
  | "SHIPWRIGHT"
  | "MUSICIAN"
  | "HELMSMAN";

export type MarineRank =
  | "FLEET_ADMIRAL"
  | "ADMIRAL"
  | "VICE_ADMIRAL"
  | "REAR_ADMIRAL"
  | "CAPTAIN"
  | "COMMANDER"
  | "LIEUTENANT_COMMANDER"
  | "LIEUTENANT"
  | "ENSIGN";

export type GamePhase =
  | "WAITING_OPPONENT"
  | "PLACING_SHIPS"
  | "IN_PROGRESS"
  | "FINISHED";

export type ShipType =
  | "THOUSAND_SUNNY"
  | "MOBY_DICK"
  | "RED_FORCE"
  | "POLAR_TANG"
  | "STRIKER"
  | "BUSTER_CALL"
  | "WARSHIP"
  | "BATTLESHIP"
  | "CRUISER"
  | "CUTTER";

export type Orientation = "HORIZONTAL" | "VERTICAL";

export type ShotResult = "HIT" | "MISS" | "SUNK";
