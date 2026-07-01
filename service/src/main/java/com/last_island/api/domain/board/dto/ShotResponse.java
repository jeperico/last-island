package com.last_island.api.domain.board.dto;

import com.last_island.api.domain.board.enums.ShotResult;

public record ShotResponse(ShotResult result, String sunkShipType, int row, int col) {}
