package com.last_island.api.domain.board.dto;

import com.last_island.api.domain.board.enums.ShotResult;

public record ShotCellResponse(int row, int col, ShotResult result, String sunkShipType) {
}
