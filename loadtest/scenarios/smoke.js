/**
 * Smoke test — 2 VUs (1 game), validates full end-to-end flow.
 *
 * Usage:
 *   k6 run loadtest/scenarios/smoke.js
 *
 * VU 1 (odd) → creator: creates a game and waits for opponent.
 * VU 2 (even) → joiner: finds and joins an available game.
 */

import { THRESHOLDS } from '../config.js';
import { runGameAsCreator, runGameAsJoiner } from './game-flow.js';

export const options = {
  scenarios: {
    smoke: {
      executor: 'per-vu-iterations',
      vus: 2,
      iterations: 1,
      maxDuration: '5m',
    },
  },
  thresholds: THRESHOLDS,
};

export default function () {
  const vuId = __VU;
  const iteration = __ITER;

  if (vuId % 2 === 1) {
    // Odd VU → creator
    runGameAsCreator(vuId, iteration);
  } else {
    // Even VU → joiner
    runGameAsJoiner(vuId, iteration);
  }
}
