import { apiGet, apiPut } from "./client";
import type { Filiation, LeaderboardResponse, UserResponse } from "./types";

export function getLeaderboard(filiation: string): Promise<LeaderboardResponse> {
  return apiGet<LeaderboardResponse>("/api/users/leaderboard", { filiation });
}

export function updateProfile(data: { filiation?: Filiation | null; avatar?: string | null }): Promise<UserResponse> {
  return apiPut<UserResponse>("/api/users/me", data);
}
