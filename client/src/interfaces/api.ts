import type {
  ShipType,
  Orientation,
  ShotResult,
  GamePhase,
} from "@/types";

// ─── Request interfaces ──────────────────────────────────────────────────────

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  avatar?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ShipPlacementDto {
  type: ShipType;
  row: number;
  col: number;
  orientation: Orientation;
}

export interface PlaceShipsRequest {
  ships: ShipPlacementDto[];
}

export interface ShotRequest {
  row: number;
  col: number;
}

// ─── Response interfaces ─────────────────────────────────────────────────────

export interface AuthResponse {
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  rank: string;
  bounty: number;
  wins: number;
  losses: number;
  avatar: string | null;
}

export interface CreateGameResponse {
  id: string;
  token: string;
  phase: GamePhase;
  createdAt: string;
}

export interface GameSummaryResponse {
  id: string;
  token: string;
  bluePlayerName: string;
  createdAt: string;
}

export interface JoinGameResponse {
  id: string;
  token: string;
  phase: GamePhase;
  bluePlayerName: string;
  redPlayerName: string | null;
  currentTurnPlayerName: string | null;
  startedAt: string | null;
  createdAt: string;
}

export interface ShipResponse {
  type: ShipType;
  orientation: Orientation;
  row: number;
  col: number;
  size: number;
}

export interface ShotCellResponse {
  row: number;
  col: number;
  result: ShotResult;
  sunkShipType: string | null;
}

export interface MyBoardResponse {
  boardId: string;
  ownerName: string;
  ships: ShipResponse[];
  shotsReceived: ShotCellResponse[];
}

export interface OpponentBoardResponse {
  boardId: string;
  ownerName: string;
  shotsFired: ShotCellResponse[];
}

export interface BoardResponse {
  boardId: string;
  ownerName: string;
  ships: ShipResponse[];
  gamePhase: GamePhase;
}

export interface GameStateResponse {
  id: string;
  token: string;
  phase: GamePhase;
  bluePlayerName: string;
  redPlayerName: string | null;
  bluePlayerAvatar: string | null;
  redPlayerAvatar: string | null;
  bluePlayerRank: string | null;
  redPlayerRank: string | null;
  bluePlayerBounty: number | null;
  redPlayerBounty: number | null;
  bluePlayerWins: number | null;
  redPlayerWins: number | null;
  bluePlayerAccuracy: number | null;
  redPlayerAccuracy: number | null;
  bountyDelta: number | null;
  currentTurnPlayerName: string | null;
  winnerName: string | null;
  startedAt: string | null;
  endedAt: string | null;
  turnStartedAt: string | null;
  createdAt: string;
  myBoard: MyBoardResponse | null;
  opponentBoard: OpponentBoardResponse | null;
}

export interface ShotResponse {
  row: number;
  col: number;
  result: ShotResult;
  sunkShipType: string | null;
  gameOver: boolean;
  winnerName: string | null;
}

// ─── Error shape ─────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}

// ─── Battle Log ──────────────────────────────────────────────────────────────

export interface BattleLogEntryResponse {
  gameId: string;
  token: string;
  opponentName: string;
  result: "VICTORY" | "DEFEAT";
  date: string;
  shotsFired: number;
  shipsSunk: number;
  duration: string | null;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntryResponse {
  position: number;
  name: string;
  wins: number;
  winRate: number;
  rank: string;
  bounty: number;
  avatar: string | null;
  isCurrentUser: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntryResponse[];
  currentUserEntry: LeaderboardEntryResponse | null;
}
