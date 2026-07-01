package com.last_island.api.domain.board.dto;

import com.last_island.api.domain.board.enums.Orientation;
import com.last_island.api.domain.board.enums.ShipType;

public record ShipPlacementDto(ShipType type, Orientation orientation, int row, int col) {}
