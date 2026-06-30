package com.last_island.api.domain.game.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record GameResponse(
        UUID id,
        String token,
        String phase,
        String bluePlayerName,
        String redPlayerName,
        String currentTurnPlayerName,
        LocalDateTime startedAt,
        LocalDateTime createdAt
) {
}
