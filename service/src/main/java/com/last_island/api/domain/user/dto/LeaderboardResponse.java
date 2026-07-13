package com.last_island.api.domain.user.dto;

import java.util.List;

public record LeaderboardResponse(
        List<LeaderboardEntryResponse> entries,
        LeaderboardEntryResponse currentUserEntry
) {
}
