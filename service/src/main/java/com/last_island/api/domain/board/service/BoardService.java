package com.last_island.api.domain.board.service;

import com.last_island.api.domain.board.dto.BoardResponse;
import com.last_island.api.domain.board.dto.PlaceShipsRequest;
import com.last_island.api.domain.board.dto.ShipPlacementDto;
import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.board.entity.Ship;
import com.last_island.api.domain.board.enums.Orientation;
import com.last_island.api.domain.board.enums.ShipType;
import com.last_island.api.domain.board.mapper.BoardMapper;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameRepository;
import com.last_island.api.domain.user.enums.Filiation;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BoardService {

    private final GameRepository gameRepository;

    public BoardService(GameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    @Transactional
    public BoardResponse placeShips(String token, UUID userId, PlaceShipsRequest request) {
        // 1. Fetch game
        Game game = gameRepository.findByTokenAndIsActiveTrue(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle not found"));

        // 2. Validate phase
        if (game.getPhase() != GamePhase.PLACING_SHIPS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This battle is not in the fleet deployment phase");
        }

        // 3. Identify player's board
        Board board;
        Board opponentBoard;
        if (game.getBlueBoard().getOwner().getId().equals(userId)) {
            board = game.getBlueBoard();
            opponentBoard = game.getRedBoard();
        } else if (game.getRedBoard().getOwner().getId().equals(userId)) {
            board = game.getRedBoard();
            opponentBoard = game.getBlueBoard();
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this battle");
        }

        // 4. Check ships not already placed
        if (!board.getShips().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Fleet already deployed");
        }

        // 5. Validate exactly 5 ships
        if (request.ships().size() != 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A fleet requires exactly 5 vessels");
        }

        // 6. Validate filiation match
        Filiation filiation = board.getOwner().getFiliation();
        Set<ShipType> requiredTypes = Arrays.stream(ShipType.values())
                .filter(t -> t.getFiliation() == filiation)
                .collect(Collectors.toSet());

        Set<ShipType> submittedTypes = request.ships().stream()
                .map(ShipPlacementDto::type)
                .collect(Collectors.toSet());

        if (!submittedTypes.equals(requiredTypes) || request.ships().size() != submittedTypes.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vessels must match your filiation fleet (no duplicates)");
        }

        // 7. Validate bounds
        for (ShipPlacementDto placement : request.ships()) {
            int row = placement.row();
            int col = placement.col();
            int size = placement.type().getSize();

            if (row < 0 || row > 9 || col < 0 || col > 9) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vessel position is off the sea chart");
            }

            if (placement.orientation() == Orientation.HORIZONTAL && col + size - 1 > 9) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vessel extends beyond the sea chart horizontally");
            }

            if (placement.orientation() == Orientation.VERTICAL && row + size - 1 > 9) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vessel extends beyond the sea chart vertically");
            }
        }

        // 8. Validate no overlaps
        Set<Integer> occupiedCells = new HashSet<>();
        for (ShipPlacementDto placement : request.ships()) {
            int size = placement.type().getSize();
            for (int i = 0; i < size; i++) {
                int cellRow = placement.row() + (placement.orientation() == Orientation.VERTICAL ? i : 0);
                int cellCol = placement.col() + (placement.orientation() == Orientation.HORIZONTAL ? i : 0);
                int cellKey = cellRow * 10 + cellCol;

                if (!occupiedCells.add(cellKey)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vessels cannot overlap");
                }
            }
        }

        // 9. Build Ship entities
        for (ShipPlacementDto placement : request.ships()) {
            Ship ship = Ship.builder()
                    .board(board)
                    .type(placement.type())
                    .orientation(placement.orientation())
                    .row(placement.row())
                    .col(placement.col())
                    .hits(0)
                    .build();
            board.getShips().add(ship);
        }

        // 10. Check if both players have placed → transition to IN_PROGRESS
        if (opponentBoard != null && !opponentBoard.getShips().isEmpty()) {
            game.setPhase(GamePhase.IN_PROGRESS);
            game.setStartedAt(LocalDateTime.now());
        }

        // 11. Save game (cascades board + ships)
        gameRepository.save(game);

        // 12. Return response
        return BoardMapper.toResponse(board, game.getPhase().name());
    }
}
