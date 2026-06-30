package com.last_island.api.domain.game.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CreateGameResponse(
        UUID id,
        String token,
        String phase,
        LocalDateTime createdAt
) {
}
