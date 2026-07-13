import { apiGet } from "./client";
import type { LeaderboardResponse } from "./types";

export function getLeaderboard(filiation: string): Promise<LeaderboardResponse> {
  return apiGet<LeaderboardResponse>("/api/users/leaderboard", { filiation });
}
