package com.last_island.api.domain.game.dto;

import java.util.UUID;

public record BattleLogEntryResponse(
        UUID gameId,
        String token,
        String opponentName,
        String result,
        String date,
        int shotsFired,
        long shipsSunk,
        String duration
) {
}
