package com.last_island.api.domain.game.dto;

import com.last_island.api.domain.board.dto.MyBoardResponse;
import com.last_island.api.domain.board.dto.OpponentBoardResponse;

import java.time.LocalDateTime;
import java.util.UUID;

public record GameStateResponse(UUID id, String token, String phase, String bluePlayerName,
                                String bluePlayerAvatar, String redPlayerName, String redPlayerAvatar,
                                String bluePlayerRank, String redPlayerRank,
                                Long bluePlayerBounty, Long redPlayerBounty,
                                Integer bluePlayerWins, Integer redPlayerWins,
                                Integer bluePlayerAccuracy, Integer redPlayerAccuracy,
                                Long bountyDelta,
                                String currentTurnPlayerName, String winnerName,
                                LocalDateTime startedAt, LocalDateTime endedAt, LocalDateTime turnStartedAt,
                                LocalDateTime createdAt,
                                MyBoardResponse myBoard, OpponentBoardResponse opponentBoard,
                                Integer bluePlayerObservation, Integer bluePlayerArmament,
                                Integer bluePlayerConquerors,
                                Integer redPlayerObservation, Integer redPlayerArmament,
                                Integer redPlayerConquerors,
                                Integer observationUsesRemaining, Integer observationUsesConsumed,
                                Integer conquerorsUsesRemaining, Integer conquerorsUsesConsumed,
                                Integer conquerorsCooldownTurns, Boolean hakiUsedThisTurn) {
}
