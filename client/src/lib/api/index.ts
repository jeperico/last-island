export { register, login, refresh, getProfile } from "./auth";
export { createGame, joinGame, listGames, getGame } from "./games";
export { placeShips, fireShot } from "./board";
export { ApiError, setTokenProvider } from "./client";
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
  RefreshRequest,
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
  PageResponse,
  PaginationParams,
  ApiErrorResponse,
} from "./types";
