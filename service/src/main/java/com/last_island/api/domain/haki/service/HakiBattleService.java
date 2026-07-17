package com.last_island.api.domain.haki.service;

import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.board.entity.Ship;
import com.last_island.api.domain.board.enums.Orientation;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameRepository;
import com.last_island.api.domain.haki.dto.ObservationRequest;
import com.last_island.api.domain.haki.dto.ObservationResponse;
import com.last_island.api.domain.haki.dto.RevealedCell;
import com.last_island.api.domain.haki.entity.HakiBattleState;
import com.last_island.api.domain.haki.entity.HakiProfile;
import com.last_island.api.domain.haki.enums.CellRevealStatus;
import com.last_island.api.domain.haki.repository.HakiBattleStateRepository;
import com.last_island.api.domain.haki.repository.HakiProfileRepository;
import com.last_island.api.infrastructure.sse.GameEventEmitter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
public class HakiBattleService {

    private final HakiBattleStateRepository hakiBattleStateRepository;
    private final HakiProfileRepository hakiProfileRepository;
    private final GameRepository gameRepository;
    private final GameEventEmitter gameEventEmitter;

    public HakiBattleService(HakiBattleStateRepository hakiBattleStateRepository,
                             HakiProfileRepository hakiProfileRepository,
                             GameRepository gameRepository,
                             GameEventEmitter gameEventEmitter) {
        this.hakiBattleStateRepository = hakiBattleStateRepository;
        this.hakiProfileRepository = hakiProfileRepository;
        this.gameRepository = gameRepository;
        this.gameEventEmitter = gameEventEmitter;
    }

    @Transactional
    public void initializeHakiBattleStates(Game game) {
        initializeForBoard(game.getBlueBoard());
        initializeForBoard(game.getRedBoard());
    }

    private void initializeForBoard(Board board) {
        UUID ownerId = board.getOwner().getId();
        HakiProfile profile = hakiProfileRepository.findByUserId(ownerId)
                .orElse(null);

        int observationLevel = (profile != null) ? profile.getObservationLevel() : 0;
        int usesRemaining = computeUsesRemaining(observationLevel);

        HakiBattleState state = HakiBattleState.builder()
                .boardId(board.getId())
                .observationUsesRemaining(usesRemaining)
                .observationUsesConsumed(0)
                .observationLevel(observationLevel)
                .conquerorsUsesRemaining(0)
                .hakiUsedThisTurn(false)
                .build();

        hakiBattleStateRepository.save(state);
    }

    private int computeUsesRemaining(int observationLevel) {
        return switch (observationLevel) {
            case 1 -> 1;
            case 2, 3 -> 2;
            default -> 0;
        };
    }

    @Transactional
    public ObservationResponse activateObservation(String token, UUID userId, ObservationRequest request) {
        // Fetch game
        Game game = gameRepository.findByTokenAndIsActiveTrue(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle not found"));

        // Validate phase
        if (game.getPhase() != GamePhase.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This battle is not in progress");
        }

        // Identify player/opponent boards
        Board playerBoard;
        Board opponentBoard;
        if (game.getBlueBoard().getOwner().getId().equals(userId)) {
            playerBoard = game.getBlueBoard();
            opponentBoard = game.getRedBoard();
        } else if (game.getRedBoard().getOwner().getId().equals(userId)) {
            playerBoard = game.getRedBoard();
            opponentBoard = game.getBlueBoard();
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this battle");
        }

        // Validate turn
        if (!game.getCurrentTurn().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "It's not your turn, wait for your opponent");
        }

        // Fetch player's HakiBattleState
        HakiBattleState state = hakiBattleStateRepository.findByBoardId(playerBoard.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Haki battle state not found"));

        // Validate haki not already used this turn
        if (state.isHakiUsedThisTurn()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You already used Haki this turn");
        }

        // Validate observation unlocked
        if (state.getObservationLevel() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observation Haki not unlocked");
        }

        // Validate uses remaining
        if (state.getObservationUsesRemaining() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No Observation Haki uses remaining");
        }

        // Determine effect level
        String effectLevel = determineEffectLevel(state);

        // Validate bounds
        int row = request.row();
        int col = request.col();

        if ("WEAK".equals(effectLevel)) {
            if (row < 0 || row + 1 > 9 || col < 0 || col + 1 > 9) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observation area extends beyond the sea chart");
            }
        } else {
            // STRONG or AWAKENED — 3×3
            if (row < 0 || row + 2 > 9 || col < 0 || col + 2 > 9) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observation area extends beyond the sea chart");
            }
        }

        // For AWAKENED: validate row/col reveal params
        if ("AWAKENED".equals(effectLevel)) {
            boolean hasRow = request.revealRowIndex() != null;
            boolean hasCol = request.revealColIndex() != null;
            if ((!hasRow && !hasCol) || (hasRow && hasCol)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Awakened observation requires exactly one of revealRowIndex or revealColIndex");
            }
            if (hasRow && (request.revealRowIndex() < 0 || request.revealRowIndex() > 9)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "revealRowIndex must be between 0 and 9");
            }
            if (hasCol && (request.revealColIndex() < 0 || request.revealColIndex() > 9)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "revealColIndex must be between 0 and 9");
            }
        }

        // Compute occupied cells on opponent board
        Set<Integer> occupiedCells = computeOccupiedCells(opponentBoard);

        // Compute revealed cells
        Set<Integer> revealedPositions = new LinkedHashSet<>();

        int areaSize = "WEAK".equals(effectLevel) ? 2 : 3;
        for (int r = row; r < row + areaSize; r++) {
            for (int c = col; c < col + areaSize; c++) {
                revealedPositions.add(r * 10 + c);
            }
        }

        // For AWAKENED: add entire row or column
        if ("AWAKENED".equals(effectLevel)) {
            if (request.revealRowIndex() != null) {
                for (int c = 0; c <= 9; c++) {
                    revealedPositions.add(request.revealRowIndex() * 10 + c);
                }
            } else {
                for (int r = 0; r <= 9; r++) {
                    revealedPositions.add(r * 10 + request.revealColIndex());
                }
            }
        }

        // Build response cells
        List<RevealedCell> revealedCells = new ArrayList<>();
        for (int pos : revealedPositions) {
            int cellRow = pos / 10;
            int cellCol = pos % 10;
            CellRevealStatus status = occupiedCells.contains(pos) ? CellRevealStatus.HAS_SHIP : CellRevealStatus.EMPTY;
            revealedCells.add(new RevealedCell(cellRow, cellCol, status));
        }

        // Update state
        state.setObservationUsesRemaining(state.getObservationUsesRemaining() - 1);
        state.setObservationUsesConsumed(state.getObservationUsesConsumed() + 1);
        state.setHakiUsedThisTurn(true);
        hakiBattleStateRepository.save(state);

        // Emit SSE to opponent
        UUID opponentId = opponentBoard.getOwner().getId();
        gameEventEmitter.emitObservationHakiUsed(token, opponentId);

        return new ObservationResponse(revealedCells, effectLevel);
    }

    private String determineEffectLevel(HakiBattleState state) {
        if (state.getObservationUsesConsumed() == 0) {
            return "WEAK";
        }
        // Second use (consumed == 1)
        if (state.getObservationLevel() == 3) {
            return "AWAKENED";
        }
        return "STRONG";
    }

    private Set<Integer> computeOccupiedCells(Board board) {
        Set<Integer> occupied = new HashSet<>();
        for (Ship ship : board.getShips()) {
            int size = ship.getType().getSize();
            for (int i = 0; i < size; i++) {
                int cellRow = ship.getRow() + (ship.getOrientation() == Orientation.VERTICAL ? i : 0);
                int cellCol = ship.getCol() + (ship.getOrientation() == Orientation.HORIZONTAL ? i : 0);
                occupied.add(cellRow * 10 + cellCol);
            }
        }
        return occupied;
    }

    @Transactional
    public void resetHakiUsedThisTurn(UUID boardId) {
        hakiBattleStateRepository.findByBoardId(boardId).ifPresent(state -> {
            state.setHakiUsedThisTurn(false);
            hakiBattleStateRepository.save(state);
        });
    }
}
