package com.last_island.api.domain.board.dto;

import com.last_island.api.domain.board.enums.ShotResult;
import com.last_island.api.domain.haki.dto.CounterFireResult;

public record ShotResponse(ShotResult result, String sunkShipType, int row, int col, boolean gameOver,
                           String winnerName, boolean armamentTriggered, CounterFireResult counterFire,
                           String currentTurnPlayerName) {

    public ShotResponse(ShotResult result, String sunkShipType, int row, int col, boolean gameOver,
                        String winnerName) {
        this(result, sunkShipType, row, col, gameOver, winnerName, false, null, null);
    }
}
