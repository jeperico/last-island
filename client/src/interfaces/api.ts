import type {
  Filiation,
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
  filiation: Filiation;
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
  filiation: Filiation;
  rank: string;
  bounty: number;
  wins: number;
  losses: number;
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
  currentTurnPlayerName: string | null;
  winnerName: string | null;
  startedAt: string | null;
  endedAt: string | null;
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
