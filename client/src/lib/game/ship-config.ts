import type { Filiation, ShipType } from "@/lib/api/types";

export const SHIP_SIZES: Record<ShipType, number> = {
  THOUSAND_SUNNY: 5,
  MOBY_DICK: 4,
  RED_FORCE: 3,
  POLAR_TANG: 3,
  STRIKER: 2,
  BUSTER_CALL: 5,
  WARSHIP: 4,
  BATTLESHIP: 3,
  CRUISER: 3,
  CUTTER: 2,
};

export const PIRATE_FLEET: ShipType[] = [
  "THOUSAND_SUNNY",
  "MOBY_DICK",
  "RED_FORCE",
  "POLAR_TANG",
  "STRIKER",
];

export const MARINE_FLEET: ShipType[] = [
  "BUSTER_CALL",
  "WARSHIP",
  "BATTLESHIP",
  "CRUISER",
  "CUTTER",
];

export const SHIP_DISPLAY_NAMES: Record<ShipType, string> = {
  THOUSAND_SUNNY: "Thousand Sunny",
  MOBY_DICK: "Moby Dick",
  RED_FORCE: "Red Force",
  POLAR_TANG: "Polar Tang",
  STRIKER: "Striker",
  BUSTER_CALL: "Buster Call",
  WARSHIP: "Warship",
  BATTLESHIP: "Battleship",
  CRUISER: "Cruiser",
  CUTTER: "Cutter",
};

export function getFleetForFiliation(filiation: Filiation): ShipType[] {
  return filiation === "PIRATE" ? PIRATE_FLEET : MARINE_FLEET;
}
