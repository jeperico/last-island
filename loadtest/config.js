// k6 load test configuration for Last Island
// All shared settings: base URL, stages, thresholds, think-times, avatars

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081/api/v1';

// --- Stage definitions ---

export const SMOKE_STAGES = {
  executor: 'per-vu-iterations',
  vus: 2,
  iterations: 1,
  maxDuration: '10m',
};

export const STRESS_STAGES = [
  { duration: '1m', target: 10 },   // ramp up to 10 VUs
  { duration: '2m', target: 50 },   // ramp to 50 VUs
  { duration: '3m', target: 100 },  // ramp to 100 VUs (50 concurrent games)
  { duration: '2m', target: 50 },   // ramp down to 50
  { duration: '2m', target: 0 },    // ramp down to 0
];

// --- Thresholds ---

export const THRESHOLDS = {
  http_req_duration: ['p(95)<500'],    // 95% of requests under 500ms
  http_req_failed: ['rate<0.10'],      // less than 10% unexpected failures
  checks: ['rate>0.95'],               // 95% of checks pass
};

// --- Think-time ranges (seconds) [min, max] ---
// Keep think-times short enough that players act within the 20s turn timer.

export const THINK_TIMES = {
  auth: [0.5, 1],
  settings: [0.5, 1],
  matchmaking: [0.5, 1],
  placement: [1, 2],
  battleTurn: [0.3, 1],
  hakiDecision: [0.5, 1],
  poll: [0.3, 0.7],
  consecutiveShot: [0.2, 0.5],
};

// --- Avatar options ---

export const AVATARS = ['LUFFY', 'ZORO', 'ROBIN', 'CHOPPER', 'ACE', 'USOPP'];

// --- Haki probability ---

export const HAKI_USAGE_PROBABILITY = 0.3; // 30% of users use observation haki

// --- Timeouts ---

export const PAIRING_TIMEOUT_S = 60;       // max seconds to wait for opponent
export const PLACEMENT_TIMEOUT_S = 60;     // max seconds to wait for both placements
export const TURN_POLL_TIMEOUT_S = 45;     // max seconds to wait for turn (>2 turn cycles at 20s)
