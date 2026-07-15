package com.last_island.api.domain.user.dto;

public record LeaderboardEntryResponse(
        int position,
        String name,
        int wins,
        double winRate,
        String rank,
        long bounty,
        boolean isCurrentUser,
        String avatar
) {
}
