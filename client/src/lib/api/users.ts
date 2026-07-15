import { apiGet, apiPut } from "./client";
import type { LeaderboardResponse, UserResponse } from "./types";

export function getLeaderboard(): Promise<LeaderboardResponse> {
  return apiGet<LeaderboardResponse>("/api/users/leaderboard");
}

export function updateProfile(data: { avatar?: string | null }): Promise<UserResponse> {
  return apiPut<UserResponse>("/api/users/me", data);
}
