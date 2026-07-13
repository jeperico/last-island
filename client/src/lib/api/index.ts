export { register, login, refresh, logout, getProfile } from "./auth";
export { createGame, joinGame, listGames, getGame, getBattleLog } from "./games";
export { placeShips, fireShot } from "./board";
export { getLeaderboard } from "./users";
export { ApiError, attemptRefresh } from "./client";
export type {
  Filiation,
  PirateRank,
  MarineRank,
  GamePhase,
  ShipType,
  Orientation,
  ShotResult,
  RegisterRequest,
  LoginRequest,
  ShipPlacementDto,
  PlaceShipsRequest,
  ShotRequest,
  AuthResponse,
  UserResponse,
  CreateGameResponse,
  GameSummaryResponse,
  JoinGameResponse,
  GameStateResponse,
  MyBoardResponse,
  OpponentBoardResponse,
  ShotCellResponse,
  ShipResponse,
  BoardResponse,
  ShotResponse,
  BattleLogEntryResponse,
  LeaderboardEntryResponse,
  LeaderboardResponse,
  PageResponse,
  PaginationParams,
  ApiErrorResponse,
} from "./types";
