package com.last_island.api.domain.board.dto;

import java.util.List;

public record PlaceShipsRequest(List<ShipPlacementDto> ships) {}
