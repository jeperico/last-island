import { sleep } from 'k6';
import { THINK_TIMES } from '../config.js';

/**
 * Sleep for a random duration within [min, max] seconds.
 */
function randomSleep(min, max) {
  sleep(Math.random() * (max - min) + min);
}

/** Think-time after authentication (register/login): 1-2s */
export function thinkAfterAuth() {
  randomSleep(THINK_TIMES.auth[0], THINK_TIMES.auth[1]);
}

/** Think-time after settings update: 1-3s */
export function thinkAfterSettings() {
  randomSleep(THINK_TIMES.settings[0], THINK_TIMES.settings[1]);
}

/** Think-time during matchmaking/waiting: 2-4s */
export function thinkMatchmaking() {
  randomSleep(THINK_TIMES.matchmaking[0], THINK_TIMES.matchmaking[1]);
}

/** Think-time before placing ships: 3-5s */
export function thinkPlacement() {
  randomSleep(THINK_TIMES.placement[0], THINK_TIMES.placement[1]);
}

/** Think-time between battle turns: 1-3s */
export function thinkBattleTurn() {
  randomSleep(THINK_TIMES.battleTurn[0], THINK_TIMES.battleTurn[1]);
}

/** Think-time for haki decision: 2-4s */
export function thinkHakiDecision() {
  randomSleep(THINK_TIMES.hakiDecision[0], THINK_TIMES.hakiDecision[1]);
}

/** Short delay for polling loops: 0.5-1s */
export function pollDelay() {
  randomSleep(THINK_TIMES.poll[0], THINK_TIMES.poll[1]);
}

/** Short delay between consecutive shots (hit → shoot again): 0.5-1s */
export function thinkConsecutiveShot() {
  randomSleep(THINK_TIMES.consecutiveShot[0], THINK_TIMES.consecutiveShot[1]);
}
