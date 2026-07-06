import type { ShotResult } from "./game";

export type GameEventType =
  | "CONNECTED"
  | "OPPONENT_JOINED"
  | "SHIPS_PLACED"
  | "SHOT_RECEIVED"
  | "GAME_OVER";

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

export interface GameEventHandlers {
  onConnected?: (data: ConnectedEventData) => void;
  onOpponentJoined?: (data: OpponentJoinedEventData) => void;
  onShipsPlaced?: (data: ShipsPlacedEventData) => void;
  onShotReceived?: (data: ShotReceivedEventData) => void;
  onGameOver?: (data: GameOverEventData) => void;
  onError?: (error: Event) => void;
}
