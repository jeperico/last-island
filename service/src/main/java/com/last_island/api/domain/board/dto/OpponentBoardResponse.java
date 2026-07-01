package com.last_island.api.domain.board.dto;

import java.util.List;
import java.util.UUID;

public record OpponentBoardResponse(UUID boardId, String ownerName, List<ShotCellResponse> shotsFired) {
}
