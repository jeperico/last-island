import { apiGet, apiPost } from "./client";
import type {
  BattleLogEntryResponse,
  CreateGameResponse,
  GameStateResponse,
  GameSummaryResponse,
  JoinGameResponse,
  PageResponse,
  PaginationParams,
} from "./types";

export function createGame(): Promise<CreateGameResponse> {
  return apiPost<CreateGameResponse>("/api/games");
}

export function joinGame(token: string): Promise<JoinGameResponse> {
  return apiPost<JoinGameResponse>(`/api/games/${token}`);
}

export function listGames(
  params?: PaginationParams,
): Promise<PageResponse<GameSummaryResponse>> {
  const query: Record<string, string> | undefined = params
    ? Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      )
    : undefined;

  return apiGet<PageResponse<GameSummaryResponse>>("/api/games", query);
}

export function getGame(token: string): Promise<GameStateResponse> {
  return apiGet<GameStateResponse>(`/api/games/${token}`);
}

export function getBattleLog(params?: { page?: number; size?: number }): Promise<PageResponse<BattleLogEntryResponse>> {
  const query: Record<string, string> = {};
  if (params?.page !== undefined) query.page = String(params.page);
  if (params?.size !== undefined) query.size = String(params.size);
  return apiGet<PageResponse<BattleLogEntryResponse>>("/api/games/history", query);
}

export function surrender(token: string): Promise<void> {
  return apiPost<void>(`/api/games/${token}/surrender`);
}

export function cancelGame(token: string): Promise<void> {
  return apiPost<void>(`/api/games/${token}/cancel`);
}
