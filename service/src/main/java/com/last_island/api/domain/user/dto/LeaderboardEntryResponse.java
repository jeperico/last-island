package com.last_island.api.domain.user.dto;

public record LeaderboardEntryResponse(
        int position,
        String name,
        String filiation,
        int wins,
        String rank,
        boolean isCurrentUser
) {
}
