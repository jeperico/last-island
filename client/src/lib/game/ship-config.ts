import type { ShipType } from "@/lib/api/types";

export const SHIP_SIZES: Record<ShipType, number> = {
  THOUSAND_SUNNY: 5,
  MOBY_DICK: 4,
  RED_FORCE: 3,
  POLAR_TANG: 3,
  STRIKER: 2,
};

export const PIRATE_FLEET: ShipType[] = [
  "THOUSAND_SUNNY",
  "MOBY_DICK",
  "RED_FORCE",
  "POLAR_TANG",
  "STRIKER",
];

/** Alias — use FLEET for new code */
export const FLEET: ShipType[] = PIRATE_FLEET;

export const SHIP_DISPLAY_NAMES: Record<ShipType, string> = {
  THOUSAND_SUNNY: "Thousand Sunny",
  MOBY_DICK: "Moby Dick",
  RED_FORCE: "Red Force",
  POLAR_TANG: "Polar Tang",
  STRIKER: "Striker",
};
