import { apiGet, apiPost } from "./client";
import type {
  CreateGameResponse,
  GameStateResponse,
  GameSummaryResponse,
  JoinGameResponse,
  PageResponse,
  PaginationParams,
} from "./types";

export function createGame(): Promise<CreateGameResponse> {
  return apiPost<CreateGameResponse>("/games");
}

export function joinGame(token: string): Promise<JoinGameResponse> {
  return apiPost<JoinGameResponse>(`/games/${token}`);
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

  return apiGet<PageResponse<GameSummaryResponse>>("/games", query);
}

export function getGame(token: string): Promise<GameStateResponse> {
  return apiGet<GameStateResponse>(`/games/${token}`);
}
