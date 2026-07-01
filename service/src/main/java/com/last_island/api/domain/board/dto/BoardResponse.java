package com.last_island.api.domain.board.dto;

import java.util.List;
import java.util.UUID;

public record BoardResponse(UUID boardId, String ownerName, List<ShipResponse> ships, String gamePhase) {}
