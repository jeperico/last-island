package com.last_island.api.domain.board.mapper;

import com.last_island.api.domain.board.dto.BoardResponse;
import com.last_island.api.domain.board.dto.ShipResponse;
import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.board.entity.Ship;

import java.util.List;

public final class BoardMapper {

    private BoardMapper() {}

    public static BoardResponse toResponse(Board board, String gamePhase) {
        List<ShipResponse> ships = board.getShips().stream()
                .map(BoardMapper::toShipResponse)
                .toList();

        return new BoardResponse(
                board.getId(),
                board.getOwner().getName(),
                ships,
                gamePhase
        );
    }

    public static ShipResponse toShipResponse(Ship ship) {
        return new ShipResponse(
                ship.getType().name(),
                ship.getOrientation().name(),
                ship.getRow(),
                ship.getCol(),
                ship.getType().getSize()
        );
    }
}
