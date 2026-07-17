package com.last_island.api.domain.haki.dto;

import com.last_island.api.domain.board.enums.ShotResult;

public record CounterFireResult(ShotResult result, int row, int col, String sunkShipType) {
}
