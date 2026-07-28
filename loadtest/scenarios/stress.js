/**
 * Stress test — ramp 10→100 VUs over 10 minutes, 50 concurrent games.
 *
 * Usage:
 *   k6 run --out experimental-prometheus-rw loadtest/scenarios/stress.js
 *
 * Environment variables:
 *   K6_PROMETHEUS_RW_SERVER_URL — Prometheus remote write endpoint
 *                                  (default: http://localhost:9090/api/v1/write)
 *   BASE_URL — API base URL (default: http://localhost:8081/api/v1)
 *
 * Pairing strategy:
 *   Odd __VU → creator (POST /games, then wait for opponent)
 *   Even __VU → joiner (GET /games listing, join first available)
 *
 * This naturally pairs VUs without shared state.
 */

import { STRESS_STAGES, THRESHOLDS } from '../config.js';
import { runGameAsCreator, runGameAsJoiner } from './game-flow.js';

export const options = {
  stages: STRESS_STAGES,
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
