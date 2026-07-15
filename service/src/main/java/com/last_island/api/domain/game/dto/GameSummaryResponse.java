package com.last_island.api.domain.game.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record GameSummaryResponse(
        UUID id,
        String token,
        String bluePlayerName,
        String bluePlayerAvatar,
        long bluePlayerBounty,
        String bluePlayerRank,
        LocalDateTime createdAt
) {
}
