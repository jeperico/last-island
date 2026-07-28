// k6 load test configuration for Last Island
// All shared settings: base URL, stages, thresholds, think-times, avatars

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081/api/v1';

// --- Stage definitions ---

export const SMOKE_STAGES = {
  executor: 'per-vu-iterations',
  vus: 2,
  iterations: 1,
  maxDuration: '5m',
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
  http_req_failed: ['rate<0.05'],      // less than 5% failure rate
  checks: ['rate>0.95'],               // 95% of checks pass
};

// --- Think-time ranges (seconds) [min, max] ---

export const THINK_TIMES = {
  auth: [1, 2],
  settings: [1, 3],
  matchmaking: [2, 4],
  placement: [3, 5],
  battleTurn: [1, 3],
  hakiDecision: [2, 4],
  poll: [0.5, 1],
  consecutiveShot: [0.5, 1],
};

// --- Avatar options ---

export const AVATARS = ['LUFFY', 'ZORO', 'ROBIN', 'CHOPPER', 'ACE', 'USOPP'];

// --- Haki probability ---

export const HAKI_USAGE_PROBABILITY = 0.3; // 30% of users use observation haki

// --- Timeouts ---

export const PAIRING_TIMEOUT_S = 60;       // max seconds to wait for opponent
export const PLACEMENT_TIMEOUT_S = 60;     // max seconds to wait for both placements
export const TURN_POLL_TIMEOUT_S = 30;     // max seconds to wait for turn
