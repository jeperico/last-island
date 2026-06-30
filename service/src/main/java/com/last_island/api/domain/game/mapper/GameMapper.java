package com.last_island.api.domain.game.mapper;

import com.last_island.api.domain.game.dto.CreateGameResponse;
import com.last_island.api.domain.game.dto.GameResponse;
import com.last_island.api.domain.game.dto.GameSummaryResponse;
import com.last_island.api.domain.game.entity.Game;

public final class GameMapper {

    private GameMapper() {
    }

    public static CreateGameResponse toCreateResponse(Game game) {
        return new CreateGameResponse(
                game.getId(),
                game.getToken(),
                game.getPhase().name(),
                game.getCreatedAt()
        );
    }

    public static GameResponse toResponse(Game game) {
        String redPlayerName = game.getRedBoard() != null
                ? game.getRedBoard().getOwner().getName()
                : null;

        String currentTurnPlayerName = game.getCurrentTurn() != null
                ? game.getCurrentTurn().getName()
                : null;

        return new GameResponse(
                game.getId(),
                game.getToken(),
                game.getPhase().name(),
                game.getBlueBoard().getOwner().getName(),
                redPlayerName,
                currentTurnPlayerName,
                game.getStartedAt(),
                game.getCreatedAt()
        );
    }

    public static GameSummaryResponse toSummaryResponse(Game game) {
        return new GameSummaryResponse(
                game.getId(),
                game.getToken(),
                game.getBlueBoard().getOwner().getName(),
                game.getCreatedAt()
        );
    }
}
