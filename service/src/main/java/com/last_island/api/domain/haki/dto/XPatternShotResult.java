package com.last_island.api.domain.haki.dto;

import com.last_island.api.domain.board.enums.ShotResult;

public record XPatternShotResult(int row, int col, ShotResult result, String sunkShipType) {
}
