/**
 * Ship placement generator for k6 load tests.
 * Ships: THOUSAND_SUNNY(5), MOBY_DICK(4), RED_FORCE(3), POLAR_TANG(3), STRIKER(2)
 * Grid: 10x10 (rows 0-9, cols 0-9)
 * Orientations: HORIZONTAL, VERTICAL
 *
 * All placements are validated: no overlaps, within bounds.
 */

// Ship sizes for reference
export const SHIP_SIZES = {
  THOUSAND_SUNNY: 5,
  MOBY_DICK: 4,
  RED_FORCE: 3,
  POLAR_TANG: 3,
  STRIKER: 2,
};

// Placement A: all horizontal, stacked vertically
const PLACEMENT_A = {
  ships: [
    { type: 'THOUSAND_SUNNY', orientation: 'HORIZONTAL', row: 0, col: 0 }, // cols 0-4
    { type: 'MOBY_DICK', orientation: 'HORIZONTAL', row: 2, col: 0 },     // cols 0-3
    { type: 'RED_FORCE', orientation: 'HORIZONTAL', row: 4, col: 0 },     // cols 0-2
    { type: 'POLAR_TANG', orientation: 'HORIZONTAL', row: 6, col: 0 },    // cols 0-2
    { type: 'STRIKER', orientation: 'HORIZONTAL', row: 8, col: 0 },       // cols 0-1
  ],
};

// Placement B: all vertical, spread across columns
const PLACEMENT_B = {
  ships: [
    { type: 'THOUSAND_SUNNY', orientation: 'VERTICAL', row: 0, col: 0 },  // rows 0-4
    { type: 'MOBY_DICK', orientation: 'VERTICAL', row: 0, col: 2 },      // rows 0-3
    { type: 'RED_FORCE', orientation: 'VERTICAL', row: 0, col: 4 },      // rows 0-2
    { type: 'POLAR_TANG', orientation: 'VERTICAL', row: 0, col: 6 },     // rows 0-2
    { type: 'STRIKER', orientation: 'VERTICAL', row: 0, col: 8 },        // rows 0-1
  ],
};

// Placement C: mixed orientations, scattered
const PLACEMENT_C = {
  ships: [
    { type: 'THOUSAND_SUNNY', orientation: 'HORIZONTAL', row: 0, col: 5 }, // cols 5-9
    { type: 'MOBY_DICK', orientation: 'VERTICAL', row: 2, col: 0 },       // rows 2-5
    { type: 'RED_FORCE', orientation: 'HORIZONTAL', row: 9, col: 7 },     // cols 7-9
    { type: 'POLAR_TANG', orientation: 'VERTICAL', row: 6, col: 3 },      // rows 6-8
    { type: 'STRIKER', orientation: 'HORIZONTAL', row: 5, col: 8 },       // cols 8-9
  ],
};

// Placement D: diagonal pattern, mixed orientations
const PLACEMENT_D = {
  ships: [
    { type: 'THOUSAND_SUNNY', orientation: 'VERTICAL', row: 5, col: 9 },  // rows 5-9
    { type: 'MOBY_DICK', orientation: 'HORIZONTAL', row: 3, col: 6 },     // cols 6-9
    { type: 'RED_FORCE', orientation: 'VERTICAL', row: 0, col: 4 },       // rows 0-2
    { type: 'POLAR_TANG', orientation: 'HORIZONTAL', row: 7, col: 0 },    // cols 0-2
    { type: 'STRIKER', orientation: 'VERTICAL', row: 0, col: 7 },         // rows 0-1
  ],
};

// Placement E: center-heavy placement
const PLACEMENT_E = {
  ships: [
    { type: 'THOUSAND_SUNNY', orientation: 'HORIZONTAL', row: 4, col: 2 }, // cols 2-6
    { type: 'MOBY_DICK', orientation: 'VERTICAL', row: 0, col: 0 },       // rows 0-3
    { type: 'RED_FORCE', orientation: 'HORIZONTAL', row: 8, col: 0 },     // cols 0-2
    { type: 'POLAR_TANG', orientation: 'VERTICAL', row: 7, col: 9 },      // rows 7-9
    { type: 'STRIKER', orientation: 'HORIZONTAL', row: 1, col: 8 },       // cols 8-9
  ],
};

const PLACEMENTS = [PLACEMENT_A, PLACEMENT_B, PLACEMENT_C, PLACEMENT_D, PLACEMENT_E];

/**
 * Returns a random valid ship placement object (PlaceShipsRequest body).
 */
export function getRandomPlacement() {
  const index = Math.floor(Math.random() * PLACEMENTS.length);
  return PLACEMENTS[index];
}
