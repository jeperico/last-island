import { check, group } from 'k6';
import { sleep } from 'k6';
import {
  AVATARS,
  HAKI_USAGE_PROBABILITY,
  PAIRING_TIMEOUT_S,
  PLACEMENT_TIMEOUT_S,
  TURN_POLL_TIMEOUT_S,
} from '../config.js';
import { authGet, authPost, authPut } from '../helpers/http.js';
import { registerUser } from '../helpers/auth.js';
import { getRandomPlacement } from '../helpers/ships.js';
import { createShotQueue } from '../helpers/shots.js';
import {
  thinkAfterAuth,
  thinkAfterSettings,
  thinkMatchmaking,
  thinkPlacement,
  thinkBattleTurn,
  thinkHakiDecision,
  thinkConsecutiveShot,
  pollDelay,
} from '../helpers/delays.js';

/**
 * Run the full game flow as a CREATOR (odd VU).
 * Creates a game and waits for an opponent to join.
 */
export function runGameAsCreator(vuId, iteration) {
  // --- Auth phase ---
  const user = group('auth', () => {
    const u = registerUser(vuId, iteration);
    if (u) thinkAfterAuth();
    return u;
  });

  if (!user) {
    console.error(`[VU${vuId}] Auth failed, aborting.`);
    return;
  }

  // --- Settings phase ---
  group('settings', () => {
    const newAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const res = authPut('/users/me', { avatar: newAvatar }, user.accessToken);
    check(res, { 'avatar update 200': (r) => r.status === 200 });
    thinkAfterSettings();
  });

  // --- Create game ---
  let gameToken = null;
  group('create_game', () => {
    const res = authPost('/games', {}, user.accessToken);
    const created = check(res, {
      'create game 201': (r) => r.status === 201,
      'create game has token': (r) => r.json() && r.json().token,
    });
    if (created) {
      gameToken = res.json().token;
    }
  });

  if (!gameToken) {
    console.error(`[VU${vuId}] Game creation failed, aborting.`);
    return;
  }

  // --- Wait for opponent to join (poll until PLACING_SHIPS) ---
  let gameReady = false;
  group('wait_for_opponent', () => {
    const deadline = Date.now() + PAIRING_TIMEOUT_S * 1000;
    while (Date.now() < deadline) {
      const res = authGet(`/games/${gameToken}`, user.accessToken);
      if (res.status === 200) {
        const state = res.json();
        if (state.phase === 'PLACING_SHIPS' || state.phase === 'IN_PROGRESS') {
          gameReady = true;
          break;
        }
      }
      pollDelay();
    }
    check(null, { 'opponent joined': () => gameReady });
  });

  if (!gameReady) {
    console.warn(`[VU${vuId}] No opponent joined within timeout.`);
    return;
  }

  thinkMatchmaking();

  // --- Shared game phases ---
  runPlacementAndBattle(vuId, gameToken, user);
}

/**
 * Run the full game flow as a JOINER (even VU).
 * Lists available games and joins the first one found.
 */
export function runGameAsJoiner(vuId, iteration) {
  // --- Auth phase ---
  const user = group('auth', () => {
    const u = registerUser(vuId, iteration);
    if (u) thinkAfterAuth();
    return u;
  });

  if (!user) {
    console.error(`[VU${vuId}] Auth failed, aborting.`);
    return;
  }

  // --- Settings phase ---
  group('settings', () => {
    const newAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const res = authPut('/users/me', { avatar: newAvatar }, user.accessToken);
    check(res, { 'avatar update 200': (r) => r.status === 200 });
    thinkAfterSettings();
  });

  // --- Find and join a game ---
  let gameToken = null;
  group('join_game', () => {
    const deadline = Date.now() + PAIRING_TIMEOUT_S * 1000;
    while (Date.now() < deadline) {
      const res = authGet('/games?page=0&size=20', user.accessToken);
      if (res.status === 200) {
        const data = res.json();
        const games = data.content || [];
        // Find a WAITING_OPPONENT game to join
        for (const game of games) {
          const joinRes = authPost(`/games/${game.token}`, {}, user.accessToken, { expectedStatuses: [400, 409] });
          if (joinRes.status === 200) {
            gameToken = game.token;
            break;
          }
          // 409/400 means someone else joined — try next
        }
        if (gameToken) break;
      }
      pollDelay();
    }
    check(null, { 'joined a game': () => gameToken !== null });
  });

  if (!gameToken) {
    console.warn(`[VU${vuId}] Could not find/join a game within timeout.`);
    return;
  }

  thinkMatchmaking();

  // --- Shared game phases ---
  runPlacementAndBattle(vuId, gameToken, user);
}

/**
 * Shared placement + battle logic for both creator and joiner.
 */
function runPlacementAndBattle(vuId, gameToken, user) {
  // --- Placement phase ---
  group('place_ships', () => {
    thinkPlacement();
    const placement = getRandomPlacement();
    const res = authPost(`/games/${gameToken}/place-ships`, placement, user.accessToken);
    check(res, {
      'place ships success': (r) => r.status === 200 || r.status === 201,
    });
    if (res.status !== 200 && res.status !== 201) {
      console.error(`[VU${vuId}] Place ships failed: ${res.status} - ${res.body}`);
    }
  });

  // --- Wait for both players to place (poll until IN_PROGRESS) ---
  let battleReady = false;
  group('wait_for_battle', () => {
    const deadline = Date.now() + PLACEMENT_TIMEOUT_S * 1000;
    while (Date.now() < deadline) {
      const res = authGet(`/games/${gameToken}`, user.accessToken);
      if (res.status === 200) {
        const state = res.json();
        if (state.phase === 'IN_PROGRESS') {
          battleReady = true;
          break;
        }
        if (state.phase === 'FINISHED' || state.phase === 'CANCELLED') {
          // Game ended during placement (opponent cancelled/surrendered)
          break;
        }
      }
      pollDelay();
    }
    check(null, { 'battle started': () => battleReady });
  });

  if (!battleReady) {
    console.warn(`[VU${vuId}] Battle did not start (placement timeout or cancellation).`);
    return;
  }

  // --- Battle phase ---
  group('battle', () => {
    const shotQueue = createShotQueue();
    let hakiUsed = false;
    const shouldUseHaki = Math.random() < HAKI_USAGE_PROBABILITY;
    let gameOver = false;
    let shotCount = 0;

    while (!gameOver && shotQueue.length > 0) {
      // Poll game state to check whose turn it is
      const stateRes = authGet(`/games/${gameToken}`, user.accessToken);
      if (stateRes.status !== 200) {
        console.error(`[VU${vuId}] Get game state failed: ${stateRes.status}`);
        sleep(1);
        continue;
      }

      const state = stateRes.json();

      // Check if game is over
      if (state.phase === 'FINISHED' || state.phase === 'CANCELLED') {
        gameOver = true;
        break;
      }

      // Check if it's my turn
      if (state.current_turn_player_name !== user.userName) {
        // Not my turn — poll and wait
        const turnDeadline = Date.now() + TURN_POLL_TIMEOUT_S * 1000;
        let myTurn = false;
        while (Date.now() < turnDeadline) {
          pollDelay();
          const pollRes = authGet(`/games/${gameToken}`, user.accessToken);
          if (pollRes.status === 200) {
            const pollState = pollRes.json();
            if (pollState.phase === 'FINISHED' || pollState.phase === 'CANCELLED') {
              gameOver = true;
              break;
            }
            if (pollState.current_turn_player_name === user.userName) {
              myTurn = true;
              break;
            }
          }
        }
        if (gameOver) break;
        if (!myTurn) {
          // Turn timeout — re-poll from top
          continue;
        }
      }

      // --- Haki usage (before first shot, 30% chance) ---
      if (shouldUseHaki && !hakiUsed) {
        thinkHakiDecision();
        const hakiRow = Math.floor(Math.random() * 9); // Level 1 bounds: 0-8
        const hakiCol = Math.floor(Math.random() * 9);
        const hakiRes = authPost(`/games/${gameToken}/haki/observation`, {
          row: hakiRow,
          col: hakiCol,
          revealRowIndex: null,
          revealColIndex: null,
        }, user.accessToken, { expectedStatuses: [400, 409] });
        // Handle gracefully — 400/409 means already used or not your turn
        if (hakiRes.status === 200) {
          hakiUsed = true;
        }
      }

      // --- Fire shot ---
      thinkBattleTurn();
      const target = shotQueue.pop();
      const shotRes = authPost(`/games/${gameToken}/shots`, {
        row: target.row,
        col: target.col,
      }, user.accessToken, { expectedStatuses: [400, 409] });

      if (shotRes.status === 200) {
        shotCount++;
        const shotData = shotRes.json();

        if (shotData.game_over) {
          gameOver = true;
          break;
        }

        // If HIT or SUNK and still my turn, shoot again immediately
        const result = shotData.result;
        if ((result === 'HIT' || result === 'SUNK') && shotQueue.length > 0) {
          // Consecutive shot — keep shooting with brief delay
          let keepShooting = true;
          while (keepShooting && shotQueue.length > 0) {
            thinkConsecutiveShot();
            const nextTarget = shotQueue.pop();
            const nextRes = authPost(`/games/${gameToken}/shots`, {
              row: nextTarget.row,
              col: nextTarget.col,
            }, user.accessToken, { expectedStatuses: [400, 409] });

            if (nextRes.status === 200) {
              shotCount++;
              const nextData = nextRes.json();
              if (nextData.game_over) {
                gameOver = true;
                break;
              }
              const nextResult = nextData.result;
              if (nextResult !== 'HIT' && nextResult !== 'SUNK') {
                keepShooting = false; // MISS — turn passes
              }
            } else {
              // 409 = not your turn anymore, or other error
              keepShooting = false;
            }
          }
        }
      } else if (shotRes.status === 409 || shotRes.status === 400) {
        // Not my turn or already shot there — re-poll state
        continue;
      } else {
        console.error(`[VU${vuId}] Shot failed: ${shotRes.status} - ${shotRes.body}`);
        sleep(1);
      }
    }

    check(null, {
      'game completed': () => gameOver,
      'shots fired > 0': () => shotCount > 0,
    });
  });
}
