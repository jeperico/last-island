import type { ShotResult } from "./game";

export type GameEventType =
  | "CONNECTED"
  | "OPPONENT_JOINED"
  | "SHIPS_PLACED"
  | "SHOT_RECEIVED"
  | "GAME_OVER"
  | "TURN_EXPIRED"
  | "GAME_EXPIRED"
  | "SURRENDER";

export interface ConnectedEventData {}

export interface OpponentJoinedEventData {
  joinerName: string;
}

export interface ShipsPlacedEventData {
  gameStarted?: boolean;
}

export interface ShotReceivedEventData {
  row: number;
  col: number;
  result: ShotResult;
  isMyTurn: boolean;
  sunkShipType?: string | null;
}

export interface GameOverEventData {
  winnerName: string;
}

export interface TurnExpiredEventData {
  newTurnPlayerName: string;
}

export interface GameExpiredEventData {
  [key: string]: never;
}

export interface SurrenderEventData {
  surrenderedPlayerName: string;
}

export interface GameEventHandlers {
  onConnected?: (data: ConnectedEventData) => void;
  onOpponentJoined?: (data: OpponentJoinedEventData) => void;
  onShipsPlaced?: (data: ShipsPlacedEventData) => void;
  onShotReceived?: (data: ShotReceivedEventData) => void;
  onGameOver?: (data: GameOverEventData) => void;
  onTurnExpired?: (data: TurnExpiredEventData) => void;
  onGameExpired?: (data: GameExpiredEventData) => void;
  onSurrender?: (data: SurrenderEventData) => void;
  onError?: (error: Event) => void;
}

// Lobby SSE event types

export type LobbyEventType =
  | "LOBBY_CONNECTED"
  | "GAME_CREATED"
  | "GAME_REMOVED";

export interface GameCreatedEventData {
  token: string;
  bluePlayerName: string;
  createdAt: string;
}

export interface GameRemovedEventData {
  token: string;
}

export interface LobbyEventHandlers {
  onGameCreated?: (data: GameCreatedEventData) => void;
  onGameRemoved?: (data: GameRemovedEventData) => void;
  onError?: (error: Event) => void;
}
