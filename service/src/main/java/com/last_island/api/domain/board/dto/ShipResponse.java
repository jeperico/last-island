package com.last_island.api.domain.board.dto;

import java.util.UUID;

public record ShipResponse(UUID id, String type, String orientation, int row, int col, int size) {}
