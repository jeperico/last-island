package com.last_island.api.domain.board.mapper;

import com.last_island.api.domain.board.dto.*;
import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.board.entity.Ship;
import com.last_island.api.domain.board.entity.Shot;
import com.last_island.api.domain.board.enums.Orientation;
import com.last_island.api.domain.board.enums.ShotResult;

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

    public static MyBoardResponse toMyBoardResponse(Board board) {
        List<ShipResponse> ships = board.getShips().stream()
                .map(BoardMapper::toShipResponse)
                .toList();

        List<ShotCellResponse> shotsReceived = board.getShots().stream()
                .map(shot -> toShotCellResponse(shot, board))
                .toList();

        return new MyBoardResponse(
                board.getId(),
                board.getOwner().getName(),
                ships,
                shotsReceived
        );
    }

    public static OpponentBoardResponse toOpponentBoardResponse(Board board) {
        return toOpponentBoardResponse(board, false);
    }

    public static OpponentBoardResponse toOpponentBoardResponse(Board board, boolean revealShips) {
        List<ShotCellResponse> shotsFired = board.getShots().stream()
                .map(shot -> toShotCellResponse(shot, board))
                .toList();
        List<ShipResponse> ships = revealShips
                ? board.getShips().stream().map(BoardMapper::toShipResponse).toList()
                : null;
        return new OpponentBoardResponse(board.getId(), board.getOwner().getName(), shotsFired, ships);
    }

    public static ShotCellResponse toShotCellResponse(Shot shot, Board board) {
        String sunkShipType = null;
        if (shot.getResult() == ShotResult.SUNK) {
            sunkShipType = findSunkShipTypeAt(shot.getRow(), shot.getCol(), board);
        }
        return new ShotCellResponse(shot.getRow(), shot.getCol(), shot.getResult(), sunkShipType);
    }

    public static ShipResponse toShipResponse(Ship ship) {
        return new ShipResponse(
                ship.getId(),
                ship.getType().name(),
                ship.getOrientation().name(),
                ship.getRow(),
                ship.getCol(),
                ship.getType().getSize()
        );
    }

    private static String findSunkShipTypeAt(int row, int col, Board board) {
        for (Ship ship : board.getShips()) {
            int size = ship.getType().getSize();
            for (int i = 0; i < size; i++) {
                int cellRow = ship.getRow() + (ship.getOrientation() == Orientation.VERTICAL ? i : 0);
                int cellCol = ship.getCol() + (ship.getOrientation() == Orientation.HORIZONTAL ? i : 0);
                if (cellRow == row && cellCol == col) {
                    return ship.getType().name();
                }
            }
        }
        return null;
    }
}
