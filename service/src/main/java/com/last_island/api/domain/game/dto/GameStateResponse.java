package com.last_island.api.domain.game.dto;

import com.last_island.api.domain.board.dto.MyBoardResponse;
import com.last_island.api.domain.board.dto.OpponentBoardResponse;

import java.time.LocalDateTime;
import java.util.UUID;

public record GameStateResponse(UUID id, String token, String phase, String bluePlayerName,
                                String redPlayerName, String currentTurnPlayerName, String winnerName,
                                LocalDateTime startedAt, LocalDateTime endedAt, LocalDateTime turnStartedAt,
                                LocalDateTime createdAt,
                                MyBoardResponse myBoard, OpponentBoardResponse opponentBoard) {
}
