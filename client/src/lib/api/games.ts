import { apiGet, apiPost } from "./client";
import type {
  CreateGameResponse,
  GameResponse,
  GameSummaryResponse,
  PageResponse,
  PaginationParams,
} from "./types";

export function createGame(): Promise<CreateGameResponse> {
  return apiPost<CreateGameResponse>("/games");
}

export function joinGame(token: string): Promise<GameResponse> {
  return apiPost<GameResponse>(`/games/${token}`);
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

export function getGame(token: string): Promise<GameResponse> {
  return apiGet<GameResponse>(`/games/${token}`);
}
