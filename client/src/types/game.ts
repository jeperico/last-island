// ─── Union-type enums ────────────────────────────────────────────────────────

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

export type GamePhase =
  | "WAITING_OPPONENT"
  | "PLACING_SHIPS"
  | "IN_PROGRESS"
  | "FINISHED"
  | "CANCELLED";

export type ShipType =
  | "THOUSAND_SUNNY"
  | "MOBY_DICK"
  | "RED_FORCE"
  | "POLAR_TANG"
  | "STRIKER";

export type Orientation = "HORIZONTAL" | "VERTICAL";

export type ShotResult = "HIT" | "MISS" | "SUNK";

export type HakiType = "OBSERVATION" | "ARMAMENT" | "CONQUERORS";
