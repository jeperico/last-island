// ─── Union-type enums ────────────────────────────────────────────────────────

export type Filiation = "PIRATE" | "MARINE";

export type PirateRank =
  | "CAPTAIN"
  | "FIRST_MATE"
  | "NAVIGATOR"
  | "SNIPER"
  | "COOK"
  | "DOCTOR"
  | "SHIPWRIGHT"
  | "MUSICIAN"
  | "HELMSMAN";

export type MarineRank =
  | "FLEET_ADMIRAL"
  | "ADMIRAL"
  | "VICE_ADMIRAL"
  | "REAR_ADMIRAL"
  | "CAPTAIN"
  | "COMMANDER"
  | "LIEUTENANT_COMMANDER"
  | "LIEUTENANT"
  | "ENSIGN";

export type GamePhase =
  | "WAITING_OPPONENT"
  | "PLACING_SHIPS"
  | "IN_PROGRESS"
  | "FINISHED";

export type ShipType =
  | "THOUSAND_SUNNY"
  | "MOBY_DICK"
  | "RED_FORCE"
  | "POLAR_TANG"
  | "STRIKER"
  | "BUSTER_CALL"
  | "WARSHIP"
  | "BATTLESHIP"
  | "CRUISER"
  | "CUTTER";

export type Orientation = "HORIZONTAL" | "VERTICAL";

export type ShotResult = "HIT" | "MISS" | "SUNK";

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

export interface RefreshRequest {
  refreshToken: string;
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
  accessToken: string;
  refreshToken: string;
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
  token: string;
  phase: GamePhase;
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

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

// ─── Error shape ─────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}
